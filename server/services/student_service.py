from datetime import datetime, timezone

from models import score_model
from utils.id_generator import generate_id


def submit_score(student_id, disaster_type, activity_type, score, duration_seconds):
    """Create a new score record. Returns (score_dict, error)."""
    try:
        new_score_id = generate_id('sc')
        timestamp = datetime.now(timezone.utc).isoformat()

        insert_res = score_model.create(
            new_score_id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp
        )
        return insert_res['rows'][0], None
    except Exception as e:
        print('Error submitting score', e)
        return None, {'success': False, 'message': 'Database error'}
