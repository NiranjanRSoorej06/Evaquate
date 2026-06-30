import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

connection_pool = pool.SimpleConnectionPool(
    1,  # minconn
    20,  # maxconn
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASSWORD'),
    host=os.environ.get('DB_HOST'),
    port=int(os.environ.get('DB_PORT', 5432)),
    database=os.environ.get('DB_NAME'),
)


def query(text, params=None):
    """Execute a query and return results similar to node-pg: { rows, rowCount }"""
    conn = connection_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(text, params)
        if cur.description:
            columns = [desc[0] for desc in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
            return {'rows': rows, 'rowCount': len(rows)}
        else:
            conn.commit()
            return {'rows': [], 'rowCount': cur.rowcount}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)
