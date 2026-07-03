from utils.sql import sql


def find_by_credentials(student_id, password):
    return sql(
        """SELECT st.*, s.name as school_name, u.name as teacher_name, u.class_assigned
           FROM students st
           LEFT JOIN schools s ON st.school_id = s.id
           LEFT JOIN users u ON st.teacher_id = u.id
           WHERE st.id = $1
             AND LOWER(TRIM(st.password)) = LOWER(TRIM($2))""",
        [student_id, password],
    )


def get_for_school(school_id):
    return sql(
        'SELECT id, roll_no, name, teacher_id FROM students WHERE school_id = $1',
        [school_id],
    )


def get_for_teacher(teacher_id):
    return sql(
        """SELECT id, roll_no, name, school_id, teacher_id
           FROM students
           WHERE teacher_id = $1
           ORDER BY roll_no::int ASC, name ASC""",
        [teacher_id],
    )


def get_for_teacher_and_school(school_id, teacher_id):
    return sql(
        """SELECT id, roll_no, name, password
           FROM students
           WHERE school_id = $1 AND teacher_id = $2
           ORDER BY name ASC""",
        [school_id, teacher_id],
    )


def roll_no_exists_in_school(school_id, roll_no):
    return sql('SELECT 1 FROM students WHERE school_id = $1 AND roll_no = $2', [school_id, roll_no])


def id_exists(student_id):
    return sql('SELECT 1 FROM students WHERE id = $1', [student_id])


def create(student_id, school_id, teacher_id, roll_no, name, password):
    return sql(
        """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
        [student_id, school_id, teacher_id, roll_no, name, password],
    )


def insert_bulk(student_id, school_id, teacher_id, roll_no, name, password):
    return sql(
        """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
           VALUES ($1, $2, $3, $4, $5, $6)""",
        [student_id, school_id, teacher_id, roll_no, name, password],
    )


def delete(student_id):
    return sql('DELETE FROM students WHERE id = $1', [student_id])


def reset_password(student_id, new_password):
    return sql('UPDATE students SET password = $1 WHERE id = $2 RETURNING *', [new_password, student_id])
