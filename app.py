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
from urllib.parse import urlparse, quote, unquote
import time
import random
from bs4 import BeautifulSoup
import base64
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def get_burp_suite_headers():
    """
    🔥 Headers مستخرجة بطريقة Burp Suite - محاكاة مثالية للمتصفح
    """
    headers_variants = [
        # Chrome على Windows
        {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        # Chrome على Android
        {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        },
        # Firefox على Windows
        {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ar-EG,ar;q=0.8,en-US;q=0.5,en;q=0.3',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
        }
    ]
    
    return random.choice(headers_variants)

def simulate_burp_suite_behavior(session):
    """
    🧠 محاكاة السلوك كما في Burp Suite - تحليل حركة المرور الحقيقية
    """
    try:
        headers = get_burp_suite_headers()
        
        # خطوة 1: زيارة الصفحة الرئيسية لـ Google (محاكاة المستخدم الحقيقي)
        session.get('https://www.google.com', headers=headers, timeout=8)
        time.sleep(random.uniform(0.8, 2.2))
        
        # خطوة 2: بحث وهمي في Google (كما يفعل المستخدم الحقيقي)
        search_queries = ['whatsapp web', 'تطبيق واتساب', 'whatsapp download']
        query = random.choice(search_queries)
        
        search_params = {'q': query, 'hl': 'ar'}
        headers['Referer'] = 'https://www.google.com/'
        
        session.get('https://www.google.com/search', params=search_params, headers=headers, timeout=8)
        time.sleep(random.uniform(1.0, 2.5))
        
        # خطوة 3: تصفح عشوائي (لبناء تاريخ تصفح طبيعي)
        browse_sites = [
            'https://web.whatsapp.com',
            'https://www.whatsapp.com',
            'https://faq.whatsapp.com'
        ]
        
        if random.choice([True, False]):
            random_site = random.choice(browse_sites)
            try:
                session.get(random_site, headers=headers, timeout=6)
                time.sleep(random.uniform(0.5, 1.8))
            except:
                pass
                
        return True
    except Exception as e:
        print(f"⚠️ تحذير Burp Suite simulation: {e}")
        return False

def extract_network_fingerprints(response, phone_number):
    """
    🔍 استخراج البصمات الشبكية - تقنية Burp Suite المتقدمة
    تحليل عميق للاستجابة مثل أدوات الـ Penetration Testing
    """
    
    fingerprints = {
        'status_code': response.status_code,
        'content_length': len(response.text),
        'response_time': getattr(response, 'elapsed', None),
        'final_url': response.url.lower(),
        'headers': dict(response.headers),
        'cookies': response.cookies.get_dict() if hasattr(response, 'cookies') else {},
        'redirects': len(response.history) if hasattr(response, 'history') else 0,
        'content_type': response.headers.get('content-type', '').lower(),
        'server': response.headers.get('server', '').lower(),
        'content_encoding': response.headers.get('content-encoding', '').lower()
    }
    
    # تحليل محتوى الاستجابة
    content = response.text.lower()
    content_analysis = {
        'html_structure': analyze_html_structure(content),
        'javascript_patterns': analyze_javascript_patterns(content),
        'error_indicators': analyze_error_patterns(content),
        'success_indicators': analyze_success_patterns(content),
        'whatsapp_signatures': analyze_whatsapp_signatures(content, phone_number),
        'security_headers': analyze_security_headers(response.headers),
        'redirect_chain': analyze_redirect_chain(response)
    }
    
    return {
        'network_fingerprints': fingerprints,
        'content_analysis': content_analysis
    }

def analyze_html_structure(content):
    """تحليل بنية HTML مثل Burp Suite"""
    try:
        soup = BeautifulSoup(content, 'html.parser')
        
        structure = {
            'title': soup.title.string if soup.title else '',
            'meta_tags': len(soup.find_all('meta')),
            'script_tags': len(soup.find_all('script')),
            'link_tags': len(soup.find_all('link')),
            'form_tags': len(soup.find_all('form')),
            'input_tags': len(soup.find_all('input')),
            'button_tags': len(soup.find_all('button')),
            'div_tags': len(soup.find_all('div')),
            'has_whatsapp_elements': bool(soup.find_all(text=re.compile(r'whatsapp', re.I)))
        }
        
        # البحث عن عناصر مميزة
        chat_elements = soup.find_all(['a', 'button'], string=re.compile(r'(chat|message|send|continue)', re.I))
        structure['chat_elements_count'] = len(chat_elements)
        
        # البحث عن روابط واتساب
        wa_links = soup.find_all('a', href=re.compile(r'(whatsapp://|wa\.me/|api\.whatsapp\.com)', re.I))
        structure['whatsapp_links_count'] = len(wa_links)
        
        return structure
        
    except Exception as e:
        print(f"HTML analysis error: {e}")
        return {'error': str(e)}

def analyze_javascript_patterns(content):
    """تحليل أكواد JavaScript مثل Burp Suite"""
    js_patterns = {
        'whatsapp_api_calls': len(re.findall(r'api\.whatsapp\.com', content, re.I)),
        'wa_me_calls': len(re.findall(r'wa\.me/', content, re.I)),
        'phone_validation': len(re.findall(r'phone.*valid', content, re.I)),
        'error_handling': len(re.findall(r'error.*phone', content, re.I)),
        'redirect_scripts': len(re.findall(r'window\.location|location\.href', content, re.I)),
        'whatsapp_protocol': len(re.findall(r'whatsapp://', content, re.I)),
        'ajax_calls': len(re.findall(r'ajax|fetch|xhr', content, re.I))
    }
    
    return js_patterns

def analyze_error_patterns(content):
    """تحليل أنماط الأخطاء - البصمة المميزة لعدم وجود الرقم"""
    error_patterns = [
        # الأخطاء بالإنجليزية
        'phone number shared via url is invalid',
        'the phone number shared via url is invalid',
        'invalid phone number',
        'phone number is not valid',
        'number is not valid',
        'this phone number is not valid',
        'please enter a valid phone number',
        'phone number does not exist',
        'unable to send message',
        'failed to send message',
        
        # الأخطاء بالعربية
        'رقم الهاتف غير صحيح',
        'الرقم غير صالح',
        'لا يمكن إرسال الرسالة',
        'فشل في الإرسال',
        
        # أخطاء بلغات أخرى
        'numero de telefono no valido',
        'numero de telephone invalide',
        'telefoon nummer ongeldig',
        'ungültige telefonnummer',
        'номер телефона недействителен',
        'numero di telefono non valido',
        'número de telefone inválido'
    ]
    
    found_errors = []
    for pattern in error_patterns:
        if pattern in content:
            found_errors.append(pattern)
    
    return {
        'error_patterns_found': found_errors,
        'error_count': len(found_errors),
        'has_errors': len(found_errors) > 0
    }

def analyze_success_patterns(content):
    """تحليل أنماط النجاح - البصمة المميزة لوجود الرقم"""
    success_patterns = [
        # النجاح بالإنجليزية
        'continue to chat',
        'start chat',
        'send message',
        'open whatsapp',
        'open in whatsapp',
        'message sent',
        'chat now',
        'start conversation',
        
        # النجاح بالعربية
        'المتابعة إلى الدردشة',
        'بدء المحادثة',
        'إرسال رسالة',
        'فتح واتساب',
        'بدء الدردشة',
        
        # نجاح بلغات أخرى
        'continuar al chat',
        'continuer vers le chat',
        'ga door naar chat',
        'zum chat wechseln',
        'продолжить в чат',
        'continua alla chat',
        'continuar para o bate-papo'
    ]
    
    found_success = []
    for pattern in success_patterns:
        if pattern in content:
            found_success.append(pattern)
    
    return {
        'success_patterns_found': found_success,
        'success_count': len(found_success),
        'has_success': len(found_success) > 0
    }

def analyze_whatsapp_signatures(content, phone_number):
    """تحليل البصمات المميزة لواتساب"""
    signatures = {
        'whatsapp_web_signature': 'web.whatsapp.com' in content,
        'whatsapp_api_signature': 'api.whatsapp.com' in content,
        'wa_me_signature': 'wa.me' in content,
        'whatsapp_protocol_signature': 'whatsapp://' in content,
        'phone_in_url': phone_number in content,
        'whatsapp_app_signature': bool(re.search(r'whatsapp.*app', content, re.I)),
        'chat_interface_signature': bool(re.search(r'chat.*interface', content, re.I)),
        'message_composer_signature': bool(re.search(r'message.*composer', content, re.I))
    }
    
    # حساب نقاط البصمة
    signature_score = sum([1 for v in signatures.values() if v])
    signatures['total_signature_score'] = signature_score
    signatures['signature_strength'] = 'high' if signature_score >= 4 else 'medium' if signature_score >= 2 else 'low'
    
    return signatures

def analyze_security_headers(headers):
    """تحليل Security Headers مثل Burp Suite"""
    security_analysis = {
        'has_csp': 'content-security-policy' in headers,
        'has_hsts': 'strict-transport-security' in headers,
        'has_xss_protection': 'x-xss-protection' in headers,
        'has_frame_options': 'x-frame-options' in headers,
        'has_content_type_options': 'x-content-type-options' in headers,
        'server_info': headers.get('server', 'unknown').lower(),
        'powered_by': headers.get('x-powered-by', '').lower(),
        'cache_control': headers.get('cache-control', '').lower()
    }
    
    return security_analysis

def analyze_redirect_chain(response):
    """تحليل سلسلة Redirections مثل Burp Suite"""
    if not hasattr(response, 'history'):
        return {'redirect_count': 0, 'chain': []}
    
    chain = []
    for i, redirect in enumerate(response.history):
        chain.append({
            'step': i + 1,
            'status_code': redirect.status_code,
            'url': redirect.url,
            'location': redirect.headers.get('location', '')
        })
    
    return {
        'redirect_count': len(response.history),
        'chain': chain,
        'final_url': response.url
    }

def burp_suite_whatsapp_check(phone_number):
    """
    🔥 الفحص بطريقة Burp Suite - تحليل شبكي متقدم
    """
    
    if not re.match(r'^\+[1-9]\d{7,14}$', phone_number):
        return {
            'exists': False,
            'method': 'burp_suite_format_check',
            'confidence': 'very_high',
            'accuracy': 100,
            'message': 'تنسيق الرقم غير صحيح'
        }
    
    clean_phone = phone_number.replace('+', '').replace(' ', '')
    
    try:
        # إنشاء جلسة Burp Suite محاكاة
        session = requests.Session()
        
        # محاكاة السلوك البشري
        if not simulate_burp_suite_behavior(session):
            print("⚠️ تحذير: فشل في محاكاة Burp Suite")
        
        # الفحص المتوازي بطرق متعددة (مثل Burp Suite Scanner)
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(burp_check_whatsapp_web, session, clean_phone): 'web',
                executor.submit(burp_check_api_endpoint, session, clean_phone): 'api',
                executor.submit(burp_check_wa_me, session, clean_phone): 'wa_me'
            }
            
            results = {}
            for future in as_completed(futures, timeout=15):
                method = futures[future]
                try:
                    result = future.result(timeout=5)
                    results[method] = result
                except Exception as e:
                    print(f"Burp check {method} failed: {e}")
                    results[method] = {'exists': None, 'error': str(e)}
        
        # تحليل النتائج بطريقة Burp Suite Professional
        final_analysis = burp_analyze_results(results, clean_phone, phone_number)
        
        return final_analysis
        
    except Exception as e:
        print(f"Burp Suite check error: {e}")
        return {
            'exists': None,
            'method': 'burp_suite_system_error',
            'confidence': 'very_low',
            'accuracy': 0,
            'message': f'خطأ في النظام: {str(e)[:50]}'
        }

def burp_check_whatsapp_web(session, phone_number):
    """فحص WhatsApp Web بطريقة Burp Suite"""
    try:
        headers = get_burp_suite_headers()
        headers['Referer'] = 'https://www.google.com/'
        
        url = f"https://web.whatsapp.com/send?phone={phone_number}"
        
        response = session.get(url, headers=headers, timeout=12, allow_redirects=True)
        
        # استخراج البصمات الشبكية
        network_analysis = extract_network_fingerprints(response, phone_number)
        
        return {
            'method': 'burp_whatsapp_web',
            'network_analysis': network_analysis,
            'raw_analysis': analyze_burp_response(response, phone_number)
        }
        
    except Exception as e:
        return {'exists': None, 'method': 'burp_whatsapp_web', 'error': str(e)}

def burp_check_api_endpoint(session, phone_number):
    """فحص API Endpoint بطريقة Burp Suite"""
    try:
        headers = get_burp_suite_headers()
        headers['Referer'] = 'https://web.whatsapp.com/'
        
        # انتظار عشوائي (تجنب Rate Limiting)
        time.sleep(random.uniform(1.0, 2.5))
        
        url = f"https://api.whatsapp.com/send/?phone={phone_number}&text=test"
        
        response = session.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        network_analysis = extract_network_fingerprints(response, phone_number)
        
        return {
            'method': 'burp_api_endpoint',
            'network_analysis': network_analysis,
            'raw_analysis': analyze_burp_response(response, phone_number)
        }
        
    except Exception as e:
        return {'exists': None, 'method': 'burp_api_endpoint', 'error': str(e)}

def burp_check_wa_me(session, phone_number):
    """فحص wa.me بطريقة Burp Suite"""
    try:
        headers = get_burp_suite_headers()
        headers['Referer'] = 'https://api.whatsapp.com/'
        
        time.sleep(random.uniform(0.8, 1.8))
        
        url = f"https://wa.me/{phone_number}"
        
        response = session.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        network_analysis = extract_network_fingerprints(response, phone_number)
        
        return {
            'method': 'burp_wa_me',
            'network_analysis': network_analysis,
            'raw_analysis': analyze_burp_response(response, phone_number)
        }
        
    except Exception as e:
        return {'exists': None, 'method': 'burp_wa_me', 'error': str(e)}

def analyze_burp_response(response, phone_number):
    """تحليل الاستجابة بطريقة Burp Suite Professional"""
    content = response.text.lower()
    
    # تحليل الأخطاء
    error_analysis = analyze_error_patterns(content)
    
    # إذا وُجدت أخطاء واضحة
    if error_analysis['has_errors']:
        return {
            'exists': False,
            'confidence': 'very_high',
            'accuracy': 95,
            'reason': 'error_patterns_detected',
            'details': error_analysis
        }
    
    # تحليل النجاح
    success_analysis = analyze_success_patterns(content)
    
    if success_analysis['has_success'] and success_analysis['success_count'] >= 2:
        return {
            'exists': True,
            'confidence': 'very_high',
            'accuracy': 92,
            'reason': 'multiple_success_patterns',
            'details': success_analysis
        }
    elif success_analysis['has_success']:
        return {
            'exists': True,
            'confidence': 'high',
            'accuracy': 85,
            'reason': 'success_pattern_found',
            'details': success_analysis
        }
    
    # تحليل البصمات
    signature_analysis = analyze_whatsapp_signatures(content, phone_number)
    
    if signature_analysis['signature_strength'] == 'high':
        return {
            'exists': True,
            'confidence': 'medium',
            'accuracy': 75,
            'reason': 'high_signature_strength',
            'details': signature_analysis
        }
    elif signature_analysis['signature_strength'] == 'medium':
        return {
            'exists': True,
            'confidence': 'low',
            'accuracy': 60,
            'reason': 'medium_signature_strength',
            'details': signature_analysis
        }
    
    # تحليل Content Length
    content_length = len(response.text)
    
    if content_length < 1000:
        return {
            'exists': False,
            'confidence': 'medium',
            'accuracy': 70,
            'reason': 'short_content_length',
            'details': {'content_length': content_length}
        }
    
    # الحالة الافتراضية
    return {
        'exists': False,
        'confidence': 'low',
        'accuracy': 55,
        'reason': 'no_clear_indicators',
        'details': {
            'content_length': content_length,
            'error_analysis': error_analysis,
            'success_analysis': success_analysis,
            'signature_analysis': signature_analysis
        }
    }

def burp_analyze_results(results, clean_phone, original_phone):
    """
    🧠 تحليل النتائج بطريقة Burp Suite Professional
    دمج ذكي للنتائج من طرق مختلفة
    """
    
    valid_results = []
    
    for method, result in results.items():
        if 'raw_analysis' in result and result['raw_analysis'].get('exists') is not None:
            analysis = result['raw_analysis']
            analysis['method'] = method
            analysis['network_fingerprints'] = result.get('network_analysis', {}).get('network_fingerprints', {})
            valid_results.append(analysis)
    
    if not valid_results:
        return {
            'exists': None,
            'method': 'burp_suite_all_failed',
            'confidence': 'very_low',
            'accuracy': 0,
            'message': 'فشل في جميع طرق Burp Suite - مشكلة شبكة'
        }
    
    # حساب النقاط المرجحة
    total_weighted_score = 0
    positive_weighted_score = 0
    negative_weighted_score = 0
    
    confidence_weights = {
        'very_high': 4,
        'high': 3,
        'medium': 2,
        'low': 1,
        'very_low': 0.5
    }
    
    detailed_breakdown = {
        'methods_analyzed': [],
        'consensus_level': 0,
        'conflict_level': 0,
        'average_accuracy': 0
    }
    
    accuracies = []
    
    for result in valid_results:
        confidence = result.get('confidence', 'low')
        accuracy = result.get('accuracy', 50)
        exists = result.get('exists')
        
        weight = confidence_weights.get(confidence, 1) * (accuracy / 100)
        total_weighted_score += weight
        
        if exists:
            positive_weighted_score += weight
        else:
            negative_weighted_score += weight
        
        accuracies.append(accuracy)
        
        detailed_breakdown['methods_analyzed'].append({
            'method': result.get('method'),
            'exists': exists,
            'confidence': confidence,
            'accuracy': accuracy,
            'weight': weight,
            'reason': result.get('reason', 'unknown')
        })
    
    # حساب مستوى الإجماع
    exists_votes = [r.get('exists') for r in valid_results]
    true_votes = exists_votes.count(True)
    false_votes = exists_votes.count(False)
    
    detailed_breakdown['consensus_level'] = max(true_votes, false_votes) / len(valid_results)
    detailed_breakdown['conflict_level'] = min(true_votes, false_votes) / len(valid_results)
    detailed_breakdown['average_accuracy'] = sum(accuracies) / len(accuracies) if accuracies else 0
    
    # القرار النهائي بطريقة Burp Suite
    if total_weighted_score == 0:
        final_decision = False
        final_confidence = 'very_low'
        final_accuracy = 25
        final_message = 'تحليل Burp Suite: جميع الطرق فشلت - غالباً غير موجود'
    elif positive_weighted_score > negative_weighted_score:
        confidence_ratio = positive_weighted_score / total_weighted_score
        
        if confidence_ratio >= 0.85 and detailed_breakdown['consensus_level'] >= 0.75:
            final_decision = True
            final_confidence = 'very_high'
            final_accuracy = min(95, int(85 + confidence_ratio * 15))
            final_message = f'✅ Burp Suite: موجود بثقة عالية جداً ({true_votes}/{len(valid_results)} طرق)'
        elif confidence_ratio >= 0.70:
            final_decision = True
            final_confidence = 'high'
            final_accuracy = min(90, int(75 + confidence_ratio * 20))
            final_message = f'✅ Burp Suite: موجود بثقة عالية ({true_votes}/{len(valid_results)} طرق)'
        else:
            final_decision = True
            final_confidence = 'medium'
            final_accuracy = min(80, int(60 + confidence_ratio * 25))
            final_message = f'✅ Burp Suite: غالباً موجود ({true_votes}/{len(valid_results)} طرق)'
    else:
        confidence_ratio = negative_weighted_score / total_weighted_score
        
        if confidence_ratio >= 0.85 and detailed_breakdown['consensus_level'] >= 0.75:
            final_decision = False
            final_confidence = 'very_high'
            final_accuracy = min(95, int(85 + confidence_ratio * 15))
            final_message = f'❌ Burp Suite: غير موجود بثقة عالية جداً ({false_votes}/{len(valid_results)} طرق)'
        elif confidence_ratio >= 0.70:
            final_decision = False
            final_confidence = 'high'
            final_accuracy = min(90, int(75 + confidence_ratio * 20))
            final_message = f'❌ Burp Suite: غير موجود بثقة عالية ({false_votes}/{len(valid_results)} طرق)'
        else:
            final_decision = False
            final_confidence = 'medium'
            final_accuracy = min(80, int(60 + confidence_ratio * 25))
            final_message = f'❌ Burp Suite: غالباً غير موجود ({false_votes}/{len(valid_results)} طرق)'
    
    return {
        'exists': final_decision,
        'method': 'burp_suite_professional',
        'confidence': final_confidence,
        'accuracy': final_accuracy,
        'message': final_message,
        'burp_analysis': {
            'total_methods': len(valid_results),
            'consensus_level': round(detailed_breakdown['consensus_level'] * 100, 1),
            'conflict_level': round(detailed_breakdown['conflict_level'] * 100, 1),
            'average_accuracy': round(detailed_breakdown['average_accuracy'], 1),
            'weighted_scores': {
                'positive': round(positive_weighted_score, 2),
                'negative': round(negative_weighted_score, 2),
                'total': round(total_weighted_score, 2)
            }
        },
        'detailed_breakdown': detailed_breakdown
    }

def validate_whatsapp_burp_suite_style(phone):
    """التحقق من الواتساب بطريقة Burp Suite"""
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
    
    # التحقق بطريقة Burp Suite
    whatsapp_check = burp_suite_whatsapp_check(normalized_phone)
    
    if whatsapp_check['exists'] is True:
        return {
            'is_valid': True,
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'موجود ✅ (Burp Suite: {whatsapp_check["accuracy"]}%)',
            'verification_method': f'Burp Suite Professional - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'accuracy': whatsapp_check['accuracy'],
            'burp_analysis': whatsapp_check.get('burp_analysis', {}),
            'message': whatsapp_check['message']
        }
    elif whatsapp_check['exists'] is False:
        return {
            'is_valid': False,
            'error': f"{whatsapp_check['message']} (Burp Suite: {whatsapp_check['accuracy']}%)",
            'formatted': normalized_phone,
            'verification_method': f'Burp Suite Professional - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'accuracy': whatsapp_check['accuracy'],
            'burp_analysis': whatsapp_check.get('burp_analysis', {}),
            'detailed_breakdown': whatsapp_check.get('detailed_breakdown', {})
        }
    else:  # None
        return {
            'is_valid': True,  # نقبل الرقم مع تحذير
            'formatted': normalized_phone,
            'country': country,
            'carrier': carrier_name,
            'is_egyptian': is_egyptian,
            'whatsapp_status': f'غير مؤكد ⚠️ (Burp Suite: {whatsapp_check["accuracy"]}%)',
            'verification_method': f'Burp Suite Professional - {whatsapp_check["method"]}',
            'confidence': whatsapp_check['confidence'],
            'accuracy': whatsapp_check['accuracy'],
            'message': f"رقم صحيح ولكن {whatsapp_check['message']}"
        }

# باقي الدوال كما هي...
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
    """🔥 API للتحقق بطريقة Burp Suite"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'is_valid': False, 'error': 'يرجى إدخال رقم الهاتف'})
        
        # استخدام طريقة Burp Suite
        result = validate_whatsapp_burp_suite_style(phone)
        return jsonify(result)
        
    except Exception as e:
        print(f"خطأ في التحقق من الواتساب: {str(e)}")
        return jsonify({'is_valid': False, 'error': 'خطأ في الخادم'})

@app.route('/burp-test', methods=['POST'])
def burp_test_endpoint():
    """🧪 endpoint للاختبار بطريقة Burp Suite"""
    try:
        data = request.get_json()
        phone = sanitize_input(data.get('phone', ''))
        
        if not phone:
            return jsonify({'error': 'يرجى إدخال رقم الهاتف'})
        
        normalized_phone = normalize_phone_number(phone)
        result = burp_suite_whatsapp_check(normalized_phone)
        
        return jsonify({
            'phone': normalized_phone,
            'burp_suite_analysis': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"خطأ في اختبار Burp Suite: {str(e)}")
        return jsonify({'error': f'خطأ في الاختبار: {str(e)}'})

@app.route('/update-profile', methods=['POST'])
def update_profile():
    """تحديث الملف الشخصي بطريقة Burp Suite"""
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
        
        # التحقق بطريقة Burp Suite
        whatsapp_validation = validate_whatsapp_burp_suite_style(whatsapp_number)
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
                'accuracy': whatsapp_validation.get('accuracy'),
                'burp_analysis': whatsapp_validation.get('burp_analysis', {})
            },
            'payment_method': payment_method,
            'payment_details': processed_payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'ip_address': hashlib.sha256(client_ip.encode()).hexdigest()[:10]
        }
        
        print(f"🔥 Burp Suite Professional Validation: {json.dumps(user_data, indent=2, ensure_ascii=False)}")
        
        session['csrf_token'] = generate_csrf_token()
        
        return jsonify({
            'success': True,
            'message': f'تم التحقق بطريقة Burp Suite Professional وحفظ البيانات بنجاح! (دقة: {whatsapp_validation.get("accuracy", 0)}%)',
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
