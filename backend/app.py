from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from config import Config
from extensions import db, cors, login_manager, migrate, sess
from models import User, AuditLog

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Extensions
    db.init_app(app)
    
    # CORS - 使用 app.config 支持运行时动态配置
    cors.init_app(app, 
                  origins=app.config.get('CORS_ORIGINS', ['http://localhost:5173']),
                  supports_credentials=True)
    
    login_manager.init_app(app)
    migrate.init_app(app, db)
    sess.init_app(app)
    
    # Initialize config (create upload folder etc.)
    config_class.init_app(app)

    # User Loader
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Unauthorized handler
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'success': False, 'code': 'AUTH_REQUIRED', 'message': '需要登录认证'}), 401

    # HTTP 错误处理 - 保留原始状态码
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """处理 HTTP 异常，保留正确的状态码"""
        response = {
            'success': False,
            'code': e.name.upper().replace(' ', '_'),
            'message': e.description
        }
        return jsonify(response), e.code
    
    # 非 HTTP 异常的全局错误处理
    @app.errorhandler(Exception)
    def handle_exception(e):
        """处理非 HTTP 异常，记录审计日志"""
        # 跳过 HTTP 异常（已由上面的处理器处理）
        if isinstance(e, HTTPException):
            return handle_http_exception(e)
        
        # 记录错误日志
        from flask import request
        try:
            log = AuditLog(
                user='system',
                action_type='ERROR',
                message=str(e)[:200],
                detail=str(e),
                level='error',
                ip_address=request.remote_addr if request else None,
                user_agent=str(request.user_agent) if request else None
            )
            db.session.add(log)
            db.session.commit()
        except:
            db.session.rollback()
        
        # 返回 500 错误
        return jsonify({
            'success': False, 
            'code': 'SERVER_ERROR', 
            'message': '服务器内部错误'
        }), 500

    # Register Blueprints
    from api.auth import auth_bp
    from api.keys import keys_bp
    from api.users import users_bp
    from api.devices import devices_bp
    from api.logs import logs_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(keys_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(logs_bp)
    
    # Create tables on first request (dev convenience)
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
