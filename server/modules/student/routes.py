import time
from datetime import datetime, timezone

from flask import Blueprint, jsonify

from middleware import authenticate_token, require_student, require_student_of_school
from utils.sql import sql

student_bp = Blueprint('student', __name__, url_prefix='/api')


# ── GET /api/quizzes/<disasterType> ──────────────────────────────────────────

@student_bp.route('/quizzes/<disasterType>', methods=['GET'])
@authenticate_token
def get_quiz(disasterType):
    try:
        quiz_res = sql('SELECT * FROM quizzes WHERE disaster_type = $1', [disasterType])
        if quiz_res['rowCount'] > 0:
            return jsonify(quiz_res['rows'][0])
        return jsonify({'message': 'Quiz not found'}), 404
    except Exception as e:
        print('Error getting quiz', e)
        return jsonify({'message': 'Database error'}), 500


# ── POST /api/student/score ──────────────────────────────────────────────────

@student_bp.route('/student/score', methods=['POST'])
@authenticate_token
@require_student
def submit_score():
    from flask import request
    body = request.get_json(silent=True) or {}
    student_id = body.get('student_id')
    disaster_type = body.get('disaster_type')
    activity_type = body.get('activity_type')
    score = body.get('score')
    duration_seconds = body.get('duration_seconds')
    try:
        new_score_id = f'sc_{int(time.time() * 1000)}'
        timestamp = datetime.now(timezone.utc).isoformat()

        insert_res = sql(
            """INSERT INTO scores (id, student_id, disaster_type, activity_type,
                                   score, duration_seconds, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *""",
            [new_score_id, student_id, disaster_type, activity_type,
             score, duration_seconds, timestamp],
        )
        return jsonify({'success': True, 'score': insert_res['rows'][0]})
    except Exception as e:
        print('Error submitting score', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── GET /api/student/<schoolId>/map ──────────────────────────────────────────

@student_bp.route('/student/<schoolId>/map', methods=['GET'])
@authenticate_token
@require_student_of_school
def get_school_map(schoolId):
    try:
        school_res = sql('SELECT blueprint_json FROM schools WHERE id = $1', [schoolId])
        if school_res['rowCount'] > 0 and school_res['rows'][0].get('blueprint_json'):
            return jsonify(school_res['rows'][0]['blueprint_json'])
        return jsonify({'message': 'School map not uploaded or ready yet.'}), 404
    except Exception as e:
        print('Error getting school map', e)
        return jsonify({'message': 'Database error'}), 500
