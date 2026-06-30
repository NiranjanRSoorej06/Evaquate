import os
import json
import time
import secrets
import csv
import io
import re
from datetime import datetime, timezone, timedelta
from functools import wraps

from flask import Flask, request, jsonify, make_response
from flask_cors import CORS

from config import PORT, UPLOAD_DIR


app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:5174'], supports_credentials=True)

    # ── Ensure uploads directory exists ─────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- SESSION MANAGEMENT ---
sessions = {}  # sessionId -> { user: dict, expiresAt: float }
SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000  # 24 hours in ms
SESSION_EXPIRY_SEC = 24 * 60 * 60  # 24 hours in seconds


def generate_session_id():
    return secrets.token_hex(32)


def set_session_and_cookie(response, user_payload):
    session_id = generate_session_id()
    sessions[session_id] = {
        'user': user_payload,
        'expiresAt': time.time() * 1000 + SESSION_EXPIRY_MS,
    }
    token = jwt.encode(
        {'sessionId': session_id, 'exp': datetime.now(timezone.utc) + timedelta(seconds=SESSION_EXPIRY_SEC)},
        JWT_SECRET,
        algorithm='HS256',
    )
    response.set_cookie(
        'token', token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite='Lax',
        max_age=SESSION_EXPIRY_SEC,
    )
    return response


def clear_auth_cookie(response):
    response.delete_cookie(
        'token',
        httponly=True,
        secure=IS_PRODUCTION,
        samesite='Lax',
    )
    return response


# --- MIDDLEWARE ---

def authenticate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return jsonify({'success': False, 'message': 'Access denied. No token provided.'}), 401
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            session_id = decoded.get('sessionId')
            session = sessions.get(session_id)
            if not session or session['expiresAt'] < time.time() * 1000:
                if session:
                    sessions.pop(session_id, None)
                resp = make_response(jsonify({'success': False, 'message': 'Session expired or invalid.'}), 401)
                clear_auth_cookie(resp)
                return resp
            request.user = session['user']
            request.session_id = session_id
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            resp = make_response(jsonify({'success': False, 'message': 'Session expired or invalid.'}), 401)
            clear_auth_cookie(resp)
            return resp
        except jwt.InvalidTokenError:
            resp = make_response(jsonify({'success': False, 'message': 'Invalid token.'}), 401)
            clear_auth_cookie(resp)
            return resp
    return decorated


def require_super_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'super_admin':
            return jsonify({'success': False, 'message': 'Forbidden. Super Admin access required.'}), 403
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        school_id = kwargs.get('schoolId')
        if request.user.get('role') != 'admin' or (school_id and str(request.user.get('id')) != str(school_id)):
            return jsonify({'success': False, 'message': 'Forbidden. Admin access required.'}), 403
        return f(*args, **kwargs)
    return decorated


def require_teacher_or_student_of_teacher(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        teacher_id = kwargs.get('teacherId')
        user = request.user
        if user.get('role') == 'teacher' and str(user.get('id')) == str(teacher_id):
            return f(*args, **kwargs)
        if request.method == 'GET' and user.get('role') == 'student' and str(user.get('teacher_id')) == str(teacher_id):
            return f(*args, **kwargs)
        return jsonify({'success': False, 'message': 'Forbidden. Unauthorized access.'}), 403
    return decorated


def require_student(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        body = request.get_json(silent=True) or {}
        student_id = body.get('student_id')
        user = request.user
        if user.get('role') != 'student' or (student_id and str(user.get('id')) != str(student_id)):
            return jsonify({'success': False, 'message': 'Forbidden. Student access required.'}), 403
        return f(*args, **kwargs)
    return decorated


def require_student_of_school(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        school_id = kwargs.get('schoolId')
        user = request.user
        if user.get('role') != 'student' or (school_id and str(user.get('school_id')) != str(school_id)):
            return jsonify({'success': False, 'message': 'Forbidden. Unauthorized school map access.'}), 403
        return f(*args, **kwargs)
    return decorated


# --- Helper ---

def parse_quiz_csv(file_storage):
    content = file_storage.read().decode('utf-8-sig')
    if not content.strip():
        raise ValueError('CSV file is empty.')

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError('CSV file must contain headers.')

    def normalize_header(value):
        return re.sub(r'[^a-z0-9]+', '', (value or '').strip().lower())

    def find_value(row, aliases):
        for key in row.keys():
            if normalize_header(key) in aliases:
                value = str(row.get(key, '') or '').strip()
                if value:
                    return value
        return None

    def find_option(row, label):
        for key in row.keys():
            normalized = normalize_header(key)
            if normalized in label:
                value = str(row.get(key, '') or '').strip()
                if value:
                    return value
        return None

    questions = []
    for row in reader:
        question = find_value(row, {'question', 'prompt', 'q', 'questiontext'})
        if not question:
            continue

        option_values = []
        for option_key in [
            {'optiona', 'option1', 'optionone'},
            {'optionb', 'option2', 'optiontwo'},
            {'optionc', 'option3', 'optionthree'},
            {'optiond', 'option4', 'optionfour'},
        ]:
            option_value = find_option(row, option_key)
            if option_value:
                option_values.append(option_value)

        if len(option_values) < 2:
            continue

        answer = 0
        answer_value = find_value(row, {'answer', 'correctanswer', 'correct', 'correctoption', 'correctansweroption'})
        if answer_value is not None:
            normalized = answer_value.strip().lower()
            if normalized in {'a', 'b', 'c', 'd'}:
                answer = ord(normalized) - ord('a')
            elif normalized in {'optiona', 'optionb', 'optionc', 'optiond'}:
                answer = ord(normalized[-1]) - ord('a')
            elif normalized.startswith('option '):
                letter = normalized.split()[-1][0].lower()
                if letter in 'abcd':
                    answer = ord(letter) - ord('a')
            elif normalized.isdigit():
                idx = int(normalized) - 1
                if 0 <= idx < len(option_values):
                    answer = idx
            else:
                for idx, option in enumerate(option_values):
                    if normalized == option.strip().lower():
                        answer = idx
                        break

        question_payload = {
            'question': question,
            'options': option_values,
            'answer': answer,
            'option_a': option_values[0] if len(option_values) > 0 else '',
            'option_b': option_values[1] if len(option_values) > 1 else '',
            'option_c': option_values[2] if len(option_values) > 2 else '',
            'option_d': option_values[3] if len(option_values) > 3 else '',
            'correct_answer': answer_value or '',
        }
        questions.append(question_payload)

    if not questions:
        raise ValueError('No valid quiz questions were found in the CSV file.')
    return questions


def sql(query_str, params=None):
    """Wrapper around db.query that converts $N placeholders to %s for psycopg2.
    Handles repeated $N references (e.g. $2 used twice) by expanding the params tuple."""
    if params is None:
        return db.query(query_str)
    import re
    # Find all $N tokens in order of appearance
    tokens = re.findall(r'\$(\d+)', query_str)
    # Replace all $N with %s
    converted = re.sub(r'\$\d+', '%s', query_str)
    # Build expanded params: one entry per placeholder occurrence
    expanded = tuple(params[int(idx) - 1] for idx in tokens)
    return db.query(converted, expanded)


# ===================== API ROUTES =====================

# 1. Unified Authentication

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
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
            [username, password]
        )

        if user_result['rowCount'] > 0:
            user = user_result['rows'][0]
            if user['role'] == 'super_admin':
                user_payload = {'id': user['id'], 'username': user['username'], 'role': 'super_admin'}
                resp = make_response(jsonify({'success': True, 'user': user_payload}))
                set_session_and_cookie(resp, user_payload)
                return resp
            elif user['role'] == 'teacher':
                # Check if school is disabled
                if user['school_id']:
                    school_check = sql('SELECT disabled FROM schools WHERE id = $1', [user['school_id']])
                    if school_check['rowCount'] > 0 and school_check['rows'][0].get('disabled'):
                        return jsonify({'success': False, 'message': 'This school has been disabled. Access is not permitted.'}), 403
                
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
            [username, password]
        )

        if school_result['rowCount'] > 0:
            school = school_result['rows'][0]
            if school.get('disabled'):
                return jsonify({'success': False, 'message': 'This school has been disabled. Access is not permitted.'}), 403
            
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
               WHERE st.roll_no = $1 AND (LOWER(TRIM(st.password)) = LOWER(TRIM($2)) OR LOWER(TRIM(st.name)) = LOWER(TRIM($2)))""",
            [username, password]
        )

        if student_result['rowCount'] > 0:
            student = student_result['rows'][0]
            # Check if school is disabled
            school_check = sql('SELECT disabled FROM schools WHERE id = $1', [student['school_id']])
            if school_check['rowCount'] > 0 and school_check['rows'][0].get('disabled'):
                return jsonify({'success': False, 'message': 'This school has been disabled. Access is not permitted.'}), 403
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

        return jsonify({'success': False, 'message': 'Invalid credentials. Please verify your details.'}), 401

    except Exception as e:
        print('Login error', e)
        return jsonify({'success': False, 'message': 'Server database error during login'}), 500


# Session restoration endpoint

@app.route('/api/auth/session', methods=['GET'])
@authenticate_token
def auth_session():
    return jsonify({'success': True, 'user': request.user})


# Logout endpoint

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
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


# 2. Super Admin APIs

@app.route('/api/superadmin/schools', methods=['GET'])
@authenticate_token
@require_super_admin
def superadmin_get_schools():
    try:
        result = sql("""
            SELECT s.*,
                (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher')::int as teacher_count,
                (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id)::int as student_count
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


@app.route('/api/superadmin/schools', methods=['POST'])
@authenticate_token
@require_super_admin
def superadmin_create_school():
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
            [new_school_id, name, unique_code, password, None]
        )
        print(f'School created successfully: {insert_result["rows"]}')
        return jsonify({'success': True, 'school': insert_result['rows'][0]})
    except Exception as e:
        print('Error creating school:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# Get all teachers of a school
@app.route('/api/superadmin/schools/<schoolId>/teachers', methods=['GET'])
@authenticate_token
@require_super_admin
def superadmin_get_teachers(schoolId):
    try:
        school_check = sql('SELECT id FROM schools WHERE id = $1', [schoolId])
        if school_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404
        
        result = sql(
            """SELECT id, username, name, class_assigned, password
               FROM users
               WHERE school_id = $1 AND role = 'teacher'
               ORDER BY name ASC""",
            [schoolId]
        )
        return jsonify(result['rows'])
    except Exception as e:
        print('Error fetching teachers:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# Get all students of a teacher
@app.route('/api/superadmin/schools/<schoolId>/teachers/<teacherId>/students', methods=['GET'])
@authenticate_token
@require_super_admin
def superadmin_get_students(schoolId, teacherId):
    try:
        teacher_check = sql('SELECT id FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher'])
        if teacher_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404
        
        result = sql(
            """SELECT id, roll_no, name, password
               FROM students
               WHERE school_id = $1 AND teacher_id = $2
               ORDER BY name ASC""",
            [schoolId, teacherId]
        )
        return jsonify(result['rows'])
    except Exception as e:
        print('Error fetching students:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# Disable/Enable a school
@app.route('/api/superadmin/schools/<schoolId>/disable', methods=['PUT'])
@authenticate_token
@require_super_admin
def superadmin_disable_school(schoolId):
    body = request.get_json(silent=True) or {}
    disabled = body.get('disabled', True)
    try:
        result = sql(
            """UPDATE schools SET disabled = $1 WHERE id = $2 RETURNING *""",
            [disabled, schoolId]
        )
        if result['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404
        return jsonify({'success': True, 'school': result['rows'][0]})
    except Exception as e:
        print('Error disabling school:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# Reset teacher password
@app.route('/api/superadmin/schools/<schoolId>/teachers/<teacherId>/reset-password', methods=['PUT'])
@authenticate_token
@require_super_admin
def superadmin_reset_teacher_password(schoolId, teacherId):
    body = request.get_json(silent=True) or {}
    new_password = body.get('password')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required'}), 400
    
    try:
        result = sql(
            """UPDATE users SET password = $1 WHERE id = $2 AND role = $3 RETURNING *""",
            [new_password, teacherId, 'teacher']
        )
        if result['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404
        return jsonify({'success': True, 'teacher': result['rows'][0]})
    except Exception as e:
        print('Error resetting teacher password:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# Reset student password
@app.route('/api/superadmin/schools/<schoolId>/teachers/<teacherId>/students/<studentId>/reset-password', methods=['PUT'])
@authenticate_token
@require_super_admin
def superadmin_reset_student_password(schoolId, teacherId, studentId):
    body = request.get_json(silent=True) or {}
    new_password = body.get('password')
    if not new_password:
        return jsonify({'success': False, 'message': 'New password required'}), 400
    
    try:
        result = sql(
            """UPDATE students SET password = $1 WHERE id = $2 RETURNING *""",
            [new_password, studentId]
        )
        if result['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'Student not found'}), 404
        return jsonify({'success': True, 'student': result['rows'][0]})
    except Exception as e:
        print('Error resetting student password:', str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# 3. School Admin APIs

@app.route('/api/admin/<schoolId>/dashboard', methods=['GET'])
@authenticate_token
@require_admin
def admin_dashboard(schoolId):
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
            [schoolId]
        )
        teachers = teachers_res['rows']

        students_res = sql(
            """SELECT id, roll_no, name, teacher_id
               FROM students
               WHERE school_id = $1""",
            [schoolId]
        )
        students = students_res['rows']

        scores_res = sql(
            """SELECT sc.*
               FROM scores sc
               JOIN students st ON sc.student_id = st.id
               WHERE st.school_id = $1""",
            [schoolId]
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
        # blueprint_json from JSONB is already a Python dict
        return jsonify({
            'school_name': school['name'],
            'blueprint_uploaded': bool(blueprint_json),
            'blueprint_json': blueprint_json,
            'teachers': dashboard_data,
        })
    except Exception as e:
        print('Error fetching school dashboard', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Create Teacher account

@app.route('/api/admin/<schoolId>/teachers', methods=['POST'])
@authenticate_token
@require_admin
def admin_create_teacher(schoolId):
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
            [new_teacher_id, schoolId, username, password, name, class_assigned]
        )
        return jsonify({'success': True, 'teacher': insert_result['rows'][0]})
    except Exception as e:
        print('Error creating teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Modify/Assign Teacher Class (or toggle status)

@app.route('/api/admin/<schoolId>/teachers/<teacherId>', methods=['PUT'])
@authenticate_token
@require_admin
def admin_update_teacher(schoolId, teacherId):
    body = request.get_json(silent=True) or {}
    name = body.get('name')
    password = body.get('password')
    class_assigned = body.get('class_assigned')
    try:
        select_res = sql('SELECT * FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher'])
        if select_res['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'Teacher not found'}), 404

        current_teacher = select_res['rows'][0]
        update_name = name or current_teacher.get('name')
        update_class = class_assigned if class_assigned is not None else current_teacher.get('class_assigned')
        update_password = password or current_teacher.get('password')

        update_result = sql(
            """UPDATE users
               SET name = $1, class_assigned = $2, password = $3
               WHERE id = $4 AND role = 'teacher' RETURNING *""",
            [update_name, update_class, update_password, teacherId]
        )
        return jsonify({'success': True, 'teacher': update_result['rows'][0]})
    except Exception as e:
        print('Error modifying teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Delete Teacher account

@app.route('/api/admin/<schoolId>/teachers/<teacherId>', methods=['DELETE'])
@authenticate_token
@require_admin
def admin_delete_teacher(schoolId, teacherId):
    try:
        sql('DELETE FROM students WHERE teacher_id = $1', [teacherId])
        sql('DELETE FROM users WHERE id = $1 AND role = $2', [teacherId, 'teacher'])
        return jsonify({'success': True})
    except Exception as e:
        print('Error deleting teacher', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Blueprint Upload & AI Generation Endpoint

@app.route('/api/admin/<schoolId>/blueprint', methods=['POST'])
@authenticate_token
@require_admin
def admin_upload_blueprint(schoolId):
    try:
        school_check = sql('SELECT 1 FROM schools WHERE id = $1', [schoolId])
        if school_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404

        # Handle file upload (multer equivalent) - file is received but we simulate AI parsing
        # The file field name is 'blueprint' as sent by the client
        uploaded_file = request.files.get('blueprint')
        if uploaded_file:
            # Save file to uploads directory (similar to multer dest)
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

        sql('UPDATE schools SET blueprint_json = $1 WHERE id = $2', [json.dumps(simulated_map), schoolId])
        return jsonify({
            'success': True,
            'message': 'AI has successfully mapped the school layout!',
            'blueprint_json': simulated_map,
        })
    except Exception as e:
        print('Error uploading blueprint', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Update Blueprint JSON directly (Visual Floorplan Editor modifications)

@app.route('/api/admin/<schoolId>/blueprint', methods=['PUT'])
@authenticate_token
@require_admin
def admin_update_blueprint(schoolId):
    body = request.get_json(silent=True) or {}
    blueprint_json = body.get('blueprint_json')
    try:
        school_check = sql('SELECT 1 FROM schools WHERE id = $1', [schoolId])
        if school_check['rowCount'] == 0:
            return jsonify({'success': False, 'message': 'School not found'}), 404

        sql('UPDATE schools SET blueprint_json = $1 WHERE id = $2', [json.dumps(blueprint_json), schoolId])
        return jsonify({'success': True, 'blueprint_json': blueprint_json})
    except Exception as e:
        print('Error updating blueprint', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# 4. Teacher APIs

@app.route('/api/teacher/<teacherId>/students', methods=['GET'])
@authenticate_token
@require_teacher_or_student_of_teacher
def teacher_get_students(teacherId):
    try:
        students_res = sql(
            "SELECT id, roll_no, name, school_id, teacher_id FROM students WHERE teacher_id = $1 ORDER BY roll_no::int ASC, name ASC",
            [teacherId]
        )
        students = students_res['rows']

        scores_res = sql(
            """SELECT sc.*
               FROM scores sc
               JOIN students st ON sc.student_id = st.id
               WHERE st.teacher_id = $1
               ORDER BY sc.timestamp DESC""",
            [teacherId]
        )
        scores = scores_res['rows']

        students_with_scores = []
        for student in students:
            student_scores = [sc for sc in scores if str(sc['student_id']) == str(student['id'])]
            students_with_scores.append({**student, 'scores': student_scores})

        return jsonify({'students': students_with_scores})
    except Exception as e:
        print('Error getting teacher students', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Add Single Student

@app.route('/api/teacher/<teacherId>/students', methods=['POST'])
@authenticate_token
@require_teacher_or_student_of_teacher
def teacher_add_student(teacherId):
    body = request.get_json(silent=True) or {}
    name = body.get('name')
    roll_no = body.get('roll_no')
    school_id = body.get('school_id')
    try:
        check_res = sql(
            'SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2',
            [school_id, roll_no]
        )
        if check_res['rowCount'] > 0:
            return jsonify({'success': False, 'message': f'Roll number {roll_no} already exists in this school.'}), 400

        new_student_id = f's_{int(time.time() * 1000)}'
        insert_res = sql(
            """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
            [new_student_id, school_id, teacherId, roll_no, name, name]
        )
        return jsonify({'success': True, 'student': insert_res['rows'][0]})
    except Exception as e:
        print('Error adding student', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Bulk Import Students via JSON (CSV parsed on client side)

@app.route('/api/teacher/<teacherId>/students/bulk', methods=['POST'])
@authenticate_token
@require_teacher_or_student_of_teacher
def teacher_bulk_import_students(teacherId):
    body = request.get_json(silent=True) or {}
    students_list = body.get('students', [])
    school_id = body.get('school_id')
    try:
        added_count = 0
        skipped_count = 0

        for st in students_list:
            clean_roll = str(st.get('roll_no', '')).strip()
            clean_name = str(st.get('name', '')).strip()

            if not clean_roll or not clean_name:
                skipped_count += 1
                continue

            check_res = sql(
                'SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2',
                [school_id, clean_roll]
            )

            if check_res['rowCount'] == 0:
                import random
                import string
                rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
                rand_id = f's_{int(time.time() * 1000)}_{rand_suffix}'
                sql(
                    """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
                       VALUES ($1, $2, $3, $4, $5, $6)""",
                    [rand_id, school_id, teacherId, clean_roll, clean_name, clean_name]
                )
                added_count += 1
            else:
                skipped_count += 1

        return jsonify({'success': True, 'addedCount': added_count, 'skippedCount': skipped_count})
    except Exception as e:
        print('Error bulk importing students', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Delete Student

@app.route('/api/teacher/<teacherId>/students/<studentId>', methods=['DELETE'])
@authenticate_token
@require_teacher_or_student_of_teacher
def teacher_delete_student(teacherId, studentId):
    try:
        sql('DELETE FROM students WHERE id = $1', [studentId])
        return jsonify({'success': True})
    except Exception as e:
        print('Error deleting student', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Upload quiz CSV for a disaster type

@app.route('/api/teacher/<teacherId>/quizzes/upload', methods=['POST'])
@authenticate_token
@require_teacher_or_student_of_teacher
def teacher_upload_quiz(teacherId):
    uploaded_file = request.files.get('quiz_file')
    disaster_type = (request.form.get('disaster_type') or '').strip().lower()

    if not uploaded_file or not disaster_type:
        return jsonify({'success': False, 'message': 'A CSV file and disaster type are required.'}), 400

    try:
        questions = parse_quiz_csv(uploaded_file)
        if not questions:
            raise ValueError('No valid quiz questions were found in the CSV file.')

        sql('DELETE FROM quizzes WHERE disaster_type = $1', [disaster_type])

        for question_payload in questions:
            sql(
                """INSERT INTO quizzes (
                    disaster_type, question, option_a, option_b, option_c, option_d, correct_answer, questions
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                [
                    disaster_type,
                    question_payload.get('question', ''),
                    question_payload.get('option_a', ''),
                    question_payload.get('option_b', ''),
                    question_payload.get('option_c', ''),
                    question_payload.get('option_d', ''),
                    question_payload.get('correct_answer', ''),
                    json.dumps(questions)
                ]
            )

        return jsonify({'success': True, 'disaster_type': disaster_type, 'questions': questions})
    except ValueError as value_error:
        return jsonify({'success': False, 'message': str(value_error)}), 400
    except Exception as e:
        print('Error uploading quiz', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# 5. Student & Gameplay APIs
# Get Quiz

@app.route('/api/quizzes/<disasterType>', methods=['GET'])
@authenticate_token
def get_quiz(disasterType):
    try:
        quiz_res = sql('SELECT * FROM quizzes WHERE disaster_type = $1 ORDER BY id', [disasterType])
        if quiz_res['rowCount'] > 0:
            first_row = quiz_res['rows'][0]
            questions = first_row.get('questions') or []
            return jsonify({'disaster_type': disasterType, 'questions': questions})
        return jsonify({'message': 'Quiz not found'}), 404
    except Exception as e:
        print('Error getting quiz', e)
        return jsonify({'message': 'Database error'}), 500


# Submit Score

@app.route('/api/student/score', methods=['POST'])
@authenticate_token
@require_student
def submit_score():
    body = request.get_json(silent=True) or {}
    student_id = body.get('student_id')
    disaster_type = body.get('disaster_type')
    activity_type = body.get('activity_type')
    score = body.get('score')
    duration_seconds = body.get('duration_seconds')
    try:
        new_score_id = f'sc_{int(time.time() * 1000)}'
        timestamp = datetime.now(timezone.utc).isoformat()

        insert_res = sql(
            """INSERT INTO scores (id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp)
               VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *""",
            [new_score_id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp]
        )
        return jsonify({'success': True, 'score': insert_res['rows'][0]})
    except Exception as e:
        print('Error submitting score', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# Fetch School Map for Gamification

@app.route('/api/student/<schoolId>/map', methods=['GET'])
@authenticate_token
@require_student_of_school
def get_school_map(schoolId):
    try:
        school_res = sql('SELECT blueprint_json FROM schools WHERE id = $1', [schoolId])
        if school_res['rowCount'] > 0 and school_res['rows'][0].get('blueprint_json'):
            return jsonify(school_res['rows'][0]['blueprint_json'])
        return jsonify({'message': 'School map not uploaded or ready yet.'}), 404
    except Exception as e:
        print('Error getting school map', e)
        return jsonify({'message': 'Database error'}), 500


# Launch server
if __name__ == '__main__':
    print(f'Disaster preparedness server is running on http://localhost:{PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
