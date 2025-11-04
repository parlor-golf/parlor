from flask import Flask, request, jsonify
from flask_cors import CORS
from functions import *
from typing import Dict, Any, Tuple
import os
import pyrebase
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

firebase = pyrebase.initialize_app(config)

db = firebase.database()
auth = firebase.auth()

app = Flask(__name__)
CORS(app)

@app.route("/submit-score", methods=["POST"])
def submit_score():
    data = request.json
    course = data.get("course")
    score = data.get("score")

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    
    id_token = auth_header.split(" ")[1]

    try:
        user_info = auth.get_account_info(id_token)
        uid = user_info['users'][0]['localId']

        user_data = db.child("users").child(uid).get().val()
        name = user_data.get("name") if user_data else None

        if not all([name, course, score]):
            return jsonify({"error": "Missing data"}), 400

        add_score(db, name, uid, course, score)
        return jsonify({"message": "Score submitted!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401
    
@app.route("/delete-score/<score_id>", methods=["DELETE"])
def delete_score_route(score_id):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    id_token = auth_header.split(" ")[1]

    try:
        user_info = auth.get_account_info(id_token)
        uid = user_info['users'][0]['localId']

        score = db.child("scores").child(score_id).get().val()
        if not score:
            return jsonify({"error": "Score not found"}), 404

        if score.get("uid") != uid:
            return jsonify({"error": "Unauthorized"}), 403

        delete_score(db, score_id)
        return jsonify({"message": "Score deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    course = request.args.get("course")
    data = get_leaderboard(db, course)
    return jsonify(data)

@app.route("/courses", methods=["GET"])
def get_courses_route():
    data = get_courses(db)
    return jsonify(data)

@app.route("/scores", methods=["GET"])
def get_scores_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401

    id_token = auth_header.split(" ")[1]

    try:
        user_info = auth.get_account_info(id_token)
        uid = user_info['users'][0]['localId']

        data = get_scores(db, uid)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not all([email, password, name]):
        return jsonify({"error": "Missing email, password, or name"}), 400

    try:
        user = auth.create_user_with_email_and_password(email, password)
        uid = user['localId']
        db.child("users").child(uid).set({"name": name, "email": email})
        return jsonify({"message": "User created", "user": {"uid": uid, "email": email, "name": name}}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/sign_in", methods=["POST"])
def sign_in():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    try:
        user = auth.sign_in_with_email_and_password(email, password)
        id_token = user["idToken"]
        uid = user["localId"]

        user_info = db.child("users").child(uid).get().val()
        name = user_info.get("name") if user_info else None
        return jsonify({
            "message": "User signed in",
            "idToken": id_token,
            "uid": uid,
            "name": name
        }), 200
    except Exception as e:
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
        user_info = auth.get_account_info(id_token)
        sender_uid = user_info["users"][0]["localId"]

        send_friend_request(db, sender_uid, receiver_uid)
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
        user_info = auth.get_account_info(id_token)
        receiver_uid = user_info["users"][0]["localId"]

        accept_friend_request(db, receiver_uid, sender_uid)
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
        user_info = auth.get_account_info(id_token)
        receiver_uid = user_info["users"][0]["localId"]

        decline_friend_request(db, receiver_uid, sender_uid)
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        remove_friend(db, uid, friend_uid)
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        requests = get_friend_requests(db, uid)
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        friends = get_friends(db, uid)
        return jsonify({"friends": friends}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/friends/scores", methods=["GET"])
def get_friends_scores_route():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        data = get_friends_scores(db, uid)
        return jsonify(data), 200
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        session_data = request.json

        # Validate required fields
        required_fields = ["courseName", "holes", "scores", "totalScore", "duration", "startTime", "endTime"]
        if not all(field in session_data for field in required_fields):
            return jsonify({"error": "Missing required session data"}), 400

        session_id = create_session(db, uid, session_data)
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        # Optional limit parameter
        limit = request.args.get("limit", type=int)

        sessions = get_user_sessions(db, uid, limit)
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
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        # Verify session belongs to user
        session = db.child("sessions").child(session_id).get().val()
        if not session:
            return jsonify({"error": "Session not found"}), 404

        if session.get("uid") != uid:
            return jsonify({"error": "Unauthorized"}), 403

        delete_session(db, session_id)
        return jsonify({"message": "Session deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/feed", methods=["GET"])
def get_feed_route():
    """Get feed of golf sessions from friends and public"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid token"}), 401
    id_token = auth_header.split(" ")[1]

    try:
        user_info = auth.get_account_info(id_token)
        uid = user_info["users"][0]["localId"]

        # Optional limit parameter
        limit = request.args.get("limit", type=int, default=20)

        sessions = get_feed_sessions(db, uid, limit)
        return jsonify({"sessions": sessions}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
