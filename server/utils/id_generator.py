import re
import time
import random
import string


def normalize_id_part(value):
    """Normalize a string segment for composite IDs (admin_id_class_roll)."""
    text = str(value or '').strip().lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return re.sub(r'_+', '_', text).strip('_')


def build_teacher_id(school_unique_code, class_assigned):
    """Deterministic teacher primary key: school_unique_code_class."""
    code_part = normalize_id_part(school_unique_code)
    class_part = normalize_id_part(class_assigned)
    if not code_part or not class_part:
        raise ValueError('School unique code and class assignment are required.')
    return f'{code_part}_{class_part}'


def build_student_id(teacher_id, roll_no):
    """Deterministic student primary key: schoolcode_class_rollnumber."""
    teacher_part = str(teacher_id or '').strip()
    roll_part = normalize_id_part(roll_no)
    if not teacher_part or not roll_part:
        raise ValueError('Teacher ID and roll number are required.')
    return f'{teacher_part}_{roll_part}'


def generate_id(prefix, suffix_length=0):
    """Generate a timestamp-based ID for non-user records (schools, scores, etc.).

    Do not use for teachers or students — their IDs are deterministic via
    build_teacher_id() and build_student_id().

    Examples:
        generate_id('school')  -> 'school_1782810672875'
        generate_id('sc')      -> 'sc_1782810672875'
    """
    base = f'{prefix}_{int(time.time() * 1000)}'
    if suffix_length > 0:
        rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=suffix_length))
        return f'{base}_{rand_suffix}'
    return base
