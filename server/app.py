import os
from flask import Flask
from flask_cors import CORS

from config import PORT, UPLOAD_DIR
from routes import auth_bp, superadmin_bp, admin_bp, teacher_bp, student_bp


def create_app():
    app = Flask(__name__)
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5174'], supports_credentials=True)

    # Ensure uploads directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(superadmin_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(teacher_bp)
    app.register_blueprint(student_bp)

    return app


app = create_app()

if __name__ == '__main__':
    print(f'Disaster preparedness server is running on http://localhost:{PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=False)
