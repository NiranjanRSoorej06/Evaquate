import time
from functools import wraps

import jwt
from flask import request, jsonify, make_response

from config import JWT_SECRET
from utils.session import sessions, clear_auth_cookie


def authenticate_token(f):
    """Verify the JWT token from cookies and attach the user to the request."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return jsonify({'success': False, 'message': 'Access denied. No token provided.'}), 401
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            session_id = decoded.get('sessionId')
            session = sessions.get(session_id)
            if not session or session['expiresAt'] < time.time() * 1000:
                if session:
                    sessions.pop(session_id, None)
                resp = make_response(
                    jsonify({'success': False, 'message': 'Session expired or invalid.'}), 401
                )
                clear_auth_cookie(resp)
                return resp
            request.user = session['user']
            request.session_id = session_id
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            resp = make_response(
                jsonify({'success': False, 'message': 'Session expired or invalid.'}), 401
            )
            clear_auth_cookie(resp)
            return resp
        except jwt.InvalidTokenError:
            resp = make_response(
                jsonify({'success': False, 'message': 'Invalid token.'}), 401
            )
            clear_auth_cookie(resp)
            return resp
    return decorated
