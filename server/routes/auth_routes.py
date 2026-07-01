from flask import Blueprint
from controllers import auth_controller
from middleware import authenticate_token

auth_bp = Blueprint('auth', __name__)

auth_bp.add_url_rule('/api/auth/login', view_func=auth_controller.login, methods=['POST'])

auth_bp.add_url_rule(
    '/api/auth/session',
    view_func=authenticate_token(auth_controller.session),
    methods=['GET'],
)

auth_bp.add_url_rule('/api/auth/logout', view_func=auth_controller.logout, methods=['POST'])
