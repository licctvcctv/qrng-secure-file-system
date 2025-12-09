"""
认证 API 测试
"""


class TestAuth:
    """认证 API 测试"""
    
    def test_login_success_admin(self, client):
        """管理员登录成功"""
        response = client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'admin123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['user']['username'] == 'testadmin'
        assert data['user']['role'] == 'admin'
    
    def test_login_success_user(self, client):
        """普通用户登录成功"""
        response = client.post('/api/login', json={
            'username': 'testuser',
            'password': 'user123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['user']['role'] == 'user'
    
    def test_login_wrong_password(self, client):
        """密码错误"""
        response = client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'wrongpassword'
        })
        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] == False
    
    def test_login_user_not_found(self, client):
        """用户不存在"""
        response = client.post('/api/login', json={
            'username': 'nonexistent',
            'password': 'password'
        })
        assert response.status_code == 401
    
    def test_login_locked_user(self, client):
        """锁定用户无法登录"""
        response = client.post('/api/login', json={
            'username': 'locked',
            'password': 'locked123'
        })
        assert response.status_code == 403
        data = response.get_json()
        assert 'locked' in data['message'].lower() or '锁定' in data['message']
    
    def test_login_empty_credentials(self, client):
        """空凭据"""
        response = client.post('/api/login', json={
            'username': '',
            'password': ''
        })
        assert response.status_code == 400
    
    def test_me_without_login(self, client):
        """未登录访问 /api/me"""
        response = client.get('/api/me')
        assert response.status_code == 401
    
    def test_me_after_login(self, admin_client):
        """登录后访问 /api/me"""
        response = admin_client.get('/api/me')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['user']['username'] == 'testadmin'
    
    def test_logout(self, admin_client):
        """登出"""
        response = admin_client.post('/api/logout')
        assert response.status_code == 200
        
        # 登出后无法访问 /api/me
        response = admin_client.get('/api/me')
        assert response.status_code == 401
