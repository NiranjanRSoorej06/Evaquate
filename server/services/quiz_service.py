import re

from models import quiz_model


def _question_keys(quiz_data):
    return sorted(
        (key for key in quiz_data if re.fullmatch(r'q\d+', key)),
        key=lambda key: int(key[1:]),
    )


def _summarize_quiz_rows(rows):
    """Build quiz summaries with Quiz 1, Quiz 2 labels per disaster (by id order)."""
    counters = {}
    quizzes = []

    for row in sorted(rows, key=lambda item: item['id']):
        quiz_data = row.get('quiz_data') or {}
        disaster_type = quiz_data.get('disaster')
        if not disaster_type:
            continue

        question_count = len(_question_keys(quiz_data))
        if question_count == 0:
            continue

        counters[disaster_type] = counters.get(disaster_type, 0) + 1
        quiz_number = counters[disaster_type]
        label = f'Quiz {quiz_number}'

        quizzes.append({
            'id': row.get('id'),
            'disaster_type': disaster_type,
            'quiz_number': quiz_number,
            'label': label,
            'title': quiz_data.get('title') or label,
            'question_count': question_count,
        })

    return quizzes


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


def build_quiz_data(disaster_type, parsed_questions, quiz_number=None):
    """Build the quiz_data JSON blob from CSV-parsed question rows."""
    label = f'Quiz {quiz_number}' if quiz_number else f'{disaster_type.title()} Safety Quiz'
    quiz_data = {
        'title': label,
        'disaster': disaster_type,
        'quiz_number': quiz_number,
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


def next_quiz_number(rows, disaster_type):
    count = 0
    for row in rows:
        quiz_data = row.get('quiz_data') or {}
        if quiz_data.get('disaster') == disaster_type:
            count += 1
    return count + 1


def list_teacher_quizzes(teacher_id):
    """List all uploaded quizzes for a teacher with Quiz 1, Quiz 2 labels."""
    if not teacher_id:
        return None, ({'message': 'Teacher not found'}, 404)

    try:
        quiz_res = quiz_model.find_all_by_teacher(teacher_id)
        quizzes = _summarize_quiz_rows(quiz_res['rows'])
        return {'quizzes': quizzes, 'assigned_count': len(quizzes)}, None
    except Exception as e:
        print('Error listing teacher quizzes', e)
        return None, ({'message': 'Database error'}, 500)


def list_available_quizzes(teacher_id, disaster_type=None):
    """List uploaded quizzes available to a student's teacher."""
    if not teacher_id:
        return {'quizzes': []}, None

    try:
        quiz_res = quiz_model.find_all_by_teacher(teacher_id)
        quizzes = _summarize_quiz_rows(quiz_res['rows'])
        if disaster_type:
            quizzes = [quiz for quiz in quizzes if quiz['disaster_type'] == disaster_type]
        return {'quizzes': quizzes}, None
    except Exception as e:
        print('Error listing available quizzes', e)
        return None, ({'message': 'Database error'}, 500)


def get_quiz_by_id(teacher_id, quiz_id):
    """Get a single quiz by id for a teacher (or their students)."""
    if not teacher_id:
        return None, ({'message': 'Quiz not found'}, 404)

    try:
        quiz_res = quiz_model.find_by_id_and_teacher(quiz_id, teacher_id)
        if quiz_res['rowCount'] == 0:
            return None, ({'message': 'Quiz not found'}, 404)

        row = quiz_res['rows'][0]
        quiz_data = row.get('quiz_data') or {}
        questions = quiz_data_to_questions(quiz_data)
        if not questions:
            return None, ({'message': 'Quiz not found'}, 404)

        all_rows = quiz_model.find_all_by_teacher(teacher_id)['rows']
        disaster_type = quiz_data.get('disaster')
        label = next(
            (item['label'] for item in _summarize_quiz_rows(all_rows) if item['id'] == row['id']),
            quiz_data.get('title', 'Quiz'),
        )

        return {
            'id': row.get('id'),
            'label': label,
            'title': quiz_data.get('title', label),
            'disaster_type': disaster_type,
            'quiz_number': quiz_data.get('quiz_number'),
            'questions': questions,
        }, None
    except Exception as e:
        print('Error getting quiz', e)
        return None, ({'message': 'Database error'}, 500)
