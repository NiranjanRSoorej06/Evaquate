from utils.sql import sql


def find_by_teacher_and_disaster(teacher_id, disaster_type):
    return sql(
        """SELECT * FROM quizzes
           WHERE teacher_id = $1
             AND quiz_data->>'disaster' = $2
           LIMIT 1""",
        [teacher_id, disaster_type],
    )


def delete_by_teacher_and_disaster(teacher_id, disaster_type):
    return sql(
        """DELETE FROM quizzes
           WHERE teacher_id = $1
             AND quiz_data->>'disaster' = $2""",
        [teacher_id, disaster_type],
    )


def insert_quiz(teacher_id, quiz_data_json):
    return sql(
        'INSERT INTO quizzes (teacher_id, quiz_data) VALUES ($1, $2)',
        [teacher_id, quiz_data_json],
    )
