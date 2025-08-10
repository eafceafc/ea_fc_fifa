/**
 * 🚀 FC 26 Telegram Integration - COMPLETE FIXED VERSION
 * نظام ربط التليجرام الشامل مع إصلاح جميع المشاكل
 * Version: 3.1.0 - ULTIMATE FIX
 */

// متغيرات التليجرام العامة - محسنة
let currentTelegramData = {
    code: null,
    botUsername: 'ea_fc_fifa_bot', // default fallback
    isProcessing: false,
    autoSaveEnabled: true,
    buttonElement: null // حفظ مرجع الزر
};

let telegramStatusMonitor = null;
let dataAutoSaver = null;
let globalTelegramButton = null; // متغير عام للزر

// ═══════════════════════════════════════════════════════════════
// 🔧 دالة البحث الذكي عن الزر - ENHANCED
// ═══════════════════════════════════════════════════════════════
function findTelegramButton() {
    // البحث بعدة طرق
    let telegramBtn = 
        document.getElementById('telegramBtn') ||
        document.getElementById('telegram-link-btn') ||
        document.querySelector('[onclick*="telegram"]') ||
        document.querySelector('[onclick*="Telegram"]') ||
        document.querySelector('.telegram-btn') ||
        document.querySelector('button[data-action="telegram"]');
    
    if (!telegramBtn) {
        // البحث في النص
        const allButtons = document.querySelectorAll('button');
        for (let btn of allButtons) {
            if (btn.textContent.toLowerCase().includes('telegram') || 
                btn.textContent.includes('تليجرام') ||
                btn.innerHTML.toLowerCase().includes('telegram')) {
                telegramBtn = btn;
                break;
            }
        }
    }
    
    return telegramBtn;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 دالة توليد الكود الآمنة - ULTIMATE FIXED
// ═══════════════════════════════════════════════════════════════
async function generateTelegramCodeFixed() {
    console.log('🚀 [ULTIMATE FIXED] Starting Telegram code generation...');
    
    // البحث الذكي عن الزر
    const telegramBtn = globalTelegramButton || findTelegramButton();
    
    if (!telegramBtn) {
        console.error('❌ CRITICAL: Telegram button not found anywhere!');
        showTelegramNotification('❌ خطأ: زر التليجرام غير موجود', 'error');
        return;
    }
    
    console.log('✅ Telegram button found:', telegramBtn.id || telegramBtn.className || 'no-identifier');
    
    // حفظ مرجع الزر
    currentTelegramData.buttonElement = telegramBtn;
    globalTelegramButton = telegramBtn;

    // منع المعالجة المتكررة
    if (currentTelegramData.isProcessing) {
        console.log('⏳ Already processing, skipping...');
        return;
    }

    currentTelegramData.isProcessing = true;

    try {
        // التحقق من البيانات المطلوبة
        const requiredData = collectRequiredData();
        if (!requiredData.isValid) {
            showTelegramNotification(requiredData.error, 'error');
            return;
        }

        // تحديث واجهة الزر
        updateButtonToLoading(telegramBtn);

        // إرسال طلب توليد الكود
        console.log('📤 Sending code generation request...');
        const serverResponse = await sendCodeGenerationRequest(requiredData.data);

        if (serverResponse && serverResponse.success) {
            // ✅ التحقق من وجود الكود
            const telegramCode = serverResponse.code || serverResponse.telegram_code;
            
            if (!telegramCode) {
                throw new Error('الخادم لم يُرجع كود صحيح');
            }
            
            // حفظ الكود بطريقة آمنة
            currentTelegramData.code = telegramCode;
            
            console.log('✅ Code generated successfully:', telegramCode);
            
            // تحديث الزر للفتح المباشر
            updateButtonForDirectLinking(telegramBtn);
            
            // عرض منطقة الكود
            displayCodeSection(telegramCode);
            
            // ✅ بدء الحفظ التلقائي فوراً
            if (currentTelegramData.autoSaveEnabled) {
                startAutoDataSaving(requiredData.data);
            }
            
            showTelegramNotification(`✅ تم توليد الكود بنجاح: ${telegramCode}`, 'success');
            
        } else {
            throw new Error(serverResponse?.message || 'فشل في توليد الكود من الخادم');
        }

    } catch (error) {
        console.error('❌ Code generation failed:', error);
        showTelegramNotification('خطأ في توليد الكود: ' + error.message, 'error');
        resetTelegramButton(telegramBtn);
        
    } finally {
        currentTelegramData.isProcessing = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// 📋 جمع البيانات المطلوبة - ENHANCED
// ═══════════════════════════════════════════════════════════════
function collectRequiredData() {
    console.log('📋 Collecting required data...');
    
    const platform = document.getElementById('platform')?.value?.trim();
    const whatsapp = document.getElementById('whatsapp')?.value?.trim();
    const paymentMethod = document.getElementById('payment_method')?.value?.trim();
    
    // فحص البيانات الأساسية
    if (!platform) {
        return { isValid: false, error: 'يرجى اختيار منصة اللعب أولاً' };
    }
    
    if (!whatsapp) {
        return { isValid: false, error: 'يرجى إدخال رقم الواتساب أولاً' };
    }
    
    // التحقق من صحة رقم الواتساب
    const phoneInfo = document.querySelector('.phone-info.success-info');
    if (!phoneInfo) {
        return { isValid: false, error: 'يرجى التحقق من صحة رقم الواتساب أولاً' };
    }
    
    // جمع تفاصيل الدفع
    const paymentDetails = getActivePaymentDetails();
    
    const userData = {
        platform: platform,
        whatsapp_number: whatsapp,
        payment_method: paymentMethod || '',
        payment_details: paymentDetails || '',
        timestamp: Date.now()
    };
    
    console.log('📋 Data collected successfully:', {
        platform: userData.platform,
        whatsapp: userData.whatsapp_number.substring(0, 5) + '***',
        hasPayment: !!userData.payment_method,
        hasPaymentDetails: !!userData.payment_details
    });
    
    return { isValid: true, data: userData };
}

// ═══════════════════════════════════════════════════════════════
// 🌐 إرسال طلب توليد الكود - ULTRA SAFE
// ═══════════════════════════════════════════════════════════════
async function sendCodeGenerationRequest(userData) {
    console.log('🌐 Sending code generation request...');
    
    try {
        const response = await fetch('/generate-telegram-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken() || ''
            },
            body: JSON.stringify(userData)
        });
        
        console.log('📡 Server response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Server response data:', {
            success: result.success,
            hasCode: !!(result.code || result.telegram_code),
            message: result.message
        });
        
        return result;
        
    } catch (error) {
        console.error('🌐 Request failed:', error);
        throw new Error('خطأ في الاتصال بالخادم: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 فتح التليجرام مع الكود - ULTIMATE FIXED
// ═══════════════════════════════════════════════════════════════
function openTelegramWithAutoStart() {
    console.log('🚀 [ULTIMATE FIXED] Opening Telegram with auto-start...');
    
    // ✅ التحقق المتعدد من وجود الكود
    const telegramCode = currentTelegramData.code;
    
    if (!telegramCode || telegramCode === 'undefined' || telegramCode === null || telegramCode === '') {
        console.error('❌ CRITICAL: Telegram code is invalid:', telegramCode);
        showTelegramNotification('❌ خطأ: الكود غير متاح، يرجى توليد كود جديد', 'error');
        return;
    }
    
    // التحقق من طول الكود وصحته
    if (typeof telegramCode !== 'string' || telegramCode.length < 3) {
        console.error('❌ CRITICAL: Telegram code format invalid:', telegramCode);
        showTelegramNotification('❌ خطأ: تنسيق الكود غير صحيح', 'error');
        return;
    }
    
    const botUsername = currentTelegramData.botUsername;
    console.log('🤖 Using bot username:', botUsername);
    console.log('🔐 Using telegram code:', telegramCode);
    
    // ✅ إنشاء الروابط بطريقة آمنة مع التحقق المضاعف
    const telegramAppUrl = `tg://resolve?domain=${encodeURIComponent(botUsername)}&start=${encodeURIComponent(telegramCode)}`;
    const telegramWebUrl = `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(telegramCode)}`;
    
    console.log('🔗 Generated URLs:', {
        app: telegramAppUrl,
        web: telegramWebUrl
    });
    
    // تجميد الواجهة مؤقتاً
    freezeUI();
    
    // ✅ فتح التليجرام بالطريقة المناسبة
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
        if (isMobile) {
            console.log('📱 Mobile device detected - using mobile strategy');
            
            // للهواتف: محاولة التطبيق أولاً
            window.location.href = telegramAppUrl;
            console.log('📱 Opened Telegram app URL');
            
            // نسخة احتياطية للويب بعد ثانية
            setTimeout(() => {
                window.open(telegramWebUrl, '_blank', 'noopener,noreferrer');
                console.log('🌐 Opened web URL as backup');
            }, 1200);
            
        } else {
            console.log('💻 Desktop device detected - using desktop strategy');
            
            // للكمبيوتر: فتح الرابط في نافذة جديدة
            const newWindow = window.open(telegramWebUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow || newWindow.closed) {
                console.log('💻 Popup blocked, trying app URL');
                window.location.href = telegramAppUrl;
            }
        }
        
        // رسائل تحديث الحالة
        showProgressMessages();
        
        // ✅ بدء مراقبة حالة الربط
        startLinkingMonitor(telegramCode);
        
        // ✅ نسخ الكود احتياطياً
        copyCodeToClipboard(`/start ${telegramCode}`);
        
    } catch (error) {
        console.error('❌ Error opening Telegram:', error);
        showTelegramNotification('❌ خطأ في فتح التليجرام: ' + error.message, 'error');
        unfreezeUI();
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔄 مراقبة حالة الربط - ENHANCED
// ═══════════════════════════════════════════════════════════════
function startLinkingMonitor(telegramCode) {
    console.log('🔄 Starting linking monitor for code:', telegramCode);
    
    if (telegramStatusMonitor) {
        clearInterval(telegramStatusMonitor);
    }
    
    let attempts = 0;
    const maxAttempts = 60; // 3 دقائق
    
    telegramStatusMonitor = setInterval(async () => {
        attempts++;
        console.log(`🔍 Checking link status... Attempt ${attempts}/${maxAttempts}`);
        
        try {
            const response = await fetch(`/check-telegram-status/${telegramCode}`, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('📊 Status check result:', result);
                
                if (result.success && result.linked) {
                    // ✅ نجح الربط!
                    clearInterval(telegramStatusMonitor);
                    telegramStatusMonitor = null;
                    
                    console.log('🎉 LINKING SUCCESS!');
                    
                    // إيقاف الحفظ التلقائي
                    stopAutoDataSaving();
                    
                    // عرض رسالة النجاح النهائية
                    showFinalSuccessMessage();
                    return;
                }
            }
            
            // رسائل التحديث
            if (attempts === 10) {
                showTelegramNotification('🔍 جاري البحث عن الربط...', 'info');
            } else if (attempts === 20) {
                showTelegramNotification('⏳ تأكد من فتح التليجرام وإرسال الكود', 'info');
            } else if (attempts === 40) {
                showTelegramNotification('⚠️ الربط يستغرق وقتاً أطول من المعتاد', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Status check error:', error);
        }
        
        // انتهاء المحاولات
        if (attempts >= maxAttempts) {
            clearInterval(telegramStatusMonitor);
            telegramStatusMonitor = null;
            
            console.log('⏰ Linking monitor timeout');
            showTimeoutMessage();
            unfreezeUI();
        }
        
    }, 3000); // كل 3 ثوان
}

// ═══════════════════════════════════════════════════════════════
// 💾 نظام الحفظ التلقائي - ENHANCED
// ═══════════════════════════════════════════════════════════════
function startAutoDataSaving(userData) {
    console.log('💾 Starting auto data saving...');
    
    if (!currentTelegramData.autoSaveEnabled) {
        console.log('💾 Auto save disabled, skipping...');
        return;
    }
    
    // حفظ فوري أول بعد 3 ثوان
    setTimeout(() => {
        saveUserDataAutomatically(userData);
    }, 3000);
    
    // حفظ دوري كل 10 ثوان
    dataAutoSaver = setInterval(() => {
        saveUserDataAutomatically(userData);
    }, 10000);
    
    console.log('💾 Auto saver started successfully');
}

async function saveUserDataAutomatically(userData) {
    console.log('💾 Auto-saving user data...');
    
    try {
        // حفظ في sessionStorage كنسخة احتياطية
        const dataToSave = {
            ...userData,
            telegram_code: currentTelegramData.code,
            autoSavedAt: Date.now()
        };
        
        sessionStorage.setItem('fc26_user_data', JSON.stringify(dataToSave));
        console.log('💾 Data saved to sessionStorage');
        
        // محاولة حفظ على الخادم
        const response = await fetch('/auto-save-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken() || ''
            },
            body: JSON.stringify({
                ...dataToSave,
                auto_save: true
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('✅ Data auto-saved to server successfully');
            }
        } else {
            console.log('⚠️ Server auto-save failed, but local save succeeded');
        }
        
    } catch (error) {
        console.error('❌ Auto-save failed:', error);
    }
}

function stopAutoDataSaving() {
    if (dataAutoSaver) {
        clearInterval(dataAutoSaver);
        dataAutoSaver = null;
        console.log('💾 Auto saver stopped');
    }
}

// ═══════════════════════════════════════════════════════════════
// 🎉 رسالة النجاح النهائية - CUSTOMIZED
// ═══════════════════════════════════════════════════════════════
function showFinalSuccessMessage() {
    console.log('🎉 Showing final success message...');
    
    // إخفاء جميع العناصر
    const container = document.querySelector('.container');
    if (container) {
        container.style.transition = 'all 0.5s ease';
        container.style.opacity = '0';
        container.style.transform = 'scale(0.95)';
    }
    
    // إنشاء شاشة النجاح المخصصة
    setTimeout(() => {
        createCustomSuccessOverlay();
    }, 500);
    
    // رسائل الاحتفال
    showTelegramNotification('🎉 تم ربط حسابك بنجاح!', 'success');
    
    setTimeout(() => {
        showTelegramNotification('💾 تم حفظ جميع بياناتك تلقائياً!', 'success');
    }, 1500);
    
    setTimeout(() => {
        showTelegramNotification('🏆 مرحباً بك في FC 26!', 'success');
    }, 3000);
    
    // اهتزاز احتفالي
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }
}

function createCustomSuccessOverlay() {
    // إزالة أي overlay موجود
    const existingOverlay = document.getElementById('customSuccessOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // إنشاء الـ overlay الجديد
    const overlay = document.createElement('div');
    overlay.id = 'customSuccessOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.5s ease;
    `;
    
    // المحتوى المخصص
    overlay.innerHTML = `
        <div style="text-align: center; color: white; max-width: 90%; padding: 20px;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 2s infinite;">🎉</div>
            <h1 style="font-size: 2rem; margin-bottom: 15px; font-weight: bold;">
                🎮 أهلاً بك Palestine في FC 26 Profile System!
            </h1>
            <div style="font-size: 1.3rem; margin-bottom: 30px; line-height: 1.6;">
                ✅ تم ربط حسابك وحفظ بياناتك تلقائياً!
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                <h3 style="margin-bottom: 15px;">📋 بيانات ملفك الشخصي:</h3>
                <div style="text-align: left; font-size: 1rem; text-align: center;">
                    🎯 المنصة: <span id="savedPlatform">تم التحديد</span><br>
                    📱 رقم الواتساب: <span id="savedWhatsapp">تم التحقق</span><br>
                    💳 طريقة الدفع: <span id="savedPayment">تم الحفظ</span><br>
                    رقم الدفع: <span id="savedPaymentDetails">تم الحفظ</span>
                </div>
            </div>
            <div style="margin-bottom: 20px;">
                <button onclick="continueToCoins()" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                    margin-right: 10px;
                ">
                    🚀 المتابعة لصفحة الكوينز
                </button>
                <button onclick="closeSuccessOverlay()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 2px solid white;
                    padding: 15px 30px;
                    font-size: 1.1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🏠 العودة للرئيسية
                </button>
            </div>
            <div style="font-size: 0.9rem; opacity: 0.8;">
                🔗 رابط الموقع: https://ea-fc-fifa-5jbn.onrender.com/
                <br>
                شكراً لاختيارك FC 26! 🏆
            </div>
        </div>
        <style>
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-20px); }
                60% { transform: translateY(-10px); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
    
    // إظهار الـ overlay
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 100);
    
    // تعبئة البيانات المحفوظة
    populateSavedData();
    
    // منع التمرير
    document.body.style.overflow = 'hidden';
}

function populateSavedData() {
    try {
        const platform = document.getElementById('platform')?.value || 'Pc';
        const whatsapp = document.getElementById('whatsapp')?.value || '01010845454';
        const paymentMethod = document.getElementById('payment_method')?.value || 'Bank Wallet';
        const paymentDetails = getActivePaymentDetails() || '01010845454';
        
        const savedPlatform = document.getElementById('savedPlatform');
        const savedWhatsapp = document.getElementById('savedWhatsapp');
        const savedPayment = document.getElementById('savedPayment');
        const savedPaymentDetails = document.getElementById('savedPaymentDetails');
        
        if (savedPlatform) savedPlatform.textContent = platform;
        if (savedWhatsapp) savedWhatsapp.textContent = whatsapp;
        if (savedPayment) savedPayment.textContent = getPaymentMethodName(paymentMethod);
        if (savedPaymentDetails) savedPaymentDetails.textContent = paymentDetails;
        
    } catch (error) {
        console.error('Error populating saved data:', error);
    }
}

function getPaymentMethodName(method) {
    const methods = {
        'vodafone_cash': 'فودافون كاش',
        'etisalat_cash': 'اتصالات كاش',
        'orange_cash': 'أورانج كاش',
        'we_pay': 'وي باي',
        'bank_wallet': 'Bank Wallet',
        'telda_card': 'كارت تيلدا',
        'instapay': 'إنستا باي'
    };
    return methods[method] || method || 'Bank Wallet';
}

// ═══════════════════════════════════════════════════════════════
// 📧 إدارة البريد الإلكتروني - NEW ADDITION
// ═══════════════════════════════════════════════════════════════

// نظام إدارة البريد الإلكتروني المتعدد
let emailAddresses = [];
const maxEmails = 6;

// إضافة بريد إلكتروني جديد
function addNewEmail() {
    const emailInput = document.getElementById('newEmailInput');
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        showTelegramNotification('يرجى إدخال البريد الإلكتروني', 'error');
        if (emailInput) emailInput.focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        showTelegramNotification('البريد الإلكتروني غير صحيح', 'error');
        if (emailInput) emailInput.focus();
        return;
    }
    
    if (emailAddresses.includes(email.toLowerCase())) {
        showTelegramNotification('هذا البريد مضاف بالفعل', 'error');
        if (emailInput) emailInput.focus();
        return;
    }
    
    if (emailAddresses.length >= maxEmails) {
        showTelegramNotification(`لا يمكن إضافة أكثر من ${maxEmails} عناوين بريد`, 'error');
        return;
    }
    
    // إضافة الإيميل للقائمة
    emailAddresses.push(email.toLowerCase());
    
    // إنشاء عنصر الإيميل الجديد
    createEmailElement(email, emailAddresses.length);
    
    // تنظيف الحقل
    if (emailInput) {
        emailInput.value = '';
        emailInput.focus();
    }
    
    // تحديث الحقل المخفي
    updateEmailsInput();
    
    // تحديث حالة الزر
    updateAddEmailButton();
    
    // رسالة نجاح
    showTelegramNotification(`تم إضافة البريد رقم ${emailAddresses.length}`, 'success');
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([50, 50, 100]);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function createEmailElement(email, number) {
    const container = document.getElementById('emailsContainer');
    if (!container) return;
    
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
        
        showTelegramNotification('تم حذف البريد الإلكتروني', 'success');
        
    }, 400);
}

function renumberEmails() {
    const emailItems = document.querySelectorAll('.email-item:not(.removing)');
    
    emailItems.forEach((item, index) => {
        const newNumber = index + 1;
        const numberElement = item.querySelector('.email-number');
        
        // تحديث الرقم
        if (numberElement) numberElement.textContent = newNumber;
        
        // تحديث الكلاس
        item.className = `email-item email-${newNumber}`;
    });
}

function addEmptyMessage() {
    const container = document.getElementById('emailsContainer');
    if (!container) return;
    
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
    if (!button) return;
    
    if (emailAddresses.length >= maxEmails) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-check"></i> تم الوصول للحد الأقصى';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-plus"></i> إضافة بريد إلكتروني';
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔧 دوال مساعدة - ENHANCED
// ═══════════════════════════════════════════════════════════════

// إغلاق شاشة النجاح والانتقال
function continueToCoins() {
    console.log('🚀 Continuing to coins page...');
    window.location.href = '/coins-order';
}

function closeSuccessOverlay() {
    const overlay = document.getElementById('customSuccessOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            document.body.style.overflow = '';
            
            // إعادة الصفحة للوضع الطبيعي
            const container = document.querySelector('.container');
            if (container) {
                container.style.opacity = '1';
                container.style.transform = 'scale(1)';
            }
        }, 500);
    }
}

// تجميد واجهة المستخدم
function freezeUI() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (!btn.disabled) {
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.setAttribute('data-was-enabled', 'true');
        }
    });
}

// إلغاء تجميد واجهة المستخدم
function unfreezeUI() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-was-enabled')) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.removeAttribute('data-was-enabled');
        }
    });
}

// عرض رسائل التقدم
function showProgressMessages() {
    showTelegramNotification('🚀 تم فتح التليجرام...', 'info');
    
    setTimeout(() => {
        showTelegramNotification('⚡ جاري التفعيل التلقائي...', 'info');
    }, 2000);
    
    setTimeout(() => {
        showTelegramNotification('💾 جاري الحفظ التلقائي...', 'info');
    }, 4000);
    
    setTimeout(() => {
        showTelegramNotification('🔗 انتظار تأكيد الربط...', 'info');
    }, 6000);
}

// رسالة انتهاء المهلة
function showTimeoutMessage() {
    showTelegramNotification('⏰ انتهت مهلة الانتظار - تحقق من التليجرام يدوياً', 'warning');
}

// نسخ الكود للحافظة
async function copyCodeToClipboard(code) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code);
            console.log('✅ Code copied to clipboard');
        } else {
            // طريقة احتياطية
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            console.log('✅ Code copied using fallback method');
        }
        
        showTelegramNotification('📋 تم نسخ الكود احتياطياً', 'info');
        
    } catch (error) {
        console.error('❌ Copy failed:', error);
    }
}

// تحديث الزر لحالة التحميل
function updateButtonToLoading(telegramBtn) {
    telegramBtn.disabled = true;
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-spinner fa-spin telegram-icon"></i>
            <div class="telegram-text">
                <span class="telegram-title">⚡ جاري التحضير...</span>
                <span class="telegram-subtitle">يرجى الانتظار...</span>
            </div>
        </div>
    `;
}

// تحديث الزر للفتح المباشر
function updateButtonForDirectLinking(telegramBtn) {
    telegramBtn.disabled = false;
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fab fa-telegram telegram-icon"></i>
            <div class="telegram-text">
                <span class="telegram-title">📱 فتح التليجرام والربط</span>
                <span class="telegram-subtitle">اضغط للربط التلقائي مع الحفظ</span>
            </div>
        </div>
    `;
    
    // تحديث وظيفة الزر
    telegramBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        openTelegramWithAutoStart();
    };
}

// عرض منطقة الكود
function displayCodeSection(code) {
    const telegramCodeResult = document.getElementById('telegramCodeResult');
    if (!telegramCodeResult) return;
    
    telegramCodeResult.innerHTML = `
        <div class="code-container" style="background: linear-gradient(135deg, rgba(0, 136, 204, 0.1), rgba(0, 85, 153, 0.15)); 
                    padding: 20px; margin: 15px 0; border-radius: 12px; text-align: center; 
                    border: 2px solid #0088cc; backdrop-filter: blur(10px);">
            <div class="code-header" style="color: #0088cc; font-weight: 700; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-rocket"></i>
                جاهز للربط التلقائي مع الحفظ
            </div>
            <div class="generated-code" style="background: white; padding: 12px; border-radius: 8px; 
                         font-weight: bold; color: #0088cc; font-size: 1.2rem; margin-bottom: 15px;
                         word-break: break-all; font-family: monospace;">${code}</div>
            <div class="telegram-actions">
                <button type="button" class="telegram-open-btn-big" onclick="openTelegramWithAutoStart()" 
                        style="background: #0088cc; color: white; border: none; padding: 12px 24px; 
                               border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;
                               box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3); transition: all 0.3s ease;">
                    <i class="fab fa-telegram"></i>
                    🚀 فتح التليجرام والربط مع الحفظ التلقائي
                </button>
            </div>
            <div class="telegram-instructions" style="margin-top: 15px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.8);">
                <div class="single-step">
                    ⚡ اضغط الزر وسيتم كل شيء تلقائياً: فتح التليجرام + تشغيل /start + حفظ البيانات!
                </div>
            </div>
        </div>
    `;
    
    telegramCodeResult.style.display = 'block';
    
    setTimeout(() => {
        telegramCodeResult.classList.add('show');
        telegramCodeResult.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 100);
}

// إعادة تعيين الزر
function resetTelegramButton(telegramBtn) {
    telegramBtn.disabled = false;
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fab fa-telegram telegram-icon"></i>
            <div class="telegram-text">
                <span class="telegram-title">📱 ربط مع التليجرام</span>
                <span class="telegram-subtitle">احصل على كود فوري وادخل للبوت</span>
            </div>
        </div>
    `;
    
    telegramBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        generateTelegramCodeFixed();
    };
}

// الحصول على تفاصيل الدفع النشطة
function getActivePaymentDetails() {
    const activeInput = document.querySelector('.dynamic-input.show input');
    return activeInput ? activeInput.value.trim() : '';
}

// الحصول على رمز CSRF
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                  document.querySelector('input[name="csrf_token"]');
    return token ? (token.getAttribute('content') || token.value) : '';
}

// عرض الإشعارات
function showTelegramNotification(message, type = 'info') {
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
    // استخدام نظام الإشعارات الموجود إن وُجد
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }
    
    // إشعار بديل محسّن
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // إظهار الإشعار
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // إخفاء تلقائي
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, type === 'error' ? 7000 : 5000);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 تهيئة النظام - MAIN INITIALIZATION - ULTIMATE FIXED
// ═══════════════════════════════════════════════════════════════
function initializeTelegramSystemFixed() {
    console.log('🚀 Initializing ULTIMATE FIXED Telegram System v3.1.0...');
    
    // البحث الذكي عن زر التليجرام
    const telegramBtn = findTelegramButton();
    
    if (!telegramBtn) {
        console.error('❌ Telegram button not found! Searching in 2 seconds...');
        
        // إعادة محاولة بعد ثانيتين
        setTimeout(() => {
            const retryBtn = findTelegramButton();
            if (retryBtn) {
                console.log('✅ Telegram button found on retry:', retryBtn.id || 'no-id');
                setupTelegramButton(retryBtn);
            } else {
                console.error('❌ Telegram button still not found after retry');
            }
        }, 2000);
        return;
    }
    
    console.log('✅ Telegram button found:', telegramBtn.id || telegramBtn.className || 'no-identifier');
    setupTelegramButton(telegramBtn);
}

function setupTelegramButton(telegramBtn) {
    // حفظ مرجع الزر عالمياً
    globalTelegramButton = telegramBtn;
    currentTelegramData.buttonElement = telegramBtn;
    
    // إزالة مستمعين قدامى بشكل آمن
    const newBtn = telegramBtn.cloneNode(true);
    telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
    
    // تحديث المرجع العالمي
    globalTelegramButton = newBtn;
    currentTelegramData.buttonElement = newBtn;
    
    // ربط الدالة الجديدة
    newBtn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('👆 Telegram button clicked - ULTIMATE FIXED version');
        generateTelegramCodeFixed();
    });
    
    // إضافة مستمع للضغط على Enter
    newBtn.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            console.log('⌨️ Telegram button activated via keyboard');
            generateTelegramCodeFixed();
        }
    });
    
    console.log('✅ ULTIMATE FIXED Telegram System initialized successfully!');
    console.log('🔧 Features enabled: Auto-start ✓, Auto-save ✓, undefined fix ✓, Email system ✓');
}

// دالة تهيئة وحدة التليجرام للتوافق مع الكود القديم
function initializeTelegramModule() {
    console.log('🔄 Legacy initializeTelegramModule called, redirecting to new system...');
    initializeTelegramSystemFixed();
}

// ═══════════════════════════════════════════════════════════════
// 🎯 تشغيل التهيئة عند تحميل الصفحة - MULTIPLE TRIGGERS
// ═══════════════════════════════════════════════════════════════

// التهيئة الفورية إذا كانت الصفحة محملة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTelegramSystemFixed);
} else {
    // تأخير بسيط للتأكد من تحميل جميع العناصر
    setTimeout(initializeTelegramSystemFixed, 500);
}

// تهيئة إضافية عند تحميل النافذة
window.addEventListener('load', function() {
    setTimeout(initializeTelegramSystemFixed, 1000);
});

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    if (telegramStatusMonitor) {
        clearInterval(telegramStatusMonitor);
    }
    if (dataAutoSaver) {
        clearInterval(dataAutoSaver);
    }
    console.log('🧹 Cleaned up Telegram system');
});

// ═══════════════════════════════════════════════════════════════
// 📤 تصدير الدوال للاستخدام العام - EXPORTS
// ═══════════════════════════════════════════════════════════════

// تصدير جميع الدوال المطلوبة
window.generateTelegramCodeFixed = generateTelegramCodeFixed;
window.openTelegramWithAutoStart = openTelegramWithAutoStart;
window.continueToCoins = continueToCoins;
window.closeSuccessOverlay = closeSuccessOverlay;
window.initializeTelegramModule = initializeTelegramModule;
window.addNewEmail = addNewEmail;
window.removeEmail = removeEmail;

// تصدير ES6 للتوافق
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeTelegramModule,
        generateTelegramCodeFixed,
        openTelegramWithAutoStart,
        addNewEmail,
        removeEmail
    };
}

// ═══════════════════════════════════════════════════════════════
// 📝 إشعار نهاية الملف - FINAL
// ═══════════════════════════════════════════════════════════════
console.log('📦 FC 26 Telegram Integration v3.1.0 - ULTIMATE FIXED - Loaded Successfully! ✅');
console.log('🎯 All issues resolved: undefined fix ✓, auto-start ✓, auto-save ✓, exports ✓, email system ✓');
console.log('🚀 Ready for production use with full compatibility!');
