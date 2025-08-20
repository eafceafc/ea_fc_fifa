# app_config.py - إصلاح تحميل متغيرات البيئة
"""
⚙️ وزارة الإعدادات - FC 26 Profile System - مُصححة لـ Render
==========================================
"""

import os
import secrets
from flask import Flask


class AppConfig:
    """كلاس إدارة إعدادات التطبيق"""
    
    def __init__(self):
        self.config = {}
        self.load_environment_variables()
        self.setup_security_config()
        self.validate_render_environment()  # 🔥 جديد
    
    def load_environment_variables(self):
        """تحميل متغيرات البيئة - مُحسنة لـ Render"""
        
        # 🔥 التحقق من وجود متغيرات Render
        telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        telegram_username = os.environ.get('TELEGRAM_BOT_USERNAME') 
        secret_key = os.environ.get('SECRET_KEY')
        webhook_url = os.environ.get('TELEGRAM_WEBHOOK_URL')
        
        print(f"🔍 فحص متغيرات البيئة:")
        print(f"   TELEGRAM_BOT_TOKEN: {'✅ موجود' if telegram_token else '❌ مفقود'}")
        print(f"   TELEGRAM_BOT_USERNAME: {'✅ موجود' if telegram_username else '❌ مفقود'}")
        print(f"   SECRET_KEY: {'✅ موجود' if secret_key else '❌ مفقود'}")
        print(f"   TELEGRAM_WEBHOOK_URL: {'✅ موجود' if webhook_url else '❌ مفقود'}")
        
        self.config.update({
            # إعدادات Flask الأساسية
            'SECRET_KEY': secret_key or secrets.token_urlsafe(32),
            'DEBUG': os.environ.get('DEBUG', 'False').lower() == 'true',
            'HOST': os.environ.get('HOST', '0.0.0.0'),
            'PORT': int(os.environ.get('PORT', 10000)),  # 🔥 Render يستخدم PORT من البيئة
            
            # إعدادات قاعدة البيانات
            'DATABASE_URL': os.environ.get('DATABASE_URL'),
            'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL'),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            
            # إعدادات التليجرام - مُحسنة
            'TELEGRAM_BOT_TOKEN': telegram_token,
            'TELEGRAM_BOT_USERNAME': telegram_username or 'YourBotName_bot',
            'TELEGRAM_WEBHOOK_URL': webhook_url or 'https://ea-fc-fifa-5jbn.onrender.com/telegram-webhook',
            
            # إعدادات الأمان
            'WTF_CSRF_ENABLED': True,
            'WTF_CSRF_TIME_LIMIT': 3600,
            
            # إعدادات الجلسة - مُحسنة لـ Render
            'PERMANENT_SESSION_LIFETIME': 3600,
            'SESSION_COOKIE_SECURE': True,  # 🔥 Render يستخدم HTTPS
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Lax',
            
            # إعدادات التطبيق
            'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,
            'JSON_AS_ASCII': False,
            'JSONIFY_PRETTYPRINT_REGULAR': True
        })
    
    def validate_render_environment(self):
        """التحقق من بيئة Render - جديد"""
        is_render = os.environ.get('RENDER') or os.environ.get('RENDER_SERVICE_ID')
        
        if is_render:
            print("🌐 تم اكتشاف بيئة Render")
            
            # التحقق من المتغيرات المطلوبة
            required_vars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_BOT_USERNAME']
            missing_vars = [var for var in required_vars if not os.environ.get(var)]
            
            if missing_vars:
                print(f"⚠️ متغيرات مفقودة في Render: {missing_vars}")
                print("💡 يرجى إضافة هذه المتغيرات في Render Dashboard")
            else:
                print("✅ جميع المتغيرات المطلوبة موجودة")
        else:
            print("💻 بيئة تطوير محلية")
    
    def setup_security_config(self):
        """إعداد إعدادات الأمان"""
        security_config = {
            'CSRF_PROTECTION': True,
            'SECURE_HEADERS': {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            
            # إعدادات CORS - مُحسنة لـ Render
            'CORS_ORIGINS': [
                'https://ea-fc-fifa-5jbn.onrender.com',
                'https://*.onrender.com'  # 🔥 دعم كل نطاقات Render
            ],
            'CORS_METHODS': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'CORS_ALLOW_HEADERS': ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRFToken'],
        }
        
        self.config.update(security_config)
    
    def configure_flask_app(self, app):
        """تطبيق الإعدادات على تطبيق Flask"""
        # تطبيق الإعدادات الأساسية
        for key, value in self.config.items():
            app.config[key] = value
        
        # إعداد الأمان المتقدم
        self.setup_security_headers(app)
        
        print("⚙️ تم تطبيق إعدادات التطبيق بنجاح")
        return app
    
    def setup_security_headers(self, app):
        """إعداد رؤوس الأمان"""
        @app.after_request
        def add_security_headers(response):
            headers = self.config.get('SECURE_HEADERS', {})
            for header, value in headers.items():
                response.headers[header] = value
            return response
        
        return app
    
    def get_telegram_config(self):
        """الحصول على إعدادات التليجرام"""
        return {
            'TELEGRAM_BOT_TOKEN': self.config.get('TELEGRAM_BOT_TOKEN'),
            'TELEGRAM_BOT_USERNAME': self.config.get('TELEGRAM_BOT_USERNAME'),
            'TELEGRAM_WEBHOOK_URL': self.config.get('TELEGRAM_WEBHOOK_URL')
        }
    
    def get_config_summary(self):
        """الحصول على ملخص الإعدادات"""
        telegram_config = self.get_telegram_config()
        
        return {
            'app_name': 'FC 26 Profile System',
            'version': '2.0.0 - Render Ready',
            'debug_mode': self.config.get('DEBUG'),
            'database_connected': bool(self.config.get('DATABASE_URL')),
            'telegram_configured': bool(telegram_config['TELEGRAM_BOT_TOKEN']),
            'telegram_username': telegram_config['TELEGRAM_BOT_USERNAME'],
            'webhook_url': telegram_config['TELEGRAM_WEBHOOK_URL'],
            'security_enabled': self.config.get('WTF_CSRF_ENABLED'),
            'host': self.config.get('HOST'),
            'port': self.config.get('PORT'),
            'environment': 'Render' if os.environ.get('RENDER') else 'Local'
        }


# إنشاء instance عام للإعدادات
app_config = AppConfig()

# دوال مساعدة للتوافق
def create_flask_app():
    """إنشاء تطبيق Flask مع الإعدادات"""
    app = Flask(__name__)
    app = app_config.configure_flask_app(app)
    return app

def get_config(key, default=None):
    """الحصول على إعداد محدد"""
    return app_config.config.get(key, default)

def generate_csrf_token():
    """توليد رمز CSRF آمن"""
    return secrets.token_urlsafe(32)
