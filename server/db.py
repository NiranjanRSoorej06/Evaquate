import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the .env file")

# Create PostgreSQL connection pool
connection_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=20,
    dsn=DATABASE_URL
)


def query(text, params=None):
    """
    Execute a SQL query.

    Returns:
        {
            'rows': [...],
            'rowCount': int
        }
    """
    conn = None
    cur = None

    try:
        conn = connection_pool.getconn()
        cur = conn.cursor()

        cur.execute(text, params)

        if cur.description:
            columns = [desc[0] for desc in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
            conn.commit()

            return {
                "rows": rows,
                "rowCount": len(rows)
            }

        conn.commit()

        return {
            "rows": [],
            "rowCount": cur.rowcount
        }

    except Exception as e:
        if conn:
            conn.rollback()
        raise e

    finally:
        if cur:
            cur.close()

        if conn:
            connection_pool.putconn(conn)


def close_pool():
    """Close all database connections."""
    if connection_pool:
        connection_pool.closeall()