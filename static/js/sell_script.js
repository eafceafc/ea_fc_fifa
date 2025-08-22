// sell_script.js - القلعة JavaScript المعزولة لصفحة بيع الكوينز
/**
 * 🏰 قلعة بيع الكوينز - FC 26 Profile System
 * =========================================
 * نظام معزول تماماً للتفاعل مع صفحة البيع
 * لا يؤثر على أي كود موجود في script.js
 */

// ============================================================================
// 💰 SellCoinsManager - كلاس إدارة البيع المعزول
// ============================================================================

class SellCoinsManager {
    constructor() {
        // الإعدادات الأساسية
        this.minCoins = 100;
        this.maxCoins = 1000000;
        this.coinPrice = 0.10; // السعر الافتراضي بالجنيه
        
        // معدلات التحويل
        this.rates = {
            instant: 0.85,
            normal: 1.0
        };
        
        // البيانات الحالية
        this.currentData = {
            coinsAmount: 0,
            transferType: 'normal',
            notes: '',
            basePrice: 0,
            finalPrice: 0,
            discount: 0
        };
        
        // العناصر DOM
        this.elements = {};
        
        // التهيئة
        this.init();
    }
    
    /**
     * تهيئة النظام
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadUserData();
        
        console.log('💰 SellCoinsManager initialized successfully');
    }
    
    /**
     * تخزين العناصر للأداء
     */
    cacheElements() {
        this.elements = {
            // الإدخالات
            coinsAmount: document.getElementById('coinsAmount'),
            sellNotes: document.getElementById('sellNotes'),
            notesCount: document.getElementById('notesCount'),
            
            // عرض الأسعار
            basePrice: document.getElementById('basePrice'),
            pricePreview: document.getElementById('pricePreview'),
            instantPrice: document.querySelector('#instantPrice .price-amount'),
            normalPrice: document.querySelector('#normalPrice .price-amount'),
            
            // بطاقات التحويل
            transferCards: document.querySelectorAll('.transfer-card'),
            
            // قسم الملخص
            summarySection: document.getElementById('summarySection'),
            summaryCoins: document.getElementById('summaryCoins'),
            summaryType: document.getElementById('summaryType'),
            summaryBase: document.getElementById('summaryBase'),
            summaryDiscount: document.getElementById('summaryDiscount'),
            summaryTotal: document.getElementById('summaryTotal'),
            discountRow: document.getElementById('discountRow'),
            
            // الأزرار
            confirmBtn: document.getElementById('confirmBtn'),
            
            // الرسائل
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            
            // نافذة النجاح
            successOverlay: document.getElementById('successOverlay'),
            requestId: document.getElementById('requestId'),
            
            // معلومات المستخدم
            userId: document.getElementById('userId'),
            userWhatsapp: document.getElementById('userWhatsapp'),
            userPlatform: document.getElementById('userPlatform'),
            
            // شاشة التحميل
            loading: document.getElementById('loading')
        };
    }
    
    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // إدخال الكوينز
        if (this.elements.coinsAmount) {
            this.elements.coinsAmount.addEventListener('input', (e) => {
                this.handleCoinsInput(e);
            });
        }
        
        // بطاقات التحويل
        this.elements.transferCards.forEach(card => {
            card.addEventListener('click', (e) => {
                this.handleTransferSelection(e, card);
            });
        });
        
        // الملاحظات
        if (this.elements.sellNotes) {
            this.elements.sellNotes.addEventListener('input', (e) => {
                this.handleNotesInput(e);
            });
        }
        
        // زر التأكيد
        if (this.elements.confirmBtn) {
            this.elements.confirmBtn.addEventListener('click', () => {
                this.handleConfirmSell();
            });
        }
    }
    
    /**
     * تحميل بيانات المستخدم
     */
    loadUserData() {
        // محاولة الحصول على البيانات من localStorage أو من الصفحة
        const savedData = localStorage.getItem('userProfile');
        
        if (savedData) {
            try {
                const userData = JSON.parse(savedData);
                console.log('📋 تم تحميل بيانات المستخدم:', userData);
            } catch (e) {
                console.log('⚠️ لا توجد بيانات مستخدم محفوظة');
            }
        }
    }
    
    /**
     * معالجة إدخال الكوينز
     */
    handleCoinsInput(event) {
        const value = parseInt(event.target.value) || 0;
        
        // التحقق من الحدود
        if (value > this.maxCoins) {
            event.target.value = this.maxCoins;
            this.showError(`الحد الأقصى ${this.maxCoins.toLocaleString('ar-EG')} كوين`);
            return;
        }
        
        // تحديث البيانات
        this.currentData.coinsAmount = value;
        
        // حساب وعرض الأسعار
        if (value >= this.minCoins) {
            this.calculatePrices();
            this.showPricePreview();
            this.updateSummary();
            this.enableConfirmButton();
        } else {
            this.hidePricePreview();
            this.disableConfirmButton();
        }
    }
    
    /**
     * حساب الأسعار
     */
    calculatePrices() {
        const coins = this.currentData.coinsAmount;
        
        // السعر الأساسي
        this.currentData.basePrice = coins * this.coinPrice;
        
        // الأسعار حسب نوع التحويل
        const instantPrice = this.currentData.basePrice * this.rates.instant;
        const normalPrice = this.currentData.basePrice * this.rates.normal;
        
        // تحديث العرض
        this.elements.basePrice.textContent = `${this.currentData.basePrice.toFixed(2)} جنيه`;
        
        if (this.elements.instantPrice) {
            this.elements.instantPrice.textContent = `${instantPrice.toFixed(2)} جنيه`;
        }
        
        if (this.elements.normalPrice) {
            this.elements.normalPrice.textContent = `${normalPrice.toFixed(2)} جنيه`;
        }
        
        // حساب السعر النهائي حسب الاختيار
        const rate = this.rates[this.currentData.transferType];
        this.currentData.finalPrice = this.currentData.basePrice * rate;
        this.currentData.discount = this.currentData.basePrice - this.currentData.finalPrice;
    }
    
    /**
     * عرض معاينة السعر
     */
    showPricePreview() {
        if (this.elements.pricePreview) {
            this.elements.pricePreview.style.display = 'block';
        }
        
        if (this.elements.summarySection) {
            this.elements.summarySection.style.display = 'block';
        }
    }
    
    /**
     * إخفاء معاينة السعر
     */
    hidePricePreview() {
        if (this.elements.pricePreview) {
            this.elements.pricePreview.style.display = 'none';
        }
        
        if (this.elements.summarySection) {
            this.elements.summarySection.style.display = 'none';
        }
    }
    
    /**
     * معالجة اختيار نوع التحويل
     */
    handleTransferSelection(event, selectedCard) {
        // إزالة التحديد من جميع البطاقات
        this.elements.transferCards.forEach(card => {
            card.classList.remove('selected');
        });
        
        // تحديد البطاقة المختارة
        selectedCard.classList.add('selected');
        
        // تحديث البيانات
        this.currentData.transferType = selectedCard.dataset.type;
        
        // إعادة حساب الأسعار
        if (this.currentData.coinsAmount >= this.minCoins) {
            this.calculatePrices();
            this.updateSummary();
        }
        
        // اهتزاز للهواتف
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }
    
    /**
     * معالجة إدخال الملاحظات
     */
    handleNotesInput(event) {
        const value = event.target.value;
        const length = value.length;
        
        // تحديث العداد
        if (this.elements.notesCount) {
            this.elements.notesCount.textContent = length;
        }
        
        // حفظ الملاحظات
        this.currentData.notes = value;
    }
    
    /**
     * تحديث الملخص
     */
    updateSummary() {
        // عدد الكوينز
        this.elements.summaryCoins.textContent = this.currentData.coinsAmount.toLocaleString('ar-EG');
        
        // نوع التحويل
        const typeText = this.currentData.transferType === 'instant' ? 'فوري (خلال ساعة)' : 'عادي (خلال 24 ساعة)';
        this.elements.summaryType.textContent = typeText;
        
        // السعر الأساسي
        this.elements.summaryBase.textContent = `${this.currentData.basePrice.toFixed(2)} جنيه`;
        
        // الخصم (إذا وجد)
        if (this.currentData.transferType === 'instant') {
            this.elements.discountRow.style.display = 'flex';
            this.elements.summaryDiscount.textContent = `-${this.currentData.discount.toFixed(2)} جنيه`;
        } else {
            this.elements.discountRow.style.display = 'none';
        }
        
        // السعر النهائي
        this.elements.summaryTotal.textContent = `${this.currentData.finalPrice.toFixed(2)} جنيه`;
    }
    
    /**
     * تفعيل زر التأكيد
     */
    enableConfirmButton() {
        if (this.elements.confirmBtn) {
            this.elements.confirmBtn.disabled = false;
        }
    }
    
    /**
     * تعطيل زر التأكيد
     */
    disableConfirmButton() {
        if (this.elements.confirmBtn) {
            this.elements.confirmBtn.disabled = true;
        }
    }
    
    /**
     * معالجة تأكيد البيع
     */
    async handleConfirmSell() {
        // التحقق من البيانات
        if (this.currentData.coinsAmount < this.minCoins) {
            this.showError(`الحد الأدنى ${this.minCoins} كوين`);
            return;
        }
        
        // عرض شاشة التحميل
        this.showLoading();
        
        try {
            // تحضير البيانات
            const requestData = {
                coins_amount: this.currentData.coinsAmount,
                transfer_type: this.currentData.transferType,
                notes: this.currentData.notes,
                user_id: this.elements.userId?.value || 'guest',
                whatsapp_number: this.elements.userWhatsapp?.value || '',
                platform: this.elements.userPlatform?.value || ''
            };
            
            // إرسال الطلب
            const response = await fetch('/api/sell-coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            // إخفاء شاشة التحميل
            this.hideLoading();
            
            if (result.success) {
                // عرض نافذة النجاح
                this.showSuccessModal(result.request_id);
                
                // اهتزاز نجاح
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200]);
                }
            } else {
                this.showError(result.error || 'حدث خطأ في إرسال الطلب');
            }
            
        } catch (error) {
            console.error('خطأ في إرسال الطلب:', error);
            this.hideLoading();
            this.showError('خطأ في الاتصال، يرجى المحاولة مرة أخرى');
        }
    }
    
    /**
     * عرض شاشة التحميل
     */
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.add('show');
        }
    }
    
    /**
     * إخفاء شاشة التحميل
     */
    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.classList.remove('show');
        }
    }
    
    /**
     * عرض نافذة النجاح
     */
    showSuccessModal(requestId) {
        if (this.elements.requestId) {
            this.elements.requestId.textContent = requestId;
        }
        
        if (this.elements.successOverlay) {
            this.elements.successOverlay.style.display = 'flex';
        }
    }
    
    /**
     * عرض رسالة خطأ
     */
    showError(message) {
        if (this.elements.errorText) {
            this.elements.errorText.textContent = message;
        }
        
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'block';
            
            // إخفاء بعد 5 ثواني
            setTimeout(() => {
                this.elements.errorMessage.style.display = 'none';
            }, 5000);
        }
        
        // اهتزاز خطأ
        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300]);
        }
    }
}

// ============================================================================
// 🚀 التهيئة عند تحميل الصفحة
// ============================================================================

let sellCoinsManager = null;

document.addEventListener('DOMContentLoaded', function() {
    // إنشاء مدير البيع
    sellCoinsManager = new SellCoinsManager();
    
    // إنشاء الجسيمات المتحركة
    createSellParticles();
    
    console.log('✅ Sell Coins page ready');
});

// ============================================================================
// 🎨 دوال مساعدة
// ============================================================================

/**
 * إنشاء الجسيمات المتحركة
 */
function createSellParticles() {
    const container = document.getElementById('particlesBg');
    if (!container) return;
    
    const particleCount = window.innerWidth <= 768 ? 10 : 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
        container.appendChild(particle);
    }
}

/**
 * إغلاق نافذة النجاح
 */
function closeSuccessModal() {
    const overlay = document.getElementById('successOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // العودة للرئيسية
    window.location.href = '/';
}

// ============================================================================
// 🌐 تصدير للاستخدام الخارجي (إذا احتجنا)
// ============================================================================

window.SellCoinsManager = SellCoinsManager;
window.closeSuccessModal = closeSuccessModal;
