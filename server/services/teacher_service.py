import json
import traceback

from models import student_model, score_model, quiz_model, user_model
from services import quiz_service
from utils.id_generator import build_student_id
from utils.csv_parser import parse_quiz_csv


def get_students_with_scores(teacher_id):
    """Get all students for a teacher, each with their scores attached."""
    try:
        students_res = student_model.get_for_teacher(teacher_id)
        students = students_res['rows']

        scores_res = score_model.get_for_teacher(teacher_id)
        scores = scores_res['rows']

        students_with_scores = []
        for student in students:
            student_scores = [sc for sc in scores if str(sc['student_id']) == str(student['id'])]
            students_with_scores.append({**student, 'scores': student_scores})

        return students_with_scores, None
    except Exception as e:
        print('Error getting teacher students', e)
        return None, {'success': False, 'message': 'Database error'}


def add_student(teacher_id, name, roll_no, school_id):
    """Add a single student. Returns (student_dict, error)."""
    try:
        teacher_res = user_model.find_teacher(teacher_id)
        if teacher_res['rowCount'] == 0:
            return None, {'success': False, 'message': 'Teacher not found.'}

        check_res = student_model.roll_no_exists_in_school(school_id, roll_no)
        if check_res['rowCount'] > 0:
            return None, {'success': False, 'message': f'Roll number {roll_no} already exists in this school.'}

        new_student_id = build_student_id(teacher_id, roll_no)
        if student_model.id_exists(new_student_id)['rowCount'] > 0:
            return None, {'success': False, 'message': 'A student with this ID already exists.'}

        insert_res = student_model.create(new_student_id, school_id, teacher_id, roll_no, name, name)
        return insert_res['rows'][0], None
    except ValueError as value_error:
        return None, {'success': False, 'message': str(value_error)}
    except Exception as e:
        print('Error adding student', e)
        return None, {'success': False, 'message': 'Database error'}


def bulk_import_students(teacher_id, students_list, school_id):
    """Bulk import students from a list. Returns (result_dict, error)."""
    try:
        teacher_res = user_model.find_teacher(teacher_id)
        if teacher_res['rowCount'] == 0:
            return None, {'success': False, 'message': 'Teacher not found.'}

        added_count = 0
        skipped_count = 0

        for st in students_list:
            clean_roll = str(st.get('roll_no', '')).strip()
            clean_name = str(st.get('name', '')).strip()

            if not clean_roll or not clean_name:
                skipped_count += 1
                continue

            check_res = student_model.roll_no_exists_in_school(school_id, clean_roll)
            if check_res['rowCount'] > 0:
                skipped_count += 1
                continue

            try:
                student_id = build_student_id(teacher_id, clean_roll)
            except ValueError:
                skipped_count += 1
                continue

            if student_model.id_exists(student_id)['rowCount'] > 0:
                skipped_count += 1
                continue

            student_model.insert_bulk(student_id, school_id, teacher_id, clean_roll, clean_name, clean_name)
            added_count += 1

        return {'success': True, 'addedCount': added_count, 'skippedCount': skipped_count}, None
    except Exception as e:
        print('Error bulk importing students', e)
        return None, {'success': False, 'message': 'Database error'}


def delete_student(student_id):
    """Delete a student by ID."""
    try:
        student_model.delete(student_id)
        return {'success': True}, None
    except Exception as e:
        print('Error deleting student', e)
        return None, {'success': False, 'message': 'Database error'}


def upload_quiz(file, disaster_type, teacher_id):
    """Upload and parse a quiz CSV, then store the full quiz JSON for the teacher.

    Returns:
        (result_dict, None) on success
        (None, (response_body_dict, http_status_code)) on failure
    """
    try:
        questions = parse_quiz_csv(file)
        if not questions:
            raise ValueError('No valid quiz questions were found in the CSV file.')

        existing = quiz_model.find_all_by_teacher(teacher_id)
        quiz_number = quiz_service.next_quiz_number(existing['rows'], disaster_type)
        quiz_data = quiz_service.build_quiz_data(disaster_type, questions, quiz_number)
        insert_res = quiz_model.insert_quiz(teacher_id, json.dumps(quiz_data))
        created = insert_res['rows'][0]

        return {
            'success': True,
            'id': created.get('id'),
            'disaster_type': disaster_type,
            'label': f'Quiz {quiz_number}',
            'title': quiz_data.get('title'),
            'questions': quiz_service.quiz_data_to_questions(quiz_data),
        }, None
    except ValueError as value_error:
        return None, ({'success': False, 'message': str(value_error)}, 400)
    except Exception as e:
        print('Error uploading quiz', e)
        return None, ({'success': False, 'message': 'Database error'}, 500)


def delete_quiz(teacher_id, quiz_id):
    """Delete a quiz uploaded by the teacher."""
    try:
        result = quiz_model.delete_by_id(quiz_id, teacher_id)
        if result['rowCount'] == 0:
            return None, ({'success': False, 'message': 'Quiz not found.'}, 404)
        return {'success': True}, None
    except Exception as e:
        print('Error deleting quiz', e)
        return None, ({'success': False, 'message': 'Database error'}, 500)
