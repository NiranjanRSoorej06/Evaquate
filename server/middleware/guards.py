from functools import wraps
from flask import request, jsonify


def require_super_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'super_admin':
            return jsonify({
                'success': False,
                'message': 'Forbidden. Super Admin access required.',
            }), 403
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        school_id = kwargs.get('schoolId')
        if request.user.get('role') != 'admin' or \
           (school_id and str(request.user.get('id')) != str(school_id)):
            return jsonify({
                'success': False,
                'message': 'Forbidden. Admin access required.',
            }), 403
        return f(*args, **kwargs)
    return decorated


def require_teacher_or_student_of_teacher(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        teacher_id = kwargs.get('teacherId')
        user = request.user
        if user.get('role') == 'teacher' and str(user.get('id')) == str(teacher_id):
            return f(*args, **kwargs)
        if (request.method == 'GET' and
                user.get('role') == 'student' and
                str(user.get('teacher_id')) == str(teacher_id)):
            return f(*args, **kwargs)
        return jsonify({
            'success': False,
            'message': 'Forbidden. Unauthorized access.',
        }), 403
    return decorated


def require_student(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        body = request.get_json(silent=True) or {}
        student_id = body.get('student_id')
        user = request.user
        if user.get('role') != 'student' or \
           (student_id and str(user.get('id')) != str(student_id)):
            return jsonify({
                'success': False,
                'message': 'Forbidden. Student access required.',
            }), 403
        return f(*args, **kwargs)
    return decorated


def require_student_of_school(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        school_id = kwargs.get('schoolId')
        user = request.user
        if user.get('role') != 'student' or \
           (school_id and str(user.get('school_id')) != str(school_id)):
            return jsonify({
                'success': False,
                'message': 'Forbidden. Unauthorized school map access.',
            }), 403
        return f(*args, **kwargs)
    return decorated
