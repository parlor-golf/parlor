from pyrebase.pyrebase import Database, Auth
from typing import Dict, Any, Tuple, List
from datetime import datetime, time, timedelta
from flask import jsonify

import os
import requests
import statistics

GOLFCOURSE_API_BASE_URL = os.getenv("GOLFCOURSE_API_BASE_URL", "https://api.golfcourseapi.com")
GOLFCOURSE_API_KEY = "5EBUXXT3X5AIJUE7GMYCKH6XPU"
NORMALIZED_TOP_ROUNDS = 8  # Number of best normalized rounds to average for Final Score

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
        db.child("sessions")
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

def get_leaderboard(db: Database, course=None):
    sessions = db.child("sessions").get()
    player_scores = {}

    if sessions.each():
        for s in sessions.each():
            data = s.val()
            if course and data.get("course") != course:
                continue

            name = data.get("username")
            score = data.get("totalScore")
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

def are_friends(db: Database, uid1, uid2) -> bool:
    return bool(db.child("friends").child(uid1).child(uid2).get().val())

def is_request_pending(db: Database, sender_uid, receiver_uid) -> bool:
    sent = db.child("friend_requests").child(receiver_uid).child(sender_uid).get().val()
    received = db.child("friend_requests").child(sender_uid).child(receiver_uid).get().val()
    return bool(sent or received)

# Golf Session Functions
def create_session(db: Database, uid, session_data):
    """
    Create a new golf session
    session_data should include:
    - courseName: str
    - holes: int (9 or 18)
    - selectedHoles: list (optional, for 9-hole)
    - scores: dict {hole: score}
    - totalScore: int
    - duration: int (seconds)
    - startTime: str (ISO timestamp)
    - endTime: str (ISO timestamp)
    - privacy: str ("public", "friends", "private")
    """
    # Get user info
    user_data = db.child("users").child(uid).get().val()
    username = user_data.get("name") if user_data else "Unknown"
    
    score = session_data.get("totalScore")
    course_rating = fetch_course_rating(db, session_data.get("courseName"))
    normalized_score = None

    if course_rating is not None:
        course_rating = float(course_rating)
        normalized_score = score - course_rating

    session = {
        "uid": uid,
        "username": username,
        "courseName": session_data.get("courseName"),
        "holes": session_data.get("holes"),
        "selectedHoles": session_data.get("selectedHoles"),
        "scores": session_data.get("scores"),
        "totalScore": session_data.get("totalScore"),
        "duration": session_data.get("duration"),
        "startTime": session_data.get("startTime"),
        "endTime": session_data.get("endTime"),
        "privacy": session_data.get("privacy", "friends"),
        "images": session_data.get("images", []),
        "videos": session_data.get("videos", []),
        "timestamp": datetime.now().isoformat(),
        "course_rating": course_rating,
        "normalized_score": normalized_score,
        "likes": {},
        "comments": {},
    }

    session_ref = db.child("sessions").push(session)
    update_user_final_score(db, uid)
    return session_ref["name"]  # Return the session ID


def toggle_like(db: Database, session_id: str, uid: str) -> Dict[str, Any]:
    """Toggle like for a session by a user and return updated counts/state."""
    session_ref = db.child("sessions").child(session_id)
    session = session_ref.get().val()
    if not session:
        raise ValueError("Session not found")

    likes = session.get("likes", {}) or {}
    if uid in likes:
        likes.pop(uid, None)
        liked = False
    else:
        likes[uid] = True
        liked = True

    session_ref.update({"likes": likes})
    like_count = len(likes)
    return {"liked": liked, "like_count": like_count}


def add_comment(db: Database, session_id: str, uid: str, username: str, text: str) -> Dict[str, Any]:
    """Add a comment to a session and return the new comment payload."""
    if not text.strip():
        raise ValueError("Comment cannot be empty")

    session_ref = db.child("sessions").child(session_id)
    session = session_ref.get().val()
    if not session:
        raise ValueError("Session not found")

    comment_id = datetime.now().isoformat()
    comment = {
        "id": comment_id,
        "uid": uid,
        "username": username,
        "text": text.strip(),
        "timestamp": datetime.now().isoformat(),
    }

    existing_comments = session.get("comments", {}) or {}
    existing_comments[comment_id] = comment
    session_ref.update({"comments": existing_comments})

    return comment

def get_user_sessions(db: Database, uid, limit=None):
    """Get all sessions for a specific user"""
    sessions = db.child("sessions").get()
    results = []

    if sessions.each():
        for s in sessions.each():
            data = s.val()
            if data.get("uid") == uid:
                results.append({
                    "id": s.key(),
                    **data
                })

    # Sort by timestamp descending (most recent first)
    results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    if limit:
        results = results[:limit]

    return results

def get_feed_sessions(db: Database, uid, limit=20):
    """
    Get sessions for feed - includes:
    - User's own sessions (if not private)
    - Friends' sessions (if not private)
    - League members' sessions (future)
    """
    friends = get_friends(db, uid)
    sessions = db.child("sessions").get()
    results = []

    if sessions.each():
        for s in sessions.each():
            data = s.val()
            session_uid = data.get("uid")
            privacy = data.get("privacy", "friends")

            # Include if:
            # 1. It's user's own session
            # 2. It's a friend's session and privacy is not "private"
            # 3. It's a public session

            if session_uid == uid:
                # User's own sessions
                results.append({
                    "id": s.key(),
                    **data
                })
            elif session_uid in friends and privacy in ["public", "friends"]:
                # Friends' sessions
                results.append({
                    "id": s.key(),
                    **data
                })
            elif privacy == "public":
                # Public sessions from anyone
                results.append({
                    "id": s.key(),
                    **data
                })

    # Sort by timestamp descending (most recent first)
    results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    if limit:
        results = results[:limit]

    return results

def delete_session(db: Database, session_id):
    """Delete a golf session"""
    db.child("sessions").child(session_id).remove()
