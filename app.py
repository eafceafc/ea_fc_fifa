from flask import Flask, render_template, request, jsonify, session
import os
import re
import hashlib
import secrets
import requests
from datetime import datetime, timedelta
import json
import phonenumbers
from phonenumbers import geocoder, carrier
from phonenumbers.phonenumberutil import number_type
import time
import random
from urllib.parse import urlparse
import sqlite3
from functools import wraps
import logging

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# إعداد السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# كاش للتحقق من الأرقام لتجنب الطلبات المتكررة
verification_cache = {}
CACHE_DURATION = 300  # 5 دقائق

def init_database():
    """إنشاء قاعدة البيانات إذا لم تكن موجودة"""
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                whatsapp_number TEXT NOT NULL,
                whatsapp_info TEXT,
                payment_method TEXT NOT NULL,
                payment_details TEXT NOT NULL,
                telegram_username TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_hash TEXT,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS verification_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                verification_result TEXT,
                method_used TEXT,
                confidence_level TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("تم إنشاء قاعدة البيانات بنجاح")
        
    except Exception as e:
        logger.error(f"خطأ في إنشاء قاعدة البيانات: {e}")

def rate_limit_decorator(max_requests=10, window_minutes=1):
    """دالة تحديد معدل الطلبات"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            key = f"rate_limit_{client_ip}_{f.__name__}"
            
            current_time = datetime.now()
            
            if key not in session:
                session[key] = []
            
            # تنظيف الطلبات القديمة
            session[key] = [req_time for req_time in session[key] 
                           if current_time - datetime.fromisoformat(req_time) < timedelta(minutes=window_minutes)]
            
            if len(session[key]) >= max_requests:
                return jsonify({'error': 'تم تجاوز الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً'}), 429
            
            session[key].append(current_time.isoformat())
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

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

def check_whatsapp_availability_improved(phone_number):
    """
    التحقق المحسن من وجود الرقم على واتساب - أكثر واقعية وشفافية
    """
    # التحقق من الكاش أولاً
    cache_key = hashlib.md5(phone_number.encode()).hexdigest()
    current_time = time.time()
    
    if cache_key in verification_cache:
        cached_result, cached_time = verification_cache[cache_key]
        if current_time - cached_time < CACHE_DURATION:
            logger.info(f"استخدام النتيجة المحفوظة للرقم: {phone_number}")
            return cached_result
    
    # التأكد من تنسيق الرقم
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        result = {'exists': False, 'method': 'invalid_format', 'confidence': 'high', 'error': 'تنسيق الرقم غير صحيح'}
        verification_cache[cache_key] = (result, current_time)
        return result

    # --- الطريقة الأساسية: التحقق عبر رابط wa.me ---
    try:
        clean_phone = phone_number.lstrip('+')
        url = f"https://wa.me/{clean_phone}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar,en;q=0.9',
            'Cache-Control': 'no-cache'
        }
        
        response = requests.head(url, headers=headers, timeout=8, allow_redirects=True)
        
        if response.status_code == 200:
            result = {'exists': True, 'method': 'wa.me_verification', 'confidence': 'high'}
        elif response.status_code == 404:
            result = {'exists': False, 'method': 'wa.me_verification', 'confidence': 'high'}
        else:
            # حالة غير متوقعة - نلجأ للطريقة الاحتياطية
            result = fallback_phone_validation(phone_number)
        
        # حفظ في الكاش
        verification_cache[cache_key] = (result, current_time)
        
        # تسجيل في قاعدة البيانات
        log_verification_attempt(phone_number, result)
        
        return result

    except requests.exceptions.RequestException as e:
        logger.warning(f"فشل التحقق عبر wa.me للرقم {phone_number}: {e}")
        # الطريقة الاحتياطية
        result = fallback_phone_validation(phone_number)
        verification_cache[cache_key] = (result, current_time)
        return result

def fallback_phone_validation(phone_number):
    """الطريقة الاحتياطية للتحقق من صحة الرقم"""
    try:
        parsed_number = phonenumbers.parse(phone_number, None)
        
        if phonenumbers.is_valid_number(parsed_number) and \
           number_type(parsed_number) in [phonenumbers.PhoneNumberType.MOBILE, 
                                        phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE]:
            
            # للأرقام المصرية - احتمالية عالية للوجود على واتساب
            if parsed_number.country_code == 20:
                return {'exists': True, 'method': 'egyptian_fallback', 'confidence': 'medium'}
            else:
                return {'exists': True, 'method': 'international_fallback', 'confidence': 'low'}
        else:
            return {'exists': False, 'method': 'invalid_number', 'confidence': 'high'}
            
    except Exception as e:
        logger.error(f"خطأ في التحقق الاحتياطي: {e}")
        return {'exists': False, 'method': 'error', 'confidence': 'low'}

def log_verification_attempt(phone_number, result):
    """تسجيل محاولة التحقق في قاعدة البيانات"""
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO verification_log (phone_number, verification_result, method_used, confidence_level)
            VALUES (?, ?, ?, ?)
        ''', (
            hashlib.sha256(phone_number.encode()).hexdigest()[:12],  # hash للخصوصية
            json.dumps(result),
            result.get('method', 'unknown'),
            result.get('confidence', 'unknown')
        ))
        
        conn.commit()
        conn.close()
        
    except Exception as e:
        logger.error(f"خطأ في تسجيل محاولة التحقق: {e}")

def validate_whatsapp_enhanced(phone):
    """التحقق المحسن من رقم الواتساب"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    # تنظيف وتطبيع الرقم
    clean_phone = re.sub(r'[^\d+]', '', phone)
    if not clean_phone:
        return {'is_valid': False, 'error': 'رقم الهاتف غير صحيح'}
    
    normalized_phone = normalize_phone_number(clean_phone)
    
    # التحقق من تنسيق الرقم
    if not is_valid_phone_format(normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # الحصول على معلومات الرقم أولاً
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
    
    # التحقق من وجود الرقم على واتساب
    whatsapp_check = check_whatsapp_availability_improved(normalized_phone)
    
    if whatsapp_check['exists']:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': phone_info.get('country', 'غير معروف'),
            'country_en': phone_info.get('country_en', 'Unknown'),
            'carrier': phone_info.get('carrier', 'غير معروف'),
            'carrier_en': phone_info.get('carrier_en', 'Unknown'),
            'type': phone_info.get('type', 'رقم محمول'),
            'is_egyptian': phone_info.get('is_egyptian', False),
            'whatsapp_status': 'متاح',
            'verification_method': whatsapp_check.get('method', 'unknown'),
            'confidence': whatsapp_check.get('confidence', 'medium'),
            'message': f'رقم صحيح - التحقق بطريقة {whatsapp_check.get("method", "غير معروف")} بثقة {whatsapp_check.get("confidence", "متوسطة")}'
        }
    else:
        return {
            'is_valid': False, 
            'error': f'الرقم غير متاح على واتساب - تم التحقق بطريقة {whatsapp_check.get("method", "غير معروف")} بثقة {whatsapp_check.get("confidence", "متوسطة")}',
            'formatted': normalized_phone,
            'verification_method': whatsapp_check.get('method', 'unknown'),
            'confidence': whatsapp_check.get('confidence', 'medium')
        }

def validate_mobile_payment(payment_number):
    """التحقق من صحة رقم المحفظة الإلكترونية"""
    if not payment_number:
        return False
    
    # إزالة المسافات والرموز
    clean_number = re.sub(r'\D', '', payment_number)
    
    # يجب أن يكون 11 رقم ويبدأ بـ 010, 011, 012, أو 015
    return len(clean_number) == 11 and clean_number.startswith(('010', '011', '012', '015'))

def validate_card_number(card_number):
    """التحقق من صحة رقم البطاقة باستخدام خوارزمية Luhn"""
    if not card_number:
        return False
    
    # إزالة المسافات والرموز
    clean_number = re.sub(r'\D', '', card_number)
    
    # يجب أن يكون 16 رقم
    if len(clean_number) != 16 or not clean_number.isdigit():
        return False
    
    # خوارزمية Luhn للتحقق من صحة رقم البطاقة
    def luhn_check(card_num):
        def digits_of(n):
            return [int(d) for d in str(n)]
        
        digits = digits_of(card_num)
        odd_digits = digits[-1::-2]
        even_digits = digits[-2::-2]
        checksum = sum(odd_digits)
        for d in even_digits:
            checksum += sum(digits_of(d*2))
        return checksum % 10 == 0
    
    return luhn_check(clean_number)

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

def is_valid_phone_format(phone):
    """التحقق من تنسيق الرقم الأساسي"""
    pattern = r'^\+[1-9]\d{7,14}$'
    return bool(re.match(pattern, phone))

def save_user_to_database(user_data):
    """حفظ بيانات المستخدم في قاعدة البيانات"""
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO users (platform, whatsapp_number, whatsapp_info, payment_method, 
                             payment_details, telegram_username, ip_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_data['platform'],
            user_data['whatsapp_number'],
            json.dumps(user_data['whatsapp_info'], ensure_ascii=False),
            user_data['payment_method'],
            user_data['payment_details'],
            user_data.get('telegram_username'),
            user_data['ip_address']
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"تم حفظ المستخدم بنجاح - ID: {user_id}")
        return user_id
        
    except Exception as e:
        logger.error(f"خطأ في حفظ المستخدم: {e}")
        return None

def get_verification_statistics():
    """الحصول على إحصائيات التحقق"""
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # إحصائيات عامة
        cursor.execute('''
            SELECT 
                COUNT(*) as total_verifications,
                SUM(CASE WHEN json_extract(verification_result, '$.exists') = 1 THEN 1 ELSE 0 END) as successful_verifications,
                COUNT(DISTINCT method_used) as methods_used
            FROM verification_log 
            WHERE timestamp >= datetime('now', '-7 days')
        ''')
        
        stats = cursor.fetchone()
        conn.close()
        
        return {
            'total_verifications': stats[0] if stats else 0,
            'successful_verifications': stats[1] if stats else 0,
            'methods_used': stats[2] if stats else 0,
            'success_rate': round((stats[1] / stats[0]) * 100, 2) if stats and stats[0] > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"خطأ في جلب الإحصائيات: {e}")
        return {'error': 'فشل في جلب الإحصائيات'}

@app.before_request
def before_request():
    """إجراءات ما قبل كل طلب"""
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()

# إنشاء قاعدة البيانات عند بدء التطبيق
with app.app_context():
    init_database()

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return render_template('index.html', csrf_token=session['csrf_token'])

@app.route('/validate-whatsapp', methods=['POST'])
@rate_limit_decorator(max_requests=5, window_minutes=1)
def validate_whatsapp_endpoint():
    """API للتحقق من رقم الواتساب المحسن"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام النظام المحسن
        result = validate_whatsapp_enhanced(phone)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/statistics', methods=['GET'])
def get_statistics():
    """الحصول على إحصائيات النظام"""
    try:
        stats = get_verification_statistics()
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"خطأ في جلب الإحصائيات: {str(e)}")
        return jsonify({'error': 'خطأ في الخادم'}), 500

@app.route('/update-profile', methods=['POST'])
@rate_limit_decorator(max_requests=3, window_minutes=5)
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
        
        # استخدام النظام المحسن للتحقق من الواتساب
        whatsapp_validation = validate_whatsapp_enhanced(whatsapp_number)
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
                    'message': 'Invalid card number. Must be 16 digits and pass Luhn algorithm'
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
        
        # حفظ في قاعدة البيانات
        user_id = save_user_to_database(user_data)
        
        if user_id:
            logger.info(f"تم إنشاء ملف شخصي جديد - ID: {user_id}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully!',
            'user_id': user_id,
            'data': {
                'platform': platform,
                'whatsapp_number': whatsapp_validation['formatted'],
                'whatsapp_info': user_data['whatsapp_info'],
                'payment_method': payment_method
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

@app.route('/clear-cache', methods=['POST'])
def clear_verification_cache():
    """مسح كاش التحقق"""
    try:
        global verification_cache
        cache_size = len(verification_cache)
        verification_cache.clear()
        
        return jsonify({
            'success': True,
            'message': f'تم مسح {cache_size} عنصر من الكاش'
        })
        
    except Exception as e:
        logger.error(f"خطأ في مسح الكاش: {str(e)}")
        return jsonify({'success': False, 'message': 'خطأ في الخادم'}), 500

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
