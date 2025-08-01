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
import time
import random
from urllib.parse import urlparse

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

def generate_csrf_token():
    """توليد رمز CSRF آمن"""
    return secrets.token_urlsafe(32)

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
        clean_phone = '+' + clean_phone[2:]
    elif clean_phone.startswith('0') and not clean_phone.startswith('01') and len(clean_phone) > 10:
        clean_phone = '+' + clean_phone[1:]
    elif re.match(r'^\d{12,15}$', clean_phone) and not clean_phone.startswith('01'):
        clean_phone = '+' + clean_phone
    elif clean_phone.startswith('01') and len(clean_phone) == 11:
        clean_phone = '+2' + clean_phone
    
    return clean_phone

def validate_egyptian_number(phone):
    """التحقق من الأرقام المصرية خصيصاً"""
    if phone.startswith('+2'):
        local_part = phone[2:]
    elif phone.startswith('2') and len(phone) > 11:
        local_part = phone[1:]
    else:
        local_part = phone
    
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
        normalized = normalize_phone_number(phone)
        parsed_number = phonenumbers.parse(normalized, None)
        
        if not phonenumbers.is_valid_number(parsed_number):
            return {'is_valid': False, 'error': 'رقم غير صحيح'}
        
        phone_type = number_type(parsed_number)
        if phone_type not in [phonenumbers.PhoneNumberType.MOBILE, 
                             phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE]:
            return {'is_valid': False, 'error': 'الرقم ليس رقم محمول'}
        
        country_name = geocoder.description_for_number(parsed_number, "ar")
        country_name_en = geocoder.description_for_number(parsed_number, "en")
        carrier_name = carrier.name_for_number(parsed_number, "ar")
        carrier_name_en = carrier.name_for_number(parsed_number, "en")
        
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

def check_whatsapp_availability_realistic(phone_number):
    """
    التحقق الواقعي من رقم الواتساب
    هذه الدالة صادقة وواقعية - لا تدّعي أشياء مستحيلة!
    """
    
    # التحقق الأساسي من تنسيق الرقم أولاً
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        return {
            'exists': False, 
            'method': 'invalid_format', 
            'confidence': 'high',
            'realistic_message': 'تنسيق الرقم غير صحيح'
        }
    
    try:
        # الطريقة الوحيدة الموثوقة: wa.me مع تحسينات ذكية
        clean_phone = phone_number.lstrip('+')
        url = f"https://wa.me/{clean_phone}"
        
        # Headers محسنة لتقليد المتصفح الحقيقي
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }
        
        # محاولة واحدة فقط، واقعية
        response = requests.get(url, headers=headers, timeout=8, allow_redirects=False)
        
        # تحليل الاستجابة بشكل واقعي
        if response.status_code == 200:
            # الرقم موجود فعلاً على واتساب
            return {
                'exists': True, 
                'method': 'wa_me_success', 
                'confidence': 'very_high',
                'realistic_message': 'تم التحقق - الرقم موجود على واتساب'
            }
        elif response.status_code == 404:
            # الرقم مش موجود على واتساب
            return {
                'exists': False, 
                'method': 'wa_me_not_found', 
                'confidence': 'high',
                'realistic_message': 'الرقم غير موجود على واتساب'
            }
        elif response.status_code == 302:
            # إعادة توجيه - ممكن يكون موجود
            return {
                'exists': True, 
                'method': 'wa_me_redirect', 
                'confidence': 'medium',
                'realistic_message': 'على الأغلب موجود على واتساب'
            }
        else:
            # حالة غير متوقعة
            return {
                'exists': None, 
                'method': 'wa_me_unknown', 
                'confidence': 'low',
                'realistic_message': f'استجابة غير متوقعة: {response.status_code}'
            }
            
    except requests.exceptions.Timeout:
        # انتهاء مهلة الاتصال
        return {
            'exists': None, 
            'method': 'timeout', 
            'confidence': 'very_low',
            'realistic_message': 'انتهت مهلة الاتصال - لا يمكن التحقق'
        }
        
    except requests.exceptions.ConnectionError:
        # مشكلة في الشبكة
        return {
            'exists': None, 
            'method': 'network_error', 
            'confidence': 'very_low',
            'realistic_message': 'خطأ في الشبكة - لا يمكن التحقق'
        }
        
    except Exception as e:
        # أي خطأ آخر
        print(f"خطأ في التحقق من الواتساب: {e}")
        return {
            'exists': None, 
            'method': 'error', 
            'confidence': 'very_low',
            'realistic_message': 'خطأ فني - لا يمكن التحقق'
        }

def validate_whatsapp_honest(phone):
    """التحقق الصادق من رقم الواتساب - بدون كذب على المستخدم"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    # تنظيف وتطبيع الرقم
    clean_phone = re.sub(r'[^\d+]', '', phone)
    if not clean_phone:
        return {'is_valid': False, 'error': 'رقم الهاتف غير صحيح'}
    
    normalized_phone = normalize_phone_number(clean_phone)
    
    # التحقق من تنسيق الرقم أولاً
    if not is_valid_phone_format(normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # الحصول على معلومات الرقم الأساسية
    phone_info = {}
    
    # للأرقام المصرية
    if normalized_phone.startswith('+20'):
        egyptian_info = validate_egyptian_number(normalized_phone)
        if egyptian_info['is_valid']:
            phone_info = egyptian_info
        else:
            return {'is_valid': False, 'error': 'رقم مصري غير صحيح'}
    else:
        # للأرقام الدولية
        international_info = validate_international_number(normalized_phone)
        if not international_info.get('is_valid'):
            return {'is_valid': False, 'error': international_info.get('error', 'رقم دولي غير صحيح')}
        phone_info = international_info
    
    # التحقق الواقعي من الواتساب
    whatsapp_check = check_whatsapp_availability_realistic(normalized_phone)
    
    # التعامل مع النتائج بصدق
    if whatsapp_check['exists'] is True:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': phone_info.get('country', 'غير معروف'),
            'country_en': phone_info.get('country_en', 'Unknown'),
            'carrier': phone_info.get('carrier', 'غير معروف'),
            'carrier_en': phone_info.get('carrier_en', 'Unknown'),
            'type': phone_info.get('type', 'رقم محمول'),
            'is_egyptian': phone_info.get('is_egyptian', False),
            'whatsapp_status': 'متاح ✅',
            'verification_method': whatsapp_check.get('method'),
            'confidence': whatsapp_check.get('confidence'),
            'message': whatsapp_check.get('realistic_message')
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': whatsapp_check.get('realistic_message', 'الرقم غير موجود على واتساب'),
            'formatted': normalized_phone,
            'verification_method': whatsapp_check.get('method'),
            'confidence': whatsapp_check.get('confidence')
        }
    else:  # whatsapp_check['exists'] is None (لا يمكن التحقق)
        # في هذه الحالة نقبل الرقم لكن مع تحذير
        return {
            'is_valid': True,  # نقبل الرقم لأن تنسيقه صحيح
            'formatted': normalized_phone,
            'country': phone_info.get('country', 'غير معروف'),
            'country_en': phone_info.get('country_en', 'Unknown'),  
            'carrier': phone_info.get('carrier', 'غير معروف'),
            'carrier_en': phone_info.get('carrier_en', 'Unknown'),
            'type': phone_info.get('type', 'رقم محمول'),
            'is_egyptian': phone_info.get('is_egyptian', False),
            'whatsapp_status': 'غير مؤكد ⚠️',
            'verification_method': whatsapp_check.get('method'),
            'confidence': whatsapp_check.get('confidence'),
            'message': f"الرقم صحيح ولكن {whatsapp_check.get('realistic_message', 'لا يمكن التحقق من الواتساب')}"
        }

# الدوال للتوافق مع النظام الحالي
def check_whatsapp_availability_advanced(phone):
    """نسخة محسنة للتوافق مع النظام الحالي"""
    return check_whatsapp_availability_realistic(phone)

def validate_whatsapp_enhanced(phone):
    """نسخة محسنة للتوافق مع النظام الحالي"""
    return validate_whatsapp_honest(phone)

def validate_whatsapp_simple(phone):
    """نسخة مبسطة للتوافق مع النظام الحالي"""
    return validate_whatsapp_honest(phone)

def is_valid_phone_format(phone):
    """التحقق من تنسيق الرقم الأساسي"""
    pattern = r'^\+[1-9]\d{7,14}$'
    return bool(re.match(pattern, phone))

def check_whatsapp_availability(phone):
    """نسخة محسنة للتوافق مع النظام الحالي"""
    result = check_whatsapp_availability_realistic(phone)
    return result

def validate_mobile_payment(payment_number):
    """التحقق من صحة رقم المحفظة الإلكترونية"""
    if not payment_number:
        return False
    
    # إزالة المسافات والرموز
    clean_number = re.sub(r'\D', '', payment_number)
    
    # يجب أن يكون 11 رقم ويبدأ بـ 010, 011, 012, أو 015
    return len(clean_number) == 11 and clean_number.startswith(('010', '011', '012', '015'))

def validate_card_number(card_number):
    """التحقق من صحة رقم البطاقة (16 رقم)"""
    if not card_number:
        return False
    
    # إزالة المسافات والرموز
    clean_number = re.sub(r'\D', '', card_number)
    
    # يجب أن يكون 16 رقم
    return len(clean_number) == 16 and clean_number.isdigit()

def validate_instapay_link(link):
    """التحقق من صحة رابط InstaPay"""
    if not link:
        return False, ""
    
    # البحث عن روابط https في النص
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;!?]'
    urls = re.findall(url_pattern, link, re.IGNORECASE)
    
    if not urls:
        return False, ""
    
    # التحقق من أن الرابط يحتوي على كلمات InstaPay مشهورة
    valid_domains = [
        'instapay.com.eg', 'instapay.app', 'app.instapay.com.eg',
        'instapay.me', 'pay.instapay.com.eg'
    ]
    
    for url in urls:
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc.replace('www.', '')
            
            if any(valid_domain in domain for valid_domain in valid_domains):
                return True, url
            
            # تحقق إضافي من وجود كلمة instapay في الدومين
            if 'instapay' in domain:
                return True, url
                
        except:
            continue
    
    return False, ""

@app.before_request
def before_request():
    """إجراءات ما قبل كل طلب"""
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return render_template('index.html', csrf_token=session['csrf_token'])

@app.route('/validate-whatsapp', methods=['POST'])
def validate_whatsapp_endpoint():
    """API للتحقق من رقم الواتساب المحسن"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام النظام المحسن الصادق
        result = validate_whatsapp_honest(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي"""
    try:
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        # التحقق من CSRF token
        token = request.form.get('csrf_token')
        if not token or token != session.get('csrf_token'):
            return jsonify({
                'success': False,
                'message': 'Invalid security token'
            }), 403
        
        platform = sanitize_input(request.form.get('platform'))
        whatsapp_number = sanitize_input(request.form.get('whatsapp_number'))
        payment_method = sanitize_input(request.form.get('payment_method'))
        payment_details = sanitize_input(request.form.get('payment_details'))
        telegram_username = sanitize_input(request.form.get('telegram_username'))
        
        if not all([platform, whatsapp_number, payment_method]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # استخدام النظام المحسن الصادق للتحقق من الواتساب
        whatsapp_validation = validate_whatsapp_honest(whatsapp_number)
        if not whatsapp_validation.get('is_valid'):
            return jsonify({
                'success': False,
                'message': f"رقم الواتساب غير صحيح: {whatsapp_validation.get('error', 'رقم غير صالح')}"
            }), 400
        
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
            processed_payment_details = re.sub(r'\D', '', payment_details)
            
        elif payment_method == 'instapay':
            is_valid, extracted_link = validate_instapay_link(payment_details)
            if not is_valid:
                return jsonify({
                    'success': False,
                    'message': 'Invalid InstaPay link. Must contain a valid https:// URL'
                }), 400
            processed_payment_details = extracted_link
        
        if telegram_username:
            if not telegram_username.startswith('@'):
                telegram_username = '@' + telegram_username
            if not re.match(r'^@[a-zA-Z0-9_]{5,32}$', telegram_username):
                return jsonify({
                    'success': False,
                    'message': 'Invalid Telegram username'
                }), 400
        
        user_data = {
            'platform': platform,
            'whatsapp_number': whatsapp_validation['formatted'],
            'whatsapp_info': {
                'country': whatsapp_validation.get('country'),
                'country_en': whatsapp_validation.get('country_en'),
                'carrier': whatsapp_validation.get('carrier'),
                'carrier_en': whatsapp_validation.get('carrier_en'),
                'type': whatsapp_validation.get('type'),
                'is_egyptian': whatsapp_validation.get('is_egyptian', False),
                'whatsapp_status': whatsapp_validation.get('whatsapp_status'),
                'verification_method': whatsapp_validation.get('verification_method'),
                'confidence': whatsapp_validation.get('confidence')
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]  # hash للخصوصية
        }
        
        # هنا يتم حفظ البيانات في قاعدة البيانات
        print(f"New user profile: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
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
