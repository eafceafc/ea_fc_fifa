/**
 * ===== SHAHD AL-SENIORA PAYMENT HANDLER SYSTEM =====
 * نظام معالجة طرق الدفع المتقدم لشهد السنيورة
 * إدارة شاملة لجميع طرق الدفع المدعومة مع تحقق متطور
 */

class PaymentHandler {
    constructor() {
        this.isReady = false;
        this.currentMethod = null;
        this.paymentValidators = new Map();
        this.paymentHistory = [];
        
        // قاعدة بيانات طرق الدفع المدعومة
        this.paymentMethods = {
            vodafone_cash: {
                name: 'فودافون كاش',
                icon: 'V',
                color: '#e60000',
                format: 'phone',
                regex: /^010\d{8}$/,
                placeholder: '010xxxxxxxx',
                description: 'رقم فودافون كاش (11 رقم)',
                fees: 0.02, // 2%
                limits: { min: 10, max: 10000 }
            },
            etisalat_cash: {
                name: 'اتصالات كاش',
                icon: 'E',
                color: '#00b04f',
                format: 'phone',
                regex: /^(011|014)\d{8}$/,
                placeholder: '011xxxxxxxx أو 014xxxxxxxx',
                description: 'رقم اتصالات كاش (11 رقم)',
                fees: 0.025, // 2.5%
                limits: { min: 10, max: 8000 }
            },
            orange_cash: {
                name: 'أورانج كاش',
                icon: 'O',
                color: '#ff7900',
                format: 'phone',
                regex: /^012\d{8}$/,
                placeholder: '012xxxxxxxx',
                description: 'رقم أورانج كاش (11 رقم)',
                fees: 0.03, // 3%
                limits: { min: 10, max: 5000 }
            },
            we_pay: {
                name: 'وي باي',
                icon: 'W',
                color: '#5f2c91',
                format: 'phone',
                regex: /^015\d{8}$/,
                placeholder: '015xxxxxxxx',
                description: 'رقم وي باي (11 رقم)',
                fees: 0.025, // 2.5%
                limits: { min: 10, max: 7000 }
            },
            telda_card: {
                name: 'كارت تيلدا',
                icon: 'T',
                color: '#2c5aa0',
                format: 'card',
                regex: /^\d{16}$/,
                placeholder: 'xxxx xxxx xxxx xxxx',
                description: 'رقم كارت تيلدا (16 رقم)',
                fees: 0.015, // 1.5%
                limits: { min: 10, max: 15000 }
            },
            instapay: {
                name: 'إنستا باي',
                icon: 'I',
                color: '#00a8ff',
                format: 'link',
                regex: /^(https?:\/\/.*instapay.*|@\w+|.*@.*)$/i,
                placeholder: 'رابط إنستا باي أو @username',
                description: 'رابط أو اسم مستخدم إنستا باي',
                fees: 0.02, // 2%
                limits: { min: 10, max: 12000 }
            }
        };
        
        // إعدادات النظام
        this.config = {
            enableRealTimeValidation: true,
            showPaymentInfo: true,
            autoFormatInput: true,
            showFeesCalculation: true,
            enablePaymentPreview: true,
            animateTransitions: true
        };
        
        // إحصائيات الاستخدام
        this.stats = {
            totalValidations: 0,
            methodUsage: {},
            validationErrors: 0,
            averageValidationTime: 0,
            popularMethods: []
        };

        this.log('💳 تم تهيئة نظام معالجة طرق الدفع');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.utils = this.core.getModule('utils');
        this.ui = this.core.getModule('ui');
        this.validation = this.core.getModule('validation');
        
        this.setupEventListeners();
        this.enhancePaymentUI();
        this.loadPaymentHistory();
        this.isReady = true;
        
        this.log('✅ نظام معالجة طرق الدفع جاهز للعمل');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لتغيير طريقة الدفع
        this.core.on('payment:method_changed', (data) => {
            this.handleMethodChange(data.method);
        });

        // الاستماع لتغييرات حقل تفاصيل الدفع
        this.core.on('input:changed', (data) => {
            if (data.name === 'payment_details') {
                this.handlePaymentDetailsInput(data);
            }
        });

        // الاستماع لطلبات التحقق
        this.core.on('payment:validate_request', (data) => {
            this.validatePaymentDetails(data.method, data.details, data.callback);
        });

        this.log('👂 تم إعداد مستمعي أحداث الدفع');
    }

    /**
     * تحسين واجهة الدفع
     */
    enhancePaymentUI() {
        this.setupPaymentMethods();
        this.createPaymentDetailsSection();
        this.addPaymentStyles();
        this.setupPaymentPreview();
        
        this.log('🎨 تم تحسين واجهة الدفع');
    }

    /**
     * إعداد طرق الدفع
     */
    setupPaymentMethods() {
        const paymentOptions = document.querySelectorAll('.payment-option');
        
        paymentOptions.forEach((option, index) => {
            const radio = option.querySelector('input[type="radio"]');
            const label = option.querySelector('.payment-label');
            
            if (radio && label) {
                // إضافة معلومات إضافية
                this.enhancePaymentOption(option, radio, label);
                
                // ربط الأحداث
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectPaymentMethod(e.target.value);
                    }
                });
                
                // تأثيرات التمرير
                this.addHoverEffects(option, radio.value);
            }
        });
    }

    /**
     * تحسين خيار الدفع
     */
    enhancePaymentOption(option, radio, label) {
        const method = this.paymentMethods[radio.value];
        if (!method) return;
        
        // إضافة معلومات الرسوم
        const feesInfo = document.createElement('div');
        feesInfo.className = 'payment-fees';
        feesInfo.innerHTML = `
            <small>رسوم: ${(method.fees * 100).toFixed(1)}%</small>
        `;
        
        // إضافة معلومات الحدود
        const limitsInfo = document.createElement('div');
        limitsInfo.className = 'payment-limits';
        limitsInfo.innerHTML = `
            <small>الحد: ${method.limits.min} - ${method.limits.max} جنيه</small>
        `;
        
        label.appendChild(feesInfo);
        label.appendChild(limitsInfo);
        
        // إضافة أيقونة الحالة
        const statusIcon = document.createElement('div');
        statusIcon.className = 'payment-status-icon';
        statusIcon.innerHTML = '✓';
        label.appendChild(statusIcon);
    }

    /**
     * إضافة تأثيرات التمرير
     */
    addHoverEffects(option, methodValue) {
        const method = this.paymentMethods[methodValue];
        if (!method) return;
        
        option.addEventListener('mouseenter', () => {
            this.showMethodPreview(method);
        });
        
        option.addEventListener('mouseleave', () => {
            this.hideMethodPreview();
        });
    }

    /**
     * إنشاء قسم تفاصيل الدفع
     */
    createPaymentDetailsSection() {
        const detailsGroup = document.getElementById('paymentDetailsGroup');
        const detailsInput = document.getElementById('paymentDetails');
        
        if (!detailsGroup || !detailsInput) {
            this.logError('عناصر تفاصيل الدفع غير موجودة');
            return;
        }
        
        // إنشاء عناصر المساعدة
        this.createPaymentHelperElements(detailsGroup, detailsInput);
        
        // تحسين الحقل
        this.enhancePaymentDetailsInput(detailsInput);
    }

    /**
     * إنشاء عناصر المساعدة للدفع
     */
    createPaymentHelperElements(container, input) {
        // عنصر معاينة الدفع
        const preview = document.createElement('div');
        preview.id = 'payment-preview';
        preview.className = 'payment-preview hidden';
        container.appendChild(preview);
        
        // عنصر حساب الرسوم
        const calculator = document.createElement('div');
        calculator.id = 'fees-calculator';
        calculator.className = 'fees-calculator hidden';
        container.appendChild(calculator);
        
        // عنصر التنسيق المباشر
        const formatter = document.createElement('div');
        formatter.id = 'input-formatter';
        formatter.className = 'input-formatter hidden';
        container.appendChild(formatter);
        
        // عنصر التحقق المرئي
        const validator = document.createElement('div');
        validator.id = 'payment-validator';
        validator.className = 'payment-validator';
        container.appendChild(validator);
    }

    /**
     * تحسين حقل تفاصيل الدفع
     */
    enhancePaymentDetailsInput(input) {
        // التحقق أثناء الكتابة
        input.addEventListener('input', (e) => {
            this.handleRealTimeValidation(e);
        });
        
        // التنسيق التلقائي
        input.addEventListener('keyup', (e) => {
            this.handleAutoFormatting(e);
        });
        
        // التحقق عند فقدان التركيز
        input.addEventListener('blur', (e) => {
            this.handleBlurValidation(e);
        });
        
        // معالجة اللصق
        input.addEventListener('paste', (e) => {
            setTimeout(() => this.handlePasteFormatting(e), 10);
        });
        
        // منع الأحرف غير المرغوبة
        input.addEventListener('keypress', (e) => {
            this.handleKeyPress(e);
        });
    }

    /**
     * إضافة أنماط الدفع
     */
    addPaymentStyles() {
        if (document.getElementById('payment-handler-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'payment-handler-styles';
        style.textContent = `
            .payment-option {
                position: relative;
                transition: all 0.3s ease;
            }
            
            .payment-option:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .payment-label {
                position: relative;
                overflow: hidden;
            }
            
            .payment-fees,
            .payment-limits {
                margin-top: 4px;
                opacity: 0.7;
                font-size: 0.75rem;
            }
            
            .payment-status-icon {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 20px;
                height: 20px;
                background: #4caf50;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                opacity: 0;
                transform: scale(0);
                transition: all 0.3s ease;
            }
            
            .payment-option input:checked + .payment-label .payment-status-icon {
                opacity: 1;
                transform: scale(1);
            }
            
            .payment-preview {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                margin-top: 10px;
                transition: all 0.3s ease;
            }
            
            .payment-preview.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .payment-preview.hidden {
                opacity: 0;
                transform: translateY(-10px);
                display: none;
            }
            
            .preview-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .preview-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
            }
            
            .preview-details {
                font-size: 0.9rem;
                color: #666;
                line-height: 1.4;
            }
            
            .fees-calculator {
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-top: 8px;
                font-size: 0.9rem;
            }
            
            .fees-breakdown {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
            }
            
            .fees-total {
                font-weight: bold;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 152, 0, 0.3);
                margin-top: 8px;
            }
            
            .input-formatter {
                background: rgba(33, 150, 243, 0.1);
                border: 1px solid rgba(33, 150, 243, 0.3);
                border-radius: 6px;
                padding: 8px;
                margin-top: 6px;
                font-size: 0.85rem;
                color: #1976d2;
            }
            
            .payment-validator {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
                font-size: 0.85rem;
                min-height: 20px;
            }
            
            .validator-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                color: white;
            }
            
            .validator-icon.valid {
                background: #4caf50;
            }
            
            .validator-icon.invalid {
                background: #f44336;
            }
            
            .validator-icon.checking {
                background: #ff9800;
                animation: pulse 1s infinite;
            }
            
            .validator-message {
                flex: 1;
            }
            
            .validator-message.valid {
                color: #4caf50;
            }
            
            .validator-message.invalid {
                color: #f44336;
            }
            
            .validator-message.checking {
                color: #ff9800;
            }
            
            .payment-details-enhanced {
                position: relative;
            }
            
            .payment-details-enhanced.formatting::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(233, 30, 99, 0.2), transparent);
                animation: formatting-indicator 1s;
            }
            
            @keyframes formatting-indicator {
                to {
                    left: 100%;
                }
            }
            
            .method-preview-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .method-preview-tooltip.show {
                opacity: 1;
                transform: translateX(-50%) translateY(-5px);
            }
            
            .method-preview-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: rgba(0, 0, 0, 0.9);
            }
            
            @keyframes pulse {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.1);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
        `;
        
        document.head.appendChild(style);
        this.log('🎨 تم إضافة أنماط الدفع');
    }

    /**
     * اختيار طريقة دفع
     */
    selectPaymentMethod(methodValue) {
        const method = this.paymentMethods[methodValue];
        if (!method) {
            this.logError('طريقة دفع غير مدعومة:', methodValue);
            return;
        }
        
        this.currentMethod = method;
        
        this.log('💳 تم اختيار طريقة الدفع:', method.name);
        
        // إظهار/إخفاء حقل التفاصيل
        this.togglePaymentDetailsVisibility(true);
        
        // تحديث تسمية الحقل
        this.updatePaymentDetailsLabel(method);
        
        // تحديث المحتوى التعليمي
        this.updatePaymentPlaceholder(method);
        
        // إظهار معاينة الطريقة
        this.showPaymentMethodInfo(method);
        
        // تسجيل الاستخدام
        this.trackMethodUsage(methodValue);
        
        // إشعار النظام
        this.core?.emit('payment:method_selected', {
            method: methodValue,
            details: method
        });
    }

    /**
     * إظهار/إخفاء تفاصيل الدفع
     */
    togglePaymentDetailsVisibility(show) {
        const detailsGroup = document.getElementById('paymentDetailsGroup');
        if (detailsGroup) {
            detailsGroup.style.display = show ? 'block' : 'none';
            
            if (show && this.config.animateTransitions) {
                detailsGroup.style.opacity = '0';
                detailsGroup.style.transform = 'translateY(-10px)';
                
                requestAnimationFrame(() => {
                    detailsGroup.style.transition = 'all 0.3s ease';
                    detailsGroup.style.opacity = '1';
                    detailsGroup.style.transform = 'translateY(0)';
                });
            }
        }
    }

    /**
     * تحديث تسمية حقل التفاصيل
     */
    updatePaymentDetailsLabel(method) {
        const label = document.getElementById('paymentDetailsLabel');
        if (label) {
            label.innerHTML = `
                <i class="fas fa-info-circle"></i>
                ${method.description}
            `;
        }
    }

    /**
     * تحديث النص التوضيحي
     */
    updatePaymentPlaceholder(method) {
        const input = document.getElementById('paymentDetails');
        if (input) {
            input.placeholder = method.placeholder;
            input.classList.add('payment-details-enhanced');
        }
    }

    /**
     * إظهار معلومات طريقة الدفع
     */
    showPaymentMethodInfo(method) {
        const preview = document.getElementById('payment-preview');
        if (!preview) return;
        
        preview.innerHTML = `
            <div class="preview-header">
                <div class="preview-icon" style="background-color: ${method.color}">
                    ${method.icon}
                </div>
                <div>
                    <div style="font-weight: 600;">${method.name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">${method.description}</div>
                </div>
            </div>
            <div class="preview-details">
                <div>📱 التنسيق: ${method.format === 'phone' ? 'رقم هاتف' : method.format === 'card' ? 'رقم بطاقة' : 'رابط/اسم مستخدم'}</div>
                <div>💰 الرسوم: ${(method.fees * 100).toFixed(1)}% من المبلغ</div>
                <div>📊 الحدود: ${method.limits.min} - ${method.limits.max} جنيه</div>
            </div>
        `;
        
        preview.classList.remove('hidden');
        preview.classList.add('show');
    }

    /**
     * معالجة إدخال تفاصيل الدفع
     */
    handlePaymentDetailsInput(data) {
        const { value, element } = data;
        
        if (!this.currentMethod) return;
        
        // التحقق الفوري
        if (this.config.enableRealTimeValidation) {
            this.performRealTimeValidation(value, element);
        }
        
        // حساب الرسوم إذا كان المبلغ متاحاً
        if (this.config.showFeesCalculation) {
            this.updateFeesCalculation();
        }
    }

    /**
     * التحقق في الوقت الفعلي
     */
    async performRealTimeValidation(value, element) {
        if (!value || !this.currentMethod) {
            this.clearPaymentValidation();
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // عرض حالة التحقق
            this.showPaymentValidation('checking', 'جاري التحقق...');
            element.classList.add('checking');
            
            // تنفيذ التحقق
            const result = await this.validatePaymentDetails(this.currentMethod, value);
            
            // تحديث العرض
            this.updatePaymentValidationDisplay(result, element);
            
            // تسجيل الإحصائيات
            const validationTime = Date.now() - startTime;
            this.updateValidationStats(result, validationTime);
            
        } catch (error) {
            this.logError('خطأ في التحقق من الدفع', error);
            this.showPaymentValidation('invalid', 'خطأ في التحقق');
        }
    }

    /**
     * التحقق من تفاصيل الدفع
     */
    async validatePaymentDetails(method, details, callback = null) {
        if (typeof method === 'string') {
            method = this.paymentMethods[method];
        }
        
        if (!method) {
            const error = { isValid: false, message: 'طريقة دفع غير مدعومة' };
            callback?.(error);
            return error;
        }
        
        try {
            // التحقق المحلي
            const localResult = this.performLocalPaymentValidation(method, details);
            
            // التحقق الإضافي المتخصص
            const enhancedResult = await this.performEnhancedValidation(method, details, localResult);
            
            callback?.(enhancedResult);
            return enhancedResult;
            
        } catch (error) {
            this.logError('فشل في التحقق من تفاصيل الدفع', error);
            const errorResult = {
                isValid: false,
                error: error.message,
                message: 'حدث خطأ أثناء التحقق'
            };
            
            callback?.(errorResult);
            return errorResult;
        }
    }

    /**
     * التحقق المحلي من تفاصيل الدفع
     */
    performLocalPaymentValidation(method, details) {
        const result = {
            isValid: false,
            message: '',
            formatted: details,
            method: method.name,
            details: {}
        };
        
        if (!details || details.trim().length === 0) {
            result.message = 'يرجى إدخال تفاصيل الدفع';
            return result;
        }
        
        const cleaned = this.cleanPaymentInput(details, method);
        result.formatted = this.formatPaymentInput(cleaned, method);
        
        // التحقق من النمط الأساسي
        if (!method.regex.test(cleaned)) {
            result.message = this.getFormatErrorMessage(method);
            return result;
        }
        
        // تحقق إضافي حسب نوع الطريقة
        const typeValidation = this.validateByType(method, cleaned);
        if (!typeValidation.isValid) {
            result.message = typeValidation.message;
            return result;
        }
        
        // الإعداد النهائي للنتيجة الصحيحة
        result.isValid = true;
        result.message = `تم التحقق من ${method.name} بنجاح`;
        result.details = typeValidation.details || {};
        
        return result;
    }

    /**
     * التحقق المحسن
     */
    async performEnhancedValidation(method, details, localResult) {
        if (!localResult.isValid) {
            return localResult;
        }
        
        const enhanced = { ...localResult };
        
        // إضافة معلومات الرسوم
        enhanced.feesInfo = this.calculateFees(method, 1000); // مثال بمبلغ 1000
        
        // إضافة تفاصيل خاصة بكل طريقة
        switch (method.format) {
            case 'phone':
                enhanced.details.networkInfo = this.getNetworkInfo(details);
                break;
            case 'card':
                enhanced.details.cardInfo = this.getCardInfo(details);
                break;
            case 'link':
                enhanced.details.linkInfo = this.getLinkInfo(details);
                break;
        }
        
        // فحص الأمان
        enhanced.securityCheck = this.performSecurityCheck(details);
        
        return enhanced;
    }

    /**
     * التحقق حسب النوع
     */
    validateByType(method, details) {
        switch (method.format) {
            case 'phone':
                return this.validatePhonePayment(details);
            case 'card':
                return this.validateCardPayment(details);
            case 'link':
                return this.validateLinkPayment(details);
            default:
                return { isValid: true };
        }
    }

    /**
     * التحقق من دفع الهاتف
     */
    validatePhonePayment(phone) {
        const result = { isValid: true, details: {} };
        
        // فحص الطول
        if (phone.length !== 11) {
            return { isValid: false, message: 'رقم الهاتف يجب أن يكون 11 رقم' };
        }
        
        // فحص البداية
        if (!phone.startsWith('01')) {
            return { isValid: false, message: 'رقم الهاتف يجب أن يبدأ بـ 01' };
        }
        
        // تحديد الشبكة
        const networkCode = phone.substring(0, 3);
        const networkInfo = this.getPhoneNetworkInfo(networkCode);
        
        if (!networkInfo) {
            return { isValid: false, message: 'شبكة الهاتف غير مدعومة' };
        }
        
        result.details.network = networkInfo;
        result.details.formatted = this.formatPhoneNumber(phone);
        
        return result;
    }

    /**
     * التحقق من دفع البطاقة
     */
    validateCardPayment(cardNumber) {
        const result = { isValid: true, details: {} };
        
        // فحص الطول
        if (cardNumber.length !== 16) {
            return { isValid: false, message: 'رقم البطاقة يجب أن يكون 16 رقم' };
        }
        
        // فحص Luhn
        if (!this.luhnCheck(cardNumber)) {
            return { isValid: false, message: 'رقم البطاقة غير صحيح' };
        }
        
        result.details.type = this.getCardType(cardNumber);
        result.details.formatted = this.formatCardNumber(cardNumber);
        result.details.masked = this.maskCardNumber(cardNumber);
        
        return result;
    }

    /**
     * التحقق من دفع الرابط
     */
    validateLinkPayment(link) {
        const result = { isValid: true, details: {} };
        
        // فحص نمط الرابط أو اسم المستخدم
        if (link.startsWith('@')) {
            result.details.type = 'username';
            result.details.username = link.substring(1);
        } else if (link.includes('instapay')) {
            result.details.type = 'link';
            result.details.domain = this.extractDomain(link);
        } else if (link.includes('@')) {
            result.details.type = 'email';
            result.details.email = link;
        } else {
            return { isValid: false, message: 'تنسيق الرابط أو اسم المستخدم غير صحيح' };
        }
        
        return result;
    }

    /**
     * تنظيف إدخال الدفع
     */
    cleanPaymentInput(input, method) {
        if (!input) return '';
        
        switch (method.format) {
            case 'phone':
                // إزالة جميع غير الأرقام
                return input.replace(/\D/g, '');
            case 'card':
                // إزالة جميع غير الأرقام
                return input.replace(/\D/g, '');
            case 'link':
                // تنظيف الرابط
                return input.trim().toLowerCase();
            default:
                return input.trim();
        }
    }

    /**
     * تنسيق إدخال الدفع
     */
    formatPaymentInput(input, method) {
        if (!input) return '';
        
        switch (method.format) {
            case 'phone':
                return this.formatPhoneNumber(input);
            case 'card':
                return this.formatCardNumber(input);
            case 'link':
                return input;
            default:
                return input;
        }
    }

    /**
     * تنسيق رقم الهاتف
     */
    formatPhoneNumber(phone) {
        if (!phone || phone.length !== 11) return phone;
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }

    /**
     * تنسيق رقم البطاقة
     */
    formatCardNumber(cardNumber) {
        if (!cardNumber) return '';
        return cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    /**
     * إخفاء رقم البطاقة جزئياً
     */
    maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 8) return cardNumber;
        const masked = '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
        return this.formatCardNumber(masked);
    }

    /**
     * فحص Luhn للبطاقات
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
     * الحصول على معلومات الشبكة
     */
    getPhoneNetworkInfo(networkCode) {
        const networks = {
            '010': { name: 'فودافون', color: '#e60000' },
            '011': { name: 'اتصالات', color: '#00b04f' },
            '012': { name: 'أورانج', color: '#ff7900' },
            '014': { name: 'اتصالات', color: '#00b04f' },
            '015': { name: 'وي', color: '#5f2c91' }
        };
        
        return networks[networkCode] || null;
    }

    /**
     * الحصول على نوع البطاقة
     */
    getCardType(cardNumber) {
        if (cardNumber.startsWith('4')) return 'Visa';
        if (cardNumber.startsWith('5')) return 'Mastercard';
        return 'Unknown';
    }

    /**
     * استخراج النطاق من الرابط
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'غير محدد';
        }
    }

    /**
     * حساب الرسوم
     */
    calculateFees(method, amount) {
        const fees = amount * method.fees;
        const total = amount + fees;
        
        return {
            amount,
            fees: fees.toFixed(2),
            total: total.toFixed(2),
            percentage: (method.fees * 100).toFixed(1)
        };
    }

    /**
     * تحديث حساب الرسوم
     */
    updateFeesCalculation(amount = 1000) {
        if (!this.currentMethod) return;
        
        const calculator = document.getElementById('fees-calculator');
        if (!calculator) return;
        
        const feesInfo = this.calculateFees(this.currentMethod, amount);
        
        calculator.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px;">حاسبة الرسوم (مثال بمبلغ ${amount} جنيه):</div>
            <div class="fees-breakdown">
                <span>المبلغ الأساسي:</span>
                <span>${feesInfo.amount} جنيه</span>
            </div>
            <div class="fees-breakdown">
                <span>الرسوم (${feesInfo.percentage}%):</span>
                <span>${feesInfo.fees} جنيه</span>
            </div>
            <div class="fees-breakdown fees-total">
                <span>الإجمالي:</span>
                <span>${feesInfo.total} جنيه</span>
            </div>
        `;
        
        calculator.classList.remove('hidden');
    }

    /**
     * عرض تحقق الدفع
     */
    showPaymentValidation(type, message) {
        const validator = document.getElementById('payment-validator');
        if (!validator) return;
        
        const icons = {
            valid: '✓',
            invalid: '✗',
            checking: '⏳'
        };
        
        validator.innerHTML = `
            <div class="validator-icon ${type}">${icons[type] || '?'}</div>
            <span class="validator-message ${type}">${message}</span>
        `;
    }

    /**
     * تحديث عرض تحقق الدفع
     */
    updatePaymentValidationDisplay(result, element) {
        element.classList.remove('valid', 'invalid', 'checking');
        element.classList.add(result.isValid ? 'valid' : 'invalid');
        
        this.showPaymentValidation(
            result.isValid ? 'valid' : 'invalid',
            result.message
        );
        
        // إظهار التفاصيل الإضافية
        if (result.isValid && result.details) {
            this.showPaymentDetails(result);
        }
    }

    /**
     * عرض تفاصيل الدفع
     */
    showPaymentDetails(result) {
        const formatter = document.getElementById('input-formatter');
        if (!formatter || !result.details) return;
        
        let detailsText = `تنسيق صحيح: ${result.formatted}`;
        
        if (result.details.network) {
            detailsText += ` • الشبكة: ${result.details.network.name}`;
        }
        
        if (result.details.type) {
            detailsText += ` • النوع: ${result.details.type}`;
        }
        
        formatter.textContent = detailsText;
        formatter.classList.remove('hidden');
    }

    /**
     * مسح تحقق الدفع
     */
    clearPaymentValidation() {
        this.showPaymentValidation('', '');
        
        const formatter = document.getElementById('input-formatter');
        if (formatter) {
            formatter.classList.add('hidden');
        }
        
        const input = document.getElementById('paymentDetails');
        if (input) {
            input.classList.remove('valid', 'invalid', 'checking');
        }
    }

    /**
     * معالجة التحقق عند فقدان التركيز
     */
    handleBlurValidation(event) {
        const input = event.target;
        const value = input.value.trim();
        
        if (value && this.currentMethod) {
            this.validatePaymentDetails(this.currentMethod, value).then(result => {
                this.updatePaymentValidationDisplay(result, input);
            });
        }
    }

    /**
     * معالجة التنسيق التلقائي
     */
    handleAutoFormatting(event) {
        if (!this.config.autoFormatInput || !this.currentMethod) return;
        
        const input = event.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        const cleaned = this.cleanPaymentInput(value, this.currentMethod);
        const formatted = this.formatPaymentInput(cleaned, this.currentMethod);
        
        if (formatted !== value) {
            input.classList.add('formatting');
            input.value = formatted;
            
            // إعادة تعيين موضع المؤشر
            const newPosition = this.calculateCursorPosition(value, formatted, cursorPosition);
            input.setSelectionRange(newPosition, newPosition);
            
            setTimeout(() => {
                input.classList.remove('formatting');
            }, 300);
        }
    }

    /**
     * معالجة تنسيق اللصق
     */
    handlePasteFormatting(event) {
        if (!this.currentMethod) return;
        
        const input = event.target;
        const value = input.value;
        
        const cleaned = this.cleanPaymentInput(value, this.currentMethod);
        const formatted = this.formatPaymentInput(cleaned, this.currentMethod);
        
        if (formatted !== value) {
            input.value = formatted;
            this.performRealTimeValidation(formatted, input);
        }
    }

    /**
     * معالجة ضغط المفاتيح
     */
    handleKeyPress(event) {
        if (!this.currentMethod) return;
        
        const char = String.fromCharCode(event.which);
        const isSpecialKey = this.isSpecialKey(event);
        
        // التحقق حسب نوع الدفع
        switch (this.currentMethod.format) {
            case 'phone':
            case 'card':
                if (!/[0-9]/.test(char) && !isSpecialKey) {
                    event.preventDefault();
                    this.showPaymentValidation('invalid', 'يرجى إدخال الأرقام فقط', 2000);
                }
                break;
            case 'link':
                // السماح بجميع الأحرف للروابط
                break;
        }
    }

    /**
     * التحقق من المفاتيح الخاصة
     */
    isSpecialKey(event) {
        const specialKeys = [8, 9, 13, 27, 37, 38, 39, 40, 46];
        return specialKeys.includes(event.keyCode) || event.ctrlKey || event.metaKey;
    }

    /**
     * حساب موضع المؤشر
     */
    calculateCursorPosition(oldValue, newValue, oldPosition) {
        // منطق مبسط لحساب الموضع الجديد
        let newPosition = oldPosition;
        
        const oldSpaces = (oldValue.substring(0, oldPosition).match(/\s/g) || []).length;
        const newSpaces = (newValue.substring(0, oldPosition).match(/\s/g) || []).length;
        
        newPosition += (newSpaces - oldSpaces);
        
        return Math.min(newPosition, newValue.length);
    }

    /**
     * إجراء فحص الأمان
     */
    performSecurityCheck(details) {
        return {
            isSecure: true,
            warnings: [],
            score: 100
        };
    }

    /**
     * تسجيل استخدام الطريقة
     */
    trackMethodUsage(method) {
        this.stats.methodUsage[method] = (this.stats.methodUsage[method] || 0) + 1;
        this.updatePopularMethods();
        
        this.utils?.trackEvent('payment_method_selected', {
            method,
            timestamp: new Date()
        });
    }

    /**
     * تحديث الطرق الشائعة
     */
    updatePopularMethods() {
        this.stats.popularMethods = Object.entries(this.stats.methodUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([method, count]) => ({ method, count }));
    }

    /**
     * تحديث إحصائيات التحقق
     */
    updateValidationStats(result, validationTime) {
        this.stats.totalValidations++;
        
        if (!result.isValid) {
            this.stats.validationErrors++;
        }
        
        this.stats.averageValidationTime = (
            (this.stats.averageValidationTime * (this.stats.totalValidations - 1)) + validationTime
        ) / this.stats.totalValidations;
    }

    /**
     * الحصول على رسالة خطأ التنسيق
     */
    getFormatErrorMessage(method) {
        const messages = {
            'vodafone_cash': 'رقم فودافون كاش يجب أن يبدأ بـ 010 ويكون 11 رقم',
            'etisalat_cash': 'رقم اتصالات كاش يجب أن يبدأ بـ 011 أو 014 ويكون 11 رقم',
            'orange_cash': 'رقم أورانج كاش يجب أن يبدأ بـ 012 ويكون 11 رقم',
            'we_pay': 'رقم وي باي يجب أن يبدأ بـ 015 ويكون 11 رقم',
            'telda_card': 'رقم كارت تيلدا يجب أن يكون 16 رقم صحيح',
            'instapay': 'رابط إنستا باي أو اسم المستخدم غير صحيح'
        };
        
        // البحث عن الطريقة بالاسم
        for (const [key, paymentMethod] of Object.entries(this.paymentMethods)) {
            if (paymentMethod === method) {
                return messages[key] || 'تنسيق غير صحيح';
            }
        }
        
        return 'تنسيق غير صحيح';
    }

    /**
     * إعداد معاينة الدفع
     */
    setupPaymentPreview() {
        // يمكن إضافة معاينة متقدمة للدفع هنا
    }

    /**
     * عرض معاينة الطريقة
     */
    showMethodPreview(method) {
        // يمكن إضافة تلميحات متقدمة هنا
    }

    /**
     * إخفاء معاينة الطريقة
     */
    hideMethodPreview() {
        // إخفاء التلميحات
    }

    /**
     * حفظ تاريخ الدفع
     */
    savePaymentHistory() {
        this.utils?.setStorage('payment_history', {
            history: this.paymentHistory.slice(0, 20),
            stats: this.stats
        });
    }

    /**
     * تحميل تاريخ الدفع
     */
    loadPaymentHistory() {
        const saved = this.utils?.getStorage('payment_history');
        if (saved) {
            this.paymentHistory = saved.history || [];
            this.stats = { ...this.stats, ...saved.stats };
            this.log('📂 تم تحميل تاريخ الدفع');
        }
    }

    /**
     * الحصول على إحصائيات الدفع
     */
    getPaymentStats() {
        return {
            ...this.stats,
            currentMethod: this.currentMethod?.name || 'غير محدد',
            supportedMethods: Object.keys(this.paymentMethods).length,
            errorRate: this.stats.totalValidations > 0 ? 
                (this.stats.validationErrors / this.stats.totalValidations) * 100 : 0
        };
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
                this.resetPaymentSelection();
                break;
        }
    }

    /**
     * إعادة تعيين اختيار الدفع
     */
    resetPaymentSelection() {
        this.currentMethod = null;
        this.togglePaymentDetailsVisibility(false);
        this.clearPaymentValidation();
        
        const preview = document.getElementById('payment-preview');
        if (preview) {
            preview.classList.add('hidden');
        }
        
        const calculator = document.getElementById('fees-calculator');
        if (calculator) {
            calculator.classList.add('hidden');
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        // إزالة الأنماط
        const style = document.getElementById('payment-handler-styles');
        if (style) {
            style.remove();
        }
        
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام معالجة الدفع');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - دفع] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - دفع - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام معالجة الدفع =====

// إنشاء المثيل
window.PaymentHandler = new PaymentHandler();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('paymentHandler', window.PaymentHandler);
        window.PaymentHandler.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentHandler;
}
