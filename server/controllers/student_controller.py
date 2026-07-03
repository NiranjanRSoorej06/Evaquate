from flask import jsonify, request

from services import score_service, quiz_service, blueprint_service
from utils.helpers import get_json_body


def get_quiz(disasterType):
    teacher_id = request.user.get('teacher_id')
    data, error = quiz_service.get_quiz(teacher_id, disasterType)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def list_quizzes():
    teacher_id = request.user.get('teacher_id')
    data, error = quiz_service.list_available_quizzes(teacher_id)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def submit_score():
    body = get_json_body()
    score, error = score_service.submit_score(
        body.get('student_id'),
        body.get('disaster_type'),
        body.get('activity_type'),
        body.get('score'),
        body.get('duration_seconds'),
    )
    if error:
        return jsonify(error), 500
    return jsonify({'success': True, 'score': score})


def get_school_map(schoolId):
    blueprint, error = blueprint_service.get_school_map(schoolId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(blueprint)
