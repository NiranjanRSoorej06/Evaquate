from flask import request, jsonify

from services import school_services, blueprint_service
from utils.helpers import get_json_body


def dashboard(schoolId):
    data, error = school_services.get_dashboard(schoolId)
    if error:
        status = 404 if error.get('message') == 'School not found' else 500
        return jsonify(error), status
    return jsonify(data)


def create_teacher(schoolId):
    body = get_json_body()
    teacher, error = school_services.create_teacher(
        schoolId, body.get('username'), body.get('password'),
        body.get('name'), body.get('class_assigned')
    )
    if error:
        return jsonify(error), 400
    return jsonify({'success': True, 'teacher': teacher})


def update_teacher(schoolId, teacherId):
    body = get_json_body()
    teacher, error = school_services.update_teacher(
        teacherId, body.get('name'), body.get('password'), body.get('class_assigned')
    )
    if error:
        status = 404 if error.get('message') == 'Teacher not found' else 500
        return jsonify(error), status
    return jsonify({'success': True, 'teacher': teacher})


def delete_teacher(schoolId, teacherId):
    result, error = school_services.delete_teacher(teacherId)
    if error:
        return jsonify(error), 500
    return jsonify(result)


def upload_blueprint(schoolId):
    uploaded_file = request.files.get('blueprint')
    result, error = blueprint_service.upload_blueprint(schoolId, uploaded_file)
    if error:
        status = 404 if error.get('message') == 'School not found' else 500
        return jsonify(error), status
    return jsonify(result)


def update_blueprint(schoolId):
    body = get_json_body()
    blueprint_json = body.get('blueprint_json')
    result, error = blueprint_service.update_blueprint(schoolId, blueprint_json)
    if error:
        status = 404 if error.get('message') == 'School not found' else 500
        return jsonify(error), status
    return jsonify({'success': True, 'blueprint_json': result})
