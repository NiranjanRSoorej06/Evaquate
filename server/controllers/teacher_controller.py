from flask import request, jsonify

from services import teacher_service, quiz_service
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


def import_students(teacherId):
    uploaded_file = request.files.get('student_file')
    school_id = request.form.get('school_id') or request.user.get('school_id')

    if not uploaded_file or not school_id:
        return jsonify({'success': False, 'message': 'A student file and school_id are required.'}), 400

    try:
        students = teacher_service.parse_student_upload(uploaded_file)
    except ValueError as value_error:
        return jsonify({'success': False, 'message': str(value_error)}), 400
    except Exception as e:
        print('Error parsing student upload', e)
        return jsonify({'success': False, 'message': 'Unable to process uploaded file.'}), 500

    result, error = teacher_service.bulk_import_students(teacherId, students, school_id)
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


def list_quizzes(teacherId):
    data, error = quiz_service.list_teacher_quizzes(teacherId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def get_quiz(teacherId, quizId):
    data, error = quiz_service.get_quiz_by_id(teacherId, quizId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def delete_quiz(teacherId, quizId):
    result, error = teacher_service.delete_quiz(teacherId, quizId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(result)
