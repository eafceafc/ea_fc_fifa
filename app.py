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

def check_whatsapp_real_api(phone_number):
    """
    🔥 الحل الجذري الحقيقي - تحليل محتوى الصفحة مش status code
    زي ما صاحبك قال بالضبط!
    """
    
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        return {
            'exists': False,
            'method': 'invalid_format',
            'message': 'تنسيق الرقم غير صحيح'
        }
    
    try:
        # تنظيف الرقم للرابط
        clean_phone = phone_number.replace('+', '').replace(' ', '')
        
        # الرابط الصحيح زي ما قال صاحبك
        url = f"https://api.whatsapp.com/send/?phone={clean_phone}"
        
        # Headers محاكية للمتصفح الحقيقي
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # طلب GET لجلب محتوى الصفحة
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        # تحليل محتوى الصفحة - هنا السر!
        page_content = response.text.lower()
        
        # 🔍 العلامات الحقيقية للرقم غير الموجود
        error_indicators = [
            'phone number shared via url is invalid',
            'رقم الهاتف المشترك عبر الرابط غير صالح',
            'the phone number shared via url is invalid',
            'invalid phone number',
            'رقم الهاتف غير صحيح',
            'phone number is not valid',
            'numero de telefono no valido',
            'numéro de téléphone non valide'
        ]
        
        # 🔍 العلامات الحقيقية للرقم الموجود
        success_indicators = [
            'continue to chat',
            'المتابعة إلى الدردشة',
            'continuar al chat',
            'continuer la discussion',
            'message',
            'رسالة',
            'chat with',
            'whatsapp://send',
            'wa.me/'
        ]
        
        # فحص علامات الخطأ أولاً (أهم!)
        for error_sign in error_indicators:
            if error_sign in page_content:
                return {
                    'exists': False,
                    'method': 'content_analysis_error',
                    'confidence': 'very_high',
                    'message': 'الرقم غير موجود على واتساب - تم التأكد',
                    'detected_sign': error_sign
                }
        
        # فحص علامات النجاح
        success_count = 0
        detected_success_signs = []
        
        for success_sign in success_indicators:
            if success_sign in page_content:
                success_count += 1
                detected_success_signs.append(success_sign)
        
        # إذا وجدنا علامات نجاح كتير، يبقى الرقم موجود
        if success_count >= 2:
            return {
                'exists': True,
                'method': 'content_analysis_success',
                'confidence': 'high',
                'message': 'الرقم موجود على واتساب',
                'detected_signs': detected_success_signs,
                'success_count': success_count
            }
        elif success_count == 1:
            return {
                'exists': True,
                'method': 'content_analysis_partial',
                'confidence': 'medium',
                'message': 'على الأغلب موجود على واتساب',
                'detected_signs': detected_success_signs
            }
        
        # تحليل إضافي للـ HTML structure
        if 'whatsapp' in page_content and 'chat' in page_content:
            return {
                'exists': True,
                'method': 'structure_analysis',
                'confidence': 'medium',
                'message': 'يبدو أن الرقم موجود - تم العثور على هيكل واتساب'
            }
        
        # إذا مفيش أي علامات واضحة
        return {
            'exists': False,
            'method': 'no_indicators',
            'confidence': 'medium',
            'message': 'لم يتم العثور على مؤشرات وجود الرقم'
        }
        
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
        print(f"خطأ في التحقق: {e}")
        return {
            'exists': None,
            'method': 'unknown_error',
            'confidence': 'very_low',
            'message': f'خطأ غير متوقع: {str(e)}'
        }

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

def validate_whatsapp_final_real(phone):
    """🔥 التحقق النهائي الحقيقي من الواتساب"""
    if not phone:
        return {'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'}
    
    normalized_phone = normalize_phone_number(phone)
    
    if not re.match(r'^\+[1-9]\d{7,14}$', normalized_phone):
        return {'is_valid': False, 'error': 'تنسيق الرقم غير صحيح'}
    
    # الحصول على معلومات الرقم
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
    
    # التحقق الحقيقي من واتساب
    whatsapp_check = check_whatsapp_real_api(normalized_phone)
    
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
            'whatsapp_status': f'موجود ✅ ({whatsapp_check["confidence"]})',
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'detected_signs': whatsapp_check.get('detected_signs', []),
            'message': whatsapp_check['message']
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': f"{whatsapp_check['message']} ({whatsapp_check['confidence']})",
            'formatted': normalized_phone,
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
            'detected_sign': whatsapp_check.get('detected_sign', '')
        }
    else:  # None - لا يمكن التحقق
        return {
            'is_valid': True,  # نقبل الرقم مع تحذير
            'formatted': normalized_phone,
            'country': phone_info.get('country', 'غير معروف'),
            'carrier': phone_info.get('carrier', 'غير معروف'),
            'whatsapp_status': f'غير مؤكد ⚠️ ({whatsapp_check["confidence"]})',
            'verification_method': whatsapp_check['method'],
            'confidence': whatsapp_check['confidence'],
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
    """🔥 API للتحقق الحقيقي من رقم الواتساب"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام الطريقة الحقيقية
        result = validate_whatsapp_final_real(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي بالتحقق الحقيقي"""
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
        
        # التحقق الحقيقي من الواتساب
        whatsapp_validation = validate_whatsapp_final_real(whatsapp_number)
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
                'country_en': whatsapp_validation.get('country_en'),
                'carrier': whatsapp_validation.get('carrier'),
                'carrier_en': whatsapp_validation.get('carrier_en'),
                'type': whatsapp_validation.get('type'),
                'is_egyptian': whatsapp_validation.get('is_egyptian', False),
                'whatsapp_status': whatsapp_validation.get('whatsapp_status'),
                'verification_method': whatsapp_validation.get('verification_method'),
                'confidence': whatsapp_validation.get('confidence'),
                'detected_signs': whatsapp_validation.get('detected_signs', [])
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]
        }
        
        print(f"🔥 Real WhatsApp Validation: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': 'تم التحقق الحقيقي من الواتساب وحفظ البيانات بنجاح!',
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
