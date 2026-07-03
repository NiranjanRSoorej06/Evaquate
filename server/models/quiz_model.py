from utils.sql import sql


def find_all_by_teacher(teacher_id):
    return sql(
        'SELECT * FROM quizzes WHERE teacher_id = $1 ORDER BY id ASC',
        [teacher_id],
    )


def find_by_id_and_teacher(quiz_id, teacher_id):
    return sql(
        'SELECT * FROM quizzes WHERE id = $1 AND teacher_id = $2',
        [quiz_id, teacher_id],
    )


def delete_by_id(quiz_id, teacher_id):
    return sql(
        'DELETE FROM quizzes WHERE id = $1 AND teacher_id = $2 RETURNING *',
        [quiz_id, teacher_id],
    )


def insert_quiz(teacher_id, quiz_data_json):
    return sql(
        'INSERT INTO quizzes (teacher_id, quiz_data) VALUES ($1, $2) RETURNING *',
        [teacher_id, quiz_data_json],
    )
