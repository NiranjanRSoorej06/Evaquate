import os
import sys
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

db_user = os.environ.get("DB_USER")
db_password = os.environ.get("DB_PASSWORD")
db_host = os.environ.get("DB_HOST")
db_port = int(os.environ.get("DB_PORT", 5432))
db_name = os.environ.get("DB_NAME")


def init():
    # Connect to default postgres database
    print("Connecting to default postgres database...")

    try:
        conn = psycopg2.connect(
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
            database="postgres",
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Check if database exists
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )

        if cur.fetchone() is None:
            print(f'Database "{db_name}" does not exist. Creating...')
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f'Database "{db_name}" created successfully.')
        else:
            print(f'Database "{db_name}" already exists.')

    except Exception as e:
        print("Error ensuring database exists:", e)
        sys.exit(1)

    finally:
        try:
            conn.close()
        except Exception:
            pass

    # Connect to target database
    print(f'Connecting to database "{db_name}"...')

    target_pool = pool.SimpleConnectionPool(
        1,
        20,
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

        print("Creating tables if they do not exist...")

        # Schools
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schools (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                unique_code VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                blueprint_json JSONB,
                disabled BOOLEAN DEFAULT false
            );
        """)
        
        # Add disabled column if it doesn't exist (migration)
        cur.execute("""
            ALTER TABLE schools
            ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false;
        """)

        # Users
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                school_id VARCHAR(50)
                    REFERENCES schools(id)
                    ON DELETE SET NULL,
                role VARCHAR(50) NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                class_assigned VARCHAR(100)
            );
        """)

        # Students
        cur.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id VARCHAR(50) PRIMARY KEY,
                school_id VARCHAR(50)
                    REFERENCES schools(id)
                    ON DELETE CASCADE,
                teacher_id VARCHAR(50)
                    REFERENCES users(id)
                    ON DELETE SET NULL,
                roll_no VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                UNIQUE (school_id, roll_no)
            );
        """)

        # Quizzes — one row per teacher quiz; full payload in quiz_data JSONB
        # quiz_data shape: { title, disaster, q1: { question, option_a..d, answer }, q2: {...}, ... }
        cur.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                teacher_id VARCHAR(50)
                    REFERENCES users(id)
                    ON DELETE CASCADE,
                quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb
            );
        """)

        cur.execute("""
            ALTER TABLE quizzes
            ADD COLUMN IF NOT EXISTS teacher_id VARCHAR(50)
                REFERENCES users(id)
                ON DELETE CASCADE;
        """)
        cur.execute("""
            ALTER TABLE quizzes
            ADD COLUMN IF NOT EXISTS quiz_data JSONB NOT NULL DEFAULT '{}'::jsonb;
        """)
        cur.execute("UPDATE quizzes SET quiz_data = '{}'::jsonb WHERE quiz_data IS NULL;")

        # Drop legacy per-question columns from older schema
        for legacy_column in (
            'disaster_type',
            'question',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'correct_answer',
            'questions',
        ):
            cur.execute(f"ALTER TABLE quizzes DROP COLUMN IF EXISTS {legacy_column};")
        cur.execute("ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_disaster_type_key;")

        # Scores
        cur.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id VARCHAR(50) PRIMARY KEY,
                student_id VARCHAR(50)
                    REFERENCES students(id)
                    ON DELETE CASCADE,
                disaster_type VARCHAR(50) NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                score INT NOT NULL,
                duration_seconds INT NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE
                    DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Tables created or already exist.")

        # Create default super admin
        cur.execute("""
            INSERT INTO users (
                id,
                school_id,
                role,
                username,
                password,
                name,
                class_assigned
            )
            VALUES (
                'sa_1',
                NULL,
                'super_admin',
                'superadmin',
                'adminpassword',
                'Super Admin',
                NULL
            )
            ON CONFLICT (username) DO NOTHING;
        """)

        print("Super admin initialized.")

    except Exception as e:
        print("Error during database initialization:", e)
        sys.exit(1)

    finally:
        target_pool.putconn(target_conn)
        target_pool.closeall()


if __name__ == "__main__":
    init()