import os
import json
import secrets

from config import UPLOAD_DIR
from models import school_model


def upload_blueprint(school_id, uploaded_file):
    """Upload a blueprint file and generate a simulated AI floor plan.

    Returns:
        (result_dict, None) on success
        (None, error_dict) on failure
    """
    try:
        school_check = school_model.exists(school_id)
        if school_check['rowCount'] == 0:
            return None, {'success': False, 'message': 'School not found'}

        # Handle file upload (multer equivalent)
        if uploaded_file:
            filename = secrets.token_hex(16)
            uploaded_file.save(os.path.join(UPLOAD_DIR, filename))

        # Simulate an AI parser generating a 12x10 grid floor plan
        simulated_map = {
            'width': 12,
            'height': 10,
            'grid': [
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 2, 0, 1, 0, 4, 0, 0, 2, 0, 1],
                [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 3, 1, 1, 1, 1, 1, 3, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 2, 0, 0, 0, 0, 0, 0, 4, 0, 1],
                [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1, 5, 5, 1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            ],
            'rooms': [
                {'name': 'Classroom A', 'x1': 1, 'y1': 1, 'x2': 3, 'y2': 3},
                {'name': 'Hallway Upper', 'x1': 5, 'y1': 1, 'x2': 10, 'y2': 3},
                {'name': 'Classroom B', 'x1': 1, 'y1': 5, 'x2': 3, 'y2': 8},
                {'name': 'Assembly Yard (Safe)', 'x1': 5, 'y1': 8, 'x2': 7, 'y2': 8},
            ],
            'elements': {
                'extinguishers': [
                    {'x': 2, 'y': 2},
                    {'x': 9, 'y': 2},
                    {'x': 2, 'y': 6},
                ],
                'doors': [
                    {'x': 2, 'y': 4},
                    {'x': 8, 'y': 4},
                ],
                'assembly_zone': {'x': 5, 'y': 8},
            },
        }

        school_model.update_blueprint(school_id, simulated_map)
        return {
            'success': True,
            'message': 'AI has successfully mapped the school layout!',
            'blueprint_json': simulated_map,
        }, None
    except Exception as e:
        print('Error uploading blueprint', e)
        return None, {'success': False, 'message': 'Database error'}


def update_blueprint(school_id, blueprint_json):
    """Update the blueprint JSON directly (from the Visual Floorplan Editor).

    Returns:
        (blueprint_dict, None) on success
        (None, error_dict) on failure
    """
    try:
        school_check = school_model.exists(school_id)
        if school_check['rowCount'] == 0:
            return None, {'success': False, 'message': 'School not found'}

        school_model.update_blueprint(school_id, blueprint_json)
        return blueprint_json, None
    except Exception as e:
        print('Error updating blueprint', e)
        return None, {'success': False, 'message': 'Database error'}


def get_school_map(school_id):
    """Get the school blueprint/map for gamification.

    Returns:
        (blueprint_dict, None) on success
        (None, (response_body_dict, http_status_code)) on failure
    """
    try:
        blueprint = school_model.get_blueprint(school_id)
        if blueprint:
            return blueprint, None
        return None, ({'message': 'School map not uploaded or ready yet.'}, 404)
    except Exception as e:
        print('Error getting school map', e)
        return None, ({'message': 'Database error'}, 500)
