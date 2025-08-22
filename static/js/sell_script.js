/**
 * مدير صفحة بيع الكوينز - معزول تماماً عن الكود الأساسي
 * SellCoinsManager Class
 */

class SellCoinsManager {
    constructor() {
        this.form = document.getElementById('sellCoinsForm');
        this.priceDisplay = document.getElementById('priceDisplay');
        this.orderSummary = document.getElementById('orderSummary');
        this.successOverlay = document.getElementById('successOverlay');
        
        // الأسعار الأساسية
        this.baseRate = 0.01; // 0.01 جنيه للكوين الواحد
        this.instantMultiplier = 0.85;
        this.normalMultiplier = 1.0;
        
        // تهيئة الصفحة
        this.init();
    }
    
    init() {
        console.log('🚀 تهيئة مدير صفحة بيع الكوينز');
        
        // استرجاع بيانات المستخدم من localStorage
        this.loadUserData();
        
        // ربط الأحداث
        this.bindEvents();
        
        // حساب السعر الأولي
        this.calculatePrice();
    }
    
    loadUserData() {
        try {
            // محاولة استرجاع البيانات من localStorage
            const userEmail = localStorage.getItem('userEmail');
            const userPlayerName = localStorage.getItem('playerName');
            const userTelegram = localStorage.getItem('telegramUsername');
            
            // ملء الحقول المخفية
            if (userEmail) {
                document.getElementById('userEmail').value = userEmail;
            }
            if (userPlayerName) {
                document.getElementById('userPlayerName').value = userPlayerName;
            }
            if (userTelegram) {
                document.getElementById('userTelegram').value = userTelegram;
            }
            
            console.log('✅ تم تحميل بيانات المستخدم');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
        }
    }
    
    bindEvents() {
        // تغيير نوع التحويل
        const transferOptions = document.querySelectorAll('input[name="transferType"]');
        transferOptions.forEach(option => {
            option.addEventListener('change', () => this.calculatePrice());
        });
        
        // تغيير عدد الكوينز
        const coinsInput = document.getElementById('coinsAmount');
        coinsInput.addEventListener('input', () => {
            this.calculatePrice();
            this.updateOrderSummary();
        });
        
        // تغيير طريقة الدفع
        const paymentMethod = document.getElementById('paymentMethod');
        paymentMethod.addEventListener('change', () => this.updateOrderSummary());
        
        // إرسال النموذج
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async calculatePrice() {
        const coinsAmount = document.getElementById('coinsAmount').value;
        const transferType = document.querySelector('input[name="transferType"]:checked').value;
        
        if (!coinsAmount || coinsAmount < 10000) {
            this.priceDisplay.style.display = 'none';
            return;
        }
        
        try {
            // حساب السعر محلياً أولاً
            const multiplier = transferType === 'instant' ? this.instantMultiplier : this.normalMultiplier;
            const price = coinsAmount * this.baseRate * multiplier;
            
            // عرض السعر
            this.displayPrice(price);
            
            // طلب التحقق من الخادم
            const response = await fetch('/api/calculate-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coins: parseInt(coinsAmount),
                    transferType: transferType
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayPrice(data.price);
                }
            }
            
        } catch (error) {
            console.error('❌ خطأ في حساب السعر:', error);
        }
    }
    
    displayPrice(price) {
        const priceElement = document.getElementById('calculatedPrice');
        priceElement.textContent = price.toFixed(2);
        this.priceDisplay.style.display = 'block';
        this.updateOrderSummary();
    }
    
    updateOrderSummary() {
        const coinsAmount = document.getElementById('coinsAmount').value;
        const transferType = document.querySelector('input[name="transferType"]:checked').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        
        if (!coinsAmount || coinsAmount < 10000 || !paymentMethod) {
            this.orderSummary.style.display = 'none';
            return;
        }
        
        // حساب السعر
        const multiplier = transferType === 'instant' ? this.instantMultiplier : this.normalMultiplier;
        const price = coinsAmount * this.baseRate * multiplier;
        
        // تحديث عناصر الملخص
        document.getElementById('summaryCoins').textContent = parseInt(coinsAmount).toLocaleString('ar-EG');
        document.getElementById('summaryTransferType').textContent = 
            transferType === 'instant' ? 'تحويل فوري' : 'تحويل عادي';
        document.getElementById('summaryTotal').textContent = `${price.toFixed(2)} جنيه`;
        
        // عرض الملخص
        this.orderSummary.style.display = 'block';
    }
    
    async handleSubmit(event) {
        event.preventDefault();
        
        // جمع البيانات
        const formData = {
            user_info: {
                email: document.getElementById('userEmail').value || 'غير محدد',
                player_name: document.getElementById('userPlayerName').value || 'غير محدد',
                telegram_username: document.getElementById('userTelegram').value || 'غير محدد'
            },
            coins: parseInt(document.getElementById('coinsAmount').value),
            transferType: document.querySelector('input[name="transferType"]:checked').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            accountDetails: document.getElementById('accountDetails').value,
            notes: document.getElementById('notes').value
        };
        
        // التحقق من البيانات
        if (!this.validateForm(formData)) {
            return;
        }
        
        try {
            // عرض حالة التحميل
            this.showLoading();
            
            // إرسال الطلب
            const response = await fetch('/api/sell-coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // عرض رسالة النجاح
                this.showSuccess(data.request_id);
                
                // مسح البيانات المحلية
                this.clearLocalData();
            } else {
                // عرض رسالة الخطأ
                this.showError(data.error || 'حدث خطأ في إرسال الطلب');
            }
            
        } catch (error) {
            console.error('❌ خطأ في إرسال الطلب:', error);
            this.showError('حدث خطأ في الاتصال بالخادم');
        } finally {
            this.hideLoading();
        }
    }
    
    validateForm(data) {
        // التحقق من عدد الكوينز
        if (!data.coins || data.coins < 10000) {
            this.showError('الحد الأدنى للبيع هو 10,000 كوين');
            return false;
        }
        
        if (data.coins > 10000000) {
            this.showError('الحد الأقصى للبيع هو 10,000,000 كوين');
            return false;
        }
        
        // التحقق من طريقة الدفع
        if (!data.paymentMethod) {
            this.showError('من فضلك اختر طريقة استلام المبلغ');
            return false;
        }
        
        // التحقق من تفاصيل الحساب
        if (!data.accountDetails || data.accountDetails.trim().length < 5) {
            this.showError('من فضلك أدخل رقم المحفظة أو الحساب بشكل صحيح');
            return false;
        }
        
        return true;
    }
    
    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    }
    
    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب البيع';
    }
    
    showSuccess(requestId) {
        document.getElementById('requestId').textContent = requestId;
        this.successOverlay.style.display = 'flex';
        
        // إعادة تعيين النموذج
        this.form.reset();
        this.priceDisplay.style.display = 'none';
        this.orderSummary.style.display = 'none';
    }
    
    showError(message) {
        // إنشاء عنصر رسالة الخطأ
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        // إضافة الرسالة في بداية النموذج
        this.form.insertBefore(errorDiv, this.form.firstChild);
        
        // إزالة الرسالة بعد 5 ثواني
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        // التمرير لأعلى الصفحة
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    clearLocalData() {
        try {
            localStorage.removeItem('sellCoinsData');
            console.log('✅ تم مسح البيانات المؤقتة');
        } catch (error) {
            console.error('❌ خطأ في مسح البيانات:', error);
        }
    }
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 صفحة بيع الكوينز جاهزة');
});