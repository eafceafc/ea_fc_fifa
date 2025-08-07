// FC 26 Profile Setup - كود JavaScript مدمج كامل
// دمج متقدم لحل الأزرار + كل الميزات الأصلية

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

// متغيرات البريد الإلكتروني
let emailAddresses = [];
const maxEmails = 6;

// تهيئة التطبيق مع الحل الذكي للأزرار
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FC 26 Profile Setup - Starting full initialization...');
    
    // انتظار قصير للتأكد من تحميل كامل عناصر DOM
    setTimeout(() => {
        initializeCompleteApp();
    }, 100);
});

function initializeCompleteApp() {
    console.log('🔧 Initializing complete application...');
    
    try {
        // إنشاء الجسيمات المتحركة
        createParticles();
        
        // 🔥 الحل الذكي للأزرار (من الكود الجديد)
        initializeSmartEventListeners();
        
        // 💫 كل الميزات الأصلية (من الكود القديم)
        initializeAllOriginalFeatures();
        
        // تحسين الأداء للهواتف
        if (window.innerWidth <= 768) {
            optimizeForMobile();
        }
        
        // تهيئة الميزات المتقدمة
        initializeAdvancedFeatures();
        
        console.log('✅ Complete app initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error during complete app initialization:', error);
    }
}

// 🔥 الحل الذكي للأزرار (مأخوذ من الكود الجديد)
function initializeSmartEventListeners() {
    console.log('🎯 Setting up smart event listeners for buttons...');
    
    // 🎮 تهيئة أزرار المنصات بالطريقة الذكية
    setupSmartPlatformButtons();
    
    // 💳 تهيئة أزرار طرق الدفع بالطريقة الذكية  
    setupSmartPaymentButtons();
    
    // 📱 تهيئة زر التليجرام بالطريقة الذكية
    setupSmartTelegramButton();
    
    console.log('✅ Smart button listeners initialized!');
}

function setupSmartPlatformButtons() {
    console.log('🎮 Setting up smart platform buttons...');
    
    const platformCards = document.querySelectorAll('.platform-card');
    
    if (platformCards.length === 0) {
        console.warn('⚠️ No platform cards found!');
        return;
    }
    
    platformCards.forEach((card, index) => {
        console.log(`Setting up platform card ${index + 1}:`, card.dataset.platform);
        
        // 🔥 الحل الذكي: استبدال العقدة بدلاً من إزالة Event Listeners
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        // إضافة مستمع جديد
        newCard.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handlePlatformSelection(this);
        });
        
        // مستمع اللمس للهواتف
        newCard.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        }, { passive: false });
        
        newCard.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            this.style.opacity = '';
            handlePlatformSelection(this);
        }, { passive: false });
    });
    
    console.log(`✅ ${platformCards.length} platform buttons initialized with smart method`);
}

function setupSmartPaymentButtons() {
    console.log('💳 Setting up smart payment buttons...');
    
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    if (paymentButtons.length === 0) {
        console.warn('⚠️ No payment buttons found!');
        return;
    }
    
    paymentButtons.forEach((btn, index) => {
        console.log(`Setting up payment button ${index + 1}:`, btn.dataset.value);
        
        // 🔥 الحل الذكي: استبدال العقدة
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // إضافة مستمع جديد
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handlePaymentSelection(this);
        });
        
        // مستمع اللمس للهواتف
        newBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        }, { passive: false });
        
        newBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            this.style.opacity = '';
            handlePaymentSelection(this);
        }, { passive: false });
    });
    
    console.log(`✅ ${paymentButtons.length} payment buttons initialized with smart method`);
}

function setupSmartTelegramButton() {
    console.log('📱 Setting up smart Telegram button...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        // 🔥 الحل الذكي: استبدال العقدة
        const newBtn = telegramBtn.cloneNode(true);
        telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
        
        newBtn.addEventListener('click', handleTelegramLink);
        console.log('✅ Telegram button initialized with smart method');
    } else {
        console.warn('⚠️ Telegram button not found');
    }
}

// 💫 كل الميزات الأصلية (من الكود القديم 2000 سطر)
function initializeAllOriginalFeatures() {
    console.log('💫 Initializing all original features...');
    
    // 📞 تهيئة حقل الواتساب الأصلي
    initializeOriginalWhatsApp();
    
    // 💳 تهيئة نظام تيلدا الأصلي المتقدم
    initializeOriginalTeldaSystem();
    
    // 🔗 تهيئة نظام استخلاص InstaPay الأصلي
    initializeOriginalInstapaySystem();
    
    // 📧 تهيئة نظام الإيميلات الأصلي
    initializeOriginalEmailSystem();
    
    // 📝 تهيئة النموذج الأصلي
    initializeOriginalFormSystem();
    
    // 🎯 تهيئة الحقول الديناميكية الأصلية
    initializeOriginalDynamicInputs();
    
    console.log('✅ All original features initialized!');
}

// 📞 نظام الواتساب الأصلي المحسن
function initializeOriginalWhatsApp() {
    console.log('📞 Setting up original WhatsApp system...');
    
    const whatsappInput = document.getElementById('whatsapp');
    if (!whatsappInput) {
        console.warn('⚠️ WhatsApp input not found');
        return;
    }
    
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
    
    console.log('✅ Original WhatsApp system initialized');
}

// 💳 نظام تيلدا الأصلي المتقدم
function initializeOriginalTeldaSystem() {
    console.log('💳 Setting up original Telda system...');
    
    const teldaInput = document.getElementById('telda_card') || document.getElementById('card-number');
    if (!teldaInput) {
        console.log('ℹ️ Telda input not found - will be initialized when shown');
        return;
    }
    
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
    
    console.log('✅ Original Telda system initialized');
}

// 🔗 نظام استخلاص InstaPay الأصلي
function initializeOriginalInstapaySystem() {
    console.log('🔗 Setting up original InstaPay system...');
    
    const instapayInput = document.getElementById('payment-link');
    if (!instapayInput) {
        console.log('ℹ️ InstaPay input not found - will be initialized when shown');
        return;
    }
    
    // إضافة مستمعين للاستخلاص الذكي
    instapayInput.addEventListener('input', function() {
        validateInstapayInput(this);
    });
    
    instapayInput.addEventListener('paste', function() {
        // تأخير قصير للسماح بلصق النص
        setTimeout(() => {
            validateInstapayInput(this);
        }, 100);
    });
    
    console.log('✅ Original InstaPay system initialized');
}

// 📧 نظام الإيميلات الأصلي
function initializeOriginalEmailSystem() {
    console.log('📧 Setting up original email system...');
    
    const emailInput = document.getElementById('newEmailInput');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewEmail();
            }
        });
        
        // التحقق أثناء الكتابة
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.style.borderColor = '#EF4444';
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    // إضافة رسالة فارغة في البداية
    if (emailAddresses.length === 0) {
        addEmptyMessage();
    }
    
    console.log('✅ Original email system initialized');
}

// 📝 تهيئة النموذج الأصلي
function initializeOriginalFormSystem() {
    console.log('📝 Setting up original form system...');
    
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Original form system initialized');
    } else {
        console.warn('⚠️ Profile form not found');
    }
}

// 🎯 تهيئة الحقول الديناميكية الأصلية
function initializeOriginalDynamicInputs() {
    console.log('🎯 Setting up original dynamic inputs...');
    
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
    
    console.log('✅ Original dynamic inputs initialized');
}

// معالجات الأحداث الأصلية - تم دمجها مع الحل الذكي

function handlePlatformSelection(card) {
    console.log('🎮 Platform selected:', card.dataset.platform);
    
    const platform = card.dataset.platform;
    
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.platform-card').forEach(c => {
        c.classList.remove('selected');
        c.style.transform = '';
        c.style.boxShadow = '';
    });
    
    // تحديد البطاقة المختارة
    card.classList.add('selected');
    card.style.transform = 'scale(1.05)';
    card.style.boxShadow = '0 8px 25px rgba(255, 144, 0, 0.4)';
    
    // حفظ القيمة
    const platformInput = document.getElementById('platform');
    if (platformInput) {
        platformInput.value = platform;
        console.log('✅ Platform saved:', platform);
    }
    
    // تحديث حالة التحقق
    validationStates.platform = true;
    checkFormValidity();
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }
}

function handlePaymentSelection(btn) {
    console.log('💳 Payment selected:', btn.dataset.value);
    
    const paymentType = btn.dataset.type;
    const paymentValue = btn.dataset.value;
    
    // إزالة التحديد من جميع الأزرار
    document.querySelectorAll('.payment-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.transform = '';
        b.style.background = '';
    });
    
    // تحديد الزر المختار
    btn.classList.add('selected');
    btn.style.transform = 'scale(1.03)';
    
    // حفظ القيمة
    const paymentMethodInput = document.getElementById('payment_method');
    if (paymentMethodInput) {
        paymentMethodInput.value = paymentValue;
        console.log('✅ Payment method saved:', paymentValue);
    }
    
    // إخفاء جميع الحقول الديناميكية
    document.querySelectorAll('.dynamic-input').forEach(input => {
        input.classList.remove('show');
        input.style.display = 'none';
    });
    
    // إظهار الحقل المناسب
    const targetInput = document.getElementById(paymentType + '-input');
    if (targetInput) {
        setTimeout(() => {
            targetInput.style.display = 'block';
            targetInput.classList.add('show');
            const inputField = targetInput.querySelector('input');
            if (inputField) {
                inputField.required = true;
                
                // 💳 تهيئة تيلدا إذا تم اختيارها
                if (paymentType === 'card') {
                    initializeTeldaCardForInput(inputField);
                }
                // 🔗 تهيئة InstaPay إذا تم اختيارها  
                else if (paymentType === 'link') {
                    initializeInstapayForInput(inputField);
                }
            }
        }, 200);
    }
    
    // تحديث حالة التحقق
    validationStates.paymentMethod = true;
    checkFormValidity();
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
    }
}

// معالج التليجرام مع الحل الذكي
async function handleTelegramLink() {
    const btn = document.getElementById('telegram-link-btn');
    if (!btn || btn.disabled) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحصول على الكود...';
    
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
            const botUsername = result.bot_username || 'ea_fc_fifa_bot';
            const telegramUrl = `https://t.me/${botUsername}?start=${result.telegram_code}`;
            window.open(telegramUrl, '_blank');
            
            btn.innerHTML = '✅ تم فتح التليجرام - ادخل للبوت';
            
            // مراقبة الربط
            const checkInterval = setInterval(async () => {
                try {
                    const checkResponse = await fetch(`/check-telegram-status/${result.telegram_code}`);
                    const checkResult = await checkResponse.json();
                    
                    if (checkResult.success && checkResult.linked) {
                        clearInterval(checkInterval);
                        showNotification('✅ تم ربط التليجرام بنجاح!', 'success');
                        setTimeout(() => {
                            window.location.href = '/coins-order';
                        }, 1000);
                    }
                } catch (error) {
                    console.error('خطأ في فحص الربط:', error);
                }
            }, 3000);
            
            setTimeout(() => clearInterval(checkInterval), 60000);
        } else {
            throw new Error(result.message || 'فشل في الحصول على الكود');
        }
    } catch (error) {
        console.error('خطأ:', error);
        btn.innerHTML = '❌ خطأ - اضغط للمحاولة مرة أخرى';
        btn.disabled = false;
    }
}

// 🔧 دوال تهيئة ديناميكية للميزات المتخصصة

function initializeTeldaCardForInput(input) {
    console.log('💳 Initializing Telda for input:', input.id);
    
    // تطبيق نظام تيلدا على الحقل الجديد
    input.addEventListener('input', function(e) {
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
    
    console.log('✅ Telda initialized for input');
}

function initializeInstapayForInput(input) {
    console.log('🔗 Initializing InstaPay for input:', input.id);
    
    // تطبيق نظام InstaPay على الحقل الجديد
    input.addEventListener('input', function() {
        validateInstapayInput(this);
    });
    
    input.addEventListener('paste', function() {
        setTimeout(() => {
            validateInstapayInput(this);
        }, 100);
    });
    
    console.log('✅ InstaPay initialized for input');
}

// 💳 دوال تيلدا الأصلية المحسنة

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

function finalTeldaValidation(input) {
    const numbersOnly = input.value.replace(/[^\d]/g, '');
    
    if (numbersOnly.length > 0 && numbersOnly.length !== 16) {
        showTeldaStatus(input, '⚠️ رقم كارت تيلدا يجب أن يكون 16 رقم', 'invalid');
    }
}

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

// 🔗 دوال InstaPay الأصلية المحسنة

function validateInstapayInput(input) {
    const text = input.value.trim();
    const container = input.closest('.form-group');
    
    // إزالة المعاينة السابقة
    const existingPreview = container.querySelector('.instapay-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    if (!text) {
        updateValidationUI(input, true, '');
        return true;
    }
    
    // محاولة استخلاص الرابط
    const extractedLink = extractInstapayLink(text);
    
    if (extractedLink) {
        // إنشاء معاينة الرابط
        createInstapayPreview(container, extractedLink, text);
        updateValidationUI(input, true, '✓ تم استخلاص رابط InstaPay');
        return true;
    } else {
        updateValidationUI(input, false, 'لم يتم العثور على رابط InstaPay صحيح');
        return false;
    }
}

function extractInstapayLink(text) {
    const patterns = [
        /https?:\/\/(?:www\.)?ipn\.eg\/S\/[^\/\s]+\/instapay\/[A-Za-z0-9]+/gi,
        /https?:\/\/(?:www\.)?instapay\.com\.eg\/[^\s<>"{}|\\^`\[\]]+/gi,
        /https?:\/\/(?:www\.)?app\.instapay\.com\.eg\/[^\s<>"{}|\\^`\[\]]+/gi,
        /https?:\/\/(?:www\.)?instapay\.app\/[^\s<>"{}|\\^`\[\]]+/gi,
        /https?:\/\/(?:www\.)?ipn\.eg\/[^\s<>"{}|\\^`\[\]]+/gi,
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            // تنظيف الرابط من العلامات في النهاية
            let link = matches[0].replace(/[.,;!?]+$/, '');
            if (isValidInstapayUrl(link)) {
                return link;
            }
        }
    }
    
    return null;
}

function isValidInstapayUrl(url) {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        return false;
    }
    
    const validDomains = ['ipn.eg', 'instapay.com.eg', 'app.instapay.com.eg', 'instapay.app'];
    const lowerUrl = url.toLowerCase();
    
    return validDomains.some(domain => lowerUrl.includes(domain)) && url.length >= 20;
}

function createInstapayPreview(container, extractedLink, originalText) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'instapay-preview';
    
    previewDiv.innerHTML = `
        <div class="preview-header">
            <i class="fas fa-link"></i>
            <span>تم استخلاص رابط InstaPay</span>
        </div>
        <div class="extracted-link">
            <div class="link-label">الرابط المستخلص:</div>
            <div class="link-url">${extractedLink}</div>
        </div>
        <div class="preview-actions">
            <button type="button" class="test-link-btn" onclick="testInstapayLink('${extractedLink}')">
                <i class="fas fa-external-link-alt"></i>
                اختبار الرابط
            </button>
            <button type="button" class="copy-link-btn" onclick="copyInstapayLink('${extractedLink}')">
                <i class="fas fa-copy"></i>
                نسخ الرابط
            </button>
        </div>
    `;
    
    container.appendChild(previewDiv);
    
    // انيميشن الظهور
    setTimeout(() => {
        previewDiv.classList.add('show');
    }, 100);
}

function testInstapayLink(url) {
    window.open(url, '_blank');
    showNotification('تم فتح الرابط في تبويب جديد', 'info');
}

async function copyInstapayLink(url) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
        } else {
            // طريقة احتياطية
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        
        showNotification('تم نسخ الرابط بنجاح!', 'success');
        
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
        
    } catch (error) {
        showNotification('فشل في نسخ الرابط', 'error');
    }
}

// 📧 دوال البريد الإلكتروني الأصلية

function addNewEmail() {
    const emailInput = document.getElementById('newEmailInput');
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('يرجى إدخال البريد الإلكتروني', 'error');
        emailInput.focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('البريد الإلكتروني غير صحيح', 'error');
        emailInput.focus();
        return;
    }
    
    if (emailAddresses.includes(email.toLowerCase())) {
        showNotification('هذا البريد مضاف بالفعل', 'error');
        emailInput.focus();
        return;
    }
    
    if (emailAddresses.length >= maxEmails) {
        showNotification(`لا يمكن إضافة أكثر من ${maxEmails} عناوين بريد`, 'error');
        return;
    }
    
    // إضافة الإيميل للقائمة
    emailAddresses.push(email.toLowerCase());
    
    // إنشاء عنصر الإيميل الجديد
    createEmailElement(email, emailAddresses.length);
    
    // تنظيف الحقل
    emailInput.value = '';
    emailInput.focus();
    
    // تحديث الحقل المخفي
    updateEmailsInput();
    
    // تحديث حالة الزر
    updateAddEmailButton();
    
    // رسالة نجاح
    showNotification(`تم إضافة البريد رقم ${emailAddresses.length}`, 'success');
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 100]);
    }
}

function createEmailElement(email, number) {
    const container = document.getElementById('emailsContainer');
    
    // إزالة رسالة "فارغ" إن وجدت
    const emptyMsg = container.querySelector('.emails-empty');
    if (emptyMsg) {
        emptyMsg.remove();
    }
    
    const emailDiv = document.createElement('div');
    emailDiv.className = `email-item email-${number}`;
    emailDiv.setAttribute('data-email', email);
    
    emailDiv.innerHTML = `
        <div class="email-number">${number}</div>
        <div class="email-text">${email}</div>
        <button type="button" class="delete-email-btn" onclick="removeEmail('${email}')" title="حذف البريد">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(emailDiv);
}

function removeEmail(email) {
    const emailElement = document.querySelector(`[data-email="${email}"]`);
    if (!emailElement) return;
    
    // تأثير الحذف
    emailElement.classList.add('removing');
    
    setTimeout(() => {
        // إزالة من القائمة
        const index = emailAddresses.indexOf(email);
        if (index > -1) {
            emailAddresses.splice(index, 1);
        }
        
        // إزالة العنصر
        emailElement.remove();
        
        // إعادة ترقيم الإيميلات
        renumberEmails();
        
        // تحديث الحقل المخفي
        updateEmailsInput();
        
        // تحديث حالة الزر
        updateAddEmailButton();
        
        // إضافة رسالة فارغة إذا لم تعد هناك إيميلات
        if (emailAddresses.length === 0) {
            addEmptyMessage();
        }
        
        showNotification('تم حذف البريد الإلكتروني', 'success');
        
    }, 400);
}

function renumberEmails() {
    const emailItems = document.querySelectorAll('.email-item:not(.removing)');
    
    emailItems.forEach((item, index) => {
        const newNumber = index + 1;
        const numberElement = item.querySelector('.email-number');
        
        // تحديث الرقم
        numberElement.textContent = newNumber;
        
        // تحديث الكلاس
        item.className = `email-item email-${newNumber}`;
    });
}

function addEmptyMessage() {
    const container = document.getElementById('emailsContainer');
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'emails-empty';
    emptyDiv.innerHTML = '<i class="fas fa-envelope-open"></i> لم تتم إضافة أي عناوين بريد إلكتروني';
    container.appendChild(emptyDiv);
}

function updateEmailsInput() {
    const input = document.getElementById('emailAddressesInput');
    if (input) {
        input.value = JSON.stringify(emailAddresses);
    }
}

function updateAddEmailButton() {
    const button = document.querySelector('.add-email-btn');
    
    if (emailAddresses.length >= maxEmails) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-check"></i> تم الوصول للحد الأقصى';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-plus"></i> إضافة بريد إلكتروني';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 📝 دوال النموذج الأصلية المحسنة

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
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ والربط...';
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

// دوال التحقق والتحكم في النموذج

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

function isValidInstaPayLink(link) {
    const instaPayPatterns = [
        /^https?:\/\/(www\.)?instapay\.com\.eg\//i,
        /^https?:\/\/(www\.)?instapay\.app\//i,
        /^instapay:\/\//i,
        /^https?:\/\/(www\.)?app\.instapay\.com\.eg\//i
    ];
    
    return instaPayPatterns.some(pattern => pattern.test(link));
}

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

// التحقق من الواتساب

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

// عرض معلومات الواتساب

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

// دوال مساعدة

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

function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]');
    return token ? token.getAttribute('content') || token.value : '';
}

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

function initializeAdvancedFeatures() {
    // تهيئة tooltips والانيميشن
    initializeTooltips();
    initializeAnimations();
    
    // معالجة أحداث النافذة
    setupWindowEvents();
    
    // تحسينات اللمس للهواتف
    setupTouchOptimizations();
    
    // منع التكبير على iOS
    setupIOSOptimizations();
    
    console.log('FC 26 Profile Setup - تم تهيئة جميع الميزات المتقدمة');
}

function setupWindowEvents() {
    // تحسين الأداء عند تغيير حجم النافذة
    window.addEventListener('resize', debounce(function() {
        if (window.innerWidth <= 768) {
            optimizeForMobile();
        }
    }, 250));
}

function setupTouchOptimizations() {
    if ('ontouchstart' in window) {
        document.addEventListener('touchstart', function() {}, {passive: true});
        
        // تحسين التفاعل مع العناصر القابلة للنقر
        document.querySelectorAll('.platform-card, .payment-btn, button').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, {passive: true});
            
            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 150);
            }, {passive: true});
        });
    }
}

function setupIOSOptimizations() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const viewport = document.querySelector('meta[name=viewport]');
        
        document.addEventListener('focusin', function(e) {
            if (e.target.matches('input, select, textarea')) {
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
                    );
                }
            }
        });
        
        document.addEventListener('focusout', function() {
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1');
            }
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

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
    
    e.target._tooltip = tooltip;
}

function hideTooltip(e) {
    const tooltip = e.target._tooltip;
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 300);
        delete e.target._tooltip;
    }
}

function initializeAnimations() {
    // انيميشن أقسام النموذج عند التمرير
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.form-section, .form-group').forEach(section => {
        observer.observe(section);
    });
    
    // تمرير سلس للروابط
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// إضافة مستمع للمفتاح Enter
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

function getNextInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled])'));
    const currentIndex = inputs.indexOf(currentInput);
    return inputs[currentIndex + 1] || null;
}

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

function hideNotification(notification) {
    notification.style.opacity = '0';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// تصدير الوظائف للاستخدام الخارجي أو الاختبار
window.FC26ProfileSetup = {
    validateWhatsAppReal,
    validatePaymentMethod,
    showNotification,
    checkFormValidity,
    updateSubmitButton
};

console.log('🎮 FC 26 Profile Setup - Complete integrated JavaScript loaded successfully!');
