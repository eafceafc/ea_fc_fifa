// FC 26 Profile Setup - كود JavaScript مدمج كامل
// دمج متقدم لكودين مع جميع الميزات والتحسينات

// متغيرات عامة
let isSubmitting = false;
let lastSubmitTime = 0;
let validationTimeout = null;
let whatsappValidationTimer = null;

// حالات التحقق
let validationStates = {
    whatsapp: false,
    paymentMethod: false,
    platform: false
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // إنشاء الجسيمات المتحركة
    createParticles();
    
    // تهيئة جميع مستمعي الأحداث
    initializeEventListeners();
    
    // تحسين الأداء للهواتف
    if (window.innerWidth <= 768) {
        optimizeForMobile();
    }
    
    // تهيئة الميزات المتقدمة
    initializeAdvancedFeatures();
});

// إنشاء الجسيمات المتحركة للخلفية
function createParticles() {
    const container = document.getElementById('particlesBg');
    if (!container) return;
    
    const particleCount = window.innerWidth <= 768 ? 15 : 25;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
        container.appendChild(particle);
    }
}

// تحسين للهواتف المحمولة
function optimizeForMobile() {
    // تقليل عدد الجسيمات
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        if (index > 10) {
            particle.remove();
        }
    });
    
    // تحسين الانيميشن
    document.body.style.setProperty('--animation-duration', '0.2s');
    
    // معالجة لوحة المفاتيح على الهواتف
    setupMobileKeyboardHandling();
}

// معالجة لوحة المفاتيح للهواتف
function setupMobileKeyboardHandling() {
    let viewportHeight = window.innerHeight;
    
    window.addEventListener('resize', function() {
        const currentHeight = window.innerHeight;
        const heightDifference = viewportHeight - currentHeight;
        
        if (heightDifference > 150) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
        }
    });
    
    // تركيز الحقول مع تمرير سلس
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('focus', function() {
            setTimeout(() => {
                this.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        });
    });
}

// التحقق الفوري والمتقدم من رقم الواتساب
async function validateWhatsAppReal(phone) {
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
                    'X-CSRFToken': getCSRFToken()
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
                    'X-CSRFToken': getCSRFToken()
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

// عرض معلومات مبسطة للرقم
function showPhoneInfo(info, inputElement) {
    // إزالة معلومات سابقة
    const existingInfo = document.querySelector('.phone-info');
    if (existingInfo) {
        existingInfo.classList.remove('show');
        setTimeout(() => existingInfo.remove(), 300);
    }

    // التحقق من صحة البيانات
    if (!info.is_valid) {
        showPhoneInfoError(info.error || 'رقم غير صحيح', inputElement);
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

// عرض خطأ في معلومات الرقم
function showPhoneInfoError(errorMessage, inputElement) {
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

// عرض حالة التحميل لرقم الواتساب
function showPhoneInfoLoading(inputElement) {
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

// إزالة معلومات الرقم
function clearPhoneInfo() {
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

// تهيئة جميع مستمعي الأحداث
function initializeEventListeners() {
    // عناصر النموذج الأساسية
    const platformCards = document.querySelectorAll('.platform-card');
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const whatsappInput = document.getElementById('whatsapp');
    const form = document.getElementById('profileForm');

    // معالجة اختيار المنصة
    setupPlatformSelection(platformCards);
    
    // معالجة اختيار طريقة الدفع
    setupPaymentSelection(paymentButtons);
    
    // معالجة رقم الواتساب
    setupWhatsAppInput(whatsappInput);
    
    // معالجة الحقول الديناميكية
    setupDynamicInputs();
    
    // معالجة إرسال النموذج
    setupFormSubmission(form);
    
    // تهيئة الميزات المتقدمة
    initializeTooltips();
    initializeAnimations();
    
    // منع إرسال النموذج بالضغط على Enter
    setupEnterKeyHandling();
}

// إعداد اختيار المنصة
function setupPlatformSelection(platformCards) {
    platformCards.forEach(card => {
        card.addEventListener('click', function() {
            // إزالة التحديد من الكل
            platformCards.forEach(c => c.classList.remove('selected'));
            
            // تحديد البطاقة المضغوطة
            this.classList.add('selected');
            const platformInput = document.getElementById('platform');
            if (platformInput) {
                platformInput.value = this.dataset.platform;
            }
            
            // تحديث حالة التحقق
            validationStates.platform = true;
            
            // إضافة تأثير اهتزاز خفيف (للهواتف)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            checkFormValidity();
        });
    });
}

// إعداد اختيار طريقة الدفع
function setupPaymentSelection(paymentButtons) {
    paymentButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            const paymentType = this.dataset.type;
            const paymentValue = this.dataset.value;
            
            const paymentMethodInput = document.getElementById('payment_method');
            if (paymentMethodInput) {
                paymentMethodInput.value = paymentValue;
            }
            
            // إخفاء جميع الحقول الديناميكية
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
            
            // إظهار الحقل المناسب
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
            
            // اهتزاز للهواتف
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            
            // إعادة التحقق من طرق الدفع
            setTimeout(validatePaymentMethod, 200);
        });
    });
}

// إعداد حقل رقم الواتساب
function setupWhatsAppInput(whatsappInput) {
    if (!whatsappInput) return;
    
    // معالجة الإدخال مع التحقق الفوري
    whatsappInput.addEventListener('input', function(e) {
        const inputValue = this.value;
        
        // تنظيف الرقم أولاً
        let cleanValue = formatPhoneInput(inputValue);
        this.value = cleanValue;
        
        // إزالة معلومات سابقة عند بدء الكتابة
        clearPhoneInfo();
        
        // إلغاء التحقق السابق
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        if (whatsappValidationTimer) {
            clearTimeout(whatsappValidationTimer);
        }
        
        // إعادة تعيين حالة التحقق
        validationStates.whatsapp = false;
        updateValidationUI(this, false, '');
        
        // تحقق فوري بعد توقف المستخدم عن الكتابة
        if (cleanValue.length >= 5) {
            // إضافة مؤشر التحميل
            this.classList.add('validating');
            showPhoneInfoLoading(this);
            
            validationTimeout = setTimeout(async () => {
                const result = await validateWhatsAppReal(cleanValue);
                
                // إزالة مؤشر التحميل
                this.classList.remove('validating');
                
                // تحديث حالة التحقق
                validationStates.whatsapp = result.is_valid || result.valid;
                
                // عرض النتيجة
                if (validationStates.whatsapp) {
                    updateValidationUI(this, true, 'رقم واتساب صحيح ✓');
                    showPhoneInfo(result, this);
                } else {
                    updateValidationUI(this, false, result.error || result.message || 'رقم غير صحيح');
                    showPhoneInfoError(result.error || result.message || 'رقم غير صحيح', this);
                }
                
                // تحديث حالة النموذج
                checkFormValidity();
                
            }, 800); // انتظار 800ms بعد توقف الكتابة
        } else {
            this.classList.remove('validating');
            checkFormValidity();
        }
    });
    
    // التحقق عند فقدان التركيز
    whatsappInput.addEventListener('blur', function() {
        const value = this.value.trim();
        if (value && !validationStates.whatsapp) {
            validateWhatsAppReal(value).then(result => {
                validationStates.whatsapp = result.is_valid || result.valid;
                if (validationStates.whatsapp) {
                    updateValidationUI(this, true, 'رقم واتساب صحيح ✓');
                    showPhoneInfo(result, this);
                } else {
                    updateValidationUI(this, false, result.error || result.message || 'رقم غير صحيح');
                }
                checkFormValidity();
            });
        }
    });
}

// تنسيق إدخال رقم الهاتف
function formatPhoneInput(value) {
    // إزالة جميع الرموز غير الرقمية باستثناء + في البداية
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // التأكد من أن + موجود فقط في البداية
    if (cleaned.includes('+')) {
        const parts = cleaned.split('+');
        cleaned = '+' + parts.join('');
    }
    
    return cleaned;
}

// إعداد الحقول الديناميكية لطرق الدفع
function setupDynamicInputs() {
    // جميع حقول طرق الدفع
    const paymentInputs = [
        'vodafone_cash', 'etisalat_cash', 'orange_cash', 'we_pay', 
        'fawry', 'aman', 'masary', 'bee', 'mobile-number',
        'telda_card', 'card-number', 'instapay_link', 'payment-link'
    ];

    paymentInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function() {
                validatePaymentInput(this);
                checkFormValidity();
            });
            
            input.addEventListener('blur', function() {
                validatePaymentInput(this);
                checkFormValidity();
            });
        }
    });
    
    // نظام تيلدا المحسن - تنسيق متطور للبطاقات
    function initializeTeldaCardSystem() {
        const teldaInput = document.getElementById('telda_card') || document.getElementById('card-number');
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
        teldaInput.addEventListener('input', function(e) {
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
            validateTeldaCard(e.target);
            addTeldaVisualEffects(e.target, value);
            checkFormValidity();
        });
        
        // معالج اللصق المحسن
        teldaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');
            let numbers = pastedText.replace(/[^\d]/g, '');
            
            if (numbers.length <= 16) {
                this.value = numbers;
                this.dispatchEvent(new Event('input'));
            }
        });
        
        // تأثيرات التركيز
        teldaInput.addEventListener('focus', function() {
            this.parentNode.classList.add('telda-focused');
        });
        
        teldaInput.addEventListener('blur', function() {
            this.parentNode.classList.remove('telda-focused');
            finalTeldaValidation(this);
        });
    }

    // التحقق من صحة كارت تيلدا
    function validateTeldaCard(input) {
        const value = input.value;
        const numbersOnly = value.replace(/[^\d]/g, '');
        const container = input.parentNode;
        
        // إزالة تأثيرات سابقة
        container.classList.remove('telda-valid', 'telda-invalid', 'telda-partial');
        
        if (numbersOnly.length === 0) {
            return;
        } else if (numbersOnly.length < 16) {
            container.classList.add('telda-partial');
            showTeldaStatus(input, 'جاري الكتابة...', 'partial');
        } else if (numbersOnly.length === 16) {
            container.classList.add('telda-valid');
            showTeldaStatus(input, '✅ رقم كارت صحيح', 'valid');
            
            // اهتزاز نجاح
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50]);
            }
        } else {
            container.classList.add('telda-invalid');
            showTeldaStatus(input, '❌ رقم طويل جداً', 'invalid');
        }
    }

    // التحقق النهائي لكارت تيلدا
    function finalTeldaValidation(input) {
        const numbersOnly = input.value.replace(/[^\d]/g, '');
        
        if (numbersOnly.length > 0 && numbersOnly.length !== 16) {
            showTeldaStatus(input, '⚠️ رقم كارت تيلدا يجب أن يكون 16 رقم', 'invalid');
        }
    }

    // عرض حالة تيلدا
    function showTeldaStatus(input, message, type) {
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

    // تأثيرات بصرية لتيلدا
    function addTeldaVisualEffects(input, numbersValue) {
        const container = input.parentNode;
        
        // تأثير النبض للأرقام الجديدة
        if (numbersValue.length > 0 && numbersValue.length % 4 === 0) {
            container.classList.add('telda-pulse');
            setTimeout(() => {
                container.classList.remove('telda-pulse');
            }, 200);
        }
        
        // شريط التقدم
        updateTeldaProgressBar(input, numbersValue.length);
    }

    // شريط تقدم تيلدا
    function updateTeldaProgressBar(input, length) {
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

    // معالجة خاصة لكارت تيلدا (تنسيق الأرقام) - استبدال الكود القديم
    initializeTeldaCardSystem();
}

// التحقق من صحة حقول الدفع
function validatePaymentInput(input) {
    const value = input.value.trim();
    const inputId = input.id;
    let isValid = false;
    let errorMessage = '';
    
    if (!value) {
        updateValidationUI(input, true, ''); // فارغ = صحيح للحقول الاختيارية
        return true;
    }
    
    // التحقق من المحافظ الإلكترونية (11 رقم)
    if (['vodafone_cash', 'etisalat_cash', 'orange_cash', 'we_pay', 
         'fawry', 'aman', 'masary', 'bee', 'mobile-number'].includes(inputId)) {
        isValid = /^01[0125][0-9]{8}$/.test(value) && value.length === 11;
        errorMessage = isValid ? '' : 'رقم المحفظة يجب أن يكون 11 رقم ويبدأ بـ 010، 011، 012، أو 015';
    }
    // التحقق من كارت تيلدا (16 رقم)
    else if (['telda_card', 'card-number'].includes(inputId)) {
        const numbersOnly = value.replace(/\s/g, '');
        isValid = /^\d{16}$/.test(numbersOnly);
        errorMessage = isValid ? '' : 'رقم كارت تيلدا يجب أن يكون 16 رقم';
    }
    // التحقق من رابط إنستا باي
    else if (['instapay_link', 'payment-link'].includes(inputId)) {
        isValid = isValidInstaPayLink(value);
        errorMessage = isValid ? '' : 'رابط إنستا باي غير صحيح';
    }
    
    updateValidationUI(input, isValid, errorMessage);
    return isValid;
}

// التحقق الشامل من طرق الدفع
function validatePaymentMethod() {
    const paymentInputs = document.querySelectorAll('input[name$="_cash"], input[name="telda_card"], input[name="instapay_link"], .dynamic-input.show input');
    let hasValidPayment = false;
    
    paymentInputs.forEach(input => {
        if (validatePaymentInput(input)) {
            const value = input.value.trim();
            if (value) {
                hasValidPayment = true;
            }
        }
    });
    
    validationStates.paymentMethod = hasValidPayment;
    return hasValidPayment;
}

// التحقق من صحة رابط إنستا باي
function isValidInstaPayLink(link) {
    const instaPayPatterns = [
        /^https?:\/\/(www\.)?instapay\.com\.eg\//i,
        /^https?:\/\/(www\.)?instapay\.app\//i,
        /^instapay:\/\//i,
        /^https?:\/\/(www\.)?app\.instapay\.com\.eg\//i
    ];
    
    return instaPayPatterns.some(pattern => pattern.test(link));
}

// تحديث واجهة التحقق للحقول
function updateValidationUI(input, isValid, message) {
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

// التحقق الشامل من صحة النموذج
function checkFormValidity() {
    // التحقق من جميع المتطلبات
    const platform = document.getElementById('platform')?.value;
    const whatsapp = document.getElementById('whatsapp')?.value;
    const paymentMethod = document.getElementById('payment_method')?.value;
    
    // تحديث حالات التحقق
    validationStates.platform = !!platform;
    
    // التحقق من صحة الواتساب من المعلومات المعروضة
    const phoneInfo = document.querySelector('.phone-info.success-info');
    validationStates.whatsapp = !!(whatsapp && phoneInfo);
    
    // التحقق من طرق الدفع
    validatePaymentMethod();
    
    // التحقق النهائي
    const isValid = validationStates.platform && validationStates.whatsapp && validationStates.paymentMethod;
    
    updateSubmitButton(isValid);
    return isValid;
}

// تحديث زر الإرسال
function updateSubmitButton(isValid = null) {
    const submitBtn = document.getElementById('submitBtn') || document.querySelector('.submit-btn');
    if (!submitBtn) return;
    
    if (isValid === null) {
        isValid = validationStates.platform && validationStates.whatsapp && validationStates.paymentMethod;
    }
    
    submitBtn.disabled = !isValid;
    submitBtn.classList.toggle('enabled', isValid);
    
    // تحديث النص والأيقونة
    if (isValid) {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال البيانات';
        submitBtn.style.opacity = '1';
        submitBtn.style.transform = 'scale(1)';
    } else {
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> أكمل البيانات المطلوبة';
        submitBtn.style.opacity = '0.6';
        submitBtn.style.transform = 'scale(0.98)';
    }
}

// إعداد إرسال النموذج
function setupFormSubmission(form) {
    if (!form) return;
    
    form.addEventListener('submit', handleFormSubmit);
}

// معالجة إرسال النموذج - مبسط بدون تليجرام
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // منع الإرسال المتكرر
    const now = Date.now();
    if (isSubmitting || (now - lastSubmitTime < 3000)) {
        showNotification('يرجى الانتظار قبل المحاولة مرة أخرى', 'error');
        return;
    }
    
    // التحقق النهائي من النموذج
    if (!checkFormValidity()) {
        showNotification('يرجى إكمال جميع البيانات المطلوبة', 'error');
        return;
    }
    
    isSubmitting = true;
    lastSubmitTime = now;
    
    const loading = document.getElementById('loading');
    const loadingSpinner = document.getElementById('loading-spinner');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn') || document.querySelector('.submit-btn');
    
    // إخفاء الرسائل السابقة
    if (successMessage) successMessage.classList.remove('show');
    if (errorMessage) errorMessage.classList.remove('show');
    
    // عرض شاشة التحميل
    if (loading) loading.classList.add('show');
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    
    // تحديث زر الإرسال
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    }
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    try {
        const formData = new FormData(e.target);
        
        const response = await fetch('/update-profile', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        const result = await response.json();
        
        // إخفاء شاشة التحميل
        if (loading) loading.classList.remove('show');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        if (response.ok && result.success) {
            // عرض رسالة النجاح
            let successText = '✅ تم حفظ بياناتك بنجاح!';
            if (result.data && result.data.whatsapp_number) {
                successText += `<br><small>رقم الواتساب: ${result.data.whatsapp_number}</small>`;
            }
            
            if (successMessage) {
                successMessage.innerHTML = successText;
                successMessage.classList.add('show');
            } else {
                showNotification('تم إرسال البيانات بنجاح!', 'success');
            }
            
            // اهتزاز نجاح
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            
            // الانتقال التلقائي بعد ثانيتين
            setTimeout(() => {
                window.location.href = result.next_step || '/coins-order';
            }, 2000);
            
        } else {
            const errorText = result.message || 'حدث خطأ غير متوقع';
            if (errorMessage) {
                errorMessage.textContent = errorText;
                errorMessage.classList.add('show');
            } else {
                showNotification(errorText, 'error');
            }
            
            // اهتزاز خطأ
            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 300]);
            }
        }
        
    } catch (error) {
        console.error('خطأ في الشبكة:', error);
        
        // إخفاء شاشة التحميل
        if (loading) loading.classList.remove('show');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        
        const errorText = 'خطأ في الاتصال، يرجى المحاولة مرة أخرى';
        if (errorMessage) {
            errorMessage.textContent = errorText;
            errorMessage.classList.add('show');
        } else {
            showNotification(errorText, 'error');
        }
        
        // اهتزاز خطأ شبكة
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
        }
    }
    
    isSubmitting = false;
    updateSubmitButton();
}

// معالجة مفتاح Enter
function setupEnterKeyHandling() {
    // منع إرسال النموذج بالضغط على Enter في الحقول
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = getNextInput(input);
                if (nextInput) {
                    nextInput.focus();
                } else {
                    // إذا كان النموذج صحيح، قم بالإرسال
                    if (checkFormValidity()) {
                        const form = input.closest('form');
                        if (form) {
                            handleFormSubmit({ preventDefault: () => {}, target: form });
                        }
                    }
                }
            }
        });
    });
}

// الحصول على الحقل التالي
function getNextInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled])'));
    const currentIndex = inputs.indexOf(currentInput);
    return inputs[currentIndex + 1] || null;
}

// إظهار إشعار مؤقت
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // تطبيق الأنماط
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#DC2626' : type === 'success' ? '#10B981' : '#3B82F6'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        max-width: 90%;
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);
    
    // إخفاء تلقائي بعد 5 ثوان
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // زر الإغلاق
    notification.querySelector('.notification-close').addEventListener('click', () => {
        hideNotification(notification);
    });
}

// إخفاء الإشعار
function hideNotification(notification) {
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// الحصول على رمز CSRF
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]');
    return token ? token.getAttribute('content') || token.value : '';
}

// تهيئة tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

// إظهار tooltip
function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    if (!text) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        white-space: nowrap;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 100);
    
    e.target.tooltipElement = tooltip;
}

// إخفاء tooltip
function hideTooltip(e) {
    if (e.target.tooltipElement) {
        const tooltip = e.target.tooltipElement;
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 300);
        delete e.target.tooltipElement;
    }
}

// تهيئة الانيميشن
function initializeAnimations() {
    // تهيئة Intersection Observer للانيميشن
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // إضافة العناصر للمراقبة
        document.querySelectorAll('.form-group, .platform-card, .payment-btn').forEach(el => {
            observer.observe(el);
        });
    }
}

// تهيئة الميزات المتقدمة
function initializeAdvancedFeatures() {
    // تحسين الأداء للهواتف
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-optimized');
    }
    
    // مراقبة تغيير حجم الشاشة
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth <= 768) {
                document.body.classList.add('mobile-optimized');
            } else {
                document.body.classList.remove('mobile-optimized');
            }
        }, 250);
    });
    
    // تحسين التمرير للهواتف
    let ticking = false;
    function updateScrollPosition() {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        
        // إضافة كلاس للتحكم في العناصر الثابتة
        if (scrollY > 50) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
        }
    });
}

// ✅ نظام ربط التليجرام المبسط الجديد - زر واحد فقط
function initializeTelegramButton() {
    const telegramButton = document.getElementById('telegram-link-btn');
    if (!telegramButton) return;
    
    telegramButton.addEventListener('click', async function() {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحصول على الكود...';
        
        try {
            const response = await fetch('/api/link_telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                }
            });
            
            const result = await response.json();
            
            if (result.success && result.telegram_code) {
                // فتح التليجرام مع /start فوراً
                const botUsername = result.bot_username || 'ea_fc_fifa_bot';
                const telegramUrl = `https://t.me/${botUsername}?start=${result.telegram_code}`;
                window.open(telegramUrl, '_blank');
                
                // تحديث النص
                this.innerHTML = '✅ تم فتح التليجرام - أدخل للبوت';
                
                // إشعار للمستخدم
                showNotification('📱 تم فتح التليجرام! أدخل للبوت الآن', 'success');
                
                // مراقبة الربط كل 3 ثوان
                const checkInterval = setInterval(async () => {
                    try {
                        const checkResponse = await fetch(`/check-telegram-status/${result.telegram_code}`);
                        const checkResult = await checkResponse.json();
                        
                        if (checkResult.success && checkResult.is_linked) {
                            clearInterval(checkInterval);
                            showNotification('✅ تم ربط التليجرام بنجاح!', 'success');
                            
                            // اهتزاز نجاح
                            if (navigator.vibrate) {
                                navigator.vibrate([200, 100, 200]);
                            }
                            
                            // الانتقال التلقائي فوراً
                            setTimeout(() => {
                                window.location.href = '/coins-order';
                            }, 1000);
                        }
                    } catch (error) {
                        console.error('خطأ في فحص الربط:', error);
                    }
                }, 3000);
                
                // إيقاف المراقبة بعد دقيقة
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (this.innerHTML.includes('✅')) {
                        this.innerHTML = 'ربط مع التليجرام احصل على كود فوري وادخل للبوت';
                        this.disabled = false;
                        showNotification('⏰ انتهت مهلة الربط - اضغط للمحاولة مرة أخرى', 'info');
                    }
                }, 60000);
                
            } else {
                throw new Error(result.message || 'فشل في الحصول على الكود');
            }
            
        } catch (error) {
            console.error('خطأ:', error);
            this.innerHTML = '❌ خطأ - اضغط للمحاولة مرة أخرى';
            this.disabled = false;
            showNotification('خطأ في الاتصال، جرب مرة أخرى', 'error');
        }
    });
}

// تشغيل نظام التليجرام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeTelegramButton();
});

console.log('✅ FC 26 Profile System - JavaScript loaded successfully');

// ═══ النهاية - لا تضع أي شيء بعد هذا ═══
