from flask import Blueprint
from controllers import student_controller
from middleware import authenticate_token, require_student, require_student_of_school

student_bp = Blueprint('student', __name__)

auth = authenticate_token


@student_bp.route('/api/student/quizzes', methods=['GET'])
@auth
@require_student
def list_quizzes():
    return student_controller.list_quizzes()


@student_bp.route('/api/quizzes/<int:quizId>', methods=['GET'])
@auth
def get_quiz(quizId):
    return student_controller.get_quiz(quizId)


@student_bp.route('/api/student/score', methods=['POST'])
@auth
@require_student
def submit_score():
    return student_controller.submit_score()


@student_bp.route('/api/student/<schoolId>/map', methods=['GET'])
@auth
@require_student_of_school
def get_school_map(schoolId):
    return student_controller.get_school_map(schoolId)


@student_bp.route('/api/evaluate-drill', methods=['POST'])
@auth
@require_student
def evaluate_drill():
    return student_controller.evaluate_drill()

