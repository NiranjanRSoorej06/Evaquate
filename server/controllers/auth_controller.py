from flask import request, jsonify, make_response

from services import auth_service
from middleware.sessions import set_session_and_cookie, clear_auth_cookie


def login():
    body = request.get_json(silent=True) or {}
    username = body.get('username')
    password = body.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    user_payload, error = auth_service.login(username, password)
    if error:
        return jsonify(error[0]), error[1]

    resp = make_response(jsonify({'success': True, 'user': user_payload}))
    set_session_and_cookie(resp, user_payload)
    return resp


def session():
    return jsonify({'success': True, 'user': request.user})


def logout():
    token = request.cookies.get('token')
    auth_service.logout(token)
    resp = make_response(jsonify({'success': True}))
    clear_auth_cookie(resp)
    return resp
