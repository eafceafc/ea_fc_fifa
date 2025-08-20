# app_config.py - وزارة الإعدادات والتهيئة
"""
⚙️ وزارة الإعدادات - FC 26 Profile System
==========================================
مسؤولة عن جميع الإعدادات والتهيئة
- إعدادات Flask والأمان
- متغيرات البيئة والمفاتيح السرية
- إعدادات قاعدة البيانات
- إعدادات الجلسة والأمان
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
    
    def load_environment_variables(self):
        """تحميل متغيرات البيئة"""
        self.config.update({
            # إعدادات Flask الأساسية
            'SECRET_KEY': os.environ.get('SECRET_KEY', secrets.token_urlsafe(32)),
            'DEBUG': os.environ.get('DEBUG', 'False').lower() == 'true',
            'HOST': os.environ.get('HOST', '0.0.0.0'),
            'PORT': int(os.environ.get('PORT', 5000)),
            
            # إعدادات قاعدة البيانات
            'DATABASE_URL': os.environ.get('DATABASE_URL'),
            'SQLALCHEMY_DATABASE_URI': os.environ.get('DATABASE_URL'),
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            
            # إعدادات التليجرام
            'TELEGRAM_BOT_TOKEN': os.environ.get('TELEGRAM_BOT_TOKEN'),
            'TELEGRAM_BOT_USERNAME': os.environ.get('TELEGRAM_BOT_USERNAME', 'YourBotName_bot'),
            'TELEGRAM_WEBHOOK_URL': os.environ.get('TELEGRAM_WEBHOOK_URL'),
            
            # إعدادات الأمان
            'WTF_CSRF_ENABLED': True,
            'WTF_CSRF_TIME_LIMIT': 3600,  # ساعة واحدة
            
            # إعدادات الجلسة
            'PERMANENT_SESSION_LIFETIME': 3600,  # ساعة واحدة
            'SESSION_COOKIE_SECURE': os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true',
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Lax',
            
            # إعدادات التطبيق
            'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 16MB
            'JSON_AS_ASCII': False,
            'JSONIFY_PRETTYPRINT_REGULAR': True
        })
    
    def setup_security_config(self):
        """إعداد إعدادات الأمان"""
        # إعدادات أمان إضافية
        security_config = {
            'CSRF_PROTECTION': True,
            'SECURE_HEADERS': {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            
            # إعدادات CORS
            'CORS_ORIGINS': ['https://ea-fc-fifa-5jbn.onrender.com'],
            'CORS_METHODS': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            'CORS_ALLOW_HEADERS': ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRFToken'],
            
            # إعدادات Rate Limiting
            'RATELIMIT_ENABLED': True,
            'RATELIMIT_DEFAULT': "100 per hour",
            'RATELIMIT_STORAGE_URL': 'memory://',
            
            # إعدادات التحقق
            'VALIDATION_TIMEOUT': 30,  # ثانية
            'MAX_VALIDATION_ATTEMPTS': 5,
            'VALIDATION_COOLDOWN': 300,  # 5 دقائق
            
            # إعدادات الملفات
            'UPLOAD_FOLDER': 'uploads',
            'ALLOWED_EXTENSIONS': {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'},
            'MAX_FILE_SIZE': 5 * 1024 * 1024  # 5MB
        }
        
        self.config.update(security_config)
    
    def configure_flask_app(self, app):
        """تطبيق الإعدادات على تطبيق Flask"""
        # تطبيق الإعدادات الأساسية
        for key, value in self.config.items():
            app.config[key] = value
        
        # إعداد مجلد الرفع
        upload_folder = self.config.get('UPLOAD_FOLDER', 'uploads')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
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
    
    def get_database_config(self):
        """الحصول على إعدادات قاعدة البيانات"""
        return {
            'DATABASE_URL': self.config.get('DATABASE_URL'),
            'SQLALCHEMY_DATABASE_URI': self.config.get('SQLALCHEMY_DATABASE_URI'),
            'SQLALCHEMY_TRACK_MODIFICATIONS': self.config.get('SQLALCHEMY_TRACK_MODIFICATIONS', False)
        }
    
    def get_telegram_config(self):
        """الحصول على إعدادات التليجرام"""
        return {
            'TELEGRAM_BOT_TOKEN': self.config.get('TELEGRAM_BOT_TOKEN'),
            'TELEGRAM_BOT_USERNAME': self.config.get('TELEGRAM_BOT_USERNAME'),
            'TELEGRAM_WEBHOOK_URL': self.config.get('TELEGRAM_WEBHOOK_URL')
        }
    
    def get_security_config(self):
        """الحصول على إعدادات الأمان"""
        return {
            'SECRET_KEY': self.config.get('SECRET_KEY'),
            'WTF_CSRF_ENABLED': self.config.get('WTF_CSRF_ENABLED'),
            'WTF_CSRF_TIME_LIMIT': self.config.get('WTF_CSRF_TIME_LIMIT'),
            'SESSION_COOKIE_SECURE': self.config.get('SESSION_COOKIE_SECURE'),
            'SESSION_COOKIE_HTTPONLY': self.config.get('SESSION_COOKIE_HTTPONLY'),
            'SESSION_COOKIE_SAMESITE': self.config.get('SESSION_COOKIE_SAMESITE')
        }
    
    def is_production(self):
        """التحقق من بيئة الإنتاج"""
        return not self.config.get('DEBUG', False)
    
    def is_development(self):
        """التحقق من بيئة التطوير"""
        return self.config.get('DEBUG', False)
    
    def validate_config(self):
        """التحقق من صحة الإعدادات"""
        errors = []
        warnings = []
        
        # التحقق من الإعدادات المطلوبة
        required_settings = ['SECRET_KEY']
        for setting in required_settings:
            if not self.config.get(setting):
                errors.append(f"الإعداد المطلوب مفقود: {setting}")
        
        # التحقق من إعدادات التليجرام
        if not self.config.get('TELEGRAM_BOT_TOKEN'):
            warnings.append("توكن بوت التليجرام غير محدد - لن تعمل ميزات التليجرام")
        
        # التحقق من قاعدة البيانات
        if not self.config.get('DATABASE_URL'):
            warnings.append("رابط قاعدة البيانات غير محدد - سيتم استخدام الذاكرة فقط")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def generate_new_secret_key(self):
        """توليد مفتاح سري جديد"""
        new_key = secrets.token_urlsafe(32)
        self.config['SECRET_KEY'] = new_key
        return new_key
    
    def update_config(self, updates):
        """تحديث الإعدادات"""
        self.config.update(updates)
        return True
    
    def get_config_summary(self):
        """الحصول على ملخص الإعدادات"""
        return {
            'app_name': 'FC 26 Profile System',
            'version': '1.0.0',
            'debug_mode': self.config.get('DEBUG'),
            'database_connected': bool(self.config.get('DATABASE_URL')),
            'telegram_configured': bool(self.config.get('TELEGRAM_BOT_TOKEN')),
            'security_enabled': self.config.get('WTF_CSRF_ENABLED'),
            'host': self.config.get('HOST'),
            'port': self.config.get('PORT')
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
