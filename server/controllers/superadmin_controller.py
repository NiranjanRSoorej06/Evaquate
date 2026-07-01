from flask import request, jsonify

from services import school_services
from utils.helpers import get_json_body


def get_schools():
    rows, error = school_services.get_all_schools()
    if error:
        return jsonify(error), 500
    return jsonify(rows)


def create_school():
    body = get_json_body()
    school, error = school_services.create_school(
        body.get('name'), body.get('unique_code'), body.get('password')
    )
    if error:
        return jsonify(error), 400
    return jsonify({'success': True, 'school': school})


def get_teachers(schoolId):
    rows, error = school_services.get_teachers(schoolId)
    if error:
        status = 404 if error.get('message') == 'School not found' else 500
        return jsonify(error), status
    return jsonify(rows)


def get_students(schoolId, teacherId):
    rows, error = school_services.get_students(schoolId, teacherId)
    if error:
        status = 404 if error.get('message') == 'Teacher not found' else 500
        return jsonify(error), status
    return jsonify(rows)


def disable_school(schoolId):
    body = get_json_body()
    school, error = school_services.disable_school(schoolId, body.get('disabled', True))
    if error:
        status = 404 if error.get('message') == 'School not found' else 500
        return jsonify(error), status
    return jsonify({'success': True, 'school': school})


def reset_teacher_password(schoolId, teacherId):
    body = get_json_body()
    new_password = body.get('password')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required'}), 400

    teacher, error = school_services.reset_teacher_password(teacherId, new_password)
    if error:
        status = 404 if error.get('message') == 'Teacher not found' else 500
        return jsonify(error), status
    return jsonify({'success': True, 'teacher': teacher})


def reset_student_password(schoolId, teacherId, studentId):
    body = get_json_body()
    new_password = body.get('password')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required'}), 400

    student, error = school_services.reset_student_password(studentId, new_password)
    if error:
        status = 404 if error.get('message') == 'Student not found' else 500
        return jsonify(error), status
    return jsonify({'success': True, 'student': student})
