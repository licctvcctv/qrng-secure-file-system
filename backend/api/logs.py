from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import AuditLog, KeyRecord
from extensions import db

logs_bp = Blueprint('logs', __name__, url_prefix='/api')

@logs_bp.route('/logs', methods=['GET'])
@login_required
def get_logs():
    """
    获取审计日志（带分页和过滤）
    
    权限策略：
    - 管理员：可查看所有日志
    - 普通用户：只能查看自己的操作日志
    """
    # 分页
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 100)  # 最大 100 条/页
    
    # 过滤
    level = request.args.get('level')  # info, warning, error
    action_type = request.args.get('action_type')  # LOGIN, ENCRYPT, etc.
    user_filter = request.args.get('user')
    
    query = AuditLog.query
    
    # 权限过滤：非管理员只能看自己的日志
    if current_user.role != 'admin':
        query = query.filter(AuditLog.user == current_user.username)
        # 忽略 user 过滤参数，强制只看自己的
        user_filter = None
    elif user_filter:
        # 管理员可按用户过滤
        query = query.filter(AuditLog.user == user_filter)
    
    if level:
        query = query.filter(AuditLog.level == level)
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
    
    # 按时间倒序
    query = query.order_by(AuditLog.timestamp.desc())
    
    # 分页
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    logs = pagination.items
    
    return jsonify({
        'success': True,
        'logs': [{
            'id': l.id,
            'user': l.user,
            'action_type': l.action_type,
            'message': l.message,
            'detail': l.detail,
            'level': l.level,
            'timestamp': l.timestamp.isoformat(),
            'ip_address': l.ip_address,
            'user_agent': l.user_agent
        } for l in logs],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    })

@logs_bp.route('/logs', methods=['POST'])
@login_required
def create_log():
    """前端上报日志"""
    data = request.json or {}
    
    action_type = data.get('action_type', 'FRONTEND')
    message = data.get('message', '')[:255]
    detail = data.get('detail', '')
    level = data.get('level', 'info')
    
    if level not in ['info', 'warning', 'error']:
        level = 'info'
    
    log = AuditLog(
        user=current_user.username,
        action_type=action_type,
        message=message,
        detail=detail,
        level=level,
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'id': log.id})

@logs_bp.route('/reset', methods=['POST'])
@login_required
def reset_db():
    """
    清空数据（仅管理员）
    警告：这是破坏性操作！
    """
    if current_user.role != 'admin':
        log = AuditLog(
            user=current_user.username,
            action_type='RESET_ATTEMPT',
            message='未授权的重置尝试被阻止',
            level='warning',
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': '需要管理员权限'}), 403
    
    try:
        import os
        from flask import current_app
        
        keys = KeyRecord.query.all()
        for key in keys:
            if key.storage_path and os.path.exists(key.storage_path):
                try:
                    os.remove(key.storage_path)
                except:
                    pass
        
        KeyRecord.query.delete()
        AuditLog.query.delete()
        
        log = AuditLog(
            user=current_user.username,
            action_type='SYSTEM_RESET',
            message='管理员重置了数据库',
            level='warning',
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'success': True, 'message': '数据库已重置（用户保留）'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'code': 'RESET_FAILED', 'message': str(e)}), 500
