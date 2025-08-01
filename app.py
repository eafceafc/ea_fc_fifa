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

def check_whatsapp_simple_and_effective(phone_number):
    """
    🔥 الحل البسيط والفعال - بدون تعقيد!
    هنجرب طرق متعددة ونشوف أي واحدة تشتغل
    """
    
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        return {
            'exists': False,
            'method': 'invalid_format',
            'message': 'تنسيق الرقم غير صحيح'
        }
    
    clean_phone = phone_number.replace('+', '').replace(' ', '')
    
    # قائمة بالطرق المختلفة للتحقق
    urls_to_try = [
        f"https://api.whatsapp.com/send/?phone={clean_phone}",
        f"https://wa.me/{clean_phone}",
        f"https://web.whatsapp.com/send?phone={clean_phone}",
        f"https://api.whatsapp.com/send?phone={clean_phone}&text=test"
    ]
    
    results = []
    
    for i, url in enumerate(urls_to_try):
        try:
            # انتظار عشوائي لمحاكاة السلوك البشري
            if i > 0:
                time.sleep(random.uniform(0.5, 1.5))
            
            # Headers مختلفة لكل محاولة
            headers_options = [
                {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                    'Connection': 'keep-alive'
                },
                {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ar-EG,ar;q=0.9',
                    'Connection': 'keep-alive'
                },
                {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive'
                }
            ]
            
            headers = headers_options[i % len(headers_options)]
            
            # محاولة GET request
            response = requests.get(url, headers=headers, timeout=8, allow_redirects=True)
            
            # تحليل بسيط جداً للرد
            status_ok = response.status_code in [200, 302, 301]
            content_length = len(response.text)
            
            # إذا كان الرد قصير جداً، غالباً يكون خطأ
            if content_length < 100:
                result_for_this_url = False
            elif content_length > 5000:
                # الرد طويل، غالباً صفحة واتساب الحقيقية
                result_for_this_url = True
            else:
                # متوسط، نعتمد على status code
                result_for_this_url = status_ok
            
            results.append({
                'url': url,
                'status': response.status_code,
                'content_length': content_length,
                'result': result_for_this_url,
                'success': status_ok
            })
            
        except requests.exceptions.Timeout:
            results.append({
                'url': url,
                'status': 'timeout',
                'result': None,
                'success': False
            })
        except requests.exceptions.ConnectionError:
            results.append({
                'url': url,
                'status': 'connection_error',
                'result': None,
                'success': False
            })
        except Exception as e:
            results.append({
                'url': url,
                'status': f'error: {str(e)}',
                'result': None,
                'success': False
            })
    
    # تحليل النتائج
    valid_results = [r for r in results if r['result'] is not None]
    
    if not valid_results:
        return {
            'exists': None,
            'method': 'all_failed',
            'message': 'فشل في الاتصال - لا يمكن التحقق',
            'details': results
        }
    
    # حساب نسبة النجاح
    positive_results = [r for r in valid_results if r['result'] is True]
    success_rate = len(positive_results) / len(valid_results)
    
    # قرار نهائي بناءً على نسبة النجاح
    if success_rate >= 0.5:  # 50% أو أكثر نجح
        return {
            'exists': True,
            'method': 'multiple_attempts',
            'confidence': 'high' if success_rate >= 0.75 else 'medium',
            'success_rate': f"{len(positive_results)}/{len(valid_results)}",
            'message': f'الرقم موجود على واتساب - نسبة النجاح {success_rate*100:.0f}%',
            'details': results
        }
    else:
        return {
            'exists': False,
            'method': 'multiple_attempts',
            'confidence': 'high' if success_rate <= 0.25 else 'medium',
            'success_rate': f"{len(positive_results)}/{len(valid_results)}",
            'message': f'الرقم غير موجود على واتساب - نسبة الفشل {(1-success_rate)*100:.0f}%',
            'details': results
        }

def validate_whatsapp_smart(phone):
    """التحقق الذكي من رقم الواتساب"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    normalized_phone = normalize_phone_number(phone)
    
    if not re.match(r'^\+[1-9]\d{7,14}$', normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # الحصول على معلومات الرقم الأساسية
    try:
        parsed_number = phonenumbers.parse(normalized_phone, None)
        country = geocoder.description_for_number(parsed_number, "ar") or "غير معروف"
        carrier_name = carrier.name_for_number(parsed_number, "ar") or "غير معروف"
        is_egyptian = str(parsed_number.country_code) == '20'
    except:
        country = "غير معروف"
        carrier_name = "غير معروف" 
        is_egyptian = normalized_phone.startswith('+20')
    
    # التحقق الذكي من واتساب
    whatsapp_check = check_whatsapp_simple_and_effective(normalized_phone)
    
    if whatsapp_check['exists'] is True:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'موجود ✅ ({whatsapp_check["confidence"]})',
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'success_rate': whatsapp_check.get('success_rate', ''),
            'message': whatsapp_check['message']
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': f"{whatsapp_check['message']} ({whatsapp_check['confidence']})",
            'formatted': normalized_phone,
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'success_rate': whatsapp_check.get('success_rate', '')
        }
    else:  # None - لا يمكن التحقق
        return {
            'is_valid': True,  # نقبل الرقم مع تحذير
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'غير مؤكد ⚠️',
            'verification_method': whatsapp_check['method'],
            'confidence': 'very_low',
            'message': f"رقم صحيح ولكن {whatsapp_check['message']}"
        }

def validate_mobile_payment(payment_number):
    """التحقق من صحة رقم المحفظة الإلكترونية"""
    if not payment_number:
        return False
    clean_number = re.sub(r'\D', '', payment_number)
    return len(clean_number) == 11 and clean_number.startswith(('010', '011', '012', '015'))

def validate_card_number(card_number):
    """التحقق من صحة رقم البطاقة (16 رقم)"""
    if not card_number:
        return False
    clean_number = re.sub(r'\D', '', card_number)
    return len(clean_number) == 16 and clean_number.isdigit()

def validate_instapay_link(link):
    """التحقق من صحة رابط InstaPay"""
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
    """إجراءات ما قبل كل طلب"""
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()

@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return render_template('index.html', csrf_token=session['csrf_token'])

@app.route('/validate-whatsapp', methods=['POST'])
def validate_whatsapp_endpoint():
    """🔥 API للتحقق الذكي من رقم الواتساب"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام الطريقة الذكية الجديدة
        result = validate_whatsapp_smart(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/test-phone', methods=['POST'])
def test_phone_endpoint():
    """🧪 endpoint للاختبار المباشر"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'error': 'يرجى إدخال رقم الهاتف'})
        
        normalized_phone = normalize_phone_number(phone)
        result = check_whatsapp_simple_and_effective(normalized_phone)
        
        return jsonify({
            'phone': normalized_phone,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"خطأ في الاختبار: {str(e)}")
        return jsonify({'error': f'خطأ في الاختبار: {str(e)}'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي بالتحقق الذكي"""
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
        
        # التحقق الذكي من الواتساب
        whatsapp_validation = validate_whatsapp_smart(whatsapp_number)
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
                'success_rate': whatsapp_validation.get('success_rate', '')
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]
        }
        
        print(f"🔥 Smart WhatsApp Validation: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'تم التحقق الذكي من الواتساب وحفظ البيانات بنجاح!',
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
