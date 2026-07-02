from flask import request, jsonify

from services import teacher_service
from utils.helpers import get_json_body


def get_students(teacherId):
    students, error = teacher_service.get_students_with_scores(teacherId)
    if error:
        return jsonify(error), 500
    return jsonify({'students': students})


def add_student(teacherId):
    body = get_json_body()
    student, error = teacher_service.add_student(
        teacherId, body.get('name'), body.get('roll_no'), body.get('school_id')
    )
    if error:
        return jsonify(error), 400
    return jsonify({'success': True, 'student': student})


def bulk_import_students(teacherId):
    body = get_json_body()
    result, error = teacher_service.bulk_import_students(
        teacherId, body.get('students', []), body.get('school_id')
    )
    if error:
        return jsonify(error), 500
    return jsonify(result)


def delete_student(teacherId, studentId):
    result, error = teacher_service.delete_student(studentId)
    if error:
        return jsonify(error), 500
    return jsonify(result)


def upload_quiz(teacherId):
    uploaded_file = request.files.get('quiz_file')
    disaster_type = (request.form.get('disaster_type') or '').strip().lower()

    if not uploaded_file or not disaster_type:
        return jsonify({'success': False, 'message': 'A CSV file and disaster type are required.'}), 400

    result, error = teacher_service.upload_quiz(uploaded_file, disaster_type, teacherId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(result)
