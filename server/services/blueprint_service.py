import os
import json
import secrets
import uuid
from werkzeug.utils import secure_filename

from config import UPLOAD_DIR
from models import school_model
from utils.supabase_client import supabase, BUCKET_NAME


def upload_image_to_storage(school_id, file_bytes, filename):
    """Upload raw image bytes to Supabase Storage and update blueprint_image_path in DB.

    Returns the new storage path on success, or None if upload fails.
    """
    if not supabase:
        print("Supabase client not initialized. Skipping image upload.")
        return None
    try:
        # Delete old image if one exists
        old_path = school_model.get_blueprint_image_path(school_id)
        if old_path:
            try:
                supabase.storage.from_(BUCKET_NAME).remove([old_path])
            except Exception as e:
                print(f"Failed to remove old image: {e}")

        filename = secure_filename(filename or '')
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'png'
        if ext not in {'png', 'jpg', 'jpeg', 'webp'}:
            return None
        new_path = f"{school_id}/{uuid.uuid4()}.{ext}"
        supabase.storage.from_(BUCKET_NAME).upload(new_path, file_bytes)
        # Persist path immediately to DB (blueprint_json unchanged)
        school_model.update_blueprint_with_image(school_id, None, new_path)
        return new_path
    except Exception as e:
        print(f"Error uploading image to Supabase: {e}")
        return None


def upload_blueprint(school_id, uploaded_file, blueprint_json=None):
    """Upload a blueprint file and generate a simulated AI floor plan,
    or store a pre-processed SchoolLayout JSON directly.

    Args:
        school_id: The school identifier.
        uploaded_file: A multipart file upload (legacy image path).
        blueprint_json: A pre-processed SchoolLayout dict (from JSON file upload).

    Returns:
        (result_dict, None) on success
        (None, error_dict) on failure
    """
    try:
        school_check = school_model.exists(school_id)
        if school_check['rowCount'] == 0:
            return None, {'success': False, 'message': 'School not found'}

        # If a pre-processed JSON layout was provided (from game-format JSON upload),
        # store it directly without simulating a grid.
        if blueprint_json:
            school_model.update_blueprint(school_id, blueprint_json)
            return {
                'success': True,
                'message': 'SchoolLayout blueprint saved successfully.',
                'blueprint_json': blueprint_json,
            }, None

        image_path = None
        # Legacy path: handle file upload (multer equivalent)
        if uploaded_file:
            try:
                # check old image and delete
                old_image_path = school_model.get_blueprint_image_path(school_id)
                if old_image_path and supabase:
                    try:
                        supabase.storage.from_("Evaquate Images").remove([old_image_path])
                    except Exception as e:
                        print(f"Failed to remove old image: {e}")

                # upload new image
                filename = secure_filename(uploaded_file.filename or '')
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'png'
                if ext not in {'png', 'jpg', 'jpeg', 'webp'}:
                    return None, {'success': False, 'message': 'Unsupported image type.'}
                image_uuid = str(uuid.uuid4())
                new_path = f"{school_id}/{image_uuid}.{ext}"
                
                file_bytes = uploaded_file.read()
                
                if supabase:
                    res = supabase.storage.from_("Evaquate Images").upload(new_path, file_bytes)
                    image_path = new_path
                else:
                    print("Supabase client not initialized. Skipping image upload.")
            except Exception as e:
                print('Error uploading image to supabase', e)
                return None, {'success': False, 'message': 'Storage error'}

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

        if image_path:
            school_model.update_blueprint_with_image(school_id, simulated_map, image_path)
        else:
            school_model.update_blueprint(school_id, simulated_map)

        return {
            'success': True,
            'message': 'AI has successfully mapped the school layout!',
            'blueprint_json': simulated_map,
            'blueprint_image_path': image_path
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
