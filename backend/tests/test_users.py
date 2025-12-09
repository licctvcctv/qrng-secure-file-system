"""
用户管理 API 测试
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import User


class TestUsers:
    """用户管理 API 测试"""
    
    def test_users_list_admin(self, admin_client):
        """管理员获取用户列表"""
        response = admin_client.get('/api/users')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert len(data['users']) >= 3  # admin, user, locked
    
    def test_users_list_forbidden_for_user(self, user_client):
        """普通用户无法获取用户列表"""
        response = user_client.get('/api/users')
        # API 返回 403
        assert response.status_code == 403
    
    def test_create_user(self, admin_client):
        """创建用户"""
        response = admin_client.post('/api/users', json={
            'username': 'newuser',
            'password': 'newpass123',
            'name': 'New User',
            'role': 'user'
        })
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] == True
    
    def test_create_user_duplicate(self, admin_client):
        """创建重复用户返回 409"""
        response = admin_client.post('/api/users', json={
            'username': 'testuser',  # 已存在
            'password': 'password',
            'name': 'Duplicate',
            'role': 'user'
        })
        # API 返回 409 Conflict
        assert response.status_code == 409
    
    def test_create_user_requires_admin(self, user_client):
        """普通用户无法创建用户"""
        response = user_client.post('/api/users', json={
            'username': 'hacker',
            'password': 'hack123',
            'name': 'Hacker',
            'role': 'admin'
        })
        assert response.status_code == 403
    
    def test_update_user(self, admin_client, app):
        """更新用户"""
        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            user_id = user.id
        
        response = admin_client.put(f'/api/users/{user_id}', json={
            'name': 'Updated Name',
            'department': 'IT'
        })
        assert response.status_code == 200
    
    def test_delete_user(self, admin_client):
        """删除用户"""
        # 先创建一个用于删除的用户
        create_response = admin_client.post('/api/users', json={
            'username': 'todelete',
            'password': 'delete123',
            'name': 'To Delete',
            'role': 'user'
        })
        user_id = create_response.get_json()['user']['id']
        
        # 删除
        response = admin_client.delete(f'/api/users/{user_id}')
        assert response.status_code == 200
    
    def test_update_user_status(self, admin_client, app):
        """更新用户状态"""
        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            user_id = user.id
        
        response = admin_client.put(f'/api/users/{user_id}', json={
            'status': 'locked'
        })
        assert response.status_code == 200
