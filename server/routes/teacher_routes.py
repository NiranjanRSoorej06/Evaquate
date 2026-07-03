from flask import Blueprint
from controllers import teacher_controller
from middleware import authenticate_token, require_teacher_or_student_of_teacher

teacher_bp = Blueprint('teacher', __name__)

auth = authenticate_token
tos = require_teacher_or_student_of_teacher


@teacher_bp.route('/api/teacher/<teacherId>/students', methods=['GET'])
@auth
@tos
def get_students(teacherId):
    return teacher_controller.get_students(teacherId)


@teacher_bp.route('/api/teacher/<teacherId>/students', methods=['POST'])
@auth
@tos
def add_student(teacherId):
    return teacher_controller.add_student(teacherId)


@teacher_bp.route('/api/teacher/<teacherId>/students/bulk', methods=['POST'])
@auth
@tos
def bulk_import_students(teacherId):
    return teacher_controller.bulk_import_students(teacherId)


@teacher_bp.route('/api/teacher/<teacherId>/students/<studentId>', methods=['DELETE'])
@auth
@tos
def delete_student(teacherId, studentId):
    return teacher_controller.delete_student(teacherId, studentId)


@teacher_bp.route('/api/teacher/<teacherId>/quizzes/upload', methods=['POST'])
@auth
@tos
def upload_quiz(teacherId):
    return teacher_controller.upload_quiz(teacherId)


@teacher_bp.route('/api/teacher/<teacherId>/quizzes', methods=['GET'])
@auth
@tos
def list_quizzes(teacherId):
    return teacher_controller.list_quizzes(teacherId)


@teacher_bp.route('/api/teacher/<teacherId>/quizzes/<disasterType>', methods=['GET'])
@auth
@tos
def get_quiz(teacherId, disasterType):
    return teacher_controller.get_quiz(teacherId, disasterType)
