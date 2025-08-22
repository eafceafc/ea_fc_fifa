"""
وزارة بيع الكوينز - Ministry of Coin Sales
معالج طلبات بيع كوينز FC 26 بشكل معزول تماماً
"""

from flask import Blueprint, request, jsonify, render_template, session
from datetime import datetime
import uuid
import logging

# إعداد نظام التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SellCoinsHandler:
    """وزارة بيع الكوينز - معالج معزول تماماً لطلبات البيع"""
    
    def __init__(self):
        """تهيئة وزارة بيع الكوينز"""
        self.sell_requests = {}  # قاعدة بيانات في الذاكرة للطلبات
        self.base_rate = 0.01  # سعر أساسي: 0.01 جنيه للكوين
        self.instant_multiplier = 0.85  # معامل التحويل الفوري
        self.normal_multiplier = 1.0  # معامل التحويل العادي
        
        logger.info("💰 وزارة بيع الكوينز جاهزة للعمل")
        logger.info(f"   السعر الحالي: {self.base_rate} جنيه للكوين")
    
    def calculate_price(self, coins_amount, transfer_type='normal'):
        """حساب سعر الكوينز بناءً على نوع التحويل"""
        try:
            if not isinstance(coins_amount, (int, float)) or coins_amount <= 0:
                return {'success': False, 'error': 'كمية الكوينز غير صحيحة'}
            
            multiplier = self.instant_multiplier if transfer_type == 'instant' else self.normal_multiplier
            price = coins_amount * self.base_rate * multiplier
            
            return {
                'success': True,
                'coins': coins_amount,
                'price': round(price, 2),
                'rate': self.base_rate * multiplier,
                'transfer_type': transfer_type,
                'currency': 'EGP'
            }
        except Exception as e:
            logger.error(f"❌ خطأ في حساب السعر: {str(e)}")
            return {'success': False, 'error': 'حدث خطأ في حساب السعر'}
    
    def validate_coins_amount(self, coins):
        """التحقق من صحة كمية الكوينز"""
        try:
            coins_int = int(coins)
            if coins_int < 10000:
                return False, "الحد الأدنى للبيع هو 10,000 كوين"
            if coins_int > 10000000:
                return False, "الحد الأقصى للبيع هو 10,000,000 كوين"
            return True, None
        except (ValueError, TypeError):
            return False, "من فضلك أدخل رقم صحيح"
    
    def create_sell_request(self, user_info, coins, transfer_type, payment_method, account_details, notes=None):
        """إنشاء طلب بيع جديد"""
        try:
            is_valid, error_msg = self.validate_coins_amount(coins)
            if not is_valid:
                return {'success': False, 'error': error_msg}
            
            price_info = self.calculate_price(coins, transfer_type)
            if not price_info['success']:
                return price_info
            
            request_id = str(uuid.uuid4())[:8]
            
            sell_request = {
                'id': request_id,
                'user_info': user_info,
                'coins': coins,
                'price': price_info['price'],
                'transfer_type': transfer_type,
                'payment_method': payment_method,
                'account_details': account_details,
                'notes': notes,
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'currency': 'EGP'
            }
            
            self.sell_requests[request_id] = sell_request
            
            logger.info(f"✅ تم إنشاء طلب بيع جديد: {request_id}")
            
            return {
                'success': True,
                'request_id': request_id,
                'message': 'تم إنشاء طلب البيع بنجاح',
                'details': sell_request
            }
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء طلب البيع: {str(e)}")
            return {'success': False, 'error': 'حدث خطأ في إنشاء الطلب'}

# إنشاء مثيل واحد من الوزارة
sell_coins_ministry = SellCoinsHandler()