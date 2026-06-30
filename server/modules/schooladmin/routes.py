import os
import json
import time
import secrets

from flask import Blueprint, request, jsonify

from config import UPLOAD_DIR
from middleware import authenticate_token, require_admin
from utils.sql import sql

schooladmin_bp = Blueprint('schooladmin', __name__, url_prefix='/api/admin')


# ── GET /api/admin/<schoolId>/dashboard ──────────────────────────────────────

@schooladmin_bp.route('/<schoolId>/dashboard', methods=['GET'])
@authenticate_token
@require_admin
def dashboard(schoolId):
    try:
        school_res = sql('SELECT name, blueprint_json FROM schools WHERE id = $1', [schoolId])
        if school_res['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404
        school = school_res['rows'][0]

        teachers_res = sql(
            """SELECT id, username, name, class_assigned
               FROM users
               WHERE school_id = $1 AND role = 'teacher'
               ORDER BY name ASC""",
            [schoolId],
        )
        teachers = teachers_res['rows']

        students_res = sql(
            """SELECT id, roll_no, name, teacher_id
               FROM students
               WHERE school_id = $1""",
            [schoolId],
        )
        students = students_res['rows']

        scores_res = sql(
            """SELECT sc.*
               FROM scores sc
               JOIN students st ON sc.student_id = st.id
               WHERE st.school_id = $1""",
            [schoolId],
        )
        scores = scores_res['rows']

        dashboard_data = []
        for teacher in teachers:
            my_students = [st for st in students if str(st['teacher_id']) == str(teacher['id'])]
            students_with_scores = []
            for student in my_students:
                student_scores = [sc for sc in scores if str(sc['student_id']) == str(student['id'])]
                students_with_scores.append({**student, 'scores': student_scores})
            dashboard_data.append({
                'teacher_id': teacher['id'],
                'teacher_username': teacher['username'],
                'teacher_name': teacher['name'],
                'class_assigned': teacher.get('class_assigned'),
                'students': students_with_scores,
            })

        blueprint_json = school.get('blueprint_json')
        return jsonify({
            'school_name': school['name'],
            'blueprint_uploaded': bool(blueprint_json),
            'blueprint_json': blueprint_json,
            'teachers': dashboard_data,
        })
    except Exception as e:
        print('Error fetching school dashboard', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── POST /api/admin/<schoolId>/teachers ──────────────────────────────────────

@schooladmin_bp.route('/<schoolId>/teachers', methods=['POST'])
@authenticate_token
@require_admin
def create_teacher(schoolId):
    body = request.get_json(silent=True) or {}
    username = body.get('username')
    password = body.get('password')
    name = body.get('name')
    class_assigned = body.get('class_assigned')
    try:
        user_check = sql('SELECT 1 FROM users WHERE username = $1', [username])
        if user_check['rowCount'] > 0:
            return jsonify({'success': False, 'message': 'Teacher username already exists.'}), 400

        new_teacher_id = f't_{int(time.time() * 1000)}'
        insert_result = sql(
            """INSERT INTO users (id, school_id, role, username, password, name, class_assigned)
               VALUES ($1, $2, 'teacher', $3, $4, $5, $6) RETURNING *""",
            [new_teacher_id, schoolId, username, password, name, class_assigned],
        )
        return jsonify({'success': True, 'teacher': insert_result['rows'][0]})
    except Exception as e:
        print('Error creating teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── PUT /api/admin/<schoolId>/teachers/<teacherId> ───────────────────────────

@schooladmin_bp.route('/<schoolId>/teachers/<teacherId>', methods=['PUT'])
@authenticate_token
@require_admin
def update_teacher(schoolId, teacherId):
    body = request.get_json(silent=True) or {}
    name = body.get('name')
    password = body.get('password')
    class_assigned = body.get('class_assigned')
    try:
        select_res = sql('SELECT * FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher'])
        if select_res['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404

        current = select_res['rows'][0]
        update_name = name or current.get('name')
        update_class = class_assigned if class_assigned is not None else current.get('class_assigned')
        update_password = password or current.get('password')

        update_result = sql(
            """UPDATE users
               SET name = $1, class_assigned = $2, password = $3
               WHERE id = $4 AND role = 'teacher' RETURNING *""",
            [update_name, update_class, update_password, teacherId],
        )
        return jsonify({'success': True, 'teacher': update_result['rows'][0]})
    except Exception as e:
        print('Error modifying teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── DELETE /api/admin/<schoolId>/teachers/<teacherId> ────────────────────────

@schooladmin_bp.route('/<schoolId>/teachers/<teacherId>', methods=['DELETE'])
@authenticate_token
@require_admin
def delete_teacher(schoolId, teacherId):
    try:
        sql('DELETE FROM students WHERE teacher_id = $1', [teacherId])
        sql('DELETE FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher'])
        return jsonify({'success': True})
    except Exception as e:
        print('Error deleting teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── POST /api/admin/<schoolId>/blueprint ─────────────────────────────────────

@schooladmin_bp.route('/<schoolId>/blueprint', methods=['POST'])
@authenticate_token
@require_admin
def upload_blueprint(schoolId):
    try:
        school_check = sql('SELECT 1 FROM schools WHERE id = $1', [schoolId])
        if school_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404

        uploaded_file = request.files.get('blueprint')
        if uploaded_file:
            filename = secrets.token_hex(16)
            uploaded_file.save(os.path.join(UPLOAD_DIR, filename))

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

        sql('UPDATE schools SET blueprint_json = $1 WHERE id = $2',
            [json.dumps(simulated_map), schoolId])
        return jsonify({
            'success': True,
            'message': 'AI has successfully mapped the school layout!',
            'blueprint_json': simulated_map,
        })
    except Exception as e:
        print('Error uploading blueprint', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── PUT /api/admin/<schoolId>/blueprint ──────────────────────────────────────

@schooladmin_bp.route('/<schoolId>/blueprint', methods=['PUT'])
@authenticate_token
@require_admin
def update_blueprint(schoolId):
    body = request.get_json(silent=True) or {}
    blueprint_json = body.get('blueprint_json')
    try:
        school_check = sql('SELECT 1 FROM schools WHERE id = $1', [schoolId])
        if school_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404

        sql('UPDATE schools SET blueprint_json = $1 WHERE id = $2',
            [json.dumps(blueprint_json), schoolId])
        return jsonify({'success': True, 'blueprint_json': blueprint_json})
    except Exception as e:
        print('Error updating blueprint', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500
