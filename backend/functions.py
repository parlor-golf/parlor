from pyrebase.pyrebase import Database, Auth
from typing import Dict, Any, Tuple, List
from datetime import datetime, time, timedelta
from flask import jsonify

import os
import requests
import statistics

GOLFCOURSE_API_BASE_URL = os.getenv("GOLFCOURSE_API_BASE_URL", "https://api.golfcourseapi.com")
GOLFCOURSE_API_KEY = os.getenv("5EBUXXT3X5AIJUE7GMYCKH6XPU")

def add_score(db: Database, name, uid, course, score):

    score = float(score)

    course_rating = fetch_course_rating(db, course)
    normalized_score = None

    if course_rating is not None:
        course_rating = float(course_rating)
        normalized_score = score - course_rating

    score_data = {
        "uid": uid,
        "name": name,
        "course": course,
        "score": score,
        "timestamp": datetime.now().isoformat(),
        "course_rating": course_rating,
        "normalized_score": normalized_score,
    }
    db.child("scores").push(score_data)

    update_user_final_score(db, uid)

def fetch_course_rating_from_api(course_name: str) -> float | None:
    """
    Call GolfCourseAPI to get the course rating for a given course_name.

    Still need to adjust:
      - the URL path,
      - headers,
      - and JSON field names

    to match the official GolfCourseAPI docs.
    """
    if not GOLFCOURSE_API_KEY:
        # No API key configured – just skip rating lookup
        return None

    try:
        # TODO: replace this with the REAL endpoint + params from GolfCourseAPI docs.
        # Many APIs use something like /courses/search or /v1/courses
        # Check their docs and plug in the correct path + query parameters.
        url = f"{GOLFCOURSE_API_BASE_URL}/v1/search"

        response = requests.get(
            url,
            params={"search_query": course_name},  # adjust key ("q", "name", etc.) per docs
            headers={
                "Authorization": f"Key {GOLFCOURSE_API_KEY}",
                "Accept": "application/json",
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        courses = data.get("courses") if isinstance(data, dict) else None
        if not courses:
            return None

        first_course = courses[0]
        tees = first_course.get("tees") or {}
        male_tees = tees.get("male") or []
        female_tees = tees.get("female") or []

        # Prefer first male tee, fall back to first female tee
        tee = None
        if male_tees:
            tee = male_tees[0]
        elif female_tees:
            tee = female_tees[0]

        if not tee:
            return None

        rating = tee.get("course_rating")
        if rating is None:
            return None

        return float(rating)

    except Exception:
        # Log if you have logging configured; otherwise, just ignore
        return None

def fetch_course_rating(db: Database, course: str) -> float | None:
    """
    Get course_rating for a given course name:

    1. Check Firebase cache at /courses/<course>.
    2. If missing, call GolfCourseAPI, then store it for next time.
    """
    # 1) Check cache
    cached = db.child("courses").child(course).get().val()
    if cached and "rating" in cached:
        try:
            return float(cached["rating"])
        except (TypeError, ValueError):
            pass
    rating = fetch_course_rating_from_api(course)
    if rating is not None:
        db.child("courses").child(course).update({"rating": rating})
    return rating

def update_user_final_score(db: Database, uid: str) -> float | None:
    """
    Recompute a user's Final Score based on their stored normalized rounds.

    Final Score = average of the user's best X normalized rounds
      (X = NORMALIZED_TOP_ROUNDS; lower is better).

    We look at /scores where uid == <uid>, use normalized_score if present,
    and store the result under /users/<uid>/final_score.
    """
    scores_snapshot = (
        db.child("scores")
        .order_by_child("uid")
        .equal_to(uid)
        .get()
    )

    if not scores_snapshot.each():
        final_score = None
        db.child("users").child(uid).update({"final_score": final_score})
        return final_score

    normalized_values: List[float] = []

    for snap in scores_snapshot.each():
        data = snap.val() or {}
        ns = data.get("normalized_score")
        if ns is not None:
            try:
                normalized_values.append(float(ns))
            except (TypeError, ValueError):
                continue

    if not normalized_values:
        final_score = None
    else:
        normalized_values.sort()  # lower is better
        top_n = min(NORMALIZED_TOP_ROUNDS, len(normalized_values))
        best = normalized_values[:top_n]
        final_score = round(sum(best) / len(best), 1)

    db.child("users").child(uid).update({"final_score": final_score})
    return final_score

def delete_score(db: Database, score_id):
    db.child("scores").child(score_id).remove()

def get_scores(db: Database, uid) :
    scores = db.child("scores").get()
    results = []
    if scores.each():
        for s in scores.each():
            data = s.val()
            if data.get("uid") == uid:
                results.append({
                    "id": s.key(),
                    "uid": data.get("uid"),
                    "name": data.get("name"),
                    "course": data.get("course"),
                    "score": data.get("score"),
                    "timestamp": data.get("timestamp")
                })
    return results

def get_courses(db: Database):
    scores = db.child("scores").get()
    courses = set()
    if scores.each():
        for s in scores.each():
            data = s.val()
            if "course" in data:
                courses.add(data["course"])
    return list(courses)

def get_leaderboard(db: Database, course=None):
    scores = db.child("scores").get()
    player_scores = {}

    if scores.each():
        for s in scores.each():
            data = s.val()
            if course and data.get("course") != course:
                continue

            name = data.get("name")
            score = data.get("score")
            if not name or score is None:
                continue

            if name not in player_scores:
                player_scores[name] = []
            player_scores[name].append(score)

    leaderboard = []
    for name, score_list in player_scores.items():
        avg_score = sum(score_list) / len(score_list)
        leaderboard.append({
            "name": name,
            "average_score": round(avg_score, 2)
        })

    # Sort ascending
    leaderboard.sort(key=lambda x: x["average_score"])
    return leaderboard

def send_friend_request(db: Database, sender_uid, receiver_uid):
    if sender_uid == receiver_uid:
        raise ValueError("Cannot send a friend request to yourself.")

    if are_friends(db, sender_uid, receiver_uid):
        raise ValueError("Users are already friends.")

    if is_request_pending(db, sender_uid, receiver_uid):
        raise ValueError("Friend request is already pending.")
    
    db.child("friend_requests").child(receiver_uid).child(sender_uid).set(True)

def accept_friend_request(db: Database, receiver_uid, sender_uid):
    db.child("friends").child(receiver_uid).child(sender_uid).set(True)
    db.child("friends").child(sender_uid).child(receiver_uid).set(True)
    db.child("friend_requests").child(receiver_uid).child(sender_uid).remove()

def decline_friend_request(db: Database, receiver_uid, sender_uid):
    db.child("friend_requests").child(receiver_uid).child(sender_uid).remove()

def remove_friend(db: Database, uid, friend_uid):
    db.child("friends").child(uid).child(friend_uid).remove()
    db.child("friends").child(friend_uid).child(uid).remove()

def get_friend_requests(db: Database, uid):
    requests = db.child("friend_requests").child(uid).get().val()
    if not requests:
        return []
    return list(requests.keys())

def get_friends(db: Database, uid):
    friends = db.child("friends").child(uid).get().val()
    if not friends:
        return []
    return list(friends.keys())

def get_friends_scores(db: Database, uid):
    friends = get_friends(db, uid)
    scores = db.child("scores").get()
    if not scores.each():
        return []
    
    results = []
    for s in scores.each():
        data = s.val()
        if data.get("uid") in friends:
            results.append({
                "id": s.key(),
                "uid": data.get("uid"),
                "name": data.get("name"),
                "course": data.get("course"),
                "score": data.get("score"),
                "timestamp": data.get("timestamp")
            })
    results.sort(key=lambda x: x["timestamp"], reverse=True)
    return results

def are_friends(db: Database, uid1, uid2) -> bool:
    return bool(db.child("friends").child(uid1).child(uid2).get().val())

def is_request_pending(db: Database, sender_uid, receiver_uid) -> bool:
    sent = db.child("friend_requests").child(receiver_uid).child(sender_uid).get().val()
    received = db.child("friend_requests").child(sender_uid).child(receiver_uid).get().val()
    return bool(sent or received)