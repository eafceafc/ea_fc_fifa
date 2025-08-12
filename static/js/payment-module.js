// FC 26 Payment Module - وحدة طرق الدفع المستقلة الكاملة
// الهدف: فصل كامل لمنطق طرق الدفع مع نظام تيلدا المتقدم

/**
 * Payment Module - نظام طرق الدفع المستقل
 * يدير جميع طرق الدفع السبعة مع التحقق والتأثيرات البصرية
 */

class PaymentModule {
    constructor() {
        this.selectedPayment = null;
        this.selectedType = null;
        this.paymentButtons = [];
        this.dynamicInputs = [];
        this.onPaymentChange = null;
        this.initialized = false;
        this.validationStates = {
            paymentMethod: false
        };
    }

    /**
     * تهيئة وحدة طرق الدفع
     * @param {Function} onChangeCallback - دالة يتم استدعاؤها عند تغيير طريقة الدفع
     */
    init(onChangeCallback = null) {
        if (this.initialized) {
            console.warn('💳 Payment Module already initialized');
            return;
        }

        this.onPaymentChange = onChangeCallback;
        this.setupPaymentButtons();
        this.setupDynamicInputs();
        this.initializeTeldaCardSystem();
        this.initialized = true;
        
        console.log('💳 Payment Module initialized successfully');
    }

    /**
     * إعداد أزرار طرق الدفع مع مستمعي الأحداث
     */
    setupPaymentButtons() {
        this.paymentButtons = document.querySelectorAll('.payment-btn');
        
        if (this.paymentButtons.length === 0) {
            console.warn('⚠️ No payment buttons found');
            return;
        }

        this.paymentButtons.forEach(btn => {
            btn.addEventListener('click', (event) => {
                this.handlePaymentSelection(event, btn);
            });
        });

        console.log(`💳 ${this.paymentButtons.length} payment buttons initialized`);
    }

    /**
     * معالجة اختيار طريقة الدفع
     */
    handlePaymentSelection(event, selectedBtn) {
        event.preventDefault();
        
        // إزالة التحديد من جميع الأزرار
        this.paymentButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // تحديد الزر المختار
        selectedBtn.classList.add('selected');
        
        const paymentType = selectedBtn.dataset.type;
        const paymentValue = selectedBtn.dataset.value;
        
        this.selectedPayment = paymentValue;
        this.selectedType = paymentType;
        
        // تحديث الحقل المخفي
        const paymentMethodInput = document.getElementById('payment_method');
        if (paymentMethodInput) {
            paymentMethodInput.value = paymentValue;
        }
        
        // إخفاء جميع الحقول الديناميكية
        this.hideAllDynamicInputs();
        
        // إظهار الحقل المناسب
        this.showTargetInput(paymentType);
        
        // اهتزاز للهواتف
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
        
        // إعادة التحقق من طرق الدفع
        setTimeout(() => {
            this.validatePaymentMethod();
        }, 200);
        
        // إشعار النظام الرئيسي
        this.notifyPaymentChange({
            paymentMethod: paymentValue,
            paymentType: paymentType,
            isValid: this.validationStates.paymentMethod
        });
        
        console.log(`💳 Payment selected: ${paymentValue} (${paymentType})`);
    }

    /**
     * إخفاء جميع الحقول الديناميكية
     */
    hideAllDynamicInputs() {
        document.querySelectorAll('.dynamic-input').forEach(input => {
            input.classList.remove('show');
            const inputField = input.querySelector('input');
            if (inputField) {
                inputField.required = false;
                inputField.value = '';
            }
        });
        
        // إخفاء رسائل الخطأ
        document.querySelectorAll('.error-message-field').forEach(error => {
            error.classList.remove('show');
        });
    }

    /**
     * إظهار الحقل المناسب لطريقة الدفع
     */
    showTargetInput(paymentType) {
        const targetInput = document.getElementById(paymentType + '-input');
        if (targetInput) {
            setTimeout(() => {
                targetInput.classList.add('show');
                const inputField = targetInput.querySelector('input');
                if (inputField) {
                    inputField.required = true;
                    
                    // تركيز تلقائي للهواتف
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            inputField.focus();
                        }, 300);
                    }
                }
            }, 150);
        }
    }

    /**
     * إعداد الحقول الديناميكية لطرق الدفع
     */
    setupDynamicInputs() {
        const paymentInputs = [
            'mobile-number',
            'card-number', 
            'payment-link'
        ];

        paymentInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (event) => {
                    this.validatePaymentInput(event.target);
                    this.checkFormValidity();
                });
                
                input.addEventListener('blur', (event) => {
                    this.validatePaymentInput(event.target);
                    this.checkFormValidity();
                });
            }
        });
    }

    /**
     * نظام تيلدا المحسن - تنسيق متطور للبطاقات
     */
    initializeTeldaCardSystem() {
        const teldaInput = document.getElementById('card-number');
        if (!teldaInput) return;
        
        // إضافة أيقونة تيلدا
        const inputContainer = teldaInput.parentNode;
        if (!inputContainer.querySelector('.telda-icon')) {
            const teldaIcon = document.createElement('div');
            teldaIcon.className = 'telda-icon';
            teldaIcon.innerHTML = '<i class="fas fa-credit-card"></i>';
            inputContainer.style.position = 'relative';
            inputContainer.appendChild(teldaIcon);
        }
        
        // معالج الإدخال المحسن
        teldaInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^\d]/g, ''); // أرقام فقط
            let formattedValue = '';
            
            // تنسيق بصيغة 1234-5678-9012-3456
            for (let i = 0; i < value.length; i += 4) {
                if (i > 0) formattedValue += '-';
                formattedValue += value.substr(i, 4);
            }
            
            // تحديد طول مناسب (16 رقم + 3 شرطات = 19 حرف)
            if (formattedValue.length <= 19) {
                e.target.value = formattedValue;
            }
            
            // التحقق الفوري
            this.validateTeldaCard(e.target);
            this.addTeldaVisualEffects(e.target, value);
        });
        
        // معالج اللصق المحسن
        teldaInput.addEventListener('paste', (e) => {
            e.preventDefault();
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');
            let numbers = pastedText.replace(/[^\d]/g, '');
            
            if (numbers.length <= 16) {
                teldaInput.value = numbers;
                teldaInput.dispatchEvent(new Event('input'));
            }
        });
        
        // تأثيرات التركيز
        teldaInput.addEventListener('focus', function() {
            this.parentNode.classList.add('telda-focused');
        });
        
        teldaInput.addEventListener('blur', (e) => {
            e.target.parentNode.classList.remove('telda-focused');
            this.finalTeldaValidation(e.target);
        });
    }

    /**
     * التحقق من صحة كارت تيلدا
     */
    validateTeldaCard(input) {
        const value = input.value;
        const numbersOnly = value.replace(/[^\d]/g, '');
        const container = input.parentNode;
        
        // إزالة تأثيرات سابقة
        container.classList.remove('telda-valid', 'telda-invalid', 'telda-partial');
        
        if (numbersOnly.length === 0) {
            return;
        } else if (numbersOnly.length < 16) {
            container.classList.add('telda-partial');
            this.showTeldaStatus(input, 'جاري الكتابة...', 'partial');
        } else if (numbersOnly.length === 16) {
            container.classList.add('telda-valid');
            this.showTeldaStatus(input, '✅ رقم كارت صحيح', 'valid');
            
            // اهتزاز نجاح
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        } else {
            container.classList.add('telda-invalid');
            this.showTeldaStatus(input, '❌ رقم طويل جداً', 'invalid');
        }
    }

    /**
     * التحقق النهائي لكارت تيلدا
     */
    finalTeldaValidation(input) {
        const numbersOnly = input.value.replace(/[^\d]/g, '');
        
        if (numbersOnly.length > 0 && numbersOnly.length !== 16) {
            this.showTeldaStatus(input, '⚠️ رقم كارت تيلدا يجب أن يكون 16 رقم', 'invalid');
        }
    }

    /**
     * عرض حالة تيلدا
     */
    showTeldaStatus(input, message, type) {
        const existingStatus = input.parentNode.querySelector('.telda-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        if (!message) return;
        
        const statusDiv = document.createElement('div');
        statusDiv.className = `telda-status telda-${type}`;
        statusDiv.textContent = message;
        
        input.parentNode.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.classList.add('show');
        }, 100);
        
        // إزالة تلقائية بعد 3 ثوان للرسائل الجزئية
        if (type === 'partial') {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.classList.remove('show');
                    setTimeout(() => statusDiv.remove(), 300);
                }
            }, 3000);
        }
    }

    /**
     * تأثيرات بصرية لتيلدا
     */
    addTeldaVisualEffects(input, numbersValue) {
        const container = input.parentNode;
        
        // تأثير النبض للأرقام الجديدة
        if (numbersValue.length > 0 && numbersValue.length % 4 === 0) {
            container.classList.add('telda-pulse');
            setTimeout(() => {
                container.classList.remove('telda-pulse');
            }, 200);
        }
        
        // شريط التقدم
        this.updateTeldaProgressBar(input, numbersValue.length);
    }

    /**
     * شريط تقدم تيلدا
     */
    updateTeldaProgressBar(input, length) {
        let progressBar = input.parentNode.querySelector('.telda-progress');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'telda-progress';
            progressBar.innerHTML = '<div class="telda-progress-fill"></div>';
            input.parentNode.appendChild(progressBar);
        }
        
        const progressFill = progressBar.querySelector('.telda-progress-fill');
        const percentage = Math.min((length / 16) * 100, 100);
        
        progressFill.style.width = percentage + '%';
        
        // ألوان مختلفة حسب التقدم
        if (percentage < 25) {
            progressFill.style.background = '#ef4444';
        } else if (percentage < 50) {
            progressFill.style.background = '#f97316';
        } else if (percentage < 75) {
            progressFill.style.background = '#eab308';
        } else if (percentage < 100) {
            progressFill.style.background = '#22c55e';
        } else {
            progressFill.style.background = '#10b981';
        }
    }

    /**
     * التحقق من صحة حقول الدفع
     */
    validatePaymentInput(input) {
        const value = input.value.trim();
        const inputId = input.id;
        let isValid = false;
        let errorMessage = '';
        
        if (!value) {
            this.updateValidationUI(input, true, ''); // فارغ = صحيح للحقول الاختيارية
            return true;
        }
        
        // التحقق من المحافظ الإلكترونية (11 رقم)
        if (inputId === 'mobile-number') {
            isValid = /^01[0125][0-9]{8}$/.test(value) && value.length === 11;
            errorMessage = isValid ? '' : 'رقم المحفظة يجب أن يكون 11 رقم ويبدأ بـ 010، 011، 012، أو 015';
        }
        // التحقق من كارت تيلدا (16 رقم)
        else if (inputId === 'card-number') {
            const numbersOnly = value.replace(/[^\d]/g, '');
            isValid = numbersOnly.length === 16;
            errorMessage = isValid ? '' : 'رقم كارت تيلدا يجب أن يكون 16 رقم';
        }
        // التحقق من رابط إنستا باي
        else if (inputId === 'payment-link') {
            isValid = this.isValidInstaPayLink(value);
            errorMessage = isValid ? '' : 'رابط إنستا باي غير صحيح';
        }
        
        this.updateValidationUI(input, isValid, errorMessage);
        return isValid;
    }

    /**
     * التحقق الشامل من طرق الدفع
     */
    validatePaymentMethod() {
        const paymentInputs = document.querySelectorAll('.dynamic-input.show input');
        let hasValidPayment = false;
        
        paymentInputs.forEach(input => {
            if (this.validatePaymentInput(input)) {
                const value = input.value.trim();
                if (value) {
                    hasValidPayment = true;
                }
            }
        });
        
        this.validationStates.paymentMethod = hasValidPayment;
        return hasValidPayment;
    }

    /**
     * التحقق من صحة رابط إنستا باي
     */
    isValidInstaPayLink(link) {
        const instaPayPatterns = [
            /^https?:\/\/(www\.)?instapay\.com\.eg\//i,
            /^https?:\/\/(www\.)?instapay\.app\//i,
            /^instapay:\/\//i,
            /^https?:\/\/(www\.)?app\.instapay\.com\.eg\//i,
            /^https?:\/\/(www\.)?ipn\.eg\//i
        ];
        
        return instaPayPatterns.some(pattern => pattern.test(link));
    }

    /**
     * تحديث واجهة التحقق للحقول
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
     * فحص صحة النموذج (للتكامل مع النظام الرئيسي)
     */
    checkFormValidity() {
        this.validatePaymentMethod();
        
        // إشعار النظام الرئيسي
        if (typeof this.onPaymentChange === 'function') {
            this.onPaymentChange({
                paymentMethod: this.selectedPayment,
                paymentType: this.selectedType,
                isValid: this.validationStates.paymentMethod
            });
        }
        
        // إرسال حدث مخصص
        const event = new CustomEvent('paymentValidationChanged', {
            detail: {
                isValid: this.validationStates.paymentMethod,
                paymentMethod: this.selectedPayment,
                paymentType: this.selectedType,
                validator: this
            }
        });
        document.dispatchEvent(event);
        
        return this.validationStates.paymentMethod;
    }

    /**
     * إشعار النظام الرئيسي بتغيير طريقة الدفع
     */
    notifyPaymentChange(data) {
        if (typeof this.onPaymentChange === 'function') {
            this.onPaymentChange(data);
        }
        
        const event = new CustomEvent('paymentMethodChanged', {
            detail: {
                ...data,
                module: this
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * الحصول على طريقة الدفع المختارة
     */
    getSelectedPayment() {
        return {
            method: this.selectedPayment,
            type: this.selectedType,
            isValid: this.validationStates.paymentMethod
        };
    }

    /**
     * التحقق من صحة حالة الدفع
     */
    isValid() {
        return this.validationStates.paymentMethod && this.selectedPayment !== null;
    }

    /**
     * إعادة تعيين طريقة الدفع
     */
    reset() {
        this.paymentButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.hideAllDynamicInputs();
        
        this.selectedPayment = null;
        this.selectedType = null;
        this.validationStates.paymentMethod = false;
        
        const paymentMethodInput = document.getElementById('payment_method');
        if (paymentMethodInput) {
            paymentMethodInput.value = '';
        }
        
        console.log('💳 Payment selection reset');
    }

    /**
     * تدمير الوحدة وتنظيف المستمعين
     */
    destroy() {
        this.paymentButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        this.dynamicInputs.forEach(input => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
        });
        
        this.reset();
        this.initialized = false;
        console.log('💳 Payment Module destroyed');
    }
}

// إنشاء instance عام للوحدة
const paymentModule = new PaymentModule();

// تصدير للاستخدام الخارجي
window.FC26PaymentModule = paymentModule;

// تهيئة تلقائية عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        paymentModule.init();
    });
} else {
    paymentModule.init();
}

// تصدير ES6 للوحدات
export default paymentModule;
export { PaymentModule, paymentModule as initializePaymentModule };
