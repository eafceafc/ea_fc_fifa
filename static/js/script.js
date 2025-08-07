// FC 26 Profile Setup - JavaScript محدث لحل مشاكل الأزرار

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

// 🔧 تهيئة التطبيق مع ضمان التحميل الكامل
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting FC 26 Profile Setup...');
    
    // انتظار قصير للتأكد من تحميل كامل عناصر DOM
    setTimeout(() => {
        initializeApp();
    }, 100);
});

function initializeApp() {
    console.log('🔧 Initializing app components...');
    
    try {
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
        
        console.log('✅ App initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error during app initialization:', error);
    }
}

function initializeEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
    // تهيئة أزرار المنصات
    setupPlatformButtons();
    
    // تهيئة أزرار طرق الدفع
    setupPaymentButtons();
    
    // تهيئة حقل الواتساب
    setupWhatsAppInput();
    
    // تهيئة النموذج
    setupFormSubmission();
    
    // تهيئة زر التليجرام
    setupTelegramButton();
    
    // تهيئة الميزات الأخرى
    setupDynamicInputs();
    setupEnterKeyHandling();
    
    console.log('✅ All event listeners set up successfully!');
}

function setupPlatformButtons() {
    console.log('🎮 Setting up platform buttons...');
    
    const platformCards = document.querySelectorAll('.platform-card');
    
    if (platformCards.length === 0) {
        console.warn('⚠️ No platform cards found!');
        return;
    }
    
    platformCards.forEach((card, index) => {
        console.log(`Setting up platform card ${index + 1}:`, card.dataset.platform);
        
        // إزالة مستمعين قدامى
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
    
    console.log(`✅ ${platformCards.length} platform buttons initialized`);
}

function setupPaymentButtons() {
    console.log('💳 Setting up payment buttons...');
    
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    if (paymentButtons.length === 0) {
        console.warn('⚠️ No payment buttons found!');
        return;
    }
    
    paymentButtons.forEach((btn, index) => {
        console.log(`Setting up payment button ${index + 1}:`, btn.dataset.value);
        
        // إزالة مستمعين قدامى
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
    
    console.log(`✅ ${paymentButtons.length} payment buttons initialized`);
}

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
    
    // إشعار بصري
    showNotification(`تم اختيار منصة ${getPlatformDisplayName(platform)}`, 'success');
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
    showPaymentInputField(paymentType);
    
    // تحديث حالة التحقق
    validationStates.paymentMethod = true;
    checkFormValidity();
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
    }
    
    // إشعار بصري
    showNotification(`تم اختيار ${paymentValue}`, 'success');
}

function showPaymentInputField(paymentType) {
    let targetInputId;
    
    switch(paymentType) {
        case 'mobile':
            targetInputId = 'mobile-input';
            break;
        case 'card':
            targetInputId = 'card-input';
            break;
        case 'link':
            targetInputId = 'link-input';
            break;
        default:
            console.warn('Unknown payment type:', paymentType);
            return;
    }
    
    const targetInput = document.getElementById(targetInputId);
    if (targetInput) {
        setTimeout(() => {
            targetInput.style.display = 'block';
            targetInput.classList.add('show');
            
            const inputField = targetInput.querySelector('input');
            if (inputField) {
                inputField.required = true;
                inputField.focus();
            }
        }, 200);
        
        console.log('✅ Payment input field shown:', targetInputId);
    }
}

function setupTelegramButton() {
    console.log('📱 Setting up Telegram button...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        telegramBtn.addEventListener('click', handleTelegramLink);
        console.log('✅ Telegram button initialized');
    } else {
        console.warn('⚠️ Telegram button not found');
    }
}

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
            monitorTelegramLinking(result.telegram_code);
        } else {
            throw new Error(result.message || 'فشل في الحصول على الكود');
        }
    } catch (error) {
        console.error('خطأ:', error);
        btn.innerHTML = '❌ خطأ - اضغط للمحاولة مرة أخرى';
        btn.disabled = false;
    }
}

function monitorTelegramLinking(telegramCode) {
    const checkInterval = setInterval(async () => {
        try {
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`);
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
    
    // إيقاف المراقبة بعد دقيقة
    setTimeout(() => clearInterval(checkInterval), 60000);
}

function setupWhatsAppInput() {
    console.log('📞 Setting up WhatsApp input...');
    
    const whatsappInput = document.getElementById('whatsapp');
    if (!whatsappInput) {
        console.warn('⚠️ WhatsApp input not found');
        return;
    }
    
    // معالجة الإدخال مع التحقق الفوري
    whatsappInput.addEventListener('input', function(e) {
        handleWhatsAppInput(this);
    });
    
    // التحقق عند فقدان التركيز
    whatsappInput.addEventListener('blur', function() {
        handleWhatsAppBlur(this);
    });
    
    console.log('✅ WhatsApp input initialized');
}

async function handleWhatsAppInput(input) {
    const inputValue = input.value;
    
    // تنظيف الرقم أولاً
    let cleanValue = formatPhoneInput(inputValue);
    input.value = cleanValue;
    
    // إزالة معلومات سابقة عند بدء الكتابة
    clearPhoneInfo();
    
    // إلغاء التحقق السابق
    if (validationTimeout) {
        clearTimeout(validationTimeout);
    }
    
    // إعادة تعيين حالة التحقق
    validationStates.whatsapp = false;
    updateValidationUI(input, false, '');
    
    // تحقق فوري بعد توقف المستخدم عن الكتابة
    if (cleanValue.length >= 5) {
        // إضافة مؤشر التحميل
        input.classList.add('validating');
        showPhoneInfoLoading(input);
        
        validationTimeout = setTimeout(async () => {
            await performWhatsAppValidation(input, cleanValue);
        }, 800);
    } else {
        input.classList.remove('validating');
        checkFormValidity();
    }
}

async function performWhatsAppValidation(input, phoneNumber) {
    try {
        const result = await validateWhatsAppReal(phoneNumber);
        
        // إزالة مؤشر التحميل
        input.classList.remove('validating');
        
        // تحديث حالة التحقق
        validationStates.whatsapp = result.is_valid || result.valid;
        
        // عرض النتيجة
        if (validationStates.whatsapp) {
            updateValidationUI(input, true, 'رقم واتساب صحيح ✓');
            showPhoneInfo(result, input);
        } else {
            updateValidationUI(input, false, result.error || result.message || 'رقم غير صحيح');
            showPhoneInfoError(result.error || result.message || 'رقم غير صحيح', input);
        }
        
        // تحديث حالة النموذج
        checkFormValidity();
        
    } catch (error) {
        console.error('خطأ في التحقق من الواتساب:', error);
        input.classList.remove('validating');
        validationStates.whatsapp = false;
        updateValidationUI(input, false, 'خطأ في التحقق من الرقم');
        checkFormValidity();
    }
}

async function validateWhatsAppReal(phone) {
    if (!phone || phone.length < 5) {
        return { is_valid: false, valid: false, error: 'رقم قصير جداً' };
    }

    try {
        const response = await fetch('/validate-whatsapp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({ phone: phone, phone_number: phone })
        });

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

function setupFormSubmission() {
    console.log('📝 Setting up form submission...');
    
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Form submission initialized');
    } else {
        console.warn('⚠️ Profile form not found');
    }
}

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
    
    // عرض شاشة التحميل
    showLoadingScreen();
    
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
        
        hideLoadingScreen();
        
        if (response.ok && result.success) {
            showSuccessMessage(result);
        } else {
            showErrorMessage(result.message || 'حدث خطأ غير متوقع');
        }
        
    } catch (error) {
        console.error('خطأ في الشبكة:', error);
        hideLoadingScreen();
        showErrorMessage('خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    }
    
    isSubmitting = false;
}

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
    const paymentInputs = document.querySelectorAll('.dynamic-input.show input');
    let hasValidPayment = false;
    
    paymentInputs.forEach(input => {
        const value = input.value.trim();
        if (value && validatePaymentInput(input)) {
            hasValidPayment = true;
        }
    });
    
    validationStates.paymentMethod = hasValidPayment || document.getElementById('payment_method')?.value;
    return validationStates.paymentMethod;
}

function validatePaymentInput(input) {
    const value = input.value.trim();
    const inputId = input.id;
    let isValid = false;
    
    if (!value) {
        return true; // فارغ = صحيح للحقول الاختيارية
    }
    
    // التحقق من المحافظ الإلكترونية (11 رقم)
    if (inputId === 'mobile-number') {
        isValid = /^01[0125][0-9]{8}$/.test(value) && value.length === 11;
    }
    // التحقق من كارت تيلدا (16 رقم)
    else if (inputId === 'card-number') {
        const numbersOnly = value.replace(/\s/g, '');
        isValid = /^\d{16}$/.test(numbersOnly);
    }
    // التحقق من رابط إنستا باي
    else if (inputId === 'payment-link') {
        isValid = isValidInstaPayLink(value);
    }
    
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

// دوال مساعدة
function getPlatformDisplayName(platform) {
    const names = {
        'playstation': 'PlayStation',
        'xbox': 'Xbox',
        'pc': 'PC'
    };
    return names[platform] || platform;
}

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

function showLoadingScreen() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('show');
    }
}

function hideLoadingScreen() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('show');
    }
}

function showSuccessMessage(result) {
    let successText = '✅ تم حفظ بياناتك بنجاح!';
    if (result.data && result.data.whatsapp_number) {
        successText += `<br><small>رقم الواتساب: ${result.data.whatsapp_number}</small>`;
    }
    
    const successMessage = document.getElementById('successMessage');
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
}

function showErrorMessage(errorText) {
    const errorMessage = document.getElementById('errorMessage');
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

// باقي الدوال المساعدة
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
    
    // إخفاء تلقائي بعد 3 ثوان
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
}

function setupDynamicInputs() {
    // تهيئة الحقول الديناميكية إذا لزم الأمر
    console.log('🔧 Setting up dynamic inputs...');
}

function setupEnterKeyHandling() {
    // معالجة مفتاح Enter
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
                            form.dispatchEvent(new Event('submit'));
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

function initializeAdvancedFeatures() {
    // تهيئة الميزات المتقدمة
    console.log('🚀 Initializing advanced features...');
}

// دوال إضافية لدعم الواتساب والدفع
function showPhoneInfo(info, inputElement) {
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

function handleWhatsAppBlur(input) {
    const value = input.value.trim();
    if (value && !validationStates.whatsapp) {
        validateWhatsAppReal(value).then(result => {
            validationStates.whatsapp = result.is_valid || result.valid;
            if (validationStates.whatsapp) {
                updateValidationUI(input, true, 'رقم واتساب صحيح ✓');
                showPhoneInfo(result, input);
            } else {
                updateValidationUI(input, false, result.error || result.message || 'رقم غير صحيح');
            }
            checkFormValidity();
        });
    }
}

// دوال البريد الإلكتروني
function addNewEmail() {
    // تنفيذ إضافة البريد الإلكتروني
    console.log('📧 Add new email functionality');
}

// تصدير الوظائف للاستخدام الخارجي
window.FC26ProfileSetup = {
    validateWhatsAppReal,
    validatePaymentMethod,
    showNotification,
    checkFormValidity,
    updateSubmitButton
};

console.log('🎮 FC 26 Profile Setup - JavaScript loaded successfully!');
