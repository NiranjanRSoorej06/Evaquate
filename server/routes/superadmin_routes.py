from flask import Blueprint
from controllers import superadmin_controller
from middleware import authenticate_token, require_super_admin

superadmin_bp = Blueprint('superadmin', __name__)

auth = authenticate_token
sa = require_super_admin


@superadmin_bp.route('/api/superadmin/schools', methods=['GET'])
@auth
@sa
def get_schools():
    return superadmin_controller.get_schools()


@superadmin_bp.route('/api/superadmin/schools', methods=['POST'])
@auth
@sa
def create_school():
    return superadmin_controller.create_school()


@superadmin_bp.route('/api/superadmin/schools/<schoolId>/teachers', methods=['GET'])
@auth
@sa
def get_teachers(schoolId):
    return superadmin_controller.get_teachers(schoolId)


@superadmin_bp.route('/api/superadmin/schools/<schoolId>/teachers/<teacherId>/students', methods=['GET'])
@auth
@sa
def get_students(schoolId, teacherId):
    return superadmin_controller.get_students(schoolId, teacherId)


@superadmin_bp.route('/api/superadmin/schools/<schoolId>/disable', methods=['PUT'])
@auth
@sa
def disable_school(schoolId):
    return superadmin_controller.disable_school(schoolId)


@superadmin_bp.route('/api/superadmin/schools/<schoolId>/teachers/<teacherId>/reset-password', methods=['PUT'])
@auth
@sa
def reset_teacher_password(schoolId, teacherId):
    return superadmin_controller.reset_teacher_password(schoolId, teacherId)


@superadmin_bp.route(
    '/api/superadmin/schools/<schoolId>/teachers/<teacherId>/students/<studentId>/reset-password',
    methods=['PUT'],
)
@auth
@sa
def reset_student_password(schoolId, teacherId, studentId):
    return superadmin_controller.reset_student_password(schoolId, teacherId, studentId)
