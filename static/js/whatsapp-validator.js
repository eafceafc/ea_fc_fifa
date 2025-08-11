// FC 26 WhatsApp Validator Module - وحدة التحقق من الواتساب المستقلة
// الهدف: فصل كامل لمنطق التحقق من أرقام الواتساب المصرية

/**
 * WhatsApp Validator Module - نظام التحقق من الواتساب المستقل
 * يدير جميع وظائف التحقق من الواتساب بشكل منفصل عن باقي الكود
 */

class WhatsAppValidator {
    constructor() {
        this.validationTimeout = null;
        this.whatsappValidationTimer = null;
        this.whatsappInput = null;
        this.onValidationChange = null;
        this.initialized = false;
        this.isValid = false;
        this.lastValidatedPhone = '';
    }

    /**
     * تهيئة وحدة التحقق من الواتساب
     * @param {Function} onChangeCallback - دالة يتم استدعاؤها عند تغيير حالة التحقق
     */
    init(onChangeCallback = null) {
        if (this.initialized) {
            console.warn('📱 WhatsApp Validator already initialized');
            return;
        }

        this.onValidationChange = onChangeCallback;
        this.setupWhatsAppInput();
        this.initialized = true;
        
        console.log('📱 WhatsApp Validator initialized successfully');
    }

    /**
     * البحث عن حقل الواتساب وربط مستمعي الأحداث
     */
    setupWhatsAppInput() {
        this.whatsappInput = document.getElementById('whatsapp');
        
        if (!this.whatsappInput) {
            console.warn('⚠️ WhatsApp input field not found (#whatsapp)');
            return;
        }

        // ربط مستمع الإدخال الفوري
        this.whatsappInput.addEventListener('input', (event) => {
            this.handlePhoneInput(event);
        });

        // ربط مستمع فقدان التركيز
        this.whatsappInput.addEventListener('blur', (event) => {
            this.handlePhoneBlur(event);
        });

        console.log('📱 WhatsApp input field connected successfully');
    }

    /**
     * معالجة إدخال رقم الواتساب مع التحقق الفوري
     * @param {Event} event - حدث الإدخال
     */
    handlePhoneInput(event) {
        const inputValue = event.target.value;
        
        // تنظيف الرقم أولاً
        let cleanValue = this.formatPhoneInput(inputValue);
        event.target.value = cleanValue;
        
        // إزالة معلومات سابقة عند بدء الكتابة
        this.clearPhoneInfo();
        
        // إلغاء التحقق السابق
        this.clearValidationTimers();
        
        // إعادة تعيين حالة التحقق
        this.isValid = false;
        this.updateValidationUI(event.target, false, '');
        
        // تحقق فوري بعد توقف المستخدم عن الكتابة
        if (cleanValue.length >= 5) {
            // إضافة مؤشر التحميل
            event.target.classList.add('validating');
            this.showPhoneInfoLoading(event.target);
            
            this.validationTimeout = setTimeout(async () => {
                const result = await this.validateWhatsAppReal(cleanValue);
                
                // إزالة مؤشر التحميل
                event.target.classList.remove('validating');
                
                // تحديث حالة التحقق
                this.isValid = result.is_valid || result.valid;
                this.lastValidatedPhone = cleanValue;
                
                // عرض النتيجة
                if (this.isValid) {
                    this.updateValidationUI(event.target, true, 'رقم واتساب صحيح ✓');
                    this.showPhoneInfo(result, event.target);
                } else {
                    this.updateValidationUI(event.target, false, result.error || result.message || 'رقم غير صحيح');
                    this.showPhoneInfoError(result.error || result.message || 'رقم غير صحيح', event.target);
                }
                
                // إشعار النظام الرئيسي
                this.notifyValidationChange({
                    isValid: this.isValid,
                    phone: cleanValue,
                    result: result
                });
                
            }, 800); // انتظار 800ms بعد توقف الكتابة
        } else {
            event.target.classList.remove('validating');
            this.notifyValidationChange({
                isValid: false,
                phone: cleanValue,
                result: null
            });
        }
    }

    /**
     * معالجة فقدان التركيز من حقل الواتساب
     * @param {Event} event - حدث فقدان التركيز
     */
    handlePhoneBlur(event) {
        const value = event.target.value.trim();
        if (value && !this.isValid) {
            this.validateWhatsAppReal(value).then(result => {
                this.isValid = result.is_valid || result.valid;
                this.lastValidatedPhone = value;
                
                if (this.isValid) {
                    this.updateValidationUI(event.target, true, 'رقم واتساب صحيح ✓');
                    this.showPhoneInfo(result, event.target);
                } else {
                    this.updateValidationUI(event.target, false, result.error || result.message || 'رقم غير صحيح');
                    this.showPhoneInfoError(result.error || result.message || 'رقم غير صحيح', event.target);
                }
                
                this.notifyValidationChange({
                    isValid: this.isValid,
                    phone: value,
                    result: result
                });
            });
        }
    }

    /**
     * التحقق الفعلي من رقم الواتساب عبر الخادم
     * @param {string} phone - رقم الهاتف للتحقق منه
     * @returns {Promise<Object>} نتيجة التحقق
     */
    async validateWhatsAppReal(phone) {
        if (!phone || phone.length < 5) {
            return { is_valid: false, valid: false, error: 'رقم قصير جداً' };
        }

        try {
            // محاولة كلا الـ endpoints للتوافق
            let response;
            try {
                response = await fetch('/validate-whatsapp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': this.getCSRFToken()
                    },
                    body: JSON.stringify({ phone: phone, phone_number: phone })
                });
            } catch (e) {
                // محاولة بديلة
                response = await fetch('/validate_whatsapp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': this.getCSRFToken()
                    },
                    body: JSON.stringify({ phone: phone, phone_number: phone })
                });
            }

            if (!response.ok) {
                throw new Error('خطأ في الخادم');
            }

            const result = await response.json();
            
            // توحيد الاستجابة
            return {
                is_valid: result.is_valid || result.valid,
                valid: result.is_valid || result.valid,
                error: result.error || result.message,
                ...result
            };

        } catch (error) {
            console.error('خطأ في التحقق:', error);
            return { is_valid: false, valid: false, error: 'خطأ في الاتصال' };
        }
    }

    /**
     * عرض معلومات نجاح التحقق
     * @param {Object} info - معلومات الرقم المتحقق منه
     * @param {HTMLElement} inputElement - عنصر الإدخال
     */
    showPhoneInfo(info, inputElement) {
        // إزالة معلومات سابقة
        const existingInfo = document.querySelector('.phone-info');
        if (existingInfo) {
            existingInfo.classList.remove('show');
            setTimeout(() => existingInfo.remove(), 300);
        }

        // التحقق من صحة البيانات
        if (!info.is_valid) {
            this.showPhoneInfoError(info.error || 'رقم غير صحيح', inputElement);
            return;
        }

        // إنشاء عنصر المعلومات المبسط
        const infoDiv = document.createElement('div');
        infoDiv.className = 'phone-info success-info';
        
        infoDiv.innerHTML = `
            <div class="info-content">
                <div class="info-header">
                    <i class="fas fa-check-circle"></i>
                    <span>رقم صحيح ومتاح على واتساب</span>
                </div>
                <div class="phone-display">
                    <span class="formatted-number">${info.formatted || inputElement.value}</span>
                </div>
                <div class="validation-badge">
                    <i class="fas fa-whatsapp"></i>
                    <span>تم التحقق من الرقم</span>
                </div>
            </div>
        `;
        
        // إضافة العنصر وتطبيق الانيميشن
        const container = inputElement.closest('.form-group') || inputElement.parentNode;
        container.appendChild(infoDiv);
        
        setTimeout(() => {
            infoDiv.classList.add('show', 'animated');
        }, 100);

        // اهتزاز للنجاح (للهواتف)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    /**
     * عرض رسالة خطأ في التحقق
     * @param {string} errorMessage - رسالة الخطأ
     * @param {HTMLElement} inputElement - عنصر الإدخال
     */
    showPhoneInfoError(errorMessage, inputElement) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'phone-info error-info';
        errorDiv.innerHTML = `
            <div class="info-content">
                <i class="fas fa-times-circle"></i>
                <span>${errorMessage}</span>
            </div>
        `;
        
        const container = inputElement.closest('.form-group') || inputElement.parentNode;
        container.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 100);
    }

    /**
     * عرض حالة التحميل
     * @param {HTMLElement} inputElement - عنصر الإدخال
     */
    showPhoneInfoLoading(inputElement) {
        const existingInfo = document.querySelector('.phone-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'phone-info loading-info';
        loadingDiv.innerHTML = `
            <div class="phone-info-loading">
                <div class="loading-spinner-small"></div>
                <span>جاري التحقق من الرقم...</span>
            </div>
        `;
        
        const container = inputElement.closest('.form-group') || inputElement.parentNode;
        container.appendChild(loadingDiv);
        
        setTimeout(() => {
            loadingDiv.classList.add('show');
        }, 100);
    }

    /**
     * مسح جميع معلومات الرقم المعروضة
     */
    clearPhoneInfo() {
        const phoneInfoElements = document.querySelectorAll('.phone-info');
        phoneInfoElements.forEach(element => {
            element.classList.remove('show', 'animated');
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
            }, 300);
        });
    }

    /**
     * تنسيق إدخال رقم الهاتف
     * @param {string} value - الرقم المدخل
     * @returns {string} الرقم المنسق
     */
    formatPhoneInput(value) {
        // إزالة جميع الرموز غير الرقمية باستثناء + في البداية
        let cleaned = value.replace(/[^\d+]/g, '');
        
        // التأكد من أن + موجود فقط في البداية
        if (cleaned.includes('+')) {
            const parts = cleaned.split('+');
            cleaned = '+' + parts.join('');
        }
        
        return cleaned;
    }

    /**
     * تحديث واجهة التحقق
     * @param {HTMLElement} input - عنصر الإدخال
     * @param {boolean} isValid - حالة صحة البيانات
     * @param {string} message - رسالة التحقق
     */
    updateValidationUI(input, isValid, message) {
        const container = input.closest('.form-group');
        if (!container) return;
        
        // إزالة الكلاسات الموجودة
        container.classList.remove('valid', 'invalid');
        input.classList.remove('valid', 'invalid');
        
        // إزالة رسائل الخطأ الموجودة
        const existingError = container.querySelector('.error-message');
        const existingSuccess = container.querySelector('.success-message');
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        
        if (message) {
            if (isValid) {
                container.classList.add('valid');
                input.classList.add('valid');
                if (message.includes('✓')) {
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = message;
                    container.appendChild(successMsg);
                }
            } else {
                container.classList.add('invalid');
                input.classList.add('invalid');
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = message;
                container.appendChild(errorMsg);
            }
        } else if (isValid) {
            container.classList.add('valid');
            input.classList.add('valid');
        }
    }

    /**
     * إلغاء جميع مؤقتات التحقق
     */
    clearValidationTimers() {
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
            this.validationTimeout = null;
        }
        if (this.whatsappValidationTimer) {
            clearTimeout(this.whatsappValidationTimer);
            this.whatsappValidationTimer = null;
        }
    }

    /**
     * إشعار النظام الرئيسي بتغيير حالة التحقق
     * @param {Object} data - بيانات التحقق
     */
    notifyValidationChange(data) {
        if (typeof this.onValidationChange === 'function') {
            this.onValidationChange(data);
        }

        // إرسال حدث مخصص للنظام
        const event = new CustomEvent('whatsappValidationChanged', {
            detail: {
                isValid: data.isValid,
                phone: data.phone,
                result: data.result,
                validator: this
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * الحصول على رمز CSRF
     * @returns {string} رمز CSRF
     */
    getCSRFToken() {
        const token = document.querySelector('meta[name="csrf-token"]') || 
                      document.querySelector('input[name="csrfmiddlewaretoken"]');
        return token ? token.getAttribute('content') || token.value : '';
    }

    /**
     * الحصول على حالة التحقق الحالية
     * @returns {boolean} true إذا كان الرقم صحيح
     */
    getValidationStatus() {
        return {
            isValid: this.isValid,
            phone: this.lastValidatedPhone,
            inputElement: this.whatsappInput
        };
    }

    /**
     * إعادة تعيين التحقق
     */
    reset() {
        this.clearValidationTimers();
        this.clearPhoneInfo();
        this.isValid = false;
        this.lastValidatedPhone = '';
        
        if (this.whatsappInput) {
            this.whatsappInput.value = '';
            this.whatsappInput.classList.remove('validating', 'valid', 'invalid');
        }
        
        console.log('📱 WhatsApp Validator reset');
    }

    /**
     * تدمير الوحدة وتنظيف المستمعين
     */
    destroy() {
        this.clearValidationTimers();
        this.clearPhoneInfo();
        
        if (this.whatsappInput) {
            // إزالة مستمعي الأحداث (Clone and replace method)
            const newInput = this.whatsappInput.cloneNode(true);
            this.whatsappInput.parentNode.replaceChild(newInput, this.whatsappInput);
        }
        
        this.initialized = false;
        console.log('📱 WhatsApp Validator destroyed');
    }
}

// إنشاء instance عام للوحدة
const whatsappValidator = new WhatsAppValidator();

// تصدير للاستخدام الخارجي
window.FC26WhatsAppValidator = whatsappValidator;

// تهيئة تلقائية عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        whatsappValidator.init();
    });
} else {
    whatsappValidator.init();
}

// تصدير ES6 للوحدات
export default whatsappValidator;
export { WhatsAppValidator, whatsappValidator as initializeWhatsAppValidator };
