import time
from flask import Blueprint, request, jsonify

from middleware import authenticate_token, require_super_admin
from utils.sql import sql

superadmin_bp = Blueprint('superadmin', __name__, url_prefix='/api/superadmin')


# ── GET /api/superadmin/schools ──────────────────────────────────────────────

@superadmin_bp.route('/schools', methods=['GET'])
@authenticate_token
@require_super_admin
def get_schools():
    try:
        result = sql("""
            SELECT s.*,
                (SELECT COUNT(*) FROM users u
                 WHERE u.school_id = s.id AND u.role = 'teacher')::int AS teacher_count,
                (SELECT COUNT(*) FROM students st
                 WHERE st.school_id = s.id)::int AS student_count
            FROM schools s
            ORDER BY s.name ASC
        """)
        print(f'Fetched {result["rowCount"]} schools from database')
        return jsonify(result['rows'])
    except Exception as e:
        print('Error fetching schools:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# ── POST /api/superadmin/schools ─────────────────────────────────────────────

@superadmin_bp.route('/schools', methods=['POST'])
@authenticate_token
@require_super_admin
def create_school():
    body = request.get_json(silent=True) or {}
    name = body.get('name')
    unique_code = body.get('unique_code')
    password = body.get('password')
    try:
        code_check = sql('SELECT 1 FROM schools WHERE unique_code = $1', [unique_code])
        if code_check['rowCount'] > 0:
            return jsonify({'success': False, 'message': 'School unique ID already exists.'}), 400

        new_school_id = f'school_{int(time.time() * 1000)}'
        insert_result = sql(
            """INSERT INTO schools (id, name, unique_code, password, blueprint_json)
               VALUES ($1, $2, $3, $4, $5) RETURNING *""",
            [new_school_id, name, unique_code, password, None],
        )
        print(f'School created successfully: {insert_result["rows"]}')
        return jsonify({'success': True, 'school': insert_result['rows'][0]})
    except Exception as e:
        print('Error creating school:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
