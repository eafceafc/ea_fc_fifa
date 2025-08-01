from flask import Flask, render_template, request, jsonify, session
import os
import re
import hashlib
import secrets
import requests
from datetime import datetime
import json
import phonenumbers
from phonenumbers import geocoder, carrier
from phonenumbers.phonenumberutil import number_type

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# إعدادات الأمان
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# قاموس البلدان والشركات المصرية
EGYPTIAN_CARRIERS = {
    '010': {'name': 'فودافون مصر', 'carrier_en': 'Vodafone Egypt'},
    '011': {'name': 'اتصالات مصر', 'carrier_en': 'Etisalat Egypt'},
    '012': {'name': 'أورانج مصر', 'carrier_en': 'Orange Egypt'},
    '015': {'name': 'وي مصر', 'carrier_en': 'WE Egypt (Telecom Egypt)'}
}

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

def normalize_phone_number(phone):
    """تطبيع رقم الهاتف"""
    if not phone:
        return ""
    
    # إزالة المسافات والرموز غير المرغوبة
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    # معالجة التنسيقات المختلفة
    if clean_phone.startswith('00'):
        # 00966512345678 -> +966512345678
        clean_phone = '+' + clean_phone[2:]
    elif clean_phone.startswith('0') and not clean_phone.startswith('01') and len(clean_phone) > 10:
        # 0966512345678 -> +966512345678
        clean_phone = '+' + clean_phone[1:]
    elif re.match(r'^\d{12,15}$', clean_phone) and not clean_phone.startswith('01'):
        # 966512345678 -> +966512345678
        clean_phone = '+' + clean_phone
    elif clean_phone.startswith('01') and len(clean_phone) == 11:
        # 01012345678 -> +201012345678 (مصري)
        clean_phone = '+2' + clean_phone
    
    return clean_phone

def validate_egyptian_number(phone):
    """التحقق من الأرقام المصرية خصيصاً"""
    # إزالة كود الدولة المصري إن وجد
    if phone.startswith('+2'):
        local_part = phone[2:]
    elif phone.startswith('2') and len(phone) > 11:
        local_part = phone[1:]
    else:
        local_part = phone
    
    # يجب أن يكون 11 رقم ويبدأ بـ 010/011/012/015
    if len(local_part) == 11 and local_part.startswith(('010', '011', '012', '015')):
        carrier_info = EGYPTIAN_CARRIERS.get(local_part[:3], {})
        return {
            'is_valid': True,
            'is_egyptian': True,
            'formatted': '+2' + local_part,
            'country': 'مصر',
            'country_en': 'Egypt',
            'carrier': carrier_info.get('name', 'غير معروف'),
            'carrier_en': carrier_info.get('carrier_en', 'Unknown'),
            'type': 'رقم محمول مصري'
        }
    
    return {'is_valid': False, 'is_egyptian': False}

def validate_international_number(phone):
    """التحقق من الأرقام الدولية"""
    try:
        # تطبيع الرقم أولاً
        normalized = normalize_phone_number(phone)
        
        # تحليل الرقم باستخدام phonenumbers
        parsed_number = phonenumbers.parse(normalized, None)
        
        # التحقق من صحة الرقم
        if not phonenumbers.is_valid_number(parsed_number):
            return {'is_valid': False, 'error': 'رقم غير صحيح'}
        
        # التحقق من أنه رقم محمول
        phone_type = number_type(parsed_number)
        if phone_type not in [phonenumbers.PhoneNumberType.MOBILE, 
                             phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE]:
            return {'is_valid': False, 'error': 'الرقم ليس رقم محمول'}
        
        # الحصول على معلومات البلد والشركة
        country_name = geocoder.description_for_number(parsed_number, "ar")
        country_name_en = geocoder.description_for_number(parsed_number, "en")
        carrier_name = carrier.name_for_number(parsed_number, "ar")
        carrier_name_en = carrier.name_for_number(parsed_number, "en")
        
        # تنسيق الرقم
        formatted_number = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        
        return {
            'is_valid': True,
            'is_egyptian': False,
            'formatted': formatted_number.replace(' ', ''),
            'country': country_name or 'غير معروف',
            'country_en': country_name_en or 'Unknown',
            'carrier': carrier_name or 'غير معروف',
            'carrier_en': carrier_name_en or 'Unknown',
            'type': 'رقم محمول دولي',
            'country_code': '+' + str(parsed_number.country_code)
        }
        
    except phonenumbers.NumberParseException as e:
        error_messages = {
            phonenumbers.NumberParseException.INVALID_COUNTRY_CODE: 'كود الدولة غير صحيح',
            phonenumbers.NumberParseException.NOT_A_NUMBER: 'ليس رقم هاتف صحيح',
            phonenumbers.NumberParseException.TOO_SHORT_NSN: 'الرقم قصير جداً',
            phonenumbers.NumberParseException.TOO_LONG: 'الرقم طويل جداً'
        }
        return {'is_valid': False, 'error': error_messages.get(e.error_type, 'رقم غير صحيح')}
    except Exception as e:
        return {'is_valid': False, 'error': 'خطأ في التحقق من الرقم'}

def validate_whatsapp_advanced(phone):
    """التحقق المتقدم من رقم الواتساب"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    # تنظيف الرقم أولاً
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    if not clean_phone:
        return {'is_valid': False, 'error': 'رقم الهاتف غير صحيح'}
    
    # فحص الأرقام المصرية أولاً
    if (clean_phone.startswith(('01', '+201', '201')) or 
        (clean_phone.startswith('2') and len(clean_phone) == 12)):
        
        result = validate_egyptian_number(clean_phone)
        if result['is_valid']:
            return result
    
    # فحص الأرقام الدولية
    international_result = validate_international_number(clean_phone)
    return international_result

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

@app.route('/validate-whatsapp', methods=['POST'])
def validate_whatsapp_endpoint():
    """API للتحقق من رقم الواتساب"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        result = validate_whatsapp_advanced(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

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
        
        # التحقق المتقدم من رقم الواتساب
        whatsapp_validation = validate_whatsapp_advanced(whatsapp_number)
        if not whatsapp_validation.get('is_valid'):
            return jsonify({
                'success': False,
                'message': f"رقم الواتساب غير صحيح: {whatsapp_validation.get('error', 'رقم غير صالح')}"
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
        
        # إعداد البيانات للحفظ
        user_data = {
            'platform': platform,
            'whatsapp_number': whatsapp_validation['formatted'],
            'whatsapp_info': {
                'country': whatsapp_validation.get('country'),
                'carrier': whatsapp_validation.get('carrier'),
                'type': whatsapp_validation.get('type'),
                'is_egyptian': whatsapp_validation.get('is_egyptian', False)
            },
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
                'whatsapp_number': whatsapp_validation['formatted'],
                'whatsapp_info': user_data['whatsapp_info'],
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

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'تم تجاوز الحد المسموح من الطلبات'}), 429


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


