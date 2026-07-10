from utils.sql import sql


def find_by_id(school_id):
    result = sql('SELECT * FROM schools WHERE id = $1', [school_id])
    return result['rows'][0] if result['rowCount'] > 0 else None


def find_by_credentials(unique_code, password):
    result = sql('SELECT * FROM schools WHERE unique_code = $1 AND password = $2', [unique_code, password])
    return result['rows'][0] if result['rowCount'] > 0 else None


def check_disabled(school_id):
    result = sql('SELECT disabled FROM schools WHERE id = $1', [school_id])
    if result['rowCount'] > 0:
        return result['rows'][0].get('disabled')
    return None


def get_all_with_counts():
    return sql("""
        SELECT s.*,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher')::int as teacher_count,
            (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id)::int as student_count
        FROM schools s
        ORDER BY s.name ASC
    """)


def create(school_id, name, unique_code, password):
    return sql(
        """INSERT INTO schools (id, name, unique_code, password, blueprint_json)
           VALUES ($1, $2, $3, $4, $5) RETURNING *""",
        [school_id, name, unique_code, password, None],
    )


def unique_code_exists(unique_code):
    return sql('SELECT 1 FROM schools WHERE unique_code = $1', [unique_code])


def exists(school_id):
    return sql('SELECT 1 FROM schools WHERE id = $1', [school_id])


def update_blueprint(school_id, blueprint_json):
    import json
    return sql('UPDATE schools SET blueprint_json = $1 WHERE id = $2', [json.dumps(blueprint_json), school_id])


def get_blueprint(school_id):
    result = sql('SELECT blueprint_json FROM schools WHERE id = $1', [school_id])
    if result['rowCount'] > 0:
        return result['rows'][0].get('blueprint_json')
    return None


def get_name_and_blueprint(school_id):
    result = sql('SELECT name, blueprint_json, blueprint_image_path FROM schools WHERE id = $1', [school_id])
    return result['rows'][0] if result['rowCount'] > 0 else None


def set_disabled(school_id, disabled):
    return sql('UPDATE schools SET disabled = $1 WHERE id = $2 RETURNING *', [disabled, school_id])


def get_blueprint_image_path(school_id):
    result = sql('SELECT blueprint_image_path FROM schools WHERE id = $1', [school_id])
    if result['rowCount'] > 0:
        return result['rows'][0].get('blueprint_image_path')
    return None


def update_blueprint_with_image(school_id, blueprint_json, image_path):
    import json
    if blueprint_json is not None:
        return sql(
            'UPDATE schools SET blueprint_json = $1, blueprint_image_path = $2 WHERE id = $3',
            [json.dumps(blueprint_json), image_path, school_id]
        )
    else:
        # Only update the image path, preserve existing blueprint_json
        return sql(
            'UPDATE schools SET blueprint_image_path = $1 WHERE id = $2',
            [image_path, school_id]
        )
