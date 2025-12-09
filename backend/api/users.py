from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import User, AuditLog
from extensions import db

users_bp = Blueprint('users', __name__, url_prefix='/api')

@users_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin only)."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
        
    users = User.query.all()
    return jsonify({
        'success': True,
        'users': [{
            'id': u.id,
            'username': u.username,
            'name': u.name,
            'role': u.role,
            'department': u.department,
            'status': u.status,
            'created_at': u.created_at.isoformat()
        } for u in users]
    })

@users_bp.route('/users', methods=['POST'])
@login_required
def create_user():
    """Create a new user (admin only)."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
    
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    role = data.get('role', 'user')
    department = data.get('department', '').strip()
    
    # Validate
    if not username or len(username) < 3:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Username must be at least 3 characters'}), 400
    if len(username) > 80:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Username too long'}), 400
    if not password or len(password) < 6:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Password must be at least 6 characters'}), 400
    if role not in ['admin', 'user']:
        role = 'user'
    
    # Check if username exists
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'code': 'DUPLICATE', 'message': 'Username already exists'}), 409
    
    user = User(
        username=username,
        name=name or username,
        role=role,
        department=department,
        status='active'
    )
    user.set_password(password)
    
    db.session.add(user)
    
    log = AuditLog(
        user=current_user.username,
        action_type='USER_CREATE',
        message=f'Created user {username} with role {role}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username}}), 201

@users_bp.route('/users/<int:user_id>', methods=['PUT', 'PATCH'])
@login_required
def update_user(user_id):
    """Update a user (admin or self)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'code': 'NOT_FOUND', 'message': 'User not found'}), 404
    
    # Only admin can update others
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Access denied'}), 403
    
    data = request.json or {}
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name'][:80]
    if 'department' in data:
        user.department = data['department'][:80]
    
    # Admin-only fields
    if current_user.role == 'admin':
        if 'status' in data and data['status'] in ['active', 'locked']:
            user.status = data['status']
        if 'role' in data and data['role'] in ['admin', 'user']:
            user.role = data['role']
    
    # Password change
    if 'password' in data and len(data['password']) >= 6:
        user.set_password(data['password'])
    
    log = AuditLog(
        user=current_user.username,
        action_type='USER_UPDATE',
        message=f'Updated user {user.username}',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User updated'})

@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Delete a user (admin only)."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
    
    # Prevent self-deletion
    if current_user.id == user_id:
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Cannot delete yourself'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'code': 'NOT_FOUND', 'message': 'User not found'}), 404
    
    username = user.username
    db.session.delete(user)
    
    log = AuditLog(
        user=current_user.username,
        action_type='USER_DELETE',
        message=f'Deleted user {username}',
        level='warning',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'User deleted'})
