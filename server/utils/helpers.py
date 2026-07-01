from flask import request


def get_json_body():
    """Safely extract JSON body from the request, returning an empty dict on failure."""
    return request.get_json(silent=True) or {}
