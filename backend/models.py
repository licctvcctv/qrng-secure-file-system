from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(80))
    role = db.Column(db.String(20), default='user') # admin, user
    department = db.Column(db.String(80))
    status = db.Column(db.String(20), default='active') # active, locked
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class KeyRecord(db.Model):
    __tablename__ = 'key_records'
    id = db.Column(db.String(50), primary_key=True) # KEY-YYYYMMDD-XXXX
    owner = db.Column(db.String(80), nullable=False)
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.String(20))
    algorithm = db.Column(db.String(20))
    key_type = db.Column(db.String(20)) # QRNG-Auto, Custom-Seed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    key_fingerprint = db.Column(db.String(64))
    decrypt_count = db.Column(db.Integer, default=0)
    
    # Real storage fields
    storage_path = db.Column(db.String(255), nullable=True)
    iv = db.Column(db.String(255), nullable=True) # Hex string
    key_hex = db.Column(db.String(255), nullable=True) # Hex string (Encrypted in real app, plain for demo)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(80))
    action_type = db.Column(db.String(50)) # LOGIN, ENCRYPT, SYSTEM
    message = db.Column(db.String(255))
    detail = db.Column(db.Text)
    level = db.Column(db.String(20), default='info')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))

class Device(db.Model):
    __tablename__ = 'devices'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(80))
    ip = db.Column(db.String(45))
    status = db.Column(db.String(20), default='pending') # trusted, pending, revoked
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
