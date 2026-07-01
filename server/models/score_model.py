from utils.sql import sql


def get_for_school(school_id):
    return sql(
        """SELECT sc.*
           FROM scores sc
           JOIN students st ON sc.student_id = st.id
           WHERE st.school_id = $1""",
        [school_id],
    )


def get_for_teacher(teacher_id):
    return sql(
        """SELECT sc.*
           FROM scores sc
           JOIN students st ON sc.student_id = st.id
           WHERE st.teacher_id = $1
           ORDER BY sc.timestamp DESC""",
        [teacher_id],
    )


def create(score_id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp):
    return sql(
        """INSERT INTO scores (id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *""",
        [score_id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp],
    )
