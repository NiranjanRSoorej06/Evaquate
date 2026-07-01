import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.environ.get('PORT', 3001))
JWT_SECRET = os.environ.get('JWT_SECRET', 'super_secret_jwt_key_123')
NODE_ENV = os.environ.get('NODE_ENV', 'development')
IS_PRODUCTION = NODE_ENV == 'production'

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000   # 24 hours in milliseconds
SESSION_EXPIRY_SEC = 24 * 60 * 60          # 24 hours in seconds
