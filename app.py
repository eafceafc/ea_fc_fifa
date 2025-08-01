from flask import Flask, render_template, request, jsonify, session
import os
import re
import hashlib
import secrets
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# إعدادات الأمان
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# قائمة سوداء للكلمات المحظورة (حماية XSS)
BLOCKED_PATTERNS = [
    r'<script.*?>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',
    r'<iframe.*?>.*?</iframe>',
    r'eval\s*\(',
    r'document\.',
    r'window\.',
]

def sanitize_input(text):
    """تنظيف المدخلات من الأكواد الضارة"""
    if not text:
        return ""
    
    # إزالة الأكواد الضارة
    for pattern in BLOCKED_PATTERNS:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # إزالة HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # تنظيف إضافي
    text = text.replace('<', '&lt;').replace('>', '&gt;')
    text = text.replace('"', '&quot;').replace("'", '&#x27;')
    
    return text.strip()

def validate_whatsapp(number):
    """التحقق من صحة رقم الواتساب"""
    if not number:
        return False
    
    # إزالة المسافات والرموز
    clean_number = re.sub(r'[^\d+]', '', number)
    
    # التحقق من التنسيق المصري
    egyptian_pattern = r'^(\+2|2)?01[0125][0-9]{8}$'
    return bool(re.match(egyptian_pattern, clean_number))

def validate_mobile_payment(number):
    """التحقق من أرقام الدفع الإلكتروني"""
    if not number:
        return False
    
    # يجب أن يكون 11 رقم بدون مسافات
    clean_number = re.sub(r'\D', '', number)
    
    if len(clean_number) != 11:
        return False
    
    # يجب أن يبدأ بـ 010, 011, 012, 015
    return clean_number.startswith(('010', '011', '012', '015'))

def validate_card_number(card_number):
    """التحقق من رقم البطاقة (تيلدا)"""
    if not card_number:
        return False
    
    # استخلاص الأرقام فقط
    numbers_only = re.sub(r'\D', '', card_number)
    
    # يجب أن يكون 16 رقم
    return len(numbers_only) == 16

def validate_instapay_link(text):
    """التحقق من واستخلاص رابط إنستا باي"""
    if not text:
        return False, ""
    
    # البحث عن رابط https
    url_pattern = r'https://[^\s]+'
    match = re.search(url_pattern, text, re.IGNORECASE)
    
    if match:
        return True, match.group()
    
    return False, ""

def generate_csrf_token():
    """توليد CSRF token"""
    return secrets.token_urlsafe(32)

def rate_limit_check(ip):
    """فحص Rate Limiting (مبسط)"""
    # في التطبيق الحقيقي، استخدم Redis أو قاعدة بيانات
    return True

@app.before_request
def before_request():
    """إجراءات ما قبل كل طلب"""
    # إنشاء CSRF token للجلسة
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return render_template('index.html', csrf_token=session['csrf_token'])

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي"""
    try:
        # فحص Rate Limiting
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        if not rate_limit_check(client_ip):
            return jsonify({
                'success': False,
                'message': 'Too many requests. Please try again later.'
            }), 429
        
        # التحقق من CSRF token
        token = request.form.get('csrf_token')
        if not token or token != session.get('csrf_token'):
            return jsonify({
                'success': False,
                'message': 'Invalid security token'
            }), 403
        
        # استلام وتنظيف البيانات
        platform = sanitize_input(request.form.get('platform'))
        whatsapp_number = sanitize_input(request.form.get('whatsapp_number'))
        payment_method = sanitize_input(request.form.get('payment_method'))
        payment_details = sanitize_input(request.form.get('payment_details'))
        telegram_username = sanitize_input(request.form.get('telegram_username'))
        
        # التحقق من البيانات المطلوبة
        if not all([platform, whatsapp_number, payment_method]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # التحقق من صحة رقم الواتساب
        if not validate_whatsapp(whatsapp_number):
            return jsonify({
                'success': False,
                'message': 'Invalid WhatsApp number format'
            }), 400
        
        # التحقق من تفاصيل الدفع حسب النوع
        processed_payment_details = ""
        
        if payment_method in ['vodafone_cash', 'etisalat_cash', 'orange_cash', 'we_cash', 'bank_wallet']:
            if not validate_mobile_payment(payment_details):
                return jsonify({
                    'success': False,
                    'message': 'Invalid mobile payment number. Must be 11 digits starting with 010/011/012/015'
                }), 400
            processed_payment_details = re.sub(r'\D', '', payment_details)
            
        elif payment_method == 'tilda':
            if not validate_card_number(payment_details):
                return jsonify({
                    'success': False,
                    'message': 'Invalid card number. Must be 16 digits'
                }), 400
            # حفظ الأرقام فقط للأدمن
            processed_payment_details = re.sub(r'\D', '', payment_details)
            
        elif payment_method == 'instapay':
            is_valid, extracted_link = validate_instapay_link(payment_details)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'message': 'Invalid InstaPay link. Must contain a valid https:// URL'
                }), 400
            processed_payment_details = extracted_link
        
        # تنظيف معرف التيليجرام
        if telegram_username:
            if not telegram_username.startswith('@'):
                telegram_username = '@' + telegram_username
            # التحقق من صحة المعرف
            if not re.match(r'^@[a-zA-Z0-9_]{5,32}$', telegram_username):
                return jsonify({
                    'success': False,
                    'message': 'Invalid Telegram username'
                }), 400
        
        # تنظيف رقم الواتساب للحفظ
        clean_whatsapp = re.sub(r'[^\d+]', '', whatsapp_number)
        if clean_whatsapp.startswith('01'):
            clean_whatsapp = '+2' + clean_whatsapp
        
        # إعداد البيانات للحفظ
        user_data = {
            'platform': platform,
            'whatsapp_number': clean_whatsapp,
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]  # hash للخصوصية
        }
        
        # هنا يتم حفظ البيانات في قاعدة البيانات
        # في هذا المثال، سنطبع البيانات فقط
        print(f"New user profile: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        # توليد token جديد للأمان
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully!',
            'data': {
                'platform': platform,
                'whatsapp_number': clean_whatsapp,
                'payment_method': payment_method
            }
        })
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
