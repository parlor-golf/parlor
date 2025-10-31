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

if __name__ == "__main__":
    app.run(debug=True)
