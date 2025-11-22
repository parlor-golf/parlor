from pyrebase.pyrebase import Database, Auth
from typing import Dict, Any, Tuple, List
from datetime import datetime, time, timedelta
from flask import jsonify

def add_score(db: Database, name, uid, course, score):
    score_data = {
        "uid": uid,
        "name": name,
        "course": course,
        "score": score,
        "timestamp": datetime.now().isoformat()
    }
    db.child("scores").push(score_data)

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
        "timestamp": datetime.now().isoformat()
    }

    session_ref = db.child("sessions").push(session)
    return session_ref["name"]  # Return the session ID

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