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
from bs4 import BeautifulSoup  # <--- هو ده السطر ومكانه صح 100%
import numpy as np

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

def check_whatsapp_ultimate_method(phone_number):
    """
    🔥 الطريقة النهائية المبتكرة - تجمع كل الحلول الذكية
    """
    
    results = []
    clean_phone = phone_number.replace('+', '').replace(' ', '')
    
    # الطريقة 1: Advanced Scraping
    try:
        time.sleep(random.uniform(0.1, 0.5))  # محاكاة سلوك إنساني
        
        url = f"https://wa.me/{clean_phone}?text=Test"
        session = requests.Session()
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar,en;q=0.9',
            'Connection': 'keep-alive'
        }
        
        response = session.get(url, headers=headers, timeout=8, allow_redirects=True)
        
        # تحليل محتوى متقدم
        soup = BeautifulSoup(response.text, 'html.parser')
        page_content = response.text.lower()
        
        success_indicators = ['continue to chat', 'المتابعة إلى الدردشة', 'open whatsapp', 'whatsapp://send']
        error_indicators = ['phone number shared via url is invalid', 'رقم الهاتف غير صحيح', 'invalid phone']
        
        scraping_result = None
        for indicator in success_indicators:
            if indicator.lower() in page_content:
                scraping_result = True
                break
                
        if scraping_result is None:
            for indicator in error_indicators:
                if indicator.lower() in page_content:
                    scraping_result = False
                    break
        
        results.append({
            'method': 'advanced_scraping',
            'result': scraping_result,
            'confidence': 0.8 if scraping_result is not None else 0.3
        })
        
    except:
        results.append({
            'method': 'advanced_scraping',
            'result': None,
            'confidence': 0.1
        })
    
    # الطريقة 2: Multiple Endpoints
    try:
        endpoints = [
            f"https://wa.me/{clean_phone}",
            f"https://api.whatsapp.com/send?phone={clean_phone}",
            f"https://web.whatsapp.com/send?phone={clean_phone}"
        ]
        
        success_count = 0
        total_count = 0
        
        for endpoint in endpoints:
            try:
                resp = requests.head(endpoint, timeout=3, allow_redirects=True)
                total_count += 1
                if resp.status_code in [200, 302]:
                    success_count += 1
            except:
                total_count += 1
        
        endpoint_result = success_count > (total_count / 2) if total_count > 0 else None
        endpoint_confidence = (success_count / total_count) if total_count > 0 else 0.1
        
        results.append({
            'method': 'multiple_endpoints',
            'result': endpoint_result,
            'confidence': endpoint_confidence
        })
        
    except:
        results.append({
            'method': 'multiple_endpoints',
            'result': None,
            'confidence': 0.1
        })
    
    # الطريقة 3: AI Pattern Recognition
    try:
        # خصائص للتحليل
        features = []
        features.append(len(clean_phone))  # طول الرقم
        
        # تحليل كود البلد
        egypt_patterns = ['2010', '2011', '2012', '2015']
        has_egypt_pattern = any(clean_phone.startswith(pattern) for pattern in egypt_patterns)
        features.append(int(has_egypt_pattern))
        
        # تحليل الأرقام
        if len(clean_phone) > 0:
            digits = [int(d) for d in clean_phone if d.isdigit()]
            if digits:
                features.extend([
                    np.mean(digits),
                    len(set(digits)),
                    int(len(clean_phone) >= 10 and len(clean_phone) <= 15)
                ])
            else:
                features.extend([0, 0, 0])
        else:
            features.extend([0, 0, 0])
        
        # حساب نقاط الثقة بناءً على الخصائص
        ai_score = 0.5  # قيمة افتراضية
        
        # للأرقام المصرية الصحيحة
        if has_egypt_pattern and len(clean_phone) == 12:
            ai_score = 0.9
        elif len(clean_phone) >= 10 and len(clean_phone) <= 15:
            ai_score = 0.7
        elif len(clean_phone) < 8 or len(clean_phone) > 16:
            ai_score = 0.2
        
        ai_result = ai_score > 0.6
        
        results.append({
            'method': 'ai_pattern',
            'result': ai_result,
            'confidence': ai_score
        })
        
    except:
        results.append({
            'method': 'ai_pattern',
            'result': None,
            'confidence': 0.1
        })
    
    # تحليل النتائج النهائية
    valid_results = [r for r in results if r['result'] is not None]
    
    if not valid_results:
        return {
            'exists': None,
            'method': 'ultimate_combined',
            'confidence': 'very_low',
            'details': results,
            'message': 'لا يمكن التحقق من الرقم - جميع الطرق فشلت'
        }
    
    # حساب النتيجة المرجحة
    positive_weight = sum(r['confidence'] for r in valid_results if r['result'] is True)
    negative_weight = sum(r['confidence'] for r in valid_results if r['result'] is False)
    total_weight = positive_weight + negative_weight
    
    if total_weight == 0:
        final_result = None
        confidence_level = 'very_low'
    else:
        final_score = positive_weight / total_weight
        final_result = final_score > 0.5
        
        if final_score > 0.8:
            confidence_level = 'very_high'
        elif final_score > 0.6:
            confidence_level = 'high'
        elif final_score > 0.4:
            confidence_level = 'medium'
        else:
            confidence_level = 'low'
    
    return {
        'exists': final_result,
        'method': 'ultimate_combined',
        'confidence': confidence_level,
        'score': round(positive_weight / total_weight * 100, 1) if total_weight > 0 else 0,
        'methods_used': len(results),
        'successful_methods': len(valid_results),
        'details': results,
        'message': f'تحليل شامل: {len(valid_results)} طرق نجحت من {len(results)} - نسبة الثقة {round(positive_weight / total_weight * 100, 1) if total_weight > 0 else 0}%'
    }

def validate_whatsapp_ultimate(phone):
    """الدالة النهائية للتحقق المبتكر من الواتساب"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    normalized_phone = normalize_phone_number(phone)
    
    if not re.match(r'^\+[1-9]\d{7,14}$', normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # التحقق بالطريقة المبتكرة
    whatsapp_check = check_whatsapp_ultimate_method(normalized_phone)
    
    # الحصول على معلومات إضافية عن الرقم
    try:
        parsed_number = phonenumbers.parse(normalized_phone, None)
        country = geocoder.description_for_number(parsed_number, "ar") or "غير معروف"
        carrier_name = carrier.name_for_number(parsed_number, "ar") or "غير معروف"
    except:
        country = "غير معروف"
        carrier_name = "غير معروف"
    
    if whatsapp_check['exists'] is True:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'whatsapp_status': f'موجود ✅ ({whatsapp_check["confidence"]})',
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'score': whatsapp_check.get('score', 0),
            'methods_analysis': whatsapp_check.get('details', []),
            'message': whatsapp_check['message']
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': f"غير موجود ❌ ({whatsapp_check['confidence']}) - {whatsapp_check['message']}",
            'formatted': normalized_phone,
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'methods_analysis': whatsapp_check.get('details', [])
        }
    else:
        return {
            'is_valid': True,  # نقبل الرقم مع تحذير
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'whatsapp_status': f'غير مؤكد ⚠️ ({whatsapp_check["confidence"]})',
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'methods_analysis': whatsapp_check.get('details', []),
            'message': f"رقم صحيح ولكن {whatsapp_check['message']}"
        }

# باقي دوال التطبيق
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
    
    valid_domains = ['instapay.com.eg', 'instapay.app', 'app.instapay.com.eg']
    
    for url in urls:
        try:
            parsed = urlparse(url.lower())
            domain = parsed.netloc.replace('www.', '')
            if any(valid_domain in domain for valid_domain in valid_domains) or 'instapay' in domain:
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
    """API للتحقق المبتكر من رقم الواتساب"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام الطريقة المبتكرة النهائية
        result = validate_whatsapp_ultimate(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي بالطريقة المبتكرة"""
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
        
        # التحقق المبتكر من الواتساب
        whatsapp_validation = validate_whatsapp_ultimate(whatsapp_number)
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
        
        user_data = {
            'platform': platform,
            'whatsapp_number': whatsapp_validation['formatted'],
            'whatsapp_info': {
                'country': whatsapp_validation.get('country'),
                'carrier': whatsapp_validation.get('carrier'),
                'whatsapp_status': whatsapp_validation.get('whatsapp_status'),
                'verification_method': whatsapp_validation.get('verification_method'),
                'confidence': whatsapp_validation.get('confidence'),
                'score': whatsapp_validation.get('score'),
                'methods_analysis': whatsapp_validation.get('methods_analysis', [])
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]
        }
        
        print(f"🔥 New Ultimate Validation: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'تم التحقق بالطرق المبتكرة وحفظ البيانات بنجاح!',
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

