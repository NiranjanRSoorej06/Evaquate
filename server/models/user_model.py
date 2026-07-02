from utils.sql import sql


def find_by_credentials(username, password):
    return sql(
        """SELECT u.*, s.name as school_name, s.unique_code as school_unique_code
           FROM users u
           LEFT JOIN schools s ON u.school_id = s.id
           WHERE u.username = $1 AND u.password = $2""",
        [username, password],
    )


def find_by_id(user_id):
    result = sql('SELECT * FROM users WHERE id = $1', [user_id])
    return result['rows'][0] if result['rowCount'] > 0 else None


def id_exists(user_id):
    return sql('SELECT 1 FROM users WHERE id = $1', [user_id])


def username_exists(username):
    return sql('SELECT 1 FROM users WHERE username = $1', [username])


def get_teachers_for_school(school_id):
    return sql(
        """SELECT id, username, name, class_assigned
           FROM users
           WHERE school_id = $1 AND role = 'teacher'
           ORDER BY name ASC""",
        [school_id],
    )


def get_teachers_with_password(school_id):
    return sql(
        """SELECT id, username, name, class_assigned, password
           FROM users
           WHERE school_id = $1 AND role = 'teacher'
           ORDER BY name ASC""",
        [school_id],
    )


def create_teacher(teacher_id, school_id, username, password, name, class_assigned):
    return sql(
        """INSERT INTO users (id, school_id, role, username, password, name, class_assigned)
           VALUES ($1, $2, 'teacher', $3, $4, $5, $6) RETURNING *""",
        [teacher_id, school_id, username, password, name, class_assigned],
    )


def find_teacher(teacher_id):
    return sql('SELECT * FROM users WHERE id = $1 AND role = $2', [teacher_id, 'teacher'])


def update_teacher(teacher_id, name, class_assigned, password):
    return sql(
        """UPDATE users
           SET name = $1, class_assigned = $2, password = $3
           WHERE id = $4 AND role = 'teacher' RETURNING *""",
        [name, class_assigned, password, teacher_id],
    )


def delete_teacher(teacher_id):
    sql('DELETE FROM students WHERE teacher_id = $1', [teacher_id])
    return sql('DELETE FROM users WHERE id = $1 AND role = $2', [teacher_id, 'teacher'])


def reset_password(teacher_id, new_password):
    return sql(
        'UPDATE users SET password = $1 WHERE id = $2 AND role = $3 RETURNING *',
        [new_password, teacher_id, 'teacher'],
    )
