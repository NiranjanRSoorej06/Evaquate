import time
import secrets
from datetime import datetime, timezone, timedelta

import jwt
from flask import make_response

from config import JWT_SECRET, IS_PRODUCTION, SESSION_EXPIRY_MS, SESSION_EXPIRY_SEC

COOKIE_SAMESITE = 'None' if IS_PRODUCTION else 'Lax'

# In-memory session store: sessionId -> { user: dict, expiresAt: float }
sessions: dict = {}


def generate_session_id() -> str:
    return secrets.token_hex(32)


def set_session_and_cookie(response, user_payload):
    """Create a session, sign a JWT, and attach it as an httpOnly cookie."""
    session_id = generate_session_id()
    sessions[session_id] = {
        'user': user_payload,
        'expiresAt': time.time() * 1000 + SESSION_EXPIRY_MS,
    }
    token = jwt.encode(
        {
            'sessionId': session_id,
            'exp': datetime.now(timezone.utc) + timedelta(seconds=SESSION_EXPIRY_SEC),
        },
        JWT_SECRET,
        algorithm='HS256',
    )
    response.set_cookie(
        'token', token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite=COOKIE_SAMESITE,
        max_age=SESSION_EXPIRY_SEC,
    )
    return response


def clear_auth_cookie(response):
    """Remove the auth cookie from the response."""
    response.delete_cookie(
        'token',
        httponly=True,
        secure=IS_PRODUCTION,
        samesite=COOKIE_SAMESITE,
    )
    return response
