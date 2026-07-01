from models import quiz_model


def get_quiz(disaster_type):
    """Get quiz questions for a disaster type.

    Returns:
        (quiz_data_dict, None) on success
        (None, (response_body_dict, http_status_code)) on failure
    """
    try:
        quiz_res = quiz_model.find_by_disaster_type(disaster_type)
        if quiz_res['rowCount'] > 0:
            first_row = quiz_res['rows'][0]
            questions = first_row.get('questions') or []
            return {'disaster_type': disaster_type, 'questions': questions}, None
        return None, ({'message': 'Quiz not found'}, 404)
    except Exception as e:
        print('Error getting quiz', e)
        return None, ({'message': 'Database error'}, 500)
