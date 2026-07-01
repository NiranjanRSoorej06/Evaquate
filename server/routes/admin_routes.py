from flask import Blueprint
from controllers import admin_controller
from middleware import authenticate_token, require_admin

admin_bp = Blueprint('admin', __name__)

auth = authenticate_token
adm = require_admin


@admin_bp.route('/api/admin/<schoolId>/dashboard', methods=['GET'])
@auth
@adm
def dashboard(schoolId):
    return admin_controller.dashboard(schoolId)


@admin_bp.route('/api/admin/<schoolId>/teachers', methods=['POST'])
@auth
@adm
def create_teacher(schoolId):
    return admin_controller.create_teacher(schoolId)


@admin_bp.route('/api/admin/<schoolId>/teachers/<teacherId>', methods=['PUT'])
@auth
@adm
def update_teacher(schoolId, teacherId):
    return admin_controller.update_teacher(schoolId, teacherId)


@admin_bp.route('/api/admin/<schoolId>/teachers/<teacherId>', methods=['DELETE'])
@auth
@adm
def delete_teacher(schoolId, teacherId):
    return admin_controller.delete_teacher(schoolId, teacherId)


@admin_bp.route('/api/admin/<schoolId>/blueprint', methods=['POST'])
@auth
@adm
def upload_blueprint(schoolId):
    return admin_controller.upload_blueprint(schoolId)


@admin_bp.route('/api/admin/<schoolId>/blueprint', methods=['PUT'])
@auth
@adm
def update_blueprint(schoolId):
    return admin_controller.update_blueprint(schoolId)
