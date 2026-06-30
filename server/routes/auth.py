from flask import Blueprint, request, jsonify, make_response
import jwt

from config import JWT_SECRET
from middleware.auth import authenticate_token
from utils.session import sessions, set_session_and_cookie, clear_auth_cookie
from utils.sql import sql

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ── POST /api/auth/login ────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True) or {}
    username = body.get('username')
    password = body.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    try:
        # 1. Check users table (super_admin and teacher)
        user_result = sql(
            """SELECT u.*, s.name as school_name
               FROM users u
               LEFT JOIN schools s ON u.school_id = s.id
               WHERE u.username = $1 AND u.password = $2""",
            [username, password],
        )

        if user_result['rowCount'] > 0:
            user = user_result['rows'][0]
            if user['role'] == 'super_admin':
                user_payload = {
                    'id': user['id'],
                    'username': user['username'],
                    'role': 'super_admin',
                }
                resp = make_response(jsonify({'success': True, 'user': user_payload}))
                set_session_and_cookie(resp, user_payload)
                return resp
            elif user['role'] == 'teacher':
                user_payload = {
                    'id': user['id'],
                    'username': user['username'],
                    'name': user.get('name'),
                    'role': 'teacher',
                    'school_id': user.get('school_id'),
                    'class_assigned': user.get('class_assigned'),
                    'school_name': user.get('school_name') or '',
                }
                resp = make_response(jsonify({'success': True, 'user': user_payload}))
                set_session_and_cookie(resp, user_payload)
                return resp

        # 2. Check schools table (admin / school admin)
        school_result = sql(
            'SELECT * FROM schools WHERE unique_code = $1 AND password = $2',
            [username, password],
        )

        if school_result['rowCount'] > 0:
            school = school_result['rows'][0]
            user_payload = {
                'id': school['id'],
                'name': school['name'],
                'unique_code': school['unique_code'],
                'role': 'admin',
            }
            resp = make_response(jsonify({'success': True, 'user': user_payload}))
            set_session_and_cookie(resp, user_payload)
            return resp

        # 3. Check students table (student)
        student_result = sql(
            """SELECT st.*, s.name as school_name, u.name as teacher_name, u.class_assigned
               FROM students st
               LEFT JOIN schools s ON st.school_id = s.id
               LEFT JOIN users u ON st.teacher_id = u.id
               WHERE st.roll_no = $1
                 AND (LOWER(TRIM(st.password)) = LOWER(TRIM($2))
                      OR LOWER(TRIM(st.name)) = LOWER(TRIM($2)))""",
            [username, password],
        )

        if student_result['rowCount'] > 0:
            student = student_result['rows'][0]
            user_payload = {
                'id': student['id'],
                'roll_no': student['roll_no'],
                'name': student['name'],
                'role': 'student',
                'school_id': student.get('school_id'),
                'school_name': student.get('school_name') or '',
                'teacher_id': student.get('teacher_id'),
                'teacher_name': student.get('teacher_name') or '',
                'class_assigned': student.get('class_assigned') or 'General',
            }
            resp = make_response(jsonify({'success': True, 'user': user_payload}))
            set_session_and_cookie(resp, user_payload)
            return resp

        return jsonify({
            'success': False,
            'message': 'Invalid credentials. Please verify your details.',
        }), 401

    except Exception as e:
        print('Login error', e)
        return jsonify({'success': False, 'message': 'Server database error during login'}), 500


# ── GET /api/auth/session ────────────────────────────────────────────────────

@auth_bp.route('/session', methods=['GET'])
@authenticate_token
def session():
    return jsonify({'success': True, 'user': request.user})


# ── POST /api/auth/logout ────────────────────────────────────────────────────

@auth_bp.route('/logout', methods=['POST'])
def logout():
    token = request.cookies.get('token')
    if token:
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            sessions.pop(decoded.get('sessionId'), None)
        except Exception:
            pass
    resp = make_response(jsonify({'success': True}))
    clear_auth_cookie(resp)
    return resp
