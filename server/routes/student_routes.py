from flask import Blueprint
from controllers import student_controller
from middleware import authenticate_token, require_student, require_student_of_school

student_bp = Blueprint('student', __name__)

auth = authenticate_token


@student_bp.route('/api/quizzes/<disasterType>', methods=['GET'])
@auth
def get_quiz(disasterType):
    return student_controller.get_quiz(disasterType)


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
