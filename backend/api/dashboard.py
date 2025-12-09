from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from models import KeyRecord, AuditLog, Device, User
from extensions import db
from datetime import datetime, timedelta
import os

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    """获取仪表盘统计数据"""
    
    # 根据用户角色过滤
    if current_user.role == 'admin':
        keys = KeyRecord.query.all()
        total_keys = len(keys)
    else:
        keys = KeyRecord.query.filter_by(owner=current_user.username).all()
        total_keys = len(keys)
    
    # 计算存储大小（从文件系统）
    total_storage = 0
    for key in keys:
        if key.storage_path and os.path.exists(key.storage_path):
            total_storage += os.path.getsize(key.storage_path)
    
    # 格式化存储大小
    if total_storage < 1024:
        storage_str = f"{total_storage} B"
    elif total_storage < 1024 * 1024:
        storage_str = f"{total_storage / 1024:.1f} KB"
    elif total_storage < 1024 * 1024 * 1024:
        storage_str = f"{total_storage / (1024 * 1024):.1f} MB"
    else:
        storage_str = f"{total_storage / (1024 * 1024 * 1024):.1f} GB"
    
    # 本周新增文件数
    week_ago = datetime.utcnow() - timedelta(days=7)
    if current_user.role == 'admin':
        keys_this_week = KeyRecord.query.filter(KeyRecord.created_at >= week_ago).count()
        keys_last_week = KeyRecord.query.filter(
            KeyRecord.created_at >= week_ago - timedelta(days=7),
            KeyRecord.created_at < week_ago
        ).count()
    else:
        keys_this_week = KeyRecord.query.filter(
            KeyRecord.owner == current_user.username,
            KeyRecord.created_at >= week_ago
        ).count()
        keys_last_week = KeyRecord.query.filter(
            KeyRecord.owner == current_user.username,
            KeyRecord.created_at >= week_ago - timedelta(days=7),
            KeyRecord.created_at < week_ago
        ).count()
    
    # 计算变化百分比
    if keys_last_week > 0:
        change_percent = int(((keys_this_week - keys_last_week) / keys_last_week) * 100)
    else:
        change_percent = 100 if keys_this_week > 0 else 0
    
    # 待处理告警（错误日志数）
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    if current_user.role == 'admin':
        alerts = AuditLog.query.filter(
            AuditLog.level == 'error',
            AuditLog.timestamp >= today
        ).count()
    else:
        alerts = AuditLog.query.filter(
            AuditLog.user == current_user.username,
            AuditLog.level == 'error',
            AuditLog.timestamp >= today
        ).count()
    
    # 安全评分（基于配置完整性）
    score_points = 0
    score_max = 5
    
    # 有加密文件 +1
    if total_keys > 0:
        score_points += 1
    # 无今日错误 +1
    if alerts == 0:
        score_points += 1
    # 有受信任设备 +1
    trusted_devices = Device.query.filter_by(status='trusted').count()
    if trusted_devices > 0:
        score_points += 1
    # 用户密码强度（简化：假设都通过）+1
    score_points += 1
    # 启用 QRNG +1
    score_points += 1
    
    score_map = {5: 'A+', 4: 'A', 3: 'B+', 2: 'B', 1: 'C', 0: 'D'}
    security_score = score_map.get(score_points, 'C')
    
    # 设备状态
    devices = Device.query.all()
    device_stats = {
        'total': len(devices),
        'trusted': sum(1 for d in devices if d.status == 'trusted'),
        'pending': sum(1 for d in devices if d.status == 'pending'),
        'revoked': sum(1 for d in devices if d.status == 'revoked')
    }
    
    # QRNG 状态（模拟）
    qrng_status = {
        'online': True,
        'entropy_quality': 'excellent',  # excellent, good, fair, poor
        'last_sync': datetime.utcnow().isoformat()
    }
    
    # 安全状态
    security_status = [
        {'label': '加密通道', 'value': 'TLS 1.3', 'status': 'online'},
        {'label': '会话状态', 'value': '已认证', 'status': 'online'},
        {'label': '密钥轮换', 'value': '正常', 'status': 'online'},
        {'label': '威胁检测', 'value': '无异常' if alerts == 0 else f'{alerts} 条告警', 'status': 'online' if alerts == 0 else 'warning'}
    ]
    
    return jsonify({
        'success': True,
        'stats': {
            'encrypted_files': total_keys,
            'encrypted_files_change': change_percent,
            'storage_used': storage_str,
            'storage_bytes': total_storage,
            'security_score': security_score,
            'alerts': alerts
        },
        'devices': device_stats,
        'qrng': qrng_status,
        'security_status': security_status
    })
