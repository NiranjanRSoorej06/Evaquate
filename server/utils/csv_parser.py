import re
import csv
import io
import os

try:
    import openpyxl
except ImportError:
    openpyxl = None

try:
    import xlrd
except ImportError:
    xlrd = None


def normalize_header(value):
    return re.sub(r'[^a-z0-9]+', '', (value or '').strip().lower())


def find_value(row, aliases):
    for key, value in row.items():
        if normalize_header(key) in aliases:
            text = str(value or '').strip()
            if text:
                return text
    return None


def parse_student_rows(rows):
    if not rows:
        raise ValueError('Uploaded student file is empty or missing headers.')

    students = []
    for row in rows:
        name = find_value(row, {'studentname', 'name', 'fullname', 'studentname', 'full name', 'student name'})
        roll_no = find_value(row, {'rollnumber', 'rollno', 'roll number', 'roll', 'roll_number'})
        if not name or not roll_no:
            continue
        students.append({'name': name, 'roll_no': roll_no})

    if not students:
        raise ValueError('No valid student rows were found in the uploaded file.')
    return students


def parse_csv_rows(file_storage):
    content = file_storage.read().decode('utf-8-sig')
    if not content.strip():
        raise ValueError('CSV file is empty.')

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError('CSV file must contain headers.')

    return parse_student_rows(list(reader))


def parse_excel_rows(file_bytes, extension):
    if extension == '.xlsx':
        if openpyxl is None:
            raise ValueError('Server needs openpyxl to parse .xlsx files.')
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        sheet = workbook.active
        rows = list(sheet.iter_rows(values_only=True))
    elif extension == '.xls':
        if xlrd is None:
            raise ValueError('Server needs xlrd to parse .xls files.')
        workbook = xlrd.open_workbook(file_contents=file_bytes)
        sheet = workbook.sheet_by_index(0)
        rows = []
        for row_index in range(sheet.nrows):
            rows.append([sheet.cell_value(row_index, col_index) for col_index in range(sheet.ncols)])
    else:
        raise ValueError('Unsupported Excel format.')

    if not rows:
        raise ValueError('Excel file is empty.')

    headers = [str(cell or '').strip() for cell in rows[0]]
    data_rows = []
    for row_values in rows[1:]:
        row = {}
        for index, header in enumerate(headers):
            row[header] = row_values[index] if index < len(row_values) else ''
        data_rows.append(row)

    return parse_student_rows(data_rows)


def parse_student_csv_or_excel(file_storage):
    filename = getattr(file_storage, 'filename', '') or ''
    extension = os.path.splitext(filename)[1].lower()
    file_bytes = file_storage.read()
    if extension == '.csv' or extension == '':
        try:
            text = file_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            text = file_bytes.decode('latin-1')
        return parse_student_rows(list(csv.DictReader(io.StringIO(text))))

    if extension in {'.xlsx', '.xls'}:
        return parse_excel_rows(file_bytes, extension)

    raise ValueError('Unsupported file type. Please upload a CSV, XLS or XLSX file.')


def parse_quiz_csv(file_storage):
    """Parse an uploaded CSV file into a list of quiz question dicts."""
    content = file_storage.read().decode('utf-8-sig')
    if not content.strip():
        raise ValueError('CSV file is empty.')

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise ValueError('CSV file must contain headers.')

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
