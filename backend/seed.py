#!/usr/bin/env python3
"""
Seed script for QRNG Secure Vault database.

WARNING: This script will DROP ALL TABLES and recreate them.
         All existing data will be PERMANENTLY DELETED.
         
Usage:
    python seed.py              # With confirmation prompt
    python seed.py --force      # Skip confirmation (use with caution!)
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models import User, AuditLog, KeyRecord, Device
from datetime import datetime

def confirm_reset():
    """Prompt user for confirmation before destructive operation."""
    print("\n" + "="*60)
    print("⚠️  WARNING: DESTRUCTIVE OPERATION")
    print("="*60)
    print("This will DELETE ALL DATA in the database and recreate tables.")
    print("This action CANNOT be undone.\n")
    
    response = input("Type 'yes' to confirm: ").strip().lower()
    return response == 'yes'

def seed_data(force=False):
    """Seed the database with initial data."""
    
    if not force and not confirm_reset():
        print("\n❌ Operation cancelled.")
        return False
    
    app = create_app()
    
    with app.app_context():
        print("\n🔄 Dropping all tables...")
        db.drop_all()
        
        print("📋 Creating tables...")
        db.create_all()
        
        # Create Admin User
        print("👤 Creating admin user...")
        admin = User(
            username='admin',
            name='System Administrator',
            role='admin',
            department='IT Security',
            status='active'
        )
        admin.set_password('admin123')  # Using PBKDF2-SHA256 hash
        db.session.add(admin)

        # Create Normal User
        print("👤 Creating demo user...")
        user = User(
            username='user',
            name='Alice Researcher',
            role='user',
            department='Quantum Lab',
            status='active'
        )
        user.set_password('user123')
        db.session.add(user)

        # Create Initial System Log
        print("📝 Creating initial logs...")
        log1 = AuditLog(
            user='system',
            action_type='SYSTEM_INIT',
            message='System initialized successfully.',
            detail='Database seeded with initial data.',
            level='info',
            ip_address='127.0.0.1',
            user_agent='Seed Script/1.0'
        )
        db.session.add(log1)

        # Create Sample Key Record (simulated, not real encryption)
        print("🔑 Creating sample key record...")
        key1 = KeyRecord(
            id='KEY-SAMPLE-001',
            owner='admin',
            file_name='demo_report.pdf',
            file_size='1.2 MB',
            algorithm='AES-256-GCM',
            key_type='QRNG-Auto',
            created_at=datetime.utcnow(),
            key_fingerprint='a1b2c3d4e5f6...',
            decrypt_count=0
            # storage_path, iv, key_hex left NULL (simulated mode)
        )
        db.session.add(key1)

        # Create Sample Device
        print("📱 Creating sample device...")
        device1 = Device(
            id='DEV-SAMPLE-001',
            name='Admin Workstation',
            ip='192.168.1.100',
            status='trusted',
            last_active=datetime.utcnow()
        )
        db.session.add(device1)

        db.session.commit()
        
        print("\n" + "="*60)
        print("✅ Database seeded successfully!")
        print("="*60)
        print("\n📋 Created accounts:")
        print("   • admin / admin123 (Administrator)")
        print("   • user / user123 (Regular User)")
        print("\n🔐 Password hashing: PBKDF2-SHA256 (werkzeug.security)")
        print("\n⚠️  Remember to change default passwords in production!")
        print("="*60 + "\n")
        
        return True

if __name__ == '__main__':
    force = '--force' in sys.argv or '-f' in sys.argv
    seed_data(force=force)
