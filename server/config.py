import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.environ.get('PORT', 5000))
# SECRET_KEY is the production configuration value. JWT_SECRET remains a
# backwards-compatible fallback for existing local installations.
JWT_SECRET = os.environ.get('SECRET_KEY') or os.environ.get('JWT_SECRET', '')
NODE_ENV = os.environ.get('NODE_ENV', 'development')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
IS_PRODUCTION = NODE_ENV == 'production' or os.environ.get('FLASK_ENV') == 'production' or bool(os.environ.get('RENDER'))

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000   # 24 hours in milliseconds
SESSION_EXPIRY_SEC = 24 * 60 * 60          # 24 hours in seconds
