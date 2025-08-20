# telegram_manager.py - وزارة التليجرام المستقلة
"""
🤖 وزارة التليجرام - FC 26 Profile System
==========================================
مسؤولة عن جميع عمليات التليجرام والربط
- إدارة بوت التليجرام
- توليد الأكواد وإدارة الـ webhooks
- ربط الحسابات والإشعارات
- معالجة الرسائل والردود
"""

import os
import secrets
import json
import requests
from datetime import datetime
import hashlib


class TelegramManager:
    """الكلاس الأساسي لإدارة التليجرام"""
    
    def __init__(self):
        self.bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        self.bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', 'YourBotName_bot')
        self.webhook_url = os.environ.get('TELEGRAM_WEBHOOK_URL')
        
        # قاعدة بيانات الأكواد في الذاكرة (يمكن تحويلها لقاعدة بيانات لاحقاً)
        self.telegram_codes = {}
        self.users_data = {}
    
    def generate_telegram_code(self):
        """توليد كود فريد للتليجرام"""
        return secrets.token_urlsafe(6).upper().replace('_', '').replace('-', '')[:8]
    
    def create_telegram_code(self, platform, whatsapp_number, payment_method, payment_details, telegram_username):
        """إنشاء كود تليجرام جديد مع البيانات"""
        telegram_code = self.generate_telegram_code()
        
        # حفظ البيانات في الذاكرة المؤقتة
        self.telegram_codes[telegram_code] = {
            'code': telegram_code,
            'platform': platform,
            'whatsapp_number': whatsapp_number,
            'payment_method': payment_method,
            'payment_details': payment_details,
            'telegram_username': telegram_username,
            'created_at': datetime.now().isoformat(),
            'used': False
        }
        
        telegram_link = f"https://t.me/{self.bot_username}?start={telegram_code}"
        
        print(f"🤖 Generated Telegram Code: {telegram_code} for {whatsapp_number}")
        
        return {
            'success': True,
            'code': telegram_code,
            'telegram_link': telegram_link,
            'message': f'تم إنشاء الكود: {telegram_code}'
        }
    
    def notify_website_telegram_linked(self, code, profile_data, chat_id, first_name, username):
        """إشعار الموقع بنجاح ربط التليجرام"""
        try:
            # تحديث بيانات المستخدم
            user_id = hashlib.md5(f"{profile_data['whatsapp_number']}-telegram-{code}".encode()).hexdigest()[:12]
            
            updated_user_data = {
                **profile_data,
                'telegram_linked': True,
                'telegram_chat_id': chat_id,
                'telegram_first_name': first_name,
                'telegram_username_actual': username,
                'telegram_linked_at': datetime.now().isoformat(),
                'user_id': user_id
            }
            
            # حفظ في بيانات المستخدمين
            self.users_data[user_id] = updated_user_data
            
            print(f"🔗 Telegram Linked Successfully!")
            print(f"   User: {first_name} (@{username})")
            print(f"   WhatsApp: {profile_data['whatsapp_number']}")
            print(f"   Platform: {profile_data['platform']}")
            print(f"   Code: {code}")
            print(f"   Chat ID: {chat_id}")
            
            return True, updated_user_data
            
        except Exception as e:
            print(f"خطأ في إشعار الموقع: {str(e)}")
            return False, None
    
    def get_payment_display_text(self, payment_method, payment_details):
        """تنسيق نص عرض طريقة الدفع"""
        if not payment_details:
            return ""
        
        payment_names = {
            'vodafone_cash': 'فودافون كاش',
            'etisalat_cash': 'اتصالات كاش',
            'orange_cash': 'أورانج كاش',
            'we_cash': 'وي كاش',
            'bank_wallet': 'محفظة بنكية',
            'tilda': 'بطاقة تيلدا',
            'instapay': 'رابط إنستا باي'
        }
        
        method_name = payment_names.get(payment_method, payment_method)
        
        if payment_method == 'instapay':
            return f"🔗 {method_name}: {payment_details}"
        elif payment_method == 'tilda':
            masked_card = f"**** **** **** {payment_details[-4:]}" if len(payment_details) >= 4 else payment_details
            return f"💳 {method_name}: {masked_card}"
        else:
            return f"📱 {method_name}: {payment_details}"
    
    def process_telegram_webhook(self, update_data):
        """معالجة webhook من التليجرام"""
        try:
            print(f"🤖 Telegram Webhook received: {json.dumps(update_data, indent=2, ensure_ascii=False)}")
            
            if 'message' not in update_data:
                return {'ok': True}
            
            message = update_data['message']
            text = message.get('text', '').strip().upper()
            chat_id = message['chat']['id']
            username = message.get('from', {}).get('username', 'Unknown')
            first_name = message.get('from', {}).get('first_name', 'مستخدم')
            
            # التحقق من كود /start
            if text.startswith('/START'):
                if ' ' in text:
                    code = text.replace('/START ', '').strip().upper()
                    print(f"🔍 Looking for /start code: {code}")
                    
                    # البحث عن الكود في الذاكرة
                    if code in self.telegram_codes:
                        profile_data = self.telegram_codes[code]
                        if not profile_data.get('used', False):
                            # تحديث الكود كمستخدم
                            self.telegram_codes[code]['used'] = True
                            self.telegram_codes[code]['telegram_chat_id'] = chat_id
                            self.telegram_codes[code]['telegram_username_actual'] = username
                            
                            # إرسال إشعار للموقع
                            success, user_data = self.notify_website_telegram_linked(
                                code, profile_data, chat_id, first_name, username
                            )
                            
                            if success:
                                # تحديد نص الدفع
                                payment_text = self.get_payment_display_text(
                                    profile_data['payment_method'], 
                                    profile_data.get('payment_details', '')
                                )
                                
                                # إرسال رسالة ترحيب مخصصة
                                welcome_message = f"""🎮 أهلاً بك {first_name} في FC 26 Profile System!

✅ تم ربط حسابك بنجاح!

📋 بيانات ملفك الشخصي:
🎯 المنصة: {profile_data['platform'].title()}
📱 رقم الواتساب: {profile_data['whatsapp_number']}
💳 طريقة الدفع: {profile_data['payment_method'].replace('_', ' ').title()}
{payment_text}

🔗 رابط الموقع: https://ea-fc-fifa-5jbn.onrender.com/

شكراً لاختيارك خدماتنا! 🚀"""
                                
                                # إرسال الرسالة
                                self.send_telegram_message(chat_id, welcome_message)
                                
                                return {
                                    'success': True,
                                    'message': 'تم ربط الحساب بنجاح',
                                    'user_data': user_data
                                }
                            else:
                                return {'success': False, 'message': 'فشل في ربط الحساب'}
                        else:
                            # الكود مستخدم بالفعل
                            self.send_telegram_message(chat_id, "❌ هذا الكود تم استخدامه من قبل!")
                            return {'success': False, 'message': 'الكود مستخدم'}
                    else:
                        # الكود غير موجود
                        self.send_telegram_message(chat_id, "❌ الكود غير صحيح أو منتهي الصلاحية!")
                        return {'success': False, 'message': 'كود غير صحيح'}
                else:
                    # لا يوجد كود
                    self.send_telegram_message(chat_id, "مرحباً! يرجى استخدام الرابط من الموقع للحصول على كود الربط.")
                    return {'success': False, 'message': 'لا يوجد كود'}
            else:
                # رسالة عادية
                self.send_telegram_message(chat_id, "مرحباً! يرجى استخدام الرابط من الموقع لربط حسابك.")
                return {'success': True, 'message': 'رسالة عادية'}
                
        except Exception as e:
            print(f"خطأ في معالجة webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_telegram_message(self, chat_id, message):
        """إرسال رسالة عبر التليجرام"""
        if not self.bot_token:
            print("⚠️ لا يوجد توكن للبوت")
            return False
        
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ تم إرسال رسالة تليجرام بنجاح إلى {chat_id}")
                return True
            else:
                print(f"❌ فشل إرسال رسالة تليجرام: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"خطأ في إرسال رسالة تليجرام: {str(e)}")
            return False
    
    def set_webhook(self, webhook_url):
        """تعيين webhook للبوت"""
        if not self.bot_token:
            return {'success': False, 'error': 'لا يوجد توكن للبوت'}
        
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/setWebhook"
            data = {'url': webhook_url}
            
            response = requests.post(url, json=data, timeout=10)
            result = response.json()
            
            if result.get('ok'):
                print(f"✅ تم تعيين webhook بنجاح: {webhook_url}")
                return {'success': True, 'result': result}
            else:
                print(f"❌ فشل تعيين webhook: {result}")
                return {'success': False, 'error': result.get('description')}
                
        except Exception as e:
            print(f"خطأ في تعيين webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_bot_info(self):
        """الحصول على معلومات البوت"""
        if not self.bot_token:
            return None
        
        try:
            url = f"https://api.telegram.org/bot{self.bot_token}/getMe"
            response = requests.get(url, timeout=10)
            result = response.json()
            
            if result.get('ok'):
                return result.get('result')
            else:
                return None
                
        except Exception as e:
            print(f"خطأ في الحصول على معلومات البوت: {str(e)}")
            return None
    
    def check_telegram_status(self, code):
        """فحص حالة كود التليجرام"""
        if code in self.telegram_codes:
            code_data = self.telegram_codes[code]
            return {
                'exists': True,
                'used': code_data.get('used', False),
                'created_at': code_data.get('created_at'),
                'telegram_chat_id': code_data.get('telegram_chat_id'),
                'telegram_username_actual': code_data.get('telegram_username_actual')
            }
        else:
            return {'exists': False}
    
    def get_admin_data(self):
        """الحصول على بيانات إدارية"""
        return {
            'telegram_codes_count': len(self.telegram_codes),
            'users_data_count': len(self.users_data),
            'telegram_codes': self.telegram_codes,
            'users_data': self.users_data,
            'bot_username': self.bot_username
        }


# إنشاء instance عام للاستخدام
telegram_manager = TelegramManager()

# تصدير الدوال للتوافق مع الكود الأصلي
def generate_telegram_code():
    return telegram_manager.generate_telegram_code()

def create_telegram_code(platform, whatsapp_number, payment_method, payment_details, telegram_username):
    return telegram_manager.create_telegram_code(platform, whatsapp_number, payment_method, payment_details, telegram_username)

def process_telegram_webhook(update_data):
    return telegram_manager.process_telegram_webhook(update_data)

def send_telegram_message(chat_id, message):
    return telegram_manager.send_telegram_message(chat_id, message)

def get_payment_display_text(payment_method, payment_details):
    return telegram_manager.get_payment_display_text(payment_method, payment_details)
