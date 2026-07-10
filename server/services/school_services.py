import time
import traceback

from models import school_model, user_model, student_model, score_model
from utils.id_generator import generate_id, build_teacher_id


def get_all_schools():
    """Get all schools with teacher/student counts."""
    try:
        result = school_model.get_all_with_counts()
        print(f'Fetched {result["rowCount"]} schools from database')
        return result['rows'], None
    except Exception as e:
        print('Error fetching schools:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def create_school(name, unique_code, password):
    """Create a new school. Returns (school_dict, error)."""
    try:
        code_check = school_model.unique_code_exists(unique_code)
        if code_check['rowCount'] > 0:
            return None, {'success': False, 'message': 'School unique ID already exists.'}

        new_school_id = generate_id('school')
        insert_result = school_model.create(new_school_id, name, unique_code, password)
        print(f'School created successfully: {insert_result["rows"]}')
        return insert_result['rows'][0], None
    except Exception as e:
        print('Error creating school:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def get_teachers(school_id):
    """Get all teachers of a school (with passwords, for superadmin)."""
    try:
        school_check = school_model.exists(school_id)
        if school_check['rowCount'] == 0:
            return None, {'success': False, 'message': 'School not found'}

        result = user_model.get_teachers_with_password(school_id)
        return result['rows'], None
    except Exception as e:
        print('Error fetching teachers:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def get_students(school_id, teacher_id):
    """Get all students of a specific teacher in a school."""
    try:
        teacher_check = user_model.find_teacher(teacher_id)
        if teacher_check['rowCount'] == 0:
            return None, {'success': False, 'message': 'Teacher not found'}

        result = student_model.get_for_teacher_and_school(school_id, teacher_id)
        return result['rows'], None
    except Exception as e:
        print('Error fetching students:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def disable_school(school_id, disabled):
    """Enable or disable a school."""
    try:
        result = school_model.set_disabled(school_id, disabled)
        if result['rowCount'] == 0:
            return None, {'success': False, 'message': 'School not found'}
        return result['rows'][0], None
    except Exception as e:
        print('Error disabling school:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def reset_teacher_password(teacher_id, new_password):
    """Reset a teacher's password."""
    try:
        result = user_model.reset_password(teacher_id, new_password)
        if result['rowCount'] == 0:
            return None, {'success': False, 'message': 'Teacher not found'}
        return result['rows'][0], None
    except Exception as e:
        print('Error resetting teacher password:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def reset_student_password(student_id, new_password):
    """Reset a student's password."""
    try:
        result = student_model.reset_password(student_id, new_password)
        if result['rowCount'] == 0:
            return None, {'success': False, 'message': 'Student not found'}
        return result['rows'][0], None
    except Exception as e:
        print('Error resetting student password:', str(e))
        traceback.print_exc()
        return None, {'success': False, 'message': f'Database error: {str(e)}'}


def get_dashboard(school_id):
    """Assemble the full admin dashboard data for a school."""
    try:
        school = school_model.get_name_and_blueprint(school_id)
        if not school:
            return None, {'success': False, 'message': 'School not found'}

        teachers_res = user_model.get_teachers_for_school(school_id)
        teachers = teachers_res['rows']

        students_res = student_model.get_for_school(school_id)
        students = students_res['rows']

        scores_res = score_model.get_for_school(school_id)
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

        blueprint_image_path = school.get('blueprint_image_path')
        blueprint_image_url = None
        if blueprint_image_path:
            from utils.supabase_client import supabase, BUCKET_NAME
            if supabase:
                try:
                    res = supabase.storage.from_(BUCKET_NAME).create_signed_url(blueprint_image_path, 3600)
                    blueprint_image_url = res.get('signedURL') or res.get('signedUrl')
                except Exception as e:
                    print('Error getting signed url', e)

        blueprint_json = school.get('blueprint_json')

        return {
            'school_name': school['name'],
            'blueprint_uploaded': bool(blueprint_json),
            'blueprint_json': blueprint_json,
            'blueprint_image_path': blueprint_image_path,
            'blueprint_image_url': blueprint_image_url,
            'teachers': dashboard_data,
        }, None
    except Exception as e:
        print('Error fetching school dashboard', e)
        return None, {'success': False, 'message': 'Database error'}


# ---- Teacher management (admin operations) ----

def create_teacher(school_id, password, name, class_assigned):
    """Create a new teacher account. Returns (teacher_dict, error)."""
    try:
        if not class_assigned or not str(class_assigned).strip():
            return None, {'success': False, 'message': 'Class assignment is required.'}
        if not password:
            return None, {'success': False, 'message': 'Password is required.'}

        school = school_model.find_by_id(school_id)
        if not school:
            return None, {'success': False, 'message': 'School not found.'}

        school_unique_code = school.get('unique_code')
        if not school_unique_code or not str(school_unique_code).strip():
            return None, {'success': False, 'message': 'School unique code is missing.'}

        new_teacher_id = build_teacher_id(school_unique_code, class_assigned)

        if user_model.id_exists(new_teacher_id)['rowCount'] > 0:
            return None, {'success': False, 'message': 'A teacher for this class already exists.'}

        insert_result = user_model.create_teacher(
            new_teacher_id, school_id, new_teacher_id, password, name, class_assigned
        )
        return insert_result['rows'][0], None
    except ValueError as value_error:
        return None, {'success': False, 'message': str(value_error)}
    except Exception as e:
        print('Error creating teacher', e)
        return None, {'success': False, 'message': 'Database error'}


def update_teacher(teacher_id, name, password, class_assigned):
    """Update a teacher's details. Returns (teacher_dict, error)."""
    try:
        select_res = user_model.find_teacher(teacher_id)
        if select_res['rowCount'] == 0:
            return None, {'success': False, 'message': 'Teacher not found'}

        current_teacher = select_res['rows'][0]
        update_name = name or current_teacher.get('name')
        update_class = class_assigned if class_assigned is not None else current_teacher.get('class_assigned')
        update_password = password or current_teacher.get('password')

        update_result = user_model.update_teacher(teacher_id, update_name, update_class, update_password)
        return update_result['rows'][0], None
    except Exception as e:
        print('Error modifying teacher', e)
        return None, {'success': False, 'message': 'Database error'}


def delete_teacher(teacher_id):
    """Delete a teacher and all their students. Returns (result_dict, error)."""
    try:
        user_model.delete_teacher(teacher_id)
        return {'success': True}, None
    except Exception as e:
        print('Error deleting teacher', e)
        return None, {'success': False, 'message': 'Database error'}
