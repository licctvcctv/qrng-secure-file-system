from flask import Blueprint, request, jsonify, send_file, current_app, after_this_request
from flask_login import login_required, current_user
from models import KeyRecord, AuditLog
from extensions import db
from datetime import datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import uuid
import os
import hashlib
import tempfile

# 尝试导入加密工具（允许失败以保持向后兼容）
try:
    from utils.crypto import encrypt_key_hex, decrypt_key_hex
except ImportError:
    encrypt_key_hex = lambda x: x
    decrypt_key_hex = lambda x: x

keys_bp = Blueprint('keys', __name__, url_prefix='/api')

def validate_filename(filename):
    """验证文件名是否有效且长度合理"""
    if not filename or len(filename.strip()) < 1:
        return False, "文件名不能为空"
    if len(filename) > 255:
        return False, "文件名过长（最大 255 字符）"
    # 防止路径遍历攻击
    if '..' in filename or filename.startswith('/'):
        return False, "文件名包含非法字符"
    return True, None

def allowed_file(filename):
    """检查文件扩展名是否在白名单中"""
    allowed = current_app.config.get('ALLOWED_EXTENSIONS', set())
    if not allowed:
        return True  # 如果未配置白名单，允许所有
    if '.' not in filename:
        return False  # 无扩展名不允许
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in allowed

def check_file_size(file):
    """检查文件大小是否超过限制"""
    max_size = current_app.config.get('MAX_CONTENT_LENGTH', 20 * 1024 * 1024)
    file.seek(0, 2)  # 移到文件末尾
    size = file.tell()
    file.seek(0)  # 重置到开头
    if size > max_size:
        return False, f"文件过大（最大 {max_size // (1024*1024)} MB）"
    return True, size

def generate_temp_filename(key_id, original_name):
    """生成唯一的临时文件名"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = uuid.uuid4().hex[:6]
    ext = os.path.splitext(original_name)[1] if '.' in original_name else ''
    return f"decrypt_{key_id}_{timestamp}_{random_suffix}{ext}"

@keys_bp.route('/keys', methods=['GET'])
@login_required
def get_keys():
    """获取密钥列表（管理员看全部，用户看自己的）"""
    if current_user.role == 'admin':
        keys = KeyRecord.query.order_by(KeyRecord.created_at.desc()).all()
    else:
        keys = KeyRecord.query.filter_by(owner=current_user.username).order_by(KeyRecord.created_at.desc()).all()
        
    return jsonify({
        'success': True,
        'keys': [{
            'id': k.id,
            'owner': k.owner,
            'file_name': k.file_name,
            'file_size': k.file_size,
            'algorithm': k.algorithm,
            'key_type': k.key_type,
            'created_at': k.created_at.isoformat(),
            'key_fingerprint': k.key_fingerprint,
            'decrypt_count': k.decrypt_count
        } for k in keys]
    })

@keys_bp.route('/encrypt/simulate', methods=['POST'])
@login_required
def simulate_encryption():
    """模拟加密 - 只存储元数据，不进行真实加密"""
    data = request.json or {}
    filename = data.get('filename', '').strip()
    filesize = data.get('filesize', 'Unknown')
    algorithm = data.get('algorithm', 'AES-256-GCM')
    key_mode = data.get('keyMode', 'QRNG-Auto')
    
    # 验证输入
    valid, error = validate_filename(filename)
    if not valid:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': error}), 400
    
    # 验证扩展名
    if not allowed_file(filename):
        return jsonify({'success': False, 'code': 'INVALID_TYPE', 'message': '不支持的文件类型'}), 400
    
    key_id = f"KEY-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    fingerprint = hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:16]
    
    new_key = KeyRecord(
        id=key_id,
        owner=current_user.username,
        file_name=filename,
        file_size=filesize,
        algorithm=algorithm,
        key_type=key_mode,
        created_at=datetime.utcnow(),
        key_fingerprint=fingerprint,
        decrypt_count=0
    )
    
    db.session.add(new_key)
    
    log = AuditLog(
        user=current_user.username,
        action_type='ENCRYPT_SIMULATE',
        message=f'文件 {filename} 模拟加密，算法 {algorithm}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'key_id': key_id,
        'fingerprint': fingerprint,
        'steps': ['hashing', 'qrng', 'encrypting', 'finalizing']
    })

@keys_bp.route('/encrypt', methods=['POST'])
@login_required
def real_encryption():
    """真实 AES-256-GCM 加密端点"""
    # 检查文件是否存在
    if 'file' not in request.files:
        return jsonify({'success': False, 'code': 'NO_FILE', 'message': '未提供文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'code': 'NO_FILE', 'message': '未选择文件'}), 400
    
    # 验证文件名
    valid, error = validate_filename(file.filename)
    if not valid:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': error}), 400
    
    # 验证扩展名
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'code': 'INVALID_TYPE', 'message': '不支持的文件类型'}), 400
    
    # 验证文件大小
    size_ok, result = check_file_size(file)
    if not size_ok:
        return jsonify({'success': False, 'code': 'FILE_TOO_LARGE', 'message': result}), 413
    file_size = result
    
    # 获取参数
    algorithm = request.form.get('algorithm', 'AES-256-GCM')
    key_mode = request.form.get('keyMode', 'QRNG-Auto')
    mode = request.form.get('mode', 'real')  # 'real' 或 'simulate'
    
    if mode == 'simulate':
        # 使用模拟模式（复用验证逻辑）
        data = {
            'filename': file.filename,
            'filesize': f"{file_size / 1024:.2f} KB" if file_size < 1024*1024 else f"{file_size / (1024*1024):.2f} MB",
            'algorithm': algorithm,
            'keyMode': key_mode
        }
        return simulate_encryption_internal(data)
    
    # 读取文件内容
    file_bytes = file.read()
    
    # 生成 AES-256-GCM 密钥和 IV
    key = AESGCM.generate_key(bit_length=256)
    iv = os.urandom(12)  # 96 bits for GCM
    
    # 加密
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, file_bytes, None)
    
    # 生成密钥 ID 和指纹
    key_id = f"KEY-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    fingerprint = hashlib.sha256(key).hexdigest()[:16]
    
    # 保存加密文件
    storage_filename = f"{key_id}.enc"
    storage_path = os.path.join(current_app.config['UPLOAD_FOLDER'], storage_filename)
    
    with open(storage_path, 'wb') as f:
        f.write(ciphertext)
    
    # 存储记录
    new_key = KeyRecord(
        id=key_id,
        owner=current_user.username,
        file_name=file.filename,
        file_size=f"{file_size / 1024:.2f} KB" if file_size < 1024*1024 else f"{file_size / (1024*1024):.2f} MB",
        algorithm=algorithm,
        key_type=key_mode,
        created_at=datetime.utcnow(),
        key_fingerprint=fingerprint,
        decrypt_count=0,
        storage_path=storage_path,
        iv=iv.hex(),
        key_hex=encrypt_key_hex(key.hex())  # 使用 MASTER_KEY 加密存储
    )
    
    db.session.add(new_key)
    
    log = AuditLog(
        user=current_user.username,
        action_type='ENCRYPT',
        message=f'文件 {file.filename} 已加密，算法 {algorithm}',
        detail=f'大小: {new_key.file_size}, 密钥ID: {key_id}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'key_id': key_id,
        'fingerprint': fingerprint,
        'file_size': new_key.file_size,
        'steps': ['hashing', 'qrng', 'encrypting', 'finalizing']
    })

def simulate_encryption_internal(data):
    """模拟加密的内部处理函数"""
    filename = data.get('filename', '').strip()
    filesize = data.get('filesize', 'Unknown')
    algorithm = data.get('algorithm', 'AES-256-GCM')
    key_mode = data.get('keyMode', 'QRNG-Auto')
    
    key_id = f"KEY-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    fingerprint = hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:16]
    
    new_key = KeyRecord(
        id=key_id,
        owner=current_user.username,
        file_name=filename,
        file_size=filesize,
        algorithm=algorithm,
        key_type=key_mode,
        created_at=datetime.utcnow(),
        key_fingerprint=fingerprint,
        decrypt_count=0
    )
    
    db.session.add(new_key)
    
    log = AuditLog(
        user=current_user.username,
        action_type='ENCRYPT_SIMULATE',
        message=f'文件 {filename} 模拟加密，算法 {algorithm}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'key_id': key_id,
        'fingerprint': fingerprint,
        'steps': ['hashing', 'qrng', 'encrypting', 'finalizing']
    })

@keys_bp.route('/decrypt', methods=['POST'])
@login_required
def decrypt_file():
    """解密文件并返回下载链接"""
    data = request.json or {}
    key_id = data.get('key_id', '').strip()
    
    if not key_id:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': '密钥ID不能为空'}), 400
    
    # 查找密钥记录
    key_record = KeyRecord.query.get(key_id)
    
    if not key_record:
        return jsonify({'success': False, 'code': 'NOT_FOUND', 'message': '密钥不存在'}), 404
    
    # 检查权限（管理员可解密所有，用户只能解密自己的）
    if current_user.role != 'admin' and key_record.owner != current_user.username:
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': '无权访问'}), 403
    
    # 检查是否为模拟加密（无实际文件）
    if not key_record.storage_path or not key_record.key_hex:
        log = AuditLog(
            user=current_user.username,
            action_type='DECRYPT_SIMULATE',
            message=f'模拟解密 {key_record.file_name}',
            level='info',
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )
        db.session.add(log)
        key_record.decrypt_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '模拟解密成功（无实际文件存储）',
            'file_name': key_record.file_name,
            'decrypt_count': key_record.decrypt_count,
            'simulated': True
        })
    
    # 检查加密文件是否存在
    if not os.path.exists(key_record.storage_path):
        return jsonify({'success': False, 'code': 'FILE_MISSING', 'message': '加密文件不存在'}), 404
    
    # 读取加密内容
    with open(key_record.storage_path, 'rb') as f:
        ciphertext = f.read()
    
    # 解密
    try:
        key = bytes.fromhex(decrypt_key_hex(key_record.key_hex))
        iv = bytes.fromhex(key_record.iv)
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
    except Exception as e:
        log = AuditLog(
            user=current_user.username,
            action_type='DECRYPT_FAIL',
            message=f'解密失败 {key_record.file_name}: {str(e)}',
            level='error',
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': False, 'code': 'DECRYPT_ERROR', 'message': '解密失败'}), 500
    
    # 生成唯一临时文件名，避免覆盖和命名冲突
    temp_filename = generate_temp_filename(key_id, key_record.file_name)
    decrypted_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
    
    with open(decrypted_path, 'wb') as f:
        f.write(plaintext)
    
    # 记录解密成功，并存储临时文件路径
    log = AuditLog(
        user=current_user.username,
        action_type='DECRYPT',
        message=f'文件 {key_record.file_name} 解密成功',
        detail=f'临时文件: {temp_filename}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    key_record.decrypt_count += 1
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '解密成功',
        'file_name': key_record.file_name,
        'decrypt_count': key_record.decrypt_count,
        'download_url': f'/api/download/{key_id}?token={temp_filename}',
        'simulated': False
    })

@keys_bp.route('/download/<key_id>', methods=['GET'])
@login_required
def download_decrypted(key_id):
    """下载解密后的文件，下载后自动删除"""
    key_record = KeyRecord.query.get(key_id)
    
    if not key_record:
        return jsonify({'success': False, 'message': '密钥不存在'}), 404
    
    if current_user.role != 'admin' and key_record.owner != current_user.username:
        return jsonify({'success': False, 'message': '无权访问'}), 403
    
    # 获取临时文件名 token（防止下载旧文件）
    temp_filename = request.args.get('token', '')
    if not temp_filename:
        return jsonify({'success': False, 'message': '缺少下载令牌，请先调用 /api/decrypt'}), 400
    
    # 验证 token 格式，防止路径遍历
    if '..' in temp_filename or '/' in temp_filename:
        return jsonify({'success': False, 'message': '无效的下载令牌'}), 400
    
    decrypted_path = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
    
    if not os.path.exists(decrypted_path):
        return jsonify({'success': False, 'message': '解密文件已过期或不存在，请重新解密'}), 404
    
    # 下载后删除临时文件
    @after_this_request
    def cleanup(response):
        try:
            if os.path.exists(decrypted_path):
                os.remove(decrypted_path)
        except Exception as e:
            current_app.logger.error(f'清理临时文件失败: {e}')
        return response
    
    return send_file(decrypted_path, as_attachment=True, download_name=key_record.file_name)
