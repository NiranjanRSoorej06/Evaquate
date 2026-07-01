import re
import csv
import io


def parse_quiz_csv(file_storage):
    """Parse an uploaded CSV file into a list of quiz question dicts."""
    content = file_storage.read().decode('utf-8-sig')
    if not content.strip():
        raise ValueError('CSV file is empty.')

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError('CSV file must contain headers.')

    def normalize_header(value):
        return re.sub(r'[^a-z0-9]+', '', (value or '').strip().lower())

    def find_value(row, aliases):
        for key in row.keys():
            if normalize_header(key) in aliases:
                value = str(row.get(key, '') or '').strip()
                if value:
                    return value
        return None

    def find_option(row, label):
        for key in row.keys():
            normalized = normalize_header(key)
            if normalized in label:
                value = str(row.get(key, '') or '').strip()
                if value:
                    return value
        return None

    questions = []
    for row in reader:
        question = find_value(row, {'question', 'prompt', 'q', 'questiontext'})
        if not question:
            continue

        option_values = []
        for option_key in [
            {'optiona', 'option1', 'optionone'},
            {'optionb', 'option2', 'optiontwo'},
            {'optionc', 'option3', 'optionthree'},
            {'optiond', 'option4', 'optionfour'},
        ]:
            option_value = find_option(row, option_key)
            if option_value:
                option_values.append(option_value)

        if len(option_values) < 2:
            continue

        answer = 0
        answer_value = find_value(row, {'answer', 'correctanswer', 'correct', 'correctoption', 'correctansweroption'})
        if answer_value is not None:
            normalized = answer_value.strip().lower()
            if normalized in {'a', 'b', 'c', 'd'}:
                answer = ord(normalized) - ord('a')
            elif normalized in {'optiona', 'optionb', 'optionc', 'optiond'}:
                answer = ord(normalized[-1]) - ord('a')
            elif normalized.startswith('option '):
                letter = normalized.split()[-1][0].lower()
                if letter in 'abcd':
                    answer = ord(letter) - ord('a')
            elif normalized.isdigit():
                idx = int(normalized) - 1
                if 0 <= idx < len(option_values):
                    answer = idx
            else:
                for idx, option in enumerate(option_values):
                    if normalized == option.strip().lower():
                        answer = idx
                        break

        question_payload = {
            'question': question,
            'options': option_values,
            'answer': answer,
            'option_a': option_values[0] if len(option_values) > 0 else '',
            'option_b': option_values[1] if len(option_values) > 1 else '',
            'option_c': option_values[2] if len(option_values) > 2 else '',
            'option_d': option_values[3] if len(option_values) > 3 else '',
            'correct_answer': answer_value or '',
        }
        questions.append(question_payload)

    if not questions:
        raise ValueError('No valid quiz questions were found in the CSV file.')
    return questions
