from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import User, AuditLog
from extensions import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

def validate_credentials(username, password):
    """Validate login credentials format."""
    errors = []
    if not username or len(username) < 1:
        errors.append("Username is required")
    elif len(username) > 80:
        errors.append("Username too long")
    if not password or len(password) < 1:
        errors.append("Password is required")
    return errors

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    # Validate input
    errors = validate_credentials(username, password)
    if errors:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': ', '.join(errors)}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        if user.status != 'active':
            log = AuditLog(
                user=username,
                action_type='LOGIN_BLOCKED',
                message='Login blocked - account locked',
                level='warning',
                ip_address=request.remote_addr,
                user_agent=str(request.user_agent)
            )
            db.session.add(log)
            db.session.commit()
            return jsonify({'success': False, 'code': 'ACCOUNT_LOCKED', 'message': 'Account is locked.'}), 403
            
        login_user(user)
        
        # Log login
        log = AuditLog(
            user=user.username,
            action_type='LOGIN',
            message='User logged in successfully',
            level='info',
            ip_address=request.remote_addr,
            user_agent=str(request.user_agent)
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'name': user.name,
                'department': user.department
            }
        })
    
    # Log failure
    log = AuditLog(
        user=username,
        action_type='LOGIN_FAIL',
        message='Invalid credentials',
        level='warning',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': False, 'code': 'AUTH_FAIL', 'message': 'Invalid username or password'}), 401

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    log = AuditLog(
        user=current_user.username,
        action_type='LOGOUT',
        message='User logged out',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    logout_user()
    return jsonify({'success': True})

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Returns current authenticated user info."""
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'role': current_user.role,
            'name': current_user.name,
            'department': current_user.department
        }
    })
