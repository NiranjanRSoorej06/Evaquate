import jwt
from config import JWT_SECRET
from models import user_model, school_model, student_model
from middleware.sessions import sessions


def login(username, password):
    """Authenticate a user by checking users, schools, then students tables.

    Returns:
        (user_payload_dict, None) on success
        (None, (response_body_dict, http_status_code)) on failure
    """
    try:
        # 1. Check users table (super_admin and teacher)
        user_result = user_model.find_by_credentials(username, password)

        if user_result['rowCount'] > 0:
            user = user_result['rows'][0]
            if user['role'] == 'super_admin':
                user_payload = {
                    'id': user['id'],
                    'username': user['username'],
                    'role': 'super_admin',
                }
                return user_payload, None

            elif user['role'] == 'teacher':
                # Check if school is disabled
                if user['school_id']:
                    disabled = school_model.check_disabled(user['school_id'])
                    if disabled:
                        return None, (
                            {'success': False, 'message': 'This school has been disabled. Access is not permitted.'},
                            403,
                        )

                user_payload = {
                    'id': user['id'],
                    'username': user['username'],
                    'name': user.get('name'),
                    'role': 'teacher',
                    'school_id': user.get('school_id'),
                    'class_assigned': user.get('class_assigned'),
                    'school_name': user.get('school_name') or '',
                }
                return user_payload, None

        # 2. Check schools table (admin / school admin)
        school = school_model.find_by_credentials(username, password)

        if school:
            if school.get('disabled'):
                return None, (
                    {'success': False, 'message': 'This school has been disabled. Access is not permitted.'},
                    403,
                )

            user_payload = {
                'id': school['id'],
                'name': school['name'],
                'unique_code': school['unique_code'],
                'role': 'admin',
            }
            return user_payload, None

        # 3. Check students table (student)
        student_result = student_model.find_by_credentials(username, password)

        if student_result['rowCount'] > 0:
            student = student_result['rows'][0]
            # Check if school is disabled
            disabled = school_model.check_disabled(student['school_id'])
            if disabled:
                return None, (
                    {'success': False, 'message': 'This school has been disabled. Access is not permitted.'},
                    403,
                )

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
            return user_payload, None

        return None, ({'success': False, 'message': 'Invalid credentials. Please verify your details.'}, 401)

    except Exception as e:
        print('Login error', e)
        return None, ({'success': False, 'message': 'Server database error during login'}, 500)


def logout(token):
    """Remove the session associated with the given JWT token."""
    if token:
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            sessions.pop(decoded.get('sessionId'), None)
        except Exception:
            pass
