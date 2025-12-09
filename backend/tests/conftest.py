"""
共享测试配置和 Fixtures
"""
import pytest
import sys
import os
import tempfile

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User, Device, KeyRecord, AuditLog
from werkzeug.security import generate_password_hash


@pytest.fixture
def app():
    """创建测试应用"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['DEBUG'] = True  # 允许 reset 端点
    
    # 使用临时目录作为上传目录
    temp_dir = tempfile.mkdtemp()
    app.config['UPLOAD_FOLDER'] = temp_dir
    
    with app.app_context():
        db.create_all()
        
        # 创建测试用户
        admin = User(
            username='testadmin',
            password_hash=generate_password_hash('admin123'),
            name='Test Admin',
            role='admin',
            status='active'
        )
        user = User(
            username='testuser',
            password_hash=generate_password_hash('user123'),
            name='Test User',
            role='user',
            status='active'
        )
        locked_user = User(
            username='locked',
            password_hash=generate_password_hash('locked123'),
            name='Locked User',
            role='user',
            status='locked'
        )
        
        # 创建测试设备
        device = Device(
            id='DEV-TEST-001',
            name='Test Device',
            ip='192.168.1.100',
            status='trusted'
        )
        
        db.session.add_all([admin, user, locked_user, device])
        db.session.commit()
        
        yield app
        
        db.drop_all()
    
    # 清理临时目录
    import shutil
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def client(app):
    """测试客户端"""
    return app.test_client()


@pytest.fixture
def admin_client(client):
    """已登录管理员的客户端"""
    client.post('/api/login', json={
        'username': 'testadmin',
        'password': 'admin123'
    })
    return client


@pytest.fixture
def user_client(client):
    """已登录普通用户的客户端"""
    client.post('/api/login', json={
        'username': 'testuser',
        'password': 'user123'
    })
    return client
