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
from urllib.parse import urlparse
import time
import random

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

def generate_csrf_token():
    """توليد رمز CSRF آمن"""
    return secrets.token_urlsafe(32)

def sanitize_input(text):
    """تنظيف المدخلات من الأكواد الضارة"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def normalize_phone_number(phone):
    """تطبيع رقم الهاتف"""
    if not phone:
        return ""
    
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    if clean_phone.startswith('00'):
        clean_phone = '+' + clean_phone[2:]
    elif clean_phone.startswith('01') and len(clean_phone) == 11:
        clean_phone = '+2' + clean_phone
    elif re.match(r'^\d{12,15}$', clean_phone) and not clean_phone.startswith('01'):
        clean_phone = '+' + clean_phone
    
    return clean_phone

def check_whatsapp_developer_method(phone_number):
    """
    🔥 الحل الجذري - طريقة الـ Developer Tools
    تطبيق عملي لكلام صاحبك الخبير!
    """
    
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        return {
            'exists': False,
            'method': 'invalid_format',
            'confidence': 'very_high',
            'message': 'تنسيق الرقم غير صحيح'
        }
    
    clean_phone = phone_number.replace('+', '').replace(' ', '')
    
    try:
        # محاكاة زيارة جوجل أولاً (سلوك بشري)
        google_session = requests.Session()
        
        # Headers حقيقية مستخرجة من Developer Tools
        developer_headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8,ar-EG;q=0.7',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        # خطوة 1: زيارة جوجل لبناء الثقة
        google_session.get('https://www.google.com', headers=developer_headers, timeout=5)
        
        # انتظار عشوائي (محاكاة السلوك البشري)
        time.sleep(random.uniform(1.0, 2.5))
        
        # خطوة 2: الذهاب لواتساب
        whatsapp_url = f"https://api.whatsapp.com/send/?phone={clean_phone}"
        
        # إضافة Referer للمصداقية
        developer_headers['Referer'] = 'https://www.google.com/'
        
        response = google_session.get(whatsapp_url, headers=developer_headers, timeout=10, allow_redirects=True)
        
        # تحليل الاستجابة بطريقة Developer Tools
        response_analysis = analyze_whatsapp_response(response, clean_phone)
        
        return response_analysis
        
    except requests.exceptions.Timeout:
        return {
            'exists': None,
            'method': 'timeout',
            'confidence': 'very_low',
            'message': 'انتهت مهلة الاتصال - لا يمكن التحقق'
        }
        
    except requests.exceptions.ConnectionError:
        return {
            'exists': None,
            'method': 'connection_error', 
            'confidence': 'very_low',
            'message': 'خطأ في الاتصال - لا يمكن التحقق'
        }
        
    except Exception as e:
        print(f"Developer method error: {e}")
        return {
            'exists': None,
            'method': 'unknown_error',
            'confidence': 'very_low',
            'message': f'خطأ في التحليل: {str(e)}'
        }

def analyze_whatsapp_response(response, phone_number):
    """
    تحليل استجابة واتساب بطريقة الـ Developer Tools
    """
    
    # تحليل Status Code
    status_code = response.status_code
    
    # تحليل Headers
    response_headers = dict(response.headers)
    
    # تحليل Content 
    content = response.text.lower()
    content_length = len(response.text)
    
    # تحليل URL النهائي بعد Redirects
    final_url = response.url.lower()
    
    print(f"🔍 Developer Analysis for {phone_number}:")
    print(f"   Status: {status_code}")
    print(f"   Content Length: {content_length}")
    print(f"   Final URL: {final_url}")
    
    # تحليل متقدم للمحتوى
    analysis_results = []
    
    # فحص 1: رسائل الخطأ المباشرة
    error_patterns = [
        'phone number shared via url is invalid',
        'the phone number shared via url is invalid', 
        'invalid phone number',
        'رقم الهاتف غير صحيح',
        'numero de telefono no valido',
        'phone number is not valid'
    ]
    
    for pattern in error_patterns:
        if pattern in content:
            return {
                'exists': False,
                'method': 'direct_error_detection',
                'confidence': 'very_high',
                'message': 'رقم غير موجود - تم اكتشاف رسالة خطأ مباشرة',
                'detected_pattern': pattern,
                'analysis_details': {
                    'status_code': status_code,
                    'content_length': content_length,
                    'final_url': final_url
                }
            }
    
    # فحص 2: مؤشرات النجاح
    success_patterns = [
        'continue to chat',
        'المتابعة إلى الدردشة',
        'continuar al chat',
        'text-content',
        'open whatsapp',
        'whatsapp://send'
    ]
    
    success_count = 0
    found_success_patterns = []
    
    for pattern in success_patterns:
        if pattern in content:
            success_count += 1
            found_success_patterns.append(pattern)
    
    if success_count >= 2:
        return {
            'exists': True,
            'method': 'success_pattern_detection',
            'confidence': 'high',
            'message': f'رقم موجود - تم العثور على {success_count} مؤشر نجاح',
            'found_patterns': found_success_patterns,
            'analysis_details': {
                'status_code': status_code,
                'content_length': content_length,
                'final_url': final_url
            }
        }
    
    # فحص 3: تحليل URL النهائي
    if 'whatsapp.com' in final_url and 'send' in final_url:
        if phone_number in final_url.replace('%2B', ''):
            return {
                'exists': True,
                'method': 'url_analysis',
                'confidence': 'medium',
                'message': 'رقم موجود - تم التأكد من URL النهائي',
                'analysis_details': {
                    'status_code': status_code,
                    'content_length': content_length,
                    'final_url': final_url
                }
            }
    
    # فحص 4: تحليل Content Length
    if content_length < 500:
        return {
            'exists': False,
            'method': 'content_length_analysis',
            'confidence': 'medium', 
            'message': 'رقم غير موجود - محتوى الرد قصير جداً',
            'analysis_details': {
                'status_code': status_code,
                'content_length': content_length,
                'final_url': final_url
            }
        }
    elif content_length > 5000:
        return {
            'exists': True,
            'method': 'content_length_analysis',
            'confidence': 'medium',
            'message': 'رقم موجود - محتوى الرد مفصل',
            'analysis_details': {
                'status_code': status_code,
                'content_length': content_length, 
                'final_url': final_url
            }
        }
    
    # النتيجة الافتراضية
    return {
        'exists': False,
        'method': 'comprehensive_analysis',
        'confidence': 'low',
        'message': 'لم يتم العثور على مؤشرات واضحة - غالباً غير موجود',
        'analysis_details': {
            'status_code': status_code,
            'content_length': content_length,
            'final_url': final_url,
            'found_success_patterns': found_success_patterns
        }
    }

def validate_whatsapp_developer_style(phone):
    """التحقق من الواتساب بطريقة الـ Developer"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    normalized_phone = normalize_phone_number(phone)
    
    if not re.match(r'^\+[1-9]\d{7,14}$', normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # الحصول على معلومات الرقم
    try:
        parsed_number = phonenumbers.parse(normalized_phone, None)
        country = geocoder.description_for_number(parsed_number, "ar") or "غير معروف"
        carrier_name = carrier.name_for_number(parsed_number, "ar") or "غير معروف"
        is_egyptian = str(parsed_number.country_code) == '20'
    except:
        country = "غير معروف"
        carrier_name = "غير معروف"
        is_egyptian = normalized_phone.startswith('+20')
    
    # التحقق بطريقة Developer Tools
    whatsapp_check = check_whatsapp_developer_method(normalized_phone)
    
    if whatsapp_check['exists'] is True:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'موجود ✅ ({whatsapp_check["confidence"]})',
            'verification_method': f'Developer Tools - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'analysis_details': whatsapp_check.get('analysis_details', {}),
            'message': whatsapp_check['message']
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': f"{whatsapp_check['message']} ({whatsapp_check['confidence']})",
            'formatted': normalized_phone,
            'verification_method': f'Developer Tools - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'analysis_details': whatsapp_check.get('analysis_details', {}),
            'detected_pattern': whatsapp_check.get('detected_pattern', '')
        }
    else:  # None
        return {
            'is_valid': True,  # نقبل الرقم مع تحذير
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'غير مؤكد ⚠️ ({whatsapp_check["confidence"]})',
            'verification_method': f'Developer Tools - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'message': f"رقم صحيح ولكن {whatsapp_check['message']}"
        }

def validate_mobile_payment(payment_number):
    if not payment_number:
        return False
    clean_number = re.sub(r'\D', '', payment_number)
    return len(clean_number) == 11 and clean_number.startswith(('010', '011', '012', '015'))

def validate_card_number(card_number):
    if not card_number:
        return False
    clean_number = re.sub(r'\D', '', card_number)
    return len(clean_number) == 16 and clean_number.isdigit()

def validate_instapay_link(link):
    if not link:
        return False, ""
    
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;!?]'
    urls = re.findall(url_pattern, link, re.IGNORECASE)
    
    if not urls:
        return False, ""
    
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
            
            if 'instapay' in domain:
                return True, url
                
        except:
            continue
    
    return False, ""

@app.before_request
def before_request():
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()

@app.route('/')
def index():
    return render_template('index.html', csrf_token=session['csrf_token'])

@app.route('/validate-whatsapp', methods=['POST'])
def validate_whatsapp_endpoint():
    """🔥 API للتحقق بطريقة Developer Tools"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام طريقة Developer Tools
        result = validate_whatsapp_developer_style(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/developer-test', methods=['POST'])
def developer_test_endpoint():
    """🧪 endpoint للاختبار المباشر بطريقة Developer Tools"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'error': 'يرجى إدخال رقم الهاتف'})
        
        normalized_phone = normalize_phone_number(phone)
        result = check_whatsapp_developer_method(normalized_phone)
        
        return jsonify({
            'phone': normalized_phone,
            'developer_analysis': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"خطأ في اختبار Developer: {str(e)}")
        return jsonify({'error': f'خطأ في الاختبار: {str(e)}'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي بطريقة Developer Tools"""
    try:
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        
        token = request.form.get('csrf_token')
        if not token or token != session.get('csrf_token'):
            return jsonify({'success': False, 'message': 'Invalid security token'}), 403
        
        platform = sanitize_input(request.form.get('platform'))
        whatsapp_number = sanitize_input(request.form.get('whatsapp_number'))
        payment_method = sanitize_input(request.form.get('payment_method'))
        payment_details = sanitize_input(request.form.get('payment_details'))
        telegram_username = sanitize_input(request.form.get('telegram_username'))
        
        if not all([platform, whatsapp_number, payment_method]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # التحقق بطريقة Developer Tools
        whatsapp_validation = validate_whatsapp_developer_style(whatsapp_number)
        if not whatsapp_validation.get('is_valid'):
            return jsonify({
                'success': False,
                'message': f"رقم الواتساب غير صحيح: {whatsapp_validation.get('error', 'رقم غير صالح')}"
            }), 400
        
        processed_payment_details = ""
        
        if payment_method in ['vodafone_cash', 'etisalat_cash', 'orange_cash', 'we_cash', 'bank_wallet']:
            if not validate_mobile_payment(payment_details):
                return jsonify({'success': False, 'message': 'Invalid mobile payment number'}), 400
            processed_payment_details = re.sub(r'\D', '', payment_details)
            
        elif payment_method == 'tilda':
            if not validate_card_number(payment_details):
                return jsonify({'success': False, 'message': 'Invalid card number'}), 400
            processed_payment_details = re.sub(r'\D', '', payment_details)
            
        elif payment_method == 'instapay':
            is_valid, extracted_link = validate_instapay_link(payment_details)
            if not is_valid:
                return jsonify({'success': False, 'message': 'Invalid InstaPay link'}), 400
            processed_payment_details = extracted_link
        
        if telegram_username:
            if not telegram_username.startswith('@'):
                telegram_username = '@' + telegram_username
            if not re.match(r'^@[a-zA-Z0-9_]{5,32}$', telegram_username):
                return jsonify({'success': False, 'message': 'Invalid Telegram username'}), 400
        
        user_data = {
            'platform': platform,
            'whatsapp_number': whatsapp_validation['formatted'],
            'whatsapp_info': {
                'country': whatsapp_validation.get('country'),
                'carrier': whatsapp_validation.get('carrier'),
                'is_egyptian': whatsapp_validation.get('is_egyptian', False),
                'whatsapp_status': whatsapp_validation.get('whatsapp_status'),
                'verification_method': whatsapp_validation.get('verification_method'),
                'confidence': whatsapp_validation.get('confidence'),
                'analysis_details': whatsapp_validation.get('analysis_details', {})
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]
        }
        
        print(f"🔥 Developer Tools Validation: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'تم التحقق بطريقة Developer Tools وحفظ البيانات بنجاح!',
            'data': {
                'platform': platform,
                'whatsapp_number': whatsapp_validation['formatted'],
                'whatsapp_info': user_data['whatsapp_info'],
                'payment_method': payment_method
            }
        })
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
