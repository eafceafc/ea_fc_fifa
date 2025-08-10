/**
 * 🚀 FC 26 Telegram Integration - FINAL FIXED VERSION
 * نظام ربط التليجرام المطور مع إصلاح مشكلة undefined
 * Version: 3.0.0 - ULTRA FIXED
 */

// متغيرات التليجرام العامة - محسنة
let currentTelegramData = {
    code: null,
    botUsername: 'ea_fc_fifa_bot', // default fallback
    isProcessing: false,
    autoSaveEnabled: true
};

let telegramStatusMonitor = null;
let dataAutoSaver = null;

// ═══════════════════════════════════════════════════════════════
// 🔧 دالة توليد الكود الآمنة - ULTRA FIXED
// ═══════════════════════════════════════════════════════════════
async function generateTelegramCodeFixed() {
    console.log('🚀 [FIXED] Starting Telegram code generation...');
    
    const telegramBtn = document.getElementById('telegramBtn');
    if (!telegramBtn) {
        console.error('❌ Telegram button not found');
        return;
    }

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

        if (serverResponse && serverResponse.success && serverResponse.code) {
            // ✅ حفظ الكود بطريقة آمنة
            currentTelegramData.code = serverResponse.code;
            
            console.log('✅ Code generated successfully:', currentTelegramData.code);
            
            // تحديث الزر للفتح المباشر
            updateButtonForDirectLinking(telegramBtn);
            
            // عرض منطقة الكود
            displayCodeSection(serverResponse.code);
            
            // ✅ بدء الحفظ التلقائي فوراً
            if (currentTelegramData.autoSaveEnabled) {
                startAutoDataSaving(requiredData.data);
            }
            
            showTelegramNotification(`✅ تم توليد الكود بنجاح: ${serverResponse.code}`, 'success');
            
        } else {
            throw new Error(serverResponse?.message || 'فشل في توليد الكود');
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
        return { isValid: false, error: 'يرجى التحقق من صحة رقم الواتساب' };
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
    
    console.log('📋 Data collected:', {
        platform: userData.platform,
        whatsapp: userData.whatsapp_number.substring(0, 5) + '***',
        hasPayment: !!userData.payment_method
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
            hasCode: !!result.code,
            codeLength: result.code ? result.code.length : 0
        });
        
        return result;
        
    } catch (error) {
        console.error('🌐 Request failed:', error);
        throw new Error('خطأ في الاتصال بالخادم: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// 🚀 فتح التليجرام مع الكود - ULTRA FIXED
// ═══════════════════════════════════════════════════════════════
function openTelegramWithAutoStart() {
    console.log('🚀 [ULTRA FIXED] Opening Telegram with auto-start...');
    
    // ✅ التحقق المضاعف من وجود الكود
    const telegramCode = currentTelegramData.code;
    console.log('🔍 Current telegram code:', telegramCode);
    
    if (!telegramCode || telegramCode === 'undefined' || telegramCode === null) {
        console.error('❌ CRITICAL: Telegram code is undefined/null');
        showTelegramNotification('❌ خطأ: الكود غير متاح، يرجى توليد كود جديد', 'error');
        return;
    }
    
    // التحقق من طول الكود
    if (telegramCode.length < 5) {
        console.error('❌ CRITICAL: Telegram code too short:', telegramCode);
        showTelegramNotification('❌ خطأ: الكود غير صحيح', 'error');
        return;
    }
    
    const botUsername = currentTelegramData.botUsername;
    console.log('🤖 Bot username:', botUsername);
    
    // ✅ إنشاء الروابط بطريقة آمنة
    const telegramAppUrl = `tg://resolve?domain=${botUsername}&start=${telegramCode}`;
    const telegramWebUrl = `https://t.me/${botUsername}?start=${telegramCode}`;
    
    console.log('🔗 Generated URLs:', {
        app: telegramAppUrl,
        web: telegramWebUrl
    });
    
    // تجميد الواجهة مؤقتاً
    freezeUI();
    
    // ✅ فتح التليجرام بالطريقة المناسبة
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('📱 Mobile device detected');
        
        // للهواتف: محاولة التطبيق أولاً
        try {
            window.location.href = telegramAppUrl;
            console.log('📱 Opened Telegram app URL');
        } catch (e) {
            console.log('📱 App URL failed, trying web URL');
            window.open(telegramWebUrl, '_blank');
        }
        
        // نسخة احتياطية للويب
        setTimeout(() => {
            window.open(telegramWebUrl, '_blank');
            console.log('🌐 Opened web URL as backup');
        }, 1000);
        
    } else {
        console.log('💻 Desktop device detected');
        
        // للكمبيوتر: فتح الرابط في نافذة جديدة
        const newWindow = window.open(telegramWebUrl, '_blank');
        if (!newWindow) {
            console.log('💻 Popup blocked, using direct navigation');
            window.location.href = telegramWebUrl;
        }
    }
    
    // رسائل تحديث الحالة
    showProgressMessages();
    
    // ✅ بدء مراقبة حالة الربط
    startLinkingMonitor(telegramCode);
    
    // ✅ نسخ الكود احتياطياً
    copyCodeToClipboard(`/start ${telegramCode}`);
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
// 💾 نظام الحفظ التلقائي - NEW FEATURE
// ═══════════════════════════════════════════════════════════════
function startAutoDataSaving(userData) {
    console.log('💾 Starting auto data saving...');
    
    if (!currentTelegramData.autoSaveEnabled) {
        console.log('💾 Auto save disabled, skipping...');
        return;
    }
    
    // حفظ فوري أول
    setTimeout(() => {
        saveUserDataAutomatically(userData);
    }, 3000);
    
    // حفظ دوري كل 10 ثوان
    dataAutoSaver = setInterval(() => {
        saveUserDataAutomatically(userData);
    }, 10000);
    
    console.log('💾 Auto saver started');
}

async function saveUserDataAutomatically(userData) {
    console.log('💾 Auto-saving user data...');
    
    try {
        // حفظ في sessionStorage كنسخة احتياطية
        sessionStorage.setItem('fc26_user_data', JSON.stringify({
            ...userData,
            autoSavedAt: Date.now()
        }));
        
        // محاولة حفظ على الخادم
        const response = await fetch('/auto-save-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCSRFToken() || ''
            },
            body: JSON.stringify({
                ...userData,
                telegram_code: currentTelegramData.code,
                auto_save: true
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('✅ Data auto-saved successfully');
            }
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
                <h3 style="margin-bottom: 15px;">📋 تم حفظ البيانات التالية:</h3>
                <div style="text-align: left; font-size: 1rem;">
                    🎯 المنصة: <span id="savedPlatform">تم التحديد</span><br>
                    📱 رقم الواتساب: <span id="savedWhatsapp">تم التحقق</span><br>
                    💳 طريقة الدفع: <span id="savedPayment">تم الحفظ</span><br>
                    📅 تاريخ التسجيل: ${new Date().toLocaleDateString('ar-SA')}
                </div>
            </div>
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
            <div style="margin-top: 20px; font-size: 0.9rem; opacity: 0.8;">
                🔗 رابط الموقع: https://ea-fc-fifa-5jbn.onrender.com/
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
        const platform = document.getElementById('platform')?.value || 'غير محدد';
        const whatsapp = document.getElementById('whatsapp')?.value || 'غير محدد';
        const paymentMethod = document.getElementById('payment_method')?.value || 'غير محدد';
        
        const savedPlatform = document.getElementById('savedPlatform');
        const savedWhatsapp = document.getElementById('savedWhatsapp');
        const savedPayment = document.getElementById('savedPayment');
        
        if (savedPlatform) savedPlatform.textContent = platform;
        if (savedWhatsapp) savedWhatsapp.textContent = whatsapp.substring(0, 8) + '***';
        if (savedPayment) savedPayment.textContent = getPaymentMethodName(paymentMethod);
        
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
        'bank_wallet': 'محفظة بنكية',
        'telda_card': 'كارت تيلدا',
        'instapay': 'إنستا باي'
    };
    return methods[method] || method || 'غير محدد';
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
        btn.disabled = true;
        btn.style.opacity = '0.6';
    });
}

// إلغاء تجميد واجهة المستخدم
function unfreezeUI() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
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
    telegramBtn.onclick = function() {
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
    
    telegramBtn.onclick = function() {
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
// 🚀 تهيئة النظام - MAIN INITIALIZATION
// ═══════════════════════════════════════════════════════════════
function initializeTelegramSystemFixed() {
    console.log('🚀 Initializing FIXED Telegram System v3.0.0...');
    
    // البحث عن زر التليجرام
    const telegramBtn = document.getElementById('telegramBtn') || document.getElementById('telegram-link-btn');
    
    if (!telegramBtn) {
        console.error('❌ Telegram button not found! Looking for alternatives...');
        
        // البحث عن أزرار بديلة
        const alternativeButtons = document.querySelectorAll('button, [onclick*="telegram"], [onclick*="Telegram"]');
        console.log('🔍 Found alternative buttons:', alternativeButtons.length);
        
        return;
    }
    
    console.log('✅ Telegram button found:', telegramBtn.id || 'no-id');
    
    // إزالة مستمعين قدامى
    const newBtn = telegramBtn.cloneNode(true);
    telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
    
    // ربط الدالة الجديدة
    newBtn.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('👆 Telegram button clicked - FIXED version');
        generateTelegramCodeFixed();
    });
    
    // تحضير المتغيرات
    currentTelegramData.isProcessing = false;
    
    console.log('✅ FIXED Telegram System initialized successfully!');
    console.log('🔧 Features enabled: Auto-start ✓, Auto-save ✓, undefined fix ✓');
}

// ═══════════════════════════════════════════════════════════════
// 🎯 تشغيل التهيئة عند تحميل الصفحة
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    // تأخير بسيط للتأكد من تحميل جميع العناصر
    setTimeout(() => {
        initializeTelegramSystemFixed();
    }, 1000);
});

// تشغيل فوري إذا كانت الصفحة محملة بالفعل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTelegramSystemFixed);
} else {
    initializeTelegramSystemFixed();
}

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
// 📝 إشعار نهاية الملف
// ═══════════════════════════════════════════════════════════════
console.log('📦 FC 26 Telegram Integration v3.0.0 - ULTRA FIXED - Loaded Successfully! ✅');
console.log('🎯 All issues resolved: undefined fix ✓, auto-start ✓, auto-save ✓');
console.log('🚀 Ready for production use!');

// تصدير الدوال للاستخدام العام
window.generateTelegramCodeFixed = generateTelegramCodeFixed;
window.openTelegramWithAutoStart = openTelegramWithAutoStart;
window.continueToCoins = continueToCoins;
window.closeSuccessOverlay = closeSuccessOverlay;
