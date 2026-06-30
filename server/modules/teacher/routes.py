import time
import random
import string

from flask import Blueprint, request, jsonify

from middleware import authenticate_token, require_teacher_or_student_of_teacher
from utils.sql import sql

teacher_bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')


# ── GET /api/teacher/<teacherId>/students ────────────────────────────────────

@teacher_bp.route('/<teacherId>/students', methods=['GET'])
@authenticate_token
@require_teacher_or_student_of_teacher
def get_students(teacherId):
    try:
        students_res = sql(
            """SELECT id, roll_no, name, school_id, teacher_id
               FROM students
               WHERE teacher_id = $1
               ORDER BY roll_no::int ASC, name ASC""",
            [teacherId],
        )
        students = students_res['rows']

        scores_res = sql(
            """SELECT sc.*
               FROM scores sc
               JOIN students st ON sc.student_id = st.id
               WHERE st.teacher_id = $1
               ORDER BY sc.timestamp DESC""",
            [teacherId],
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


# ── POST /api/teacher/<teacherId>/students ───────────────────────────────────

@teacher_bp.route('/<teacherId>/students', methods=['POST'])
@authenticate_token
@require_teacher_or_student_of_teacher
def add_student(teacherId):
    body = request.get_json(silent=True) or {}
    name = body.get('name')
    roll_no = body.get('roll_no')
    school_id = body.get('school_id')
    try:
        check_res = sql(
            'SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2',
            [school_id, roll_no],
        )
        if check_res['rowCount'] > 0:
            return jsonify({
                'success': False,
                'message': f'Roll number {roll_no} already exists in this school.',
            }), 400

        new_student_id = f's_{int(time.time() * 1000)}'
        insert_res = sql(
            """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
            [new_student_id, school_id, teacherId, roll_no, name, name],
        )
        return jsonify({'success': True, 'student': insert_res['rows'][0]})
    except Exception as e:
        print('Error adding student', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── POST /api/teacher/<teacherId>/students/bulk ──────────────────────────────

@teacher_bp.route('/<teacherId>/students/bulk', methods=['POST'])
@authenticate_token
@require_teacher_or_student_of_teacher
def bulk_import_students(teacherId):
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
                [school_id, clean_roll],
            )

            if check_res['rowCount'] == 0:
                rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
                rand_id = f's_{int(time.time() * 1000)}_{rand_suffix}'
                sql(
                    """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
                       VALUES ($1, $2, $3, $4, $5, $6)""",
                    [rand_id, school_id, teacherId, clean_roll, clean_name, clean_name],
                )
                added_count += 1
            else:
                skipped_count += 1

        return jsonify({
            'success': True,
            'addedCount': added_count,
            'skippedCount': skipped_count,
        })
    except Exception as e:
        print('Error bulk importing students', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500


# ── DELETE /api/teacher/<teacherId>/students/<studentId> ─────────────────────

@teacher_bp.route('/<teacherId>/students/<studentId>', methods=['DELETE'])
@authenticate_token
@require_teacher_or_student_of_teacher
def delete_student(teacherId, studentId):
    try:
        sql('DELETE FROM students WHERE id = $1', [studentId])
        return jsonify({'success': True})
    except Exception as e:
        print('Error deleting student', e)
        return jsonify({'success': False, 'message': 'Database error'}), 500
