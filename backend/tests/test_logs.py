"""
审计日志 API 测试
"""


class TestLogs:
    """审计日志 API 测试"""
    
    def test_logs_list(self, admin_client):
        """日志列表"""
        response = admin_client.get('/api/logs')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert 'logs' in data
        assert 'pagination' in data
    
    def test_logs_filter_by_level(self, admin_client):
        """按级别过滤日志"""
        response = admin_client.get('/api/logs?level=info')
        assert response.status_code == 200
    
    def test_logs_pagination(self, admin_client):
        """日志分页"""
        response = admin_client.get('/api/logs?page=1&per_page=10')
        assert response.status_code == 200
        data = response.get_json()
        assert data['pagination']['per_page'] == 10
    
    def test_create_frontend_log(self, admin_client):
        """前端上报日志"""
        response = admin_client.post('/api/logs', json={
            'action_type': 'FRONTEND_ERROR',
            'message': 'Test error from frontend',
            'level': 'error'
        })
        assert response.status_code == 200
    
    def test_reset_requires_debug(self, app, admin_client):
        """reset 端点需要 DEBUG 模式"""
        # DEBUG=True 时应该可用
        response = admin_client.post('/api/reset')
        assert response.status_code == 200
    
    def test_reset_requires_admin(self, user_client):
        """reset 端点需要管理员权限"""
        response = user_client.post('/api/reset')
        assert response.status_code == 403
    
    def test_user_sees_own_logs(self, user_client):
        """普通用户可以看到日志（自己的操作会产生日志）"""
        # 用户执行一些操作产生日志
        user_client.get('/api/keys')
        
        # 然后查看日志
        response = user_client.get('/api/logs')
        assert response.status_code == 200
        data = response.get_json()
        assert 'logs' in data
