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

    # Sort ascending (lower average = better)
    leaderboard.sort(key=lambda x: x["average_score"])
    return leaderboard