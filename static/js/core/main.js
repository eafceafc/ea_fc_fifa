/**
 * ===== SHAHD AL-SENIORA CORE SYSTEM =====
 * الملف الأساسي الجديد لنظام شهد السنيورة
 * النواة الرئيسية لإدارة التطبيق والتنسيق بين الوحدات
 */

class ShahdCore {
    constructor() {
        this.isInitialized = false;
        this.modules = new Map();
        this.eventListeners = new Map();
        this.config = {
            appName: 'شهد السنيورة',
            version: '2.0.0',
            apiEndpoint: '/api',
            debug: true
        };
        
        // حالات التطبيق
        this.state = {
            currentStep: 'profile_setup',
            formData: {},
            isFormValid: false,
            telegramLinked: false,
            processing: false
        };

        this.log('🌟 تم تهيئة نواة شهد السنيورة');
    }

    /**
     * تهيئة النظام الأساسي
     */
    async initialize() {
        try {
            this.log('🚀 بدء تهيئة النظام...');
            
            // التحقق من وجود DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupDOM());
            } else {
                this.setupDOM();
            }
            
            // تسجيل الأحداث الأساسية
            this.setupEventListeners();
            
            // تهيئة معالج الأخطاء العام
            this.setupErrorHandler();
            
            this.isInitialized = true;
            this.log('✅ تم تهيئة النظام بنجاح');
            
            // إشعار الوحدات الأخرى
            this.emit('system:initialized');
            
        } catch (error) {
            this.logError('فشل في تهيئة النظام', error);
            throw error;
        }
    }

    /**
     * إعداد DOM والعناصر الأساسية
     */
    setupDOM() {
        this.log('📱 إعداد واجهة المستخدم...');
        
        // العناصر الأساسية
        this.elements = {
            form: document.getElementById('profileForm'),
            submitBtn: document.getElementById('submitBtn'),
            telegramBtn: document.getElementById('telegramBtn'),
            
            // رسائل الحالة
            successMessage: document.getElementById('successMessage'),
            errorMessage: document.getElementById('errorMessage'),
            loadingMessage: document.getElementById('loadingMessage'),
            
            // النصوص المتغيرة
            successText: document.getElementById('successText'),
            errorText: document.getElementById('errorText'),
            loadingText: document.getElementById('loadingText'),
            
            // حقول الإدخال
            whatsapp: document.getElementById('whatsapp'),
            paymentMethod: document.querySelectorAll('input[name="payment_method"]'),
            paymentDetails: document.getElementById('paymentDetails'),
            paymentDetailsGroup: document.getElementById('paymentDetailsGroup')
        };

        // التحقق من وجود العناصر المطلوبة
        this.validateRequiredElements();
        
        // إعداد النموذج الأساسي
        this.setupForm();
        
        this.log('✅ تم إعداد واجهة المستخدم');
    }

    /**
     * التحقق من وجود العناصر المطلوبة
     */
    validateRequiredElements() {
        const required = ['form', 'submitBtn', 'whatsapp'];
        const missing = required.filter(key => !this.elements[key]);
        
        if (missing.length > 0) {
            throw new Error(`العناصر المطلوبة مفقودة: ${missing.join(', ')}`);
        }
    }

    /**
     * إعداد النموذج الأساسي
     */
    setupForm() {
        if (!this.elements.form) return;

        // منع الإرسال التقليدي للنموذج
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // مراقبة تغييرات النموذج
        this.elements.form.addEventListener('input', (e) => {
            this.handleInputChange(e);
        });

        this.log('📝 تم إعداد النموذج الأساسي');
    }

    /**
     * إعداد مستمعي الأحداث الأساسية
     */
    setupEventListeners() {
        // أحداث النظام
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // أحداث التليجرام
        if (this.elements.telegramBtn) {
            this.elements.telegramBtn.addEventListener('click', () => {
                this.handleTelegramConnect();
            });
        }

        // أحداث تغيير طريقة الدفع
        this.elements.paymentMethod.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handlePaymentMethodChange(e.target.value);
            });
        });

        this.log('👂 تم إعداد مستمعي الأحداث');
    }

    /**
     * إعداد معالج الأخطاء العام
     */
    setupErrorHandler() {
        window.addEventListener('error', (event) => {
            this.logError('خطأ غير متوقع في النظام', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('خطأ في Promise غير معالج', event.reason);
            event.preventDefault();
        });

        this.log('🛡️ تم إعداد معالج الأخطاء');
    }

    /**
     * معالجة إرسال النموذج
     */
    async handleFormSubmit() {
        try {
            this.log('📤 معالجة إرسال النموذج...');
            
            // إظهار حالة التحميل
            this.showLoading('جاري حفظ البيانات...');
            this.state.processing = true;
            
            // جمع بيانات النموذج
            const formData = this.collectFormData();
            
            // التحقق من صحة البيانات
            const validation = await this.validateFormData(formData);
            
            if (!validation.isValid) {
                throw new Error(validation.message);
            }
            
            // إرسال البيانات إلى الخادم
            const result = await this.submitFormData(formData);
            
            // معالجة الاستجابة
            await this.handleSubmitSuccess(result);
            
        } catch (error) {
            this.handleSubmitError(error);
        } finally {
            this.state.processing = false;
            this.hideLoading();
        }
    }

    /**
     * جمع بيانات النموذج
     */
    collectFormData() {
        const formData = new FormData(this.elements.form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value.trim();
        }
        
        // جمع الإيميلات المتعددة
        const emails = [];
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            if (input.value.trim()) {
                emails.push(input.value.trim());
            }
        });
        data.emails = emails;
        
        this.state.formData = data;
        this.log('📋 تم جمع بيانات النموذج:', data);
        
        return data;
    }

    /**
     * إرسال البيانات إلى الخادم
     */
    async submitFormData(data) {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `خطأ في الخادم: ${response.status}`);
        }

        return response.json();
    }

    /**
     * معالجة نجاح الإرسال
     */
    async handleSubmitSuccess(result) {
        this.log('✅ تم حفظ البيانات بنجاح:', result);
        
        // إظهار رسالة النجاح
        this.showSuccess('تم حفظ البيانات بنجاح! 🎉');
        
        // إظهار زر التليجرام
        this.showTelegramButton();
        
        // إشعار الوحدات الأخرى
        this.emit('form:submitted', { data: this.state.formData, result });
        
        // تسجيل إحصائية النجاح
        this.trackEvent('form_submit_success');
    }

    /**
     * معالجة فشل الإرسال
     */
    handleSubmitError(error) {
        this.logError('فشل في إرسال النموذج', error);
        this.showError(error.message || 'حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى.');
        
        // إشعار الوحدات الأخرى
        this.emit('form:error', { error: error.message });
        
        // تسجيل إحصائية الفشل
        this.trackEvent('form_submit_error', { error: error.message });
    }

    /**
     * معالجة الاتصال بالتليجرام
     */
    async handleTelegramConnect() {
        try {
            this.log('📱 بدء عملية ربط التليجرام...');
            
            // إشعار وحدة التليجرام
            this.emit('telegram:connect_requested');
            
        } catch (error) {
            this.logError('فشل في ربط التليجرام', error);
            this.showError('فشل في ربط التليجرام. يرجى المحاولة مرة أخرى.');
        }
    }

    /**
     * معالجة تغيير طريقة الدفع
     */
    handlePaymentMethodChange(method) {
        this.log('💳 تم تغيير طريقة الدفع إلى:', method);
        
        // إشعار وحدة معالجة الدفع
        this.emit('payment:method_changed', { method });
    }

    /**
     * معالجة تغيير الإدخال
     */
    handleInputChange(event) {
        const { target } = event;
        const { name, value } = target;
        
        // إشعار الوحدات المختصة
        this.emit('input:changed', { name, value, element: target });
        
        // تحديث حالة صحة النموذج
        this.updateFormValidation();
    }

    /**
     * التحقق من صحة بيانات النموذج
     */
    async validateFormData(data) {
        // سيتم استدعاء وحدة التحقق المنفصلة
        return this.emit('validation:validate_form', { data });
    }

    /**
     * تحديث حالة صحة النموذج
     */
    updateFormValidation() {
        // سيتم استدعاء وحدة التحقق المنفصلة
        this.emit('validation:check_form');
    }

    /**
     * إظهار زر التليجرام
     */
    showTelegramButton() {
        if (this.elements.telegramBtn) {
            this.elements.telegramBtn.style.display = 'flex';
            this.elements.telegramBtn.classList.add('fade-in');
        }
    }

    /**
     * إخفاء زر التليجرام
     */
    hideTelegramButton() {
        if (this.elements.telegramBtn) {
            this.elements.telegramBtn.style.display = 'none';
        }
    }

    /**
     * إظهار رسالة النجاح
     */
    showSuccess(message) {
        this.hideAllMessages();
        if (this.elements.successMessage && this.elements.successText) {
            this.elements.successText.textContent = message;
            this.elements.successMessage.style.display = 'flex';
            this.elements.successMessage.classList.add('message-animate');
        }
        
        // إخفاء الرسالة تلقائياً بعد 5 ثواني
        setTimeout(() => this.hideSuccess(), 5000);
    }

    /**
     * إظهار رسالة الخطأ
     */
    showError(message) {
        this.hideAllMessages();
        if (this.elements.errorMessage && this.elements.errorText) {
            this.elements.errorText.textContent = message;
            this.elements.errorMessage.style.display = 'flex';
            this.elements.errorMessage.classList.add('message-animate');
        }
        
        // إخفاء الرسالة تلقائياً بعد 8 ثواني
        setTimeout(() => this.hideError(), 8000);
    }

    /**
     * إظهار رسالة التحميل
     */
    showLoading(message = 'جاري المعالجة...') {
        this.hideAllMessages();
        if (this.elements.loadingMessage && this.elements.loadingText) {
            this.elements.loadingText.textContent = message;
            this.elements.loadingMessage.style.display = 'flex';
            this.elements.loadingMessage.classList.add('message-animate');
        }
        
        // تعطيل الأزرار أثناء التحميل
        this.toggleButtons(false);
    }

    /**
     * إخفاء رسالة التحميل
     */
    hideLoading() {
        if (this.elements.loadingMessage) {
            this.elements.loadingMessage.style.display = 'none';
        }
        
        // تفعيل الأزرار
        this.toggleButtons(true);
    }

    /**
     * إخفاء جميع الرسائل
     */
    hideAllMessages() {
        [this.elements.successMessage, this.elements.errorMessage, this.elements.loadingMessage]
            .forEach(element => {
                if (element) {
                    element.style.display = 'none';
                    element.classList.remove('message-animate');
                }
            });
    }

    /**
     * إخفاء رسالة النجاح
     */
    hideSuccess() {
        if (this.elements.successMessage) {
            this.elements.successMessage.style.display = 'none';
        }
    }

    /**
     * إخفاء رسالة الخطأ
     */
    hideError() {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }

    /**
     * تبديل حالة الأزرار
     */
    toggleButtons(enabled = true) {
        [this.elements.submitBtn, this.elements.telegramBtn]
            .forEach(button => {
                if (button) {
                    button.disabled = !enabled;
                    if (enabled) {
                        button.classList.remove('disabled');
                    } else {
                        button.classList.add('disabled');
                    }
                }
            });
    }

    /**
     * تسجيل وحدة جديدة
     */
    registerModule(name, moduleInstance) {
        this.modules.set(name, moduleInstance);
        this.log(`📦 تم تسجيل الوحدة: ${name}`);
        
        // إعلام الوحدة بتهيئة النظام إذا كان جاهزاً
        if (this.isInitialized) {
            moduleInstance.onSystemReady?.(this);
        }
    }

    /**
     * الحصول على وحدة
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * إرسال حدث للوحدات
     */
    emit(eventName, data = {}) {
        this.log(`📡 إرسال حدث: ${eventName}`, data);
        
        // إرسال للمستمعين المسجلين
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                this.logError(`فشل في معالجة حدث ${eventName}`, error);
            }
        });
        
        // إرسال للوحدات المسجلة
        this.modules.forEach((module, name) => {
            if (typeof module.handleEvent === 'function') {
                try {
                    module.handleEvent(eventName, data);
                } catch (error) {
                    this.logError(`فشل في معالجة حدث ${eventName} في الوحدة ${name}`, error);
                }
            }
        });
    }

    /**
     * الاستماع لحدث
     */
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    /**
     * إلغاء الاستماع لحدث
     */
    off(eventName, callback) {
        const listeners = this.eventListeners.get(eventName) || [];
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * تسجيل الأحداث للتحليل
     */
    trackEvent(eventName, data = {}) {
        if (this.config.debug) {
            this.log(`📊 إحصائية: ${eventName}`, data);
        }
        
        // يمكن إرسال إلى خدمة تحليلات هنا
    }

    /**
     * تسجيل رسالة في وحدة التحكم
     */
    log(message, data = null) {
        if (this.config.debug) {
            console.log(`[شهد السنيورة] ${message}`, data || '');
        }
    }

    /**
     * تسجيل خطأ في وحدة التحكم
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - خطأ] ${message}`, error || '');
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.log('🧹 تنظيف موارد النظام...');
        
        // تنظيف مستمعي الأحداث
        this.eventListeners.clear();
        
        // تنظيف الوحدات
        this.modules.forEach((module, name) => {
            if (typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                } catch (error) {
                    this.logError(`فشل في تنظيف الوحدة ${name}`, error);
                }
            }
        });
        
        this.modules.clear();
        this.isInitialized = false;
    }

    /**
     * الحصول على معلومات النظام
     */
    getSystemInfo() {
        return {
            name: this.config.appName,
            version: this.config.version,
            initialized: this.isInitialized,
            modules: Array.from(this.modules.keys()),
            state: { ...this.state }
        };
    }
}

// ===== تهيئة النظام الأساسي =====

// إنشاء المثيل الأساسي
window.ShahdCore = new ShahdCore();

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.ShahdCore.initialize();
        console.log('🎉 نظام شهد السنيورة جاهز للعمل!');
    } catch (error) {
        console.error('❌ فشل في تهيئة النظام:', error);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShahdCore;
}
