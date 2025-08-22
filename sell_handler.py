# sell_handler.py - وزارة بيع الكوينز المعزولة تماماً
"""
💰 وزارة بيع الكوينز - FC 26 Profile System
==========================================
نظام معزول تماماً لإدارة طلبات بيع الكوينز
- لا يؤثر على أي كود موجود
- يعمل بشكل مستقل تماماً
- يحفظ البيانات في الذاكرة مؤقتاً
"""

import os
import json
import hashlib
from datetime import datetime
import re

class SellCoinsHandler:
    """كلاس معزول تماماً لإدارة طلبات بيع الكوينز"""
    
    def __init__(self):
        # قاعدة بيانات في الذاكرة لحفظ الطلبات
        self.sell_requests = {}
        
        # معدلات التحويل الافتراضية
        self.conversion_rates = {
            'instant': 0.85,  # تحويل فوري - خصم 15%
            'normal': 1.0      # تحويل عادي - سعر كامل
        }
        
        # سعر الكوين بالجنيه المصري (افتراضي)
        self.coin_price_egp = float(os.environ.get('COINS_CONVERSION_RATE', '0.10'))
        
        # الحد الأدنى والأقصى للكوينز
        self.min_coins = 100
        self.max_coins = 1000000
        
        print("💰 وزارة بيع الكوينز جاهزة للعمل")
        print(f"   السعر الحالي: {self.coin_price_egp} جنيه للكوين")
    
    def generate_request_id(self):
        """توليد معرف فريد للطلب"""
        timestamp = datetime.now().isoformat()
        random_part = hashlib.md5(timestamp.encode()).hexdigest()[:8]
        return f"SELL_{random_part.upper()}"
    
    def calculate_price(self, coins_amount, transfer_type):
        """حساب السعر المتوقع للكوينز"""
        try:
            coins = int(coins_amount)
            
            # التحقق من الحدود
            if coins < self.min_coins:
                return {
                    'success': False,
                    'error': f'الحد الأدنى {self.min_coins} كوين'
                }
            
            if coins > self.max_coins:
                return {
                    'success': False,
                    'error': f'الحد الأقصى {self.max_coins} كوين'
                }
            
            # حساب السعر الأساسي
            base_price = coins * self.coin_price_egp
            
            # تطبيق معدل التحويل
            rate = self.conversion_rates.get(transfer_type, 1.0)
            final_price = base_price * rate
            
            # حساب الخصم
            discount = base_price - final_price
            discount_percentage = (1 - rate) * 100
            
            return {
                'success': True,
                'coins_amount': coins,
                'base_price': round(base_price, 2),
                'final_price': round(final_price, 2),
                'discount': round(discount, 2),
                'discount_percentage': discount_percentage,
                'transfer_type': transfer_type,
                'rate': rate,
                'coin_price': self.coin_price_egp
            }
            
        except (ValueError, TypeError):
            return {
                'success': False,
                'error': 'كمية الكوينز غير صحيحة'
            }
    
    def create_sell_request(self, request_data):
        """إنشاء طلب بيع جديد"""
        try:
            # استخراج البيانات
            coins_amount = request_data.get('coins_amount')
            transfer_type = request_data.get('transfer_type', 'normal')
            notes = request_data.get('notes', '')
            user_id = request_data.get('user_id')
            whatsapp_number = request_data.get('whatsapp_number')
            platform = request_data.get('platform')
            
            # التحقق من البيانات المطلوبة
            if not coins_amount:
                return {
                    'success': False,
                    'error': 'يرجى إدخال كمية الكوينز'
                }
            
            # حساب السعر
            price_calculation = self.calculate_price(coins_amount, transfer_type)
            
            if not price_calculation['success']:
                return price_calculation
            
            # إنشاء معرف الطلب
            request_id = self.generate_request_id()
            
            # تنظيف الملاحظات
            clean_notes = self.sanitize_input(notes)[:500]
            
            # إنشاء بيانات الطلب
            sell_request = {
                'request_id': request_id,
                'user_id': user_id,
                'whatsapp_number': whatsapp_number,
                'platform': platform,
                'coins_amount': price_calculation['coins_amount'],
                'transfer_type': transfer_type,
                'base_price': price_calculation['base_price'],
                'final_price': price_calculation['final_price'],
                'discount': price_calculation['discount'],
                'discount_percentage': price_calculation['discount_percentage'],
                'notes': clean_notes,
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # حفظ في الذاكرة
            self.sell_requests[request_id] = sell_request
            
            print(f"💰 طلب بيع جديد: {request_id}")
            print(f"   الكمية: {coins_amount} كوين")
            print(f"   النوع: {transfer_type}")
            print(f"   السعر النهائي: {price_calculation['final_price']} جنيه")
            
            return {
                'success': True,
                'request_id': request_id,
                'sell_request': sell_request,
                'message': 'تم إنشاء طلب البيع بنجاح'
            }
            
        except Exception as e:
            print(f"خطأ في إنشاء طلب البيع: {str(e)}")
            return {
                'success': False,
                'error': 'حدث خطأ في إنشاء الطلب'
            }
    
    def get_sell_request(self, request_id):
        """الحصول على تفاصيل طلب بيع"""
        if request_id in self.sell_requests:
            return {
                'success': True,
                'sell_request': self.sell_requests[request_id]
            }
        else:
            return {
                'success': False,
                'error': 'الطلب غير موجود'
            }
    
    def get_user_requests(self, user_id):
        """الحصول على جميع طلبات مستخدم"""
        user_requests = []
        
        for request_id, request_data in self.sell_requests.items():
            if request_data.get('user_id') == user_id:
                user_requests.append(request_data)
        
        # ترتيب حسب التاريخ
        user_requests.sort(key=lambda x: x['created_at'], reverse=True)
        
        return {
            'success': True,
            'requests': user_requests,
            'count': len(user_requests)
        }
    
    def update_request_status(self, request_id, new_status):
        """تحديث حالة الطلب"""
        if request_id not in self.sell_requests:
            return {
                'success': False,
                'error': 'الطلب غير موجود'
            }
        
        valid_statuses = ['pending', 'processing', 'completed', 'cancelled']
        
        if new_status not in valid_statuses:
            return {
                'success': False,
                'error': 'حالة غير صحيحة'
            }
        
        self.sell_requests[request_id]['status'] = new_status
        self.sell_requests[request_id]['updated_at'] = datetime.now().isoformat()
        
        return {
            'success': True,
            'message': f'تم تحديث الحالة إلى {new_status}'
        }
    
    def get_statistics(self):
        """الحصول على إحصائيات عامة"""
        total_requests = len(self.sell_requests)
        total_coins = 0
        total_value = 0
        
        status_counts = {
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'cancelled': 0
        }
        
        transfer_type_counts = {
            'instant': 0,
            'normal': 0
        }
        
        for request in self.sell_requests.values():
            total_coins += request.get('coins_amount', 0)
            total_value += request.get('final_price', 0)
            
            status = request.get('status')
            if status in status_counts:
                status_counts[status] += 1
            
            transfer_type = request.get('transfer_type')
            if transfer_type in transfer_type_counts:
                transfer_type_counts[transfer_type] += 1
        
        return {
            'total_requests': total_requests,
            'total_coins': total_coins,
            'total_value': round(total_value, 2),
            'status_counts': status_counts,
            'transfer_type_counts': transfer_type_counts,
            'coin_price': self.coin_price_egp
        }
    
    def sanitize_input(self, text):
        """تنظيف المدخلات من الأكواد الضارة"""
        if not text:
            return ""
        # إزالة HTML tags
        text = re.sub(r'<[^>]+>', '', str(text))
        # إزالة special characters خطرة
        text = re.sub(r'[<>\"\'`;]', '', text)
        return text.strip()
    
    def validate_coins_amount(self, coins_amount):
        """التحقق من صحة كمية الكوينز"""
        try:
            coins = int(coins_amount)
            if coins < self.min_coins:
                return False, f'الحد الأدنى {self.min_coins} كوين'
            if coins > self.max_coins:
                return False, f'الحد الأقصى {self.max_coins} كوين'
            return True, 'صحيح'
        except:
            return False, 'كمية غير صحيحة'

# إنشاء instance عام للاستخدام
sell_handler = SellCoinsHandler()

# تصدير الدوال للاستخدام الخارجي
def create_sell_request(request_data):
    return sell_handler.create_sell_request(request_data)

def calculate_price(coins_amount, transfer_type):
    return sell_handler.calculate_price(coins_amount, transfer_type)

def get_sell_request(request_id):
    return sell_handler.get_sell_request(request_id)

def get_user_requests(user_id):
    return sell_handler.get_user_requests(user_id)

def get_statistics():
    return sell_handler.get_statistics()

def validate_coins_amount(coins_amount):
    return sell_handler.validate_coins_amount(coins_amount)
