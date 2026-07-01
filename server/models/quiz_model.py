from utils.sql import sql


def find_by_disaster_type(disaster_type):
    return sql('SELECT * FROM quizzes WHERE disaster_type = $1', [disaster_type])


def delete_by_disaster_type(disaster_type):
    return sql('DELETE FROM quizzes WHERE disaster_type = $1', [disaster_type])


def insert_question(disaster_type, question_payload, all_questions_json):
    return sql(
        """INSERT INTO quizzes (
            disaster_type, question, option_a, option_b, option_c, option_d, correct_answer, questions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
        [
            disaster_type,
            question_payload.get('question', ''),
            question_payload.get('option_a', ''),
            question_payload.get('option_b', ''),
            question_payload.get('option_c', ''),
            question_payload.get('option_d', ''),
            question_payload.get('correct_answer', ''),
            all_questions_json,
        ],
    )
