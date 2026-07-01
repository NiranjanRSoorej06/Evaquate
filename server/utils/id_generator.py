import time
import random
import string


def generate_id(prefix, suffix_length=0):
    """Generate a timestamp-based ID with an optional random suffix.

    Examples:
        generate_id('school')  -> 'school_1782810672875'
        generate_id('s', 5)    -> 's_1782810672875_a3kf2'
    """
    base = f'{prefix}_{int(time.time() * 1000)}'
    if suffix_length > 0:
        rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=suffix_length))
        return f'{base}_{rand_suffix}'
    return base
