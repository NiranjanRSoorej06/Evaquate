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


def image_to_json(schoolId):
    """Convert a school blueprint image (PNG/JPG) to a SchoolLayout JSON using Gemini."""
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return jsonify({'success': False, 'message': 'Missing dependency: google-genai. Run pip install google-genai.'}), 500

    if not GEMINI_API_KEY:
        return jsonify({'success': False, 'message': 'GEMINI_API_KEY not configured on server.'}), 500

    image_file = request.files.get('image')
    if not image_file:
        return jsonify({'success': False, 'message': 'No image file provided. Send a PNG/JPG as multipart field "image".'}), 400

    # Normalise mime type — Gemini accepts image/jpeg but not image/jpg
    mime_map = {'image/jpg': 'image/jpeg'}
    mime_type = mime_map.get(image_file.mimetype, image_file.mimetype)

    allowed_types = {'image/png', 'image/jpeg', 'image/webp'}
    if mime_type not in allowed_types:
        return jsonify({'success': False, 'message': f'Invalid file type "{image_file.mimetype}". Allowed: PNG, JPG, WEBP.'}), 400

    try:
        img_bytes = image_file.read()
    except Exception as e:
        return jsonify({'success': False, 'message': f'Could not read image: {str(e)}'}), 400

    # --- Persist image to Supabase Storage ---
    image_path = blueprint_service.upload_image_to_storage(
        schoolId, img_bytes, image_file.filename or f'blueprint.{mime_type.split("/")[-1]}'
    )
    if image_path is None:
        print(f"Warning: Image for school {schoolId} could not be saved to Supabase.")
    # -----------------------------------------

    prompt = """
You are an expert architectural blueprint parser.

Analyze the provided image of a school building.

Generate a JSON representation suitable for a 2D disaster management game.

Extract:

1. School name
2. Number of floors
3. Rooms
4. Doors
5. Windows
6. Corridors
7. Staircases
8. Ramps
9. Fire exits
10. Assembly points

For each room include:
- id
- name
- floor
- width
- height

For each exit include:
- id
- type

Return ONLY VALID JSON.

Template JSON:

{
  "schoolName": "School Name",
  "floorsCount": 1,

  "rooms": [
    {
      "id": "unique_room_id",
      "name": "Room Name",
      "type": "classroom",
      "x": 0,
      "y": 0,
      "width": 20,
      "height": 15,
      "floor": 1,
      "color": "#e0f2fe",

      "doors": [
        {
          "id": "door_id",
          "x": 0,
          "y": 0,
          "width": 3,
          "height": 1,
          "isOpen": true
        }
      ],

      "windows": [
        {
          "id": "window_id",
          "x": 0,
          "y": 0,
          "width": 5
        }
      ],

      "furniture": [
        {
          "id": "furniture_id",
          "type": "desk",
          "x": 0,
          "y": 0,
          "width": 2,
          "height": 1,
          "rotation": 0
        }
      ]
    }
  ],

  "assemblyArea": {
    "x": 0,
    "y": 0,
    "radius": 10,
    "name": "Assembly Ground"
  }
}
"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        image_part = types.Part.from_bytes(
            data=img_bytes,
            mime_type=mime_type
        )

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image_part, prompt]
        )

        raw_text = response.text

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Gemini API error: {str(e)}'
        }), 502

    # Strip markdown code fences if present
    raw_text = raw_text.replace('```json', '').replace('```', '').strip()

    try:
        data = json.loads(raw_text)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Gemini returned non-JSON response: {str(e)}', 'raw': raw_text[:500]}), 502

    return jsonify({'success': True, 'layout': data, 'blueprint_image_path': image_path})

