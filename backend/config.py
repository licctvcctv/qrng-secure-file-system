import os
import base64

class Config:
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-prod'
    
    # Master Key for encrypting key_hex in database (base64 encoded 32-byte key)
    # Generate with: python -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())"
    MASTER_KEY = os.environ.get('MASTER_KEY')
    
    # Debug mode - controls dangerous endpoints like /api/reset
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session Security
    SESSION_TYPE = 'filesystem'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production'  # True in production
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20MB max file size
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip'}
    
    # CORS - Whitelist specific origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    
    @staticmethod
    def get_master_key_bytes():
        """Get master key as bytes for encryption, or None if not configured"""
        master_key = Config.MASTER_KEY
        if not master_key:
            return None
        try:
            return base64.b64decode(master_key)
        except:
            return None
    
    # Ensure upload folder exists
    @staticmethod
    def init_app(app):
        upload_folder = Config.UPLOAD_FOLDER
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        # Warn if using default SECRET_KEY
        if app.config['SECRET_KEY'] == 'dev-secret-key-change-in-prod':
            import warnings
            warnings.warn("使用默认 SECRET_KEY，生产环境请设置环境变量！")
