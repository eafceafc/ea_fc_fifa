/**
 * ===== SHAHD AL-SENIORA VALIDATION SYSTEM =====
 * نظام التحقق المتقدم لشهد السنيورة
 * التحقق من صحة البيانات والحقول بطريقة احترافية
 */

class ShahdValidation {
    constructor() {
        this.rules = new Map();
        this.errors = new Map();
        this.isReady = false;
        
        // قواعد التحقق الأساسية
        this.setupDefaultRules();
        
        // حالة التحقق الحالية
        this.validationState = {
            whatsapp: { isValid: false, message: '' },
            emails: { isValid: false, message: '' },
            paymentMethod: { isValid: false, message: '' },
            paymentDetails: { isValid: false, message: '' },
            overall: { isValid: false, message: '' }
        };

        this.log('🔍 تم تهيئة نظام التحقق');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.setupEventListeners();
        this.setupRealtimeValidation();
        this.isReady = true;
        
        this.log('✅ نظام التحقق جاهز للعمل');
    }

    /**
     * إعداد القواعد الافتراضية
     */
    setupDefaultRules() {
        // قواعد رقم الواتساب
        this.addRule('whatsapp', {
            name: 'مطلوب',
            validator: (value) => value && value.trim().length > 0,
            message: 'رقم الواتساب مطلوب'
        });

        this.addRule('whatsapp', {
            name: 'تنسيق صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 10 && cleaned.startsWith('1');
            },
            message: 'رقم الواتساب يجب أن يكون 10 أرقام ويبدأ بـ 1'
        });

        this.addRule('whatsapp', {
            name: 'أرقام مصرية فقط',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                const validPrefixes = ['10', '11', '12', '15'];
                return validPrefixes.some(prefix => cleaned.startsWith(prefix));
            },
            message: 'رقم الواتساب يجب أن يكون مصري صحيح (10, 11, 12, 15)'
        });

        // قواعد البريد الإلكتروني
        this.addRule('email', {
            name: 'تنسيق صحيح',
            validator: (value) => {
                if (!value) return false;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            message: 'عنوان البريد الإلكتروني غير صحيح'
        });

        this.addRule('email', {
            name: 'نطاق مقبول',
            validator: (value) => {
                if (!value) return false;
                const acceptedDomains = [
                    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                    'live.com', 'msn.com', 'icloud.com', 'me.com'
                ];
                const domain = value.split('@')[1]?.toLowerCase();
                return acceptedDomains.includes(domain);
            },
            message: 'يرجى استخدام بريد إلكتروني من مزود معروف (Gmail، Yahoo، Hotmail، إلخ)'
        });

        // قواعد طرق الدفع
        this.addRule('paymentMethod', {
            name: 'مطلوب',
            validator: (value) => value && value.trim().length > 0,
            message: 'يرجى اختيار طريقة الدفع'
        });

        // قواعد تفاصيل الدفع
        this.setupPaymentDetailsRules();

        this.log('📋 تم إعداد قواعد التحقق الأساسية');
    }

    /**
     * إعداد قواعد تفاصيل الدفع
     */
    setupPaymentDetailsRules() {
        // فودافون كاش
        this.addRule('paymentDetails:vodafone_cash', {
            name: 'رقم فودافون صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 11 && cleaned.startsWith('010');
            },
            message: 'رقم فودافون كاش يجب أن يبدأ بـ 010 ويكون 11 رقم'
        });

        // اتصالات كاش
        this.addRule('paymentDetails:etisalat_cash', {
            name: 'رقم اتصالات صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 11 && 
                       (cleaned.startsWith('011') || cleaned.startsWith('014'));
            },
            message: 'رقم اتصالات كاش يجب أن يبدأ بـ 011 أو 014 ويكون 11 رقم'
        });

        // أورانج كاش
        this.addRule('paymentDetails:orange_cash', {
            name: 'رقم أورانج صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 11 && 
                       (cleaned.startsWith('012') || cleaned.startsWith('010'));
            },
            message: 'رقم أورانج كاش يجب أن يبدأ بـ 012 أو 010 ويكون 11 رقم'
        });

        // وي باي
        this.addRule('paymentDetails:we_pay', {
            name: 'رقم وي صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 11 && cleaned.startsWith('015');
            },
            message: 'رقم وي باي يجب أن يبدأ بـ 015 ويكون 11 رقم'
        });

        // كارت تيلدا
        this.addRule('paymentDetails:telda_card', {
            name: 'رقم كارت تيلدا صحيح',
            validator: (value) => {
                if (!value) return false;
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 16 && this.luhnCheck(cleaned);
            },
            message: 'رقم كارت تيلدا يجب أن يكون 16 رقم صحيح'
        });

        // إنستا باي
        this.addRule('paymentDetails:instapay', {
            name: 'رابط إنستا باي صحيح',
            validator: (value) => {
                if (!value) return false;
                const instaPayPattern = /instapay\.com\.eg|instapay|@\w+/i;
                return instaPayPattern.test(value) || value.includes('@');
            },
            message: 'يرجى إدخال رابط إنستا باي أو اسم المستخدم صحيح'
        });
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لأحداث النظام الأساسي
        this.core.on('input:changed', (data) => {
            this.handleInputChange(data);
        });

        this.core.on('validation:validate_form', (data) => {
            return this.validateFormData(data.data);
        });

        this.core.on('validation:check_form', () => {
            this.updateFormValidation();
        });

        this.core.on('payment:method_changed', (data) => {
            this.handlePaymentMethodChange(data.method);
        });

        this.log('👂 تم إعداد مستمعي الأحداث للتحقق');
    }

    /**
     * إعداد التحقق الفوري
     */
    setupRealtimeValidation() {
        // التحقق من الواتساب فورياً
        const whatsappInput = document.getElementById('whatsapp');
        if (whatsappInput) {
            whatsappInput.addEventListener('input', (e) => {
                this.validateWhatsAppRealtime(e.target);
            });
        }

        // التحقق من الإيميلات فورياً
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateEmailRealtime(e.target);
            });
        });

        this.log('⚡ تم إعداد التحقق الفوري');
    }

    /**
     * إضافة قاعدة تحقق جديدة
     */
    addRule(field, rule) {
        if (!this.rules.has(field)) {
            this.rules.set(field, []);
        }
        this.rules.get(field).push(rule);
    }

    /**
     * التحقق من حقل واحد
     */
    validateField(field, value, context = {}) {
        const rules = this.rules.get(field) || [];
        const errors = [];

        for (const rule of rules) {
            if (!rule.validator(value, context)) {
                errors.push(rule.message);
            }
        }

        const isValid = errors.length === 0;
        const result = {
            isValid,
            errors,
            message: errors[0] || ''
        };

        this.validationState[field] = result;
        return result;
    }

    /**
     * التحقق من جميع بيانات النموذج
     */
    async validateFormData(data) {
        this.log('🔍 التحقق من صحة النموذج:', data);
        
        const results = {};
        let overallValid = true;

        try {
            // التحقق من رقم الواتساب
            results.whatsapp = this.validateField('whatsapp', data.whatsapp);
            if (!results.whatsapp.isValid) overallValid = false;

            // التحقق من الإيميلات
            results.emails = await this.validateEmails(data.emails || []);
            if (!results.emails.isValid) overallValid = false;

            // التحقق من طريقة الدفع
            results.paymentMethod = this.validateField('paymentMethod', data.payment_method);
            if (!results.paymentMethod.isValid) overallValid = false;

            // التحقق من تفاصيل الدفع
            if (data.payment_method && data.payment_details) {
                const paymentKey = `paymentDetails:${data.payment_method}`;
                results.paymentDetails = this.validateField(paymentKey, data.payment_details);
                if (!results.paymentDetails.isValid) overallValid = false;
            }

            const finalResult = {
                isValid: overallValid,
                message: overallValid ? 'جميع البيانات صحيحة' : 'يوجد أخطاء في البيانات',
                details: results
            };

            this.validationState.overall = finalResult;
            
            // إشعار النظام بنتيجة التحقق
            this.core?.emit('validation:completed', finalResult);

            return finalResult;

        } catch (error) {
            this.logError('فشل في التحقق من البيانات', error);
            return {
                isValid: false,
                message: 'حدث خطأ أثناء التحقق من البيانات',
                error: error.message
            };
        }
    }

    /**
     * التحقق من الإيميلات المتعددة
     */
    async validateEmails(emails) {
        if (!emails || emails.length === 0) {
            return {
                isValid: false,
                message: 'يجب إدخال بريد إلكتروني واحد على الأقل',
                errors: ['البريد الإلكتروني مطلوب']
            };
        }

        const results = [];
        let hasErrors = false;

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const result = this.validateField('email', email);
            results.push({
                email,
                index: i + 1,
                ...result
            });

            if (!result.isValid) {
                hasErrors = true;
            }
        }

        // فحص التكرار
        const uniqueEmails = new Set(emails.map(e => e.toLowerCase()));
        if (uniqueEmails.size !== emails.length) {
            hasErrors = true;
            results.push({
                isValid: false,
                message: 'لا يمكن تكرار نفس البريد الإلكتروني',
                errors: ['بريد إلكتروني مكرر']
            });
        }

        return {
            isValid: !hasErrors,
            message: hasErrors ? 'يوجد أخطاء في البريد الإلكتروني' : 'جميع البريد الإلكتروني صحيحة',
            results,
            count: emails.length
        };
    }

    /**
     * معالجة تغيير الإدخال
     */
    handleInputChange(data) {
        const { name, value, element } = data;
        
        // التحقق الفوري حسب نوع الحقل
        switch (name) {
            case 'whatsapp':
                this.validateWhatsAppRealtime(element);
                break;
            case 'payment_details':
                this.validatePaymentDetailsRealtime(element);
                break;
            default:
                if (element.type === 'email') {
                    setTimeout(() => this.validateEmailRealtime(element), 500);
                }
        }
    }

    /**
     * التحقق الفوري من الواتساب
     */
    validateWhatsAppRealtime(element) {
        const value = element.value;
        const result = this.validateField('whatsapp', value);
        
        this.updateFieldFeedback(element, result);
        this.updateFormValidation();
        
        // إشعار الوحدات الأخرى
        this.core?.emit('whatsapp:validation_updated', {
            value,
            isValid: result.isValid,
            message: result.message
        });
    }

    /**
     * التحقق الفوري من الإيميل
     */
    validateEmailRealtime(element) {
        const value = element.value;
        const result = this.validateField('email', value);
        
        this.updateFieldFeedback(element, result);
        this.updateFormValidation();
        
        // إشعار الوحدات الأخرى
        this.core?.emit('email:validation_updated', {
            value,
            isValid: result.isValid,
            message: result.message,
            element
        });
    }

    /**
     * التحقق الفوري من تفاصيل الدفع
     */
    validatePaymentDetailsRealtime(element) {
        const value = element.value;
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
        
        if (!paymentMethod) return;
        
        const paymentKey = `paymentDetails:${paymentMethod}`;
        const result = this.validateField(paymentKey, value);
        
        this.updateFieldFeedback(element, result);
        this.updateFormValidation();
        
        // إشعار الوحدات الأخرى
        this.core?.emit('payment_details:validation_updated', {
            value,
            paymentMethod,
            isValid: result.isValid,
            message: result.message
        });
    }

    /**
     * معالجة تغيير طريقة الدفع
     */
    handlePaymentMethodChange(method) {
        const detailsInput = document.getElementById('paymentDetails');
        if (detailsInput && detailsInput.value) {
            // إعادة التحقق من التفاصيل مع الطريقة الجديدة
            this.validatePaymentDetailsRealtime(detailsInput);
        }
        
        this.updateFormValidation();
    }

    /**
     * تحديث ملاحظات الحقل
     */
    updateFieldFeedback(element, result) {
        const feedbackId = element.id + '-feedback';
        const feedbackElement = document.getElementById(feedbackId);
        
        if (!feedbackElement) return;

        // إزالة جميع فئات الحالة
        feedbackElement.classList.remove('success', 'error', 'info');
        element.classList.remove('error', 'success');
        
        if (result.isValid) {
            feedbackElement.classList.add('success');
            feedbackElement.innerHTML = `<i class="fas fa-check-circle"></i> ${result.message || 'صحيح'}`;
            element.classList.add('success');
        } else {
            feedbackElement.classList.add('error');
            feedbackElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${result.message}`;
            element.classList.add('error');
        }
    }

    /**
     * تحديث صحة النموذج العامة
     */
    updateFormValidation() {
        // جمع البيانات الحالية
        const formData = this.core?.collectFormData?.() || {};
        
        // التحقق السريع
        const quickValidation = this.quickValidateForm(formData);
        
        // تحديث حالة زر الإرسال
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            if (quickValidation.isValid) {
                submitBtn.classList.remove('disabled');
                submitBtn.disabled = false;
            } else {
                submitBtn.classList.add('disabled');
                submitBtn.disabled = false; // نتركه مفعل للسماح بالمحاولة
            }
        }
        
        this.validationState.overall = quickValidation;
        
        // إشعار النظام
        this.core?.emit('validation:form_updated', quickValidation);
    }

    /**
     * التحقق السريع من النموذج
     */
    quickValidateForm(data) {
        let isValid = true;
        const issues = [];

        // فحص الواتساب
        if (!data.whatsapp || !this.validateField('whatsapp', data.whatsapp).isValid) {
            isValid = false;
            issues.push('رقم الواتساب');
        }

        // فحص الإيميل
        const emailInputs = document.querySelectorAll('input[type="email"]');
        const emails = Array.from(emailInputs)
            .map(input => input.value.trim())
            .filter(email => email.length > 0);
        
        if (emails.length === 0 || !emails.every(email => this.validateField('email', email).isValid)) {
            isValid = false;
            issues.push('البريد الإلكتروني');
        }

        // فحص طريقة الدفع
        if (!data.payment_method) {
            isValid = false;
            issues.push('طريقة الدفع');
        }

        return {
            isValid,
            message: isValid ? 'النموذج جاهز للإرسال' : `يرجى مراجعة: ${issues.join(', ')}`,
            issues
        };
    }

    /**
     * فحص Luhn للبطاقات الائتمانية
     */
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return (sum % 10) === 0;
    }

    /**
     * الحصول على حالة التحقق الحالية
     */
    getValidationState() {
        return { ...this.validationState };
    }

    /**
     * إعادة تعيين التحقق
     */
    reset() {
        this.errors.clear();
        this.validationState = {
            whatsapp: { isValid: false, message: '' },
            emails: { isValid: false, message: '' },
            paymentMethod: { isValid: false, message: '' },
            paymentDetails: { isValid: false, message: '' },
            overall: { isValid: false, message: '' }
        };
        
        this.log('🔄 تم إعادة تعيين التحقق');
    }

    /**
     * معالجة أحداث النظام
     */
    handleEvent(eventName, data) {
        switch (eventName) {
            case 'system:initialized':
                this.log('📡 تم استلام إشعار تهيئة النظام');
                break;
            case 'form:reset':
                this.reset();
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.rules.clear();
        this.errors.clear();
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام التحقق');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - التحقق] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - التحقق - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام التحقق =====

// إنشاء المثيل
window.ShahdValidation = new ShahdValidation();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('validation', window.ShahdValidation);
        window.ShahdValidation.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShahdValidation;
}
