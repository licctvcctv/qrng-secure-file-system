"""
仪表盘 API 测试
"""


class TestDashboard:
    """仪表盘 API 测试"""
    
    def test_dashboard_stats(self, admin_client):
        """仪表盘统计"""
        response = admin_client.get('/api/dashboard/stats')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert 'stats' in data
        assert 'qrng' in data
        assert 'security_status' in data
        assert 'devices' in data
    
    def test_dashboard_stats_structure(self, admin_client):
        """仪表盘数据结构"""
        response = admin_client.get('/api/dashboard/stats')
        data = response.get_json()
        
        # 验证 stats 结构
        stats = data['stats']
        assert 'encrypted_files' in stats
        assert 'storage_used' in stats
        assert 'security_score' in stats
        assert 'alerts' in stats
        
        # 验证 QRNG 结构
        qrng = data['qrng']
        assert 'online' in qrng
        assert 'entropy_quality' in qrng
        assert 'entropy_value' in qrng
        assert 'bit_rate' in qrng
    
    def test_dashboard_requires_auth(self, client):
        """仪表盘需要认证"""
        response = client.get('/api/dashboard/stats')
        assert response.status_code == 401
    
    def test_dashboard_user_access(self, user_client):
        """普通用户可以访问仪表盘"""
        response = user_client.get('/api/dashboard/stats')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
    
    def test_qrng_random_fluctuation(self, admin_client):
        """QRNG 状态随机波动"""
        response = admin_client.get('/api/dashboard/stats')
        qrng = response.get_json()['qrng']
        
        # 验证熵值在合理范围
        assert 0.85 <= qrng['entropy_value'] <= 1.0
        assert qrng['entropy_quality'] in ['excellent', 'good', 'fair', 'poor']
        assert 'Mbps' in qrng['bit_rate']
