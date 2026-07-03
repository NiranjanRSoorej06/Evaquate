import re

from models import quiz_model


def _question_keys(quiz_data):
    return sorted(
        (key for key in quiz_data if re.fullmatch(r'q\d+', key)),
        key=lambda key: int(key[1:]),
    )


def quiz_data_to_questions(quiz_data):
    """Convert stored quiz_data JSON into the array format used by the client."""
    questions = []
    for key in _question_keys(quiz_data):
        question_payload = quiz_data[key]
        options = [
            question_payload.get('option_a', ''),
            question_payload.get('option_b', ''),
            question_payload.get('option_c', ''),
            question_payload.get('option_d', ''),
        ]
        options = [option for option in options if option]

        answer = 0
        answer_value = str(question_payload.get('answer', 'a')).strip().lower()
        if answer_value in {'a', 'b', 'c', 'd'}:
            answer = ord(answer_value) - ord('a')
        elif answer_value.isdigit():
            idx = int(answer_value) - 1
            if 0 <= idx < len(options):
                answer = idx

        questions.append({
            'question': question_payload.get('question', ''),
            'options': options,
            'answer': answer,
        })
    return questions


def build_quiz_data(disaster_type, parsed_questions):
    """Build the quiz_data JSON blob from CSV-parsed question rows."""
    quiz_data = {
        'title': f'{disaster_type.title()} Safety Quiz',
        'disaster': disaster_type,
    }

    for index, question_payload in enumerate(parsed_questions, start=1):
        options = question_payload.get('options', [])
        answer_idx = int(question_payload.get('answer', 0))
        if 0 <= answer_idx <= 3:
            answer_letter = chr(ord('a') + answer_idx)
        else:
            answer_letter = str(question_payload.get('correct_answer', 'a')).strip().lower() or 'a'

        quiz_data[f'q{index}'] = {
            'question': question_payload.get('question', ''),
            'option_a': question_payload.get('option_a') or (options[0] if len(options) > 0 else ''),
            'option_b': question_payload.get('option_b') or (options[1] if len(options) > 1 else ''),
            'option_c': question_payload.get('option_c') or (options[2] if len(options) > 2 else ''),
            'option_d': question_payload.get('option_d') or (options[3] if len(options) > 3 else ''),
            'answer': answer_letter,
        }

    return quiz_data


DISASTER_TYPES = ('fire', 'earthquake', 'flood', 'landslide')


def list_teacher_quizzes(teacher_id):
    """List all disaster quiz slots with assigned/not_assigned status for a teacher."""
    if not teacher_id:
        return None, ({'message': 'Teacher not found'}, 404)

    try:
        quiz_res = quiz_model.find_all_by_teacher(teacher_id)
        uploaded = {}

        for row in quiz_res['rows']:
            quiz_data = row.get('quiz_data') or {}
            disaster_type = quiz_data.get('disaster')
            if not disaster_type:
                continue
            uploaded[disaster_type] = {
                'id': row.get('id'),
                'title': quiz_data.get('title', ''),
                'disaster_type': disaster_type,
                'question_count': len(_question_keys(quiz_data)),
                'status': 'assigned',
            }

        quizzes = []
        for disaster_type in DISASTER_TYPES:
            if disaster_type in uploaded:
                quizzes.append(uploaded[disaster_type])
            else:
                quizzes.append({
                    'disaster_type': disaster_type,
                    'title': f'{disaster_type.title()} Safety Quiz',
                    'question_count': 0,
                    'status': 'not_assigned',
                })

        assigned_count = sum(1 for quiz in quizzes if quiz['status'] == 'assigned')
        return {'quizzes': quizzes, 'assigned_count': assigned_count}, None
    except Exception as e:
        print('Error listing teacher quizzes', e)
        return None, ({'message': 'Database error'}, 500)


def list_available_quizzes(teacher_id):
    """List only uploaded quizzes available to a student's teacher."""
    if not teacher_id:
        return {'quizzes': []}, None

    try:
        quiz_res = quiz_model.find_all_by_teacher(teacher_id)
        quizzes = []

        for row in quiz_res['rows']:
            quiz_data = row.get('quiz_data') or {}
            disaster_type = quiz_data.get('disaster')
            if not disaster_type:
                continue

            question_count = len(_question_keys(quiz_data))
            if question_count == 0:
                continue

            quizzes.append({
                'id': row.get('id'),
                'title': quiz_data.get('title', ''),
                'disaster_type': disaster_type,
                'question_count': question_count,
            })

        return {'quizzes': quizzes}, None
    except Exception as e:
        print('Error listing available quizzes', e)
        return None, ({'message': 'Database error'}, 500)


def get_quiz(teacher_id, disaster_type):
    """Get quiz questions for a teacher's disaster module.

    Returns:
        (quiz_data_dict, None) on success
        (None, (response_body_dict, http_status_code)) on failure
    """
    if not teacher_id:
        return None, ({'message': 'Quiz not found'}, 404)

    try:
        quiz_res = quiz_model.find_by_teacher_and_disaster(teacher_id, disaster_type)
        if quiz_res['rowCount'] > 0:
            row = quiz_res['rows'][0]
            quiz_data = row.get('quiz_data') or {}
            questions = quiz_data_to_questions(quiz_data)
            if not questions:
                return None, ({'message': 'Quiz not found'}, 404)
            return {
                'title': quiz_data.get('title', ''),
                'disaster_type': quiz_data.get('disaster', disaster_type),
                'questions': questions,
            }, None
        return None, ({'message': 'Quiz not found'}, 404)
    except Exception as e:
        print('Error getting quiz', e)
        return None, ({'message': 'Database error'}, 500)
