import os
import io
import json
from flask import request, jsonify

from config import GEMINI_API_KEY
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
        schoolId, body.get('password'), body.get('name'), body.get('class_assigned')
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
    # First try JSON body (new SchoolLayout format from JSON file upload)
    body = get_json_body()
    if body and body.get('blueprint_json'):
        result, error = blueprint_service.upload_blueprint(schoolId, None, blueprint_json=body['blueprint_json'])
    else:
        # Fall back to multipart file upload (legacy image path)
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


def get_public_blueprint(schoolId):
    """Public endpoint (no auth) for the game to fetch a school's blueprint."""
    blueprint, error = blueprint_service.get_school_map(schoolId)
    if error:
        status = error[1] if isinstance(error, tuple) and len(error) > 1 else 404
        return jsonify(error[0] if isinstance(error, tuple) else error), status

    # Some psycopg2 configurations return JSONB columns as a raw JSON string
    # instead of a parsed dict.  If that happens, parse it so jsonify returns
    # a proper JSON object (not a double-encoded string).
    if isinstance(blueprint, str):
        import json as _json
        try:
            blueprint = _json.loads(blueprint)
        except (ValueError, TypeError):
            pass

    return jsonify(blueprint)
