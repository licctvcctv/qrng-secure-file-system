"""
密钥管理 API 测试
"""
import io


class TestKeys:
    """密钥管理 API 测试"""
    
    def test_keys_list_requires_auth(self, client):
        """密钥列表需要认证"""
        response = client.get('/api/keys')
        assert response.status_code == 401
    
    def test_keys_list_empty(self, admin_client):
        """空密钥列表"""
        response = admin_client.get('/api/keys')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['keys'] == []
    
    def test_encrypt_no_file(self, admin_client):
        """加密无文件"""
        response = admin_client.post('/api/encrypt')
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] == False
    
    def test_encrypt_real_success(self, admin_client):
        """真实加密成功"""
        data = {
            'file': (io.BytesIO(b'Hello, World!'), 'test.txt'),
            'algorithm': 'AES-256-GCM',
            'mode': 'real'
        }
        response = admin_client.post('/api/encrypt', 
            data=data,
            content_type='multipart/form-data'
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result['success'] == True
        assert 'key_id' in result
        assert 'fingerprint' in result
        assert result['key_id'].startswith('KEY-')
    
    def test_encrypt_simulate_success(self, admin_client):
        """模拟加密成功"""
        data = {
            'file': (io.BytesIO(b'Test content'), 'test.txt'),
            'algorithm': 'AES-256-GCM',
            'mode': 'simulate'
        }
        response = admin_client.post('/api/encrypt',
            data=data,
            content_type='multipart/form-data'
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result['success'] == True
        assert 'key_id' in result
    
    def test_encrypt_invalid_extension(self, admin_client):
        """不支持的文件类型"""
        data = {
            'file': (io.BytesIO(b'Malicious content'), 'test.exe'),
            'mode': 'real'
        }
        response = admin_client.post('/api/encrypt',
            data=data,
            content_type='multipart/form-data'
        )
        assert response.status_code == 400
    
    def test_decrypt_not_found(self, admin_client):
        """解密不存在的密钥"""
        response = admin_client.post('/api/decrypt', json={
            'key_id': 'KEY-NONEXISTENT'
        })
        assert response.status_code == 404
    
    def test_full_encrypt_decrypt_flow(self, admin_client, app):
        """完整加密解密流程"""
        original_content = b'This is a secret message for testing!'
        
        # 1. 加密
        encrypt_response = admin_client.post('/api/encrypt',
            data={
                'file': (io.BytesIO(original_content), 'secret.txt'),
                'algorithm': 'AES-256-GCM',
                'mode': 'real'
            },
            content_type='multipart/form-data'
        )
        assert encrypt_response.status_code == 200
        encrypt_result = encrypt_response.get_json()
        key_id = encrypt_result['key_id']
        
        # 2. 验证密钥在列表中
        list_response = admin_client.get('/api/keys')
        keys = list_response.get_json()['keys']
        assert len(keys) == 1
        assert keys[0]['id'] == key_id
        
        # 3. 解密
        decrypt_response = admin_client.post('/api/decrypt', json={
            'key_id': key_id
        })
        assert decrypt_response.status_code == 200
        decrypt_result = decrypt_response.get_json()
        assert decrypt_result['success'] == True
        assert 'download_url' in decrypt_result
        assert decrypt_result['simulated'] == False
        
        # 4. 下载
        download_url = decrypt_result['download_url']
        download_response = admin_client.get(download_url)
        assert download_response.status_code == 200
        assert download_response.data == original_content
    
    def test_user_cannot_access_others_keys(self, app, client):
        """普通用户无法访问其他人的密钥"""
        # 管理员创建密钥
        client.post('/api/login', json={'username': 'testadmin', 'password': 'admin123'})
        client.post('/api/encrypt',
            data={
                'file': (io.BytesIO(b'Admin secret'), 'admin.txt'),
                'mode': 'real'
            },
            content_type='multipart/form-data'
        )
        client.post('/api/logout')
        
        # 普通用户看不到
        client.post('/api/login', json={'username': 'testuser', 'password': 'user123'})
        response = client.get('/api/keys')
        keys = response.get_json()['keys']
        assert len(keys) == 0


class TestKeySecurity:
    """密钥安全测试"""
    
    def test_path_traversal_in_filename(self, admin_client):
        """路径遍历攻击防护"""
        data = {
            'file': (io.BytesIO(b'Malicious'), '../../../etc/passwd'),
            'mode': 'real'
        }
        response = admin_client.post('/api/encrypt',
            data=data,
            content_type='multipart/form-data'
        )
        assert response.status_code == 400
    
    def test_download_token_required(self, admin_client):
        """下载需要 token"""
        # 先加密
        admin_client.post('/api/encrypt',
            data={
                'file': (io.BytesIO(b'Test'), 'test.txt'),
                'mode': 'real'
            },
            content_type='multipart/form-data'
        )
        
        # 获取 key_id
        keys = admin_client.get('/api/keys').get_json()['keys']
        key_id = keys[0]['id']
        
        # 尝试不带 token 下载
        response = admin_client.get(f'/api/download/{key_id}')
        assert response.status_code == 400
    
    def test_download_token_path_traversal(self, admin_client):
        """下载 token 路径遍历防护"""
        # 加密一个文件
        admin_client.post('/api/encrypt',
            data={
                'file': (io.BytesIO(b'Test'), 'test.txt'),
                'mode': 'real'
            },
            content_type='multipart/form-data'
        )
        keys = admin_client.get('/api/keys').get_json()['keys']
        key_id = keys[0]['id']
        
        # 尝试路径遍历
        response = admin_client.get(f'/api/download/{key_id}?token=../../../etc/passwd')
        assert response.status_code == 400
