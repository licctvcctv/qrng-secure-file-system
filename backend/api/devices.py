from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import Device, AuditLog
from extensions import db
from datetime import datetime
import uuid

devices_bp = Blueprint('devices', __name__, url_prefix='/api')

@devices_bp.route('/devices', methods=['GET'])
@login_required
def get_devices():
    """Get all devices."""
    devices = Device.query.order_by(Device.last_active.desc()).all()
    return jsonify({
        'success': True,
        'devices': [{
            'id': d.id,
            'name': d.name,
            'ip': d.ip,
            'status': d.status,
            'last_active': d.last_active.isoformat()
        } for d in devices]
    })

@devices_bp.route('/devices', methods=['POST'])
@login_required
def add_device():
    """Add a new device (admin only)."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
    
    data = request.json or {}
    name = data.get('name', '').strip()
    ip = data.get('ip', '').strip()
    status = data.get('status', 'pending')
    
    # Validate
    if not name or len(name) < 1:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Device name is required'}), 400
    if len(name) > 80:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Device name too long'}), 400
    if status not in ['trusted', 'pending', 'revoked']:
        status = 'pending'
    
    device_id = f"DEV-{uuid.uuid4().hex[:8].upper()}"
    
    device = Device(
        id=device_id,
        name=name,
        ip=ip or 'Unknown',
        status=status,
        last_active=datetime.utcnow()
    )
    
    db.session.add(device)
    
    log = AuditLog(
        user=current_user.username,
        action_type='DEVICE_ADD',
        message=f'Added device {name} ({device_id})',
        level='info',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'device': {'id': device_id, 'name': name}}), 201

@devices_bp.route('/devices/<device_id>/status', methods=['PATCH'])
@login_required
def update_device_status(device_id):
    """Update device status (trust/revoke) - admin only."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
    
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'success': False, 'code': 'NOT_FOUND', 'message': 'Device not found'}), 404
    
    data = request.json or {}
    new_status = data.get('status', '').strip()
    
    if new_status not in ['trusted', 'pending', 'revoked']:
        return jsonify({'success': False, 'code': 'VALIDATION_ERROR', 'message': 'Status must be trusted, pending, or revoked'}), 400
    
    old_status = device.status
    device.status = new_status
    device.last_active = datetime.utcnow()
    
    log = AuditLog(
        user=current_user.username,
        action_type='DEVICE_STATUS',
        message=f'Device {device.name} status changed: {old_status} -> {new_status}',
        level='info' if new_status == 'trusted' else 'warning',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'Device status updated to {new_status}'})

@devices_bp.route('/devices/<device_id>', methods=['DELETE'])
@login_required
def delete_device(device_id):
    """Delete a device (admin only)."""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'code': 'FORBIDDEN', 'message': 'Admin access required'}), 403
    
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'success': False, 'code': 'NOT_FOUND', 'message': 'Device not found'}), 404
    
    device_name = device.name
    db.session.delete(device)
    
    log = AuditLog(
        user=current_user.username,
        action_type='DEVICE_DELETE',
        message=f'Deleted device {device_name} ({device_id})',
        level='warning',
        ip_address=request.remote_addr,
        user_agent=str(request.user_agent)
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Device deleted'})
