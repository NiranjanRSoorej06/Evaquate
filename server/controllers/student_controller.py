from flask import jsonify, request

from services import score_service, quiz_service, blueprint_service
from utils.helpers import get_json_body


def get_quiz(quizId):
    teacher_id = request.user.get('teacher_id')
    data, error = quiz_service.get_quiz_by_id(teacher_id, quizId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def list_quizzes():
    teacher_id = request.user.get('teacher_id')
    disaster_type = request.args.get('disaster')
    data, error = quiz_service.list_available_quizzes(teacher_id, disaster_type)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(data)


def submit_score():
    body = get_json_body()
    score, error = score_service.submit_score(
        body.get('student_id'),
        body.get('disaster_type'),
        body.get('activity_type'),
        body.get('score'),
        body.get('duration_seconds'),
    )
    if error:
        return jsonify(error), 500
    return jsonify({'success': True, 'score': score})


def get_school_map(schoolId):
    blueprint, error = blueprint_service.get_school_map(schoolId)
    if error:
        return jsonify(error[0]), error[1]
    return jsonify(blueprint)


def evaluate_drill():
    from config import GEMINI_API_KEY
    import json
    
    body = get_json_body()
    drill_result = body.get('drillResult')
    if not drill_result:
        return jsonify({'success': False, 'message': 'Missing drill result data.'}), 400

    is_successful = drill_result.get('isSuccessful', False)
    
    # Fallback evaluation details
    fallback_evaluation = {
        "summary": "Evacuation completed safely, but future drills require greater attention to minimizing minor hazard exposure." if is_successful
                   else "Evacuation drill failed due to severe hazard contact. Student remained inside active hazard hotspots without proper crouch or mask protection.",
        "correctActions": ["Negotiated ground level corridors and reached assembly zone.", "Sought proper exits."] if is_successful
                          else ["Attempted corridor route evacuation."],
        "criticalMistakes": [] if is_successful
                            else ["Stood fully upright inside thick toxic smoke columns", "Neglected to use safety equipment like extinguishers"],
        "tips": [
            "In a fire breakout, stay low underneath smoke to maintain breathing capacity.",
            "Always keep eye-level alarms and corridor lockers in mind to find extinguishers.",
            "Check fire doors with the back of your hand before turning handles."
        ],
        "grade": "B" if is_successful else "F"
    }

    if not GEMINI_API_KEY:
        # Fallback if no API key
        return jsonify({'success': True, 'evaluation': fallback_evaluation})

    try:
        from google import genai
        from google.genai import types
        
        prompt = f"""You are a high-level School Safety Auditor and Emergency Coordinator.
Analyze the following disaster drill results for a student and write a highly professional, constructive emergency drill audit statement.

Drill Details:
- Student Name: {drill_result.get('studentName')}
- Disaster Incident: {drill_result.get('disasterType')}
- Duration Taken: {drill_result.get('timeTaken')} seconds
- Vitality Health Remaining: {drill_result.get('healthRemaining')}%
- Safety Score: {drill_result.get('score')} out of {drill_result.get('maxScore')}
- Completed Successfully: {"YES (reached safe assembly area)" if is_successful else "NO (critical hazard entrapment)"}

Chronological Student Action Logs during Drill:
{json.dumps(drill_result.get('actions', []))}

Based on the disaster type (e.g. Earthquake, Fire, Flood, Gas Leak, Cyclone, Chemical Spill), judge whether the student followed official safety guidelines.
For example:
- In Fire: Stay low (crouched) to avoid toxic smoke, find and use fire extinguishers, cover nose/mouth, evacuate to assembly area.
- In Earthquake: Duck and cover under sturdy tables/desks instantly while shaking is active, do not run blindly, evacuate to the sports field once shaking subsides.
- In Flood: Climb stairwells to high-ground floors immediately, avoid contact with lower level water leaks, do not stay in corridors.
- In Gas/Chemical Leak: Cover nose/mouth, bypass toxic vapors, do not touch electrical outlets, evacuate down-wind.
- In Cyclone: Stay in windowless interior hallways, cover under furniture, avoid exits near glass.

You MUST output a clean, valid JSON object conforming exactly to the following EvaluationData typescript interface:
{{
  "summary": string, // Detailed constructively critical review of performance.
  "correctActions": string[], // Array of positive actions the student performed correctly.
  "criticalMistakes": string[], // Array of critical errors, ignored hazards, or bad protocols performed.
  "tips": string[], // Array of 3-4 specific preparedness advice points tailored to this scenario and mistakes.
  "grade": "A+" | "A" | "B" | "C" | "D" | "F" // Overall safety grade.
}}

Return ONLY a single valid JSON block without any comments or formatting wrappers."""

        client = genai.Client(api_key=GEMINI_API_KEY)
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        raw_text = response.text or ""
        raw_text = raw_text.replace('```json', '').replace('```', '').strip()
        parsed_evaluation = json.loads(raw_text)
        
        # Validate required fields in the response
        required_fields = ["summary", "correctActions", "criticalMistakes", "tips", "grade"]
        if all(field in parsed_evaluation for field in required_fields):
            return jsonify({'success': True, 'evaluation': parsed_evaluation})
        else:
            raise ValueError("Parsed evaluation is missing some required fields.")
            
    except Exception as e:
        print("AI Evaluation error in backend:", e)
        return jsonify({'success': True, 'evaluation': fallback_evaluation})

