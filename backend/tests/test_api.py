"""
基础 API 测试 - Smoke Tests
运行: python -m pytest tests/test_api.py -v
"""
import pytest
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash

@pytest.fixture
def app():
    """创建测试应用"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    
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
        db.session.add(admin)
        db.session.add(user)
        db.session.commit()
        
        yield app
        
        db.drop_all()

@pytest.fixture
def client(app):
    """测试客户端"""
    return app.test_client()

class TestAuth:
    """认证测试"""
    
    def test_login_success(self, client):
        """测试登录成功"""
        response = client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['user']['username'] == 'testadmin'
    
    def test_login_wrong_password(self, client):
        """测试密码错误"""
        response = client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'wrongpassword'
        })
        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] == False
    
    def test_login_user_not_found(self, client):
        """测试用户不存在"""
        response = client.post('/api/login', json={
            'username': 'nonexistent',
            'password': 'password'
        })
        assert response.status_code == 401
    
    def test_me_without_login(self, client):
        """测试未登录访问"""
        response = client.get('/api/me')
        assert response.status_code == 401
    
    def test_logout(self, client):
        """测试登出"""
        # 先登录
        client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'admin123'
        })
        # 再登出
        response = client.post('/api/logout')
        assert response.status_code == 200

class TestKeys:
    """密钥管理测试"""
    
    def login_as_admin(self, client):
        """登录管理员"""
        client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'admin123'
        })
    
    def test_keys_list_requires_auth(self, client):
        """测试密钥列表需要认证"""
        response = client.get('/api/keys')
        assert response.status_code == 401
    
    def test_keys_list_empty(self, client):
        """测试空密钥列表"""
        self.login_as_admin(client)
        response = client.get('/api/keys')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['keys'] == []
    
    def test_encrypt_no_file(self, client):
        """测试加密无文件"""
        self.login_as_admin(client)
        response = client.post('/api/encrypt')
        assert response.status_code == 400

class TestDashboard:
    """仪表盘测试"""
    
    def login_as_admin(self, client):
        """登录管理员"""
        client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'admin123'
        })
    
    def test_dashboard_stats(self, client):
        """测试仪表盘统计"""
        self.login_as_admin(client)
        response = client.get('/api/dashboard/stats')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert 'stats' in data
        assert 'qrng' in data

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
