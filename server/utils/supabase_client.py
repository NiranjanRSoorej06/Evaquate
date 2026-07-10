import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Use service role key for backend storage operations (bypasses RLS).
# Fall back to anon key if service key not configured.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from environment variables.")
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase_client()
BUCKET_NAME = "Evaquate Images"

