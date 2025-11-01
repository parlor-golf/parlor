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