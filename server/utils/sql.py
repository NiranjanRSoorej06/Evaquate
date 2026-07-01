import re
import db


def sql(query_str, params=None):
    """Execute a parameterised query, converting $N placeholders to %s for psycopg2.

    Handles repeated $N references (e.g. $2 appearing twice) by expanding the
    params tuple so each %s gets its own value.
    """
    if params is None:
        return db.query(query_str)

    tokens = re.findall(r'\$(\d+)', query_str)
    converted = re.sub(r'\$\d+', '%s', query_str)
    expanded = tuple(params[int(idx) - 1] for idx in tokens)
    return db.query(converted, expanded)
