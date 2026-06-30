import os
import sys
import json
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

db_user = os.environ.get('DB_USER')
db_password = os.environ.get('DB_PASSWORD')
db_host = os.environ.get('DB_HOST')
db_port = int(os.environ.get('DB_PORT', 5432))
db_name = os.environ.get('DB_NAME')


def init():
    # 1. Connect to postgres database to ensure target database exists
    print('Connecting to default postgres database...')
    conn = psycopg2.connect(
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        database='postgres',
    )
    conn.autocommit = True

    try:
        cur = conn.cursor()
        cur.execute('SELECT 1 FROM pg_database WHERE datname = %s', (db_name,))
        if cur.rowcount == 0:
            print(f'Database "{db_name}" does not exist. Creating...')
            cur.execute(f'CREATE DATABASE {db_name}')
            print(f'Database "{db_name}" created successfully.')
        else:
            print(f'Database "{db_name}" already exists.')
    except Exception as e:
        print('Error ensuring database exists:', e)
        sys.exit(1)
    finally:
        try:
            conn.close()
        except Exception:
            pass

    # 2. Connect to the target database and build schema
    print(f'Connecting to database "{db_name}"...')
    target_pool = pool.SimpleConnectionPool(
        1, 20,
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        database=db_name,
    )
    target_conn = target_pool.getconn()

    try:
        target_conn.autocommit = True
        cur = target_conn.cursor()

        # Create tables
        print('Creating tables if they do not exist...')

        # Schools Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schools (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                unique_code VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                blueprint_json JSONB
            );
        """)

        # Users Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                school_id VARCHAR(50) REFERENCES schools(id) ON DELETE SET NULL,
                role VARCHAR(50) NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                class_assigned VARCHAR(100)
            );
        """)

        # Students Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id VARCHAR(50) PRIMARY KEY,
                school_id VARCHAR(50) REFERENCES schools(id) ON DELETE CASCADE,
                teacher_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
                roll_no VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                UNIQUE (school_id, roll_no)
            );
        """)

        # Quizzes Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                disaster_type VARCHAR(50) PRIMARY KEY,
                questions JSONB NOT NULL
            );
        """)

        # Scores Table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id VARCHAR(50) PRIMARY KEY,
                student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
                disaster_type VARCHAR(50) NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                score INT NOT NULL,
                duration_seconds INT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print('Tables created or already exist.')

        # 3. Migrate data from db.json if database is empty
        target_conn.autocommit = False
        cur2 = target_conn.cursor()
        cur2.execute('SELECT COUNT(*) FROM schools')
        school_count = cur2.fetchone()[0]
        has_data = school_count > 0

        if not has_data:
            print('Database is empty. Starting migration from db.json...')
            db_path = os.path.join(os.path.dirname(__file__), 'db.json')
            if os.path.exists(db_path):
                with open(db_path, 'r', encoding='utf8') as f:
                    data = json.load(f)

                # Migrate schools
                schools = data.get('schools', [])
                if schools:
                    print(f'Migrating {len(schools)} schools...')
                    for school in schools:
                        cur2.execute(
                            """INSERT INTO schools (id, name, unique_code, password, blueprint_json)
                               VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                            (school['id'], school['name'], school['unique_code'],
                             school['password'], json.dumps(school.get('blueprint_json')))
                        )

                # Migrate users
                users = data.get('users', [])
                if users:
                    print(f'Migrating {len(users)} users...')
                    for user in users:
                        cur2.execute(
                            """INSERT INTO users (id, school_id, role, username, password, name, class_assigned)
                               VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                            (user['id'], user.get('school_id'), user['role'], user['username'],
                             user['password'], user.get('name'), user.get('class_assigned'))
                        )

                # Migrate students
                students = data.get('students', [])
                if students:
                    print(f'Migrating {len(students)} students...')
                    for student in students:
                        cur2.execute(
                            """INSERT INTO students (id, school_id, teacher_id, roll_no, name, password)
                               VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                            (student['id'], student.get('school_id'), student.get('teacher_id'),
                             student['roll_no'], student['name'], student['password'])
                        )

                # Migrate quizzes
                quizzes = data.get('quizzes', [])
                if quizzes:
                    print(f'Migrating {len(quizzes)} quizzes...')
                    for quiz in quizzes:
                        cur2.execute(
                            """INSERT INTO quizzes (disaster_type, questions)
                               VALUES (%s, %s) ON CONFLICT (disaster_type) DO NOTHING""",
                            (quiz['disaster_type'], json.dumps(quiz['questions']))
                        )

                # Migrate scores
                scores = data.get('scores', [])
                if scores:
                    print(f'Migrating {len(scores)} scores...')
                    for score in scores:
                        cur2.execute(
                            """INSERT INTO scores (id, student_id, disaster_type, activity_type, score, duration_seconds, timestamp)
                               VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                            (score['id'], score['student_id'], score['disaster_type'],
                             score['activity_type'], score['score'], score['duration_seconds'],
                             score['timestamp'])
                        )

                target_conn.commit()
                print('Migration completed successfully.')
            else:
                print('db.json file not found. Skipping data migration.')
        else:
            print('Database already has data. Skipping migration.')

    except Exception as e:
        target_conn.rollback()
        print('Error during database initialization/migration:', e)
        sys.exit(1)
    finally:
        target_pool.putconn(target_conn)
        target_pool.closeall()


if __name__ == '__main__':
    init()
