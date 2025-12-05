from flask import Flask, request, jsonify
from flask_cors import CORS
from pyrebase.pyrebase import Database, Auth
from functions import *
from typing import Dict, Any, Tuple
from openai import OpenAI
import os
import pyrebase
import requests
from dotenv import load_dotenv

load_dotenv()

config = {
  "apiKey": os.getenv("FIREBASE_API_KEY"),
  "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
  "databaseURL": os.getenv("DATABASE_URL"),
  "projectId": os.getenv("FIREBASE_PROJECT_ID"),
  "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
  "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
  "appId": os.getenv("FIREBASE_APP_ID"),
  "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID")
}

# Firebase REST API endpoints
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
FIREBASE_AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(
    api_key = OPENAI_API_KEY
)

firebase = None
db = None

def get_db():
    """Lazy initialization of Firebase database"""
    global firebase, db
    if db is None:
        firebase = pyrebase.initialize_app(config)
        db = firebase.database()
    return db

# Helper functions for Firebase REST API authentication
def firebase_sign_up(email: str, password: str):
    """Sign up a new user using Firebase REST API"""
    url = f"{FIREBASE_AUTH_BASE}:signUp?key={FIREBASE_API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload, timeout=10)
    return response.json()

def firebase_sign_in(email: str, password: str):
    """Sign in a user using Firebase REST API"""
    url = f"{FIREBASE_AUTH_BASE}:signInWithPassword?key={FIREBASE_API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload, timeout=10)
    return response.json()

def firebase_get_account_info(id_token: str):
    """Get account info using Firebase REST API"""
    url = f"{FIREBASE_AUTH_BASE}:lookup?key={FIREBASE_API_KEY}"
    payload = {
        "idToken": id_token
    }
    response = requests.post(url, json=payload, timeout=10)
    return response.json()

app = Flask(__name__)
CORS(app)

    
@app.route("/me/final-score", methods=["GET"])
def get_my_final_score():
    """
    Returns the current Final Score for the authenticated user.

    Final Score = average of best X normalized rounds (Score - CourseRating).
    If needed, this recomputes it from the database.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    try:
        final_score = update_user_final_score(db, uid)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"final_score": final_score}), 200
    

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    course = request.args.get("course")
    data = get_leaderboard(get_db(), course)
    return jsonify(data)

@app.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    print(f"Sign up attempt - Email: {email}, Name: {name}, Has Password: {bool(password)}")

    if not all([email, password, name]):
        print("ERROR: Missing email, password, or name")
        return jsonify({"error": "Missing email, password, or name"}), 400

    try:
        # Use Firebase REST API for authentication
        result = firebase_sign_up(email, password)

        if "error" in result:
            error_msg = result["error"].get("message", "Sign up failed")
            print(f"ERROR during sign_up: {error_msg}")
            return jsonify({"error": error_msg}), 400

        uid = result['localId']
        get_db().child("users").child(uid).set({"name": name, "email": email})
        print(f"Sign up successful - UID: {uid}, Email: {email}")
        return jsonify({"message": "User created", "user": {"uid": uid, "email": email, "name": name}}), 200
    except Exception as e:
        print(f"ERROR during sign_up: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route("/sign_in", methods=["POST"])
def sign_in():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    print(f"Sign in attempt - Email: {email}, Has Password: {bool(password)}")

    if not all([email, password]):
        print("ERROR: Missing email or password")
        return jsonify({"error": "Missing email or password"}), 400

    try:
        # Use Firebase REST API for authentication
        result = firebase_sign_in(email, password)

        if "error" in result:
            error_msg = result["error"].get("message", "Sign in failed")
            print(f"ERROR during sign_in: {error_msg}")
            return jsonify({"error": error_msg}), 400

        id_token = result["idToken"]
        uid = result["localId"]

        user_info = get_db().child("users").child(uid).get().val()
        name = user_info.get("name") if user_info else None
        print(f"Sign in successful - UID: {uid}, Name: {name}")
        return jsonify({
            "message": "User signed in",
            "idToken": id_token,
            "uid": uid,
            "name": name
        }), 200
    except Exception as e:
        print(f"ERROR during sign_in: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.route("/send_friend_request", methods=["POST"])
def send_friend_request_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    data = request.json
    receiver_uid = data.get("receiver_uid")
    if not receiver_uid:
        return jsonify({"error": "Missing receiver UID"}), 400

    try:
        user_info = firebase_get_account_info(id_token)
        sender_uid = user_info["users"][0]["localId"]

        send_friend_request(get_db(), sender_uid, receiver_uid)
        return jsonify({"message": "Friend request sent"}), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/accept_friend_request", methods=["POST"])
def accept_friend_request_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    data = request.json
    sender_uid = data.get("sender_uid")
    if not sender_uid:
        return jsonify({"error": "Missing sender UID"}), 400

    try:
        user_info = firebase_get_account_info(id_token)
        receiver_uid = user_info["users"][0]["localId"]

        accept_friend_request(get_db(), receiver_uid, sender_uid)
        return jsonify({"message": "Friend request accepted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/decline_friend_request", methods=["POST"])
def decline_friend_request_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    data = request.json
    sender_uid = data.get("sender_uid")
    if not sender_uid:
        return jsonify({"error": "Missing sender UID"}), 400

    try:
        user_info = firebase_get_account_info(id_token)
        receiver_uid = user_info["users"][0]["localId"]

        decline_friend_request(get_db(), receiver_uid, sender_uid)
        return jsonify({"message": "Friend request declined"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/remove_friend", methods=["POST"])
def remove_friend_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    data = request.json
    friend_uid = data.get("friend_uid")
    if not friend_uid:
        return jsonify({"error": "Missing friend UID"}), 400

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        remove_friend(get_db(), uid, friend_uid)
        return jsonify({"message": "Friend removed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/friend_requests", methods=["GET"])
def get_friend_requests_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        requests = get_friend_requests(get_db(), uid)
        return jsonify({"requests": requests}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/friends", methods=["GET"])
def get_friends_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        friends = get_friends(get_db(), uid)
        return jsonify({"friends": friends}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/challenge/<int:difficulty>", methods=["GET"])
def get_challenges_route(difficulty):
    if difficulty < 1 or difficulty > 5:
        return jsonify({"error": "Difficulty must be between 1 and 5"}), 400
    
    try:
        resp = client.responses.create(
            model="gpt-4o",
            instructions="You are a golf expert who loves to output golf challenges based on the level of difficulty specified by the input. this should be able to be completed in one to two days. well formatted with time estimated to complete, tips, and basic challenge. based on a. skill level from 1-5 where 1 is beginner and 5 is expert",
            input=str(difficulty)
        )
        return jsonify({"difficulty": difficulty, "challenge": resp.output_text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Golf Session Routes
@app.route("/sessions", methods=["POST"])
def create_session_route():
    """Create a new golf session"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        session_data = request.json

        # Validate required fields
        required_fields = ["courseName", "holes", "scores", "totalScore", "duration", "startTime", "endTime"]
        if not all(field in session_data for field in required_fields):
            return jsonify({"error": "Missing required session data"}), 400

        session_id = create_session(get_db(), uid, session_data)
        return jsonify({
            "message": "Session created successfully",
            "sessionId": session_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/sessions", methods=["GET"])
def get_sessions_route():
    """Get user's golf sessions"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        viewer_uid = user_info["users"][0]["localId"]

        # Optional limit parameter
        limit = request.args.get("limit", type=int)
        requested_uid = request.args.get("uid")
        target_uid = requested_uid or viewer_uid

        # Fetch all sessions for the target user so we can privacy-filter
        raw_sessions = get_user_sessions(get_db(), target_uid, None)

        if target_uid == viewer_uid:
            sessions = raw_sessions
        else:
            # Only include public sessions or friends-only sessions if viewer is a friend
            target_friends = set(get_friends(get_db(), target_uid))
            is_friend = viewer_uid in target_friends
            sessions = [
                session for session in raw_sessions
                if session.get("privacy", "friends") == "public"
                or (session.get("privacy", "friends") == "friends" and is_friend)
            ]

        if limit:
            sessions = sessions[:limit]

        return jsonify({"sessions": sessions}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/sessions/<session_id>", methods=["DELETE"])
def delete_session_route(session_id):
    """Delete a golf session"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        # Verify session belongs to user
        session = db.child("sessions").child(session_id).get().val()
        if not session:
            return jsonify({"error": "Session not found"}), 404

        if session.get("uid") != uid:
            return jsonify({"error": "Unauthorized"}), 403

        delete_session(get_db(), session_id)
        return jsonify({"message": "Session deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/feed", methods=["GET"])
def get_feed_route():
    """Get feed of golf sessions from friends and public"""
    print("[FEED] Feed endpoint called")
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        print("[FEED] ERROR: Missing or invalid token")
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = firebase_get_account_info(id_token)
        uid = user_info["users"][0]["localId"]
        print(f"[FEED] User authenticated: {uid}")

        # Optional limit parameter
        limit = request.args.get("limit", type=int, default=20)
        print(f"[FEED] Fetching feed with limit: {limit}")

        sessions = get_feed_sessions(get_db(), uid, limit)
        print(f"[FEED] Found {len(sessions)} sessions")
        return jsonify({"sessions": sessions}), 200

    except Exception as e:
        print(f"[FEED] ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 400


@app.route("/users/<uid>", methods=["GET"])
def get_user_profile(uid):
    """Return basic profile info for a user along with visibility metadata."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        viewer_info = firebase_get_account_info(id_token)
        viewer_uid = viewer_info["users"][0]["localId"]
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    try:
        user_data = get_db().child("users").child(uid).get().val() or {}
        if not user_data:
            return jsonify({"error": "User not found"}), 404

        friends_of_user = set(get_friends(get_db(), uid))
        is_friend = viewer_uid in friends_of_user

        # Count sessions visible to the viewer
        raw_sessions = get_user_sessions(get_db(), uid, None)
        if uid == viewer_uid:
            visible_sessions = raw_sessions
        else:
            visible_sessions = [
                session for session in raw_sessions
                if session.get("privacy", "friends") == "public"
                or (session.get("privacy", "friends") == "friends" and is_friend)
            ]

        profile = {
            "uid": uid,
            "name": user_data.get("name"),
            "email": user_data.get("email"),
            "final_score": user_data.get("final_score"),
            "friends_count": len(friends_of_user),
            "is_friend": is_friend,
            "total_sessions": len(visible_sessions),
        }

        return jsonify({"profile": profile}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
