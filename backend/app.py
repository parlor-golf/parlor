from flask import Flask, request, jsonify
from flask_cors import CORS
from functions import *
from typing import Dict, Any, Tuple
from openai import OpenAI
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
    name = data.get("name")
    course = data.get("course")
    score = data.get("score")

    if not all([name, course, score]):
        return jsonify({"error": "Missing data"}), 400

    add_score(db, name, course, score)
    return jsonify({"message": "Score submitted!"}), 200

@app.route("/delete-score/<score_id>", methods=["DELETE"])
def delete_score_route(score_id):
    delete_score(db, score_id)
    return jsonify({"message": "Score deleted"}), 200

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
    name = request.args.get("name")

    if not name:
        return jsonify({"error": "Missing name parameter"}), 400

    data = get_scores(db, name)
    return jsonify(data)

@app.route("/sign_up", methods=["POST"])
def sign_up():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "Missing email or password"}), 400

    try:
        user = auth.create_user_with_email_and_password(email, password)
        return jsonify({"message": "User created", "user": user}), 200
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
        return jsonify({"message": "User signed in", "user": user}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
