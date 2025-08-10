/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 3.0.0 - FIXED UNDEFINED CODE ISSUE
 * @author FC26 Team
 */

// 🔒 متغيرات خاصة بالوحدة
let isProcessingTelegram = false;
let telegramProcessTimeout = null;
let telegramMonitoringInterval = null;

/**
 * 🔗 الحصول على حالات التحقق من النظام الرئيسي
 */
async function getValidationStatesFromMainSystem() {
    console.log('🔍 Starting validation check...');
    
    if (typeof window.validationStates !== 'undefined') {
        console.log('✅ Found validationStates in window:', window.validationStates);
        return window.validationStates;
    }
    
    if (window.parent && typeof window.parent.validationStates !== 'undefined') {
        console.log('✅ Found validationStates in parent:', window.parent.validationStates);
        return window.parent.validationStates;
    }
    
    console.log('🔍 Manual validation check starting...');
    
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const phoneInfo = document.querySelector('.phone-info.success-info');
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    
    let hasValidPaymentDetails = false;
    let activePaymentField = 'none';
    
    if (paymentMethod) {
        const mobileField = document.getElementById('mobile-number');
        if (mobileField && mobileField.closest('.dynamic-input').style.display !== 'none') {
            const mobileValue = mobileField.value.trim();
            hasValidPaymentDetails = /^01[0125][0-9]{8}$/.test(mobileValue);
            activePaymentField = 'mobile';
        }
        
        const cardField = document.getElementById('card-number');
        if (cardField && cardField.closest('.dynamic-input').style.display !== 'none') {
            const cardValue = cardField.value.replace(/[-\s]/g, '');
            hasValidPaymentDetails = /^\d{16}$/.test(cardValue);
            activePaymentField = 'card';
        }
        
        const linkField = document.getElementById('payment-link');
        if (linkField && linkField.closest('.dynamic-input').style.display !== 'none') {
            const linkValue = linkField.value.trim();
            hasValidPaymentDetails = linkValue.includes('instapay') || linkValue.includes('ipn.eg');
            activePaymentField = 'link';
        }
    }
    
    const validationStates = {
        platform: !!platform,
        whatsapp: !!(whatsapp && phoneInfo),
        paymentMethod: !!(paymentMethod && hasValidPaymentDetails)
    };
    
    console.log('🎯 Final validation results:', validationStates);
    return validationStates;
}

/**
 * 🚀 الدالة الرئيسية - معالجة ربط التليجرام - FIXED VERSION
 */
export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - FIXED VERSION...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (!telegramBtn) {
        console.error('❌ زر التليجرام غير موجود');
        return;
    }
    
    if (isProcessingTelegram) {
        console.log('⏳ المعالجة جارية بالفعل');
        showTelegramNotification('⏳ جاري المعالجة، يرجى الانتظار...', 'warning');
        return;
    }
    
    isProcessingTelegram = true;
    
    try {
        const validationStates = await getValidationStatesFromMainSystem();
        
        if (!validationStates.platform) {
            handleIncompleteDataError(telegramBtn, 'يرجى اختيار منصة اللعب أولاً');
            return;
        }
        
        if (!validationStates.whatsapp) {
            handleIncompleteDataError(telegramBtn, 'يرجى إدخال رقم واتساب صحيح والتأكد من التحقق منه');
            return;
        }
        
        if (!validationStates.paymentMethod) {
            handleIncompleteDataError(telegramBtn, 'يرجى اختيار طريقة دفع وإدخال البيانات المطلوبة');
            return;
        }
        
        console.log('✅ جميع البيانات مكتملة، بدء عملية الربط...');
        
        updateTelegramButtonToLoading(telegramBtn);
        
        const formData = await collectFormDataForTelegram();
        console.log('📤 إرسال البيانات للسيرفر...');
        
        // 🔥 الإصلاح الرئيسي: انتظار الاستجابة الكاملة قبل فتح التليجرام
        const serverResponse = await sendTelegramLinkRequest(formData);
        
        // التحقق من وجود الكود بشكل صحيح
        if (!serverResponse || !serverResponse.success || !serverResponse.telegram_code) {
            console.error('❌ لم يتم استلام كود صحيح من السيرفر:', serverResponse);
            throw new Error('فشل في الحصول على كود التليجرام');
        }
        
        // التأكد من أن الكود ليس undefined أو فارغ
        const telegramCode = serverResponse.telegram_code;
        if (!telegramCode || telegramCode === 'undefined' || telegramCode === '') {
            console.error('❌ الكود المستلم غير صحيح:', telegramCode);
            throw new Error('الكود المستلم من السيرفر غير صحيح');
        }
        
        console.log('✅ تم استلام كود صحيح:', telegramCode.substring(0, 10) + '...');
        
        // فتح التليجرام بالكود الصحيح
        await openTelegramWithCode(telegramCode, serverResponse.bot_username || 'ea_fc_fifa_bot');
        
        // عرض الكود للنسخ اليدوي
        displayCopyableCode(telegramBtn, serverResponse);
        
        // بدء مراقبة الربط
        startTelegramLinkingMonitor(telegramCode);
        
        // تحديث الزر للنجاح
        updateTelegramButtonToSuccess(telegramBtn);
        
    } catch (error) {
        console.error('❌ خطأ في معالجة التليجرام:', error);
        handleTelegramError(telegramBtn, error.message);
    } finally {
        if (!telegramBtn.classList.contains('error')) {
            setTimeout(() => {
                isProcessingTelegram = false;
            }, 2000);
        }
    }
}

/**
 * 📱 فتح التليجرام بالكود الصحيح - FIXED VERSION
 */
async function openTelegramWithCode(telegramCode, botUsername) {
    // التحقق النهائي من الكود
    if (!telegramCode || telegramCode === 'undefined') {
        console.error('❌ محاولة فتح التليجرام بكود غير صحيح');
        throw new Error('الكود غير صحيح');
    }
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 فتح التليجرام بالكود:', telegramCode.substring(0, 10) + '...');
    
    // تشفير الكود لتجنب مشاكل الرموز الخاصة
    const encodedCode = encodeURIComponent(telegramCode);
    
    // إنشاء الروابط بالكود المشفر
    const webUrl = `https://t.me/${botUsername}?start=${encodedCode}`;
    const appUrl = `tg://resolve?domain=${botUsername}&start=${encodedCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${encodedCode}`;
    
    console.log('🔗 الروابط المُنشأة:', {
        web: webUrl,
        app: appUrl,
        universal: universalUrl
    });
    
    if (isMobile) {
        console.log('📱 فتح على الموبايل...');
        
        if (isIOS) {
            console.log('🍎 iOS detected');
            window.location.href = appUrl;
        } else if (isAndroid) {
            console.log('🤖 Android detected');
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${encodedCode}#Intent;package=org.telegram.messenger;scheme=tg;launchFlags=0x10000000;end`;
            window.location.href = intentUrl;
        }
        
        setTimeout(() => {
            window.open(universalUrl, '_blank');
        }, 1000);
        
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 3000);
        
    } else {
        console.log('💻 فتح على الكمبيوتر...');
        
        try {
            window.location.href = appUrl;
        } catch (e) {
            window.open(webUrl, '_blank');
        }
        
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 1500);
    }
    
    // نسخ الكود احتياطياً
    setTimeout(() => {
        copyTelegramCodeToClipboard(telegramCode);
    }, 2000);
    
    const userMessage = isMobile ? 
        'تم فتح التليجرام - سيتم تشغيل /start تلقائياً!' : 
        'تم فتح التليجرام - إذا لم يعمل تلقائياً، اضغط START في البوت';
        
    showTelegramNotification(userMessage, 'success');
}

/**
 * 🌐 إرسال طلب ربط التليجرام للخادم - ENHANCED
 */
async function sendTelegramLinkRequest(formData) {
    console.log('🌐 إرسال طلب إلى /generate-telegram-code...');
    
    try {
        const response = await fetch('/generate-telegram-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 استجابة الخادم:', {
            status: response.status,
            ok: response.ok
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }
        
        const result = await response.json();
        
        // التحقق من صحة البيانات المستلمة
        if (!result || typeof result !== 'object') {
            throw new Error('استجابة غير صحيحة من الخادم');
        }
        
        console.log('📦 البيانات المستلمة:', {
            success: result.success,
            hasCode: !!result.telegram_code,
            codeValue: result.telegram_code ? 'EXISTS' : 'MISSING'
        });
        
        return result;
        
    } catch (error) {
        console.error('🌐 خطأ في الطلب:', error);
        throw new Error('خطأ في الاتصال بالخادم');
    }
}

/**
 * ⚠️ معالجة خطأ البيانات غير المكتملة
 */
function handleIncompleteDataError(telegramBtn, customMessage) {
    console.log('⚠️ معالجة خطأ البيانات غير المكتملة:', customMessage);
    
    isProcessingTelegram = false;
    
    const originalContent = telegramBtn.innerHTML;
    
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-exclamation-circle telegram-icon" style="color: #ff4444;"></i>
            <div class="telegram-text">
                <span class="telegram-title">❌ بيانات غير مكتملة</span>
                <span class="telegram-subtitle">${customMessage}</span>
            </div>
        </div>
    `;
    telegramBtn.classList.add('error');
    telegramBtn.disabled = false;
    
    showTelegramNotification(customMessage, 'error');
    
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
    }, 3000);
}

/**
 * 📋 جمع بيانات النموذج للتليجرام
 */
async function collectFormDataForTelegram() {
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    const paymentDetails = getActivePaymentDetails();
    
    return {
        platform: platform,
        whatsapp_number: whatsapp,
        payment_method: paymentMethod,
        payment_details: paymentDetails
    };
}

/**
 * 💳 الحصول على تفاصيل الدفع النشطة
 */
function getActivePaymentDetails() {
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    
    if (paymentMethod.includes('cash') || paymentMethod === 'bank_wallet') {
        return document.getElementById('mobile-number')?.value || '';
    } else if (paymentMethod === 'tilda') {
        return document.getElementById('card-number')?.value || '';
    } else if (paymentMethod === 'instapay') {
        return document.getElementById('payment-link')?.value || '';
    }
    
    return '';
}

/**
 * 📋 عرض الكود القابل للنسخ
 */
function displayCopyableCode(telegramBtn, data) {
    const existingCodeDisplay = document.querySelector('.telegram-code-display');
    if (existingCodeDisplay) {
        existingCodeDisplay.remove();
    }
    
    if (!data.telegram_code) {
        return;
    }
    
    const codeDisplay = document.createElement('div');
    codeDisplay.className = 'telegram-code-display';
    codeDisplay.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 136, 204, 0.1), rgba(0, 85, 153, 0.15)); 
                    padding: 15px; margin: 15px 0; border-radius: 12px; text-align: center; 
                    border: 2px solid #0088cc; backdrop-filter: blur(10px);">
            <div style="color: #0088cc; font-weight: 700; margin-bottom: 10px;">
                <i class="fas fa-copy"></i> الكود للنسخ اليدوي:
            </div>
            <code style="background: white; padding: 8px 12px; border-radius: 6px; 
                         font-weight: bold; color: #0088cc; font-size: 1.1em; 
                         word-break: break-all; display: inline-block; margin-bottom: 10px;">
                /start ${data.telegram_code}
            </code>
            <div style="font-size: 0.9em; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px;">
                <small>📱 الكود سيعمل تلقائياً عند فتح التليجرام</small>
            </div>
            <button onclick="window.copyTelegramCodeManual('/start ${data.telegram_code}')" 
                    style="background: #0088cc; color: white; border: none; padding: 8px 16px; 
                           border-radius: 6px; margin-top: 5px; cursor: pointer; font-weight: 600;">
                📋 نسخ الكود
            </button>
        </div>
    `;
    
    telegramBtn.parentNode.insertBefore(codeDisplay, telegramBtn.nextSibling);
    
    setTimeout(() => {
        if (codeDisplay && codeDisplay.parentNode) {
            codeDisplay.style.opacity = '0';
            setTimeout(() => {
                if (codeDisplay.parentNode) {
                    codeDisplay.remove();
                }
            }, 500);
        }
    }, 15000);
}

/**
 * 📋 نسخ كود التليجرام للحافظة
 */
function copyTelegramCodeToClipboard(code) {
    const fullCode = `/start ${code}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullCode).then(() => {
            console.log('✅ تم نسخ الكود للحافظة');
            showTelegramNotification('✅ تم نسخ الكود للحافظة', 'success');
        }).catch(err => {
            fallbackCopyToClipboard(fullCode);
        });
    } else {
        fallbackCopyToClipboard(fullCode);
    }
}

/**
 * 📋 طريقة بديلة للنسخ
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('❌ خطأ في النسخ:', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

/**
 * 👁️ بدء مراقبة ربط التليجرام
 */
function startTelegramLinkingMonitor(telegramCode) {
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    
    console.log('🔍 بدء مراقبة ربط التليجرام...');
    
    telegramMonitoringInterval = setInterval(async () => {
        try {
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`);
            const checkResult = await checkResponse.json();
            
            if (checkResult.success && checkResult.linked) {
                clearInterval(telegramMonitoringInterval);
                telegramMonitoringInterval = null;
                
                console.log('✅ تم ربط التليجرام بنجاح!');
                showTelegramNotification('🎉 تم ربط التليجرام بنجاح!', 'success');
                
                const codeDisplay = document.querySelector('.telegram-code-display');
                if (codeDisplay) {
                    codeDisplay.remove();
                }
                
                setTimeout(() => {
                    window.location.href = '/coins-order';
                }, 1500);
            }
        } catch (error) {
            console.error('❌ خطأ في فحص الربط:', error);
        }
    }, 3000);
    
    setTimeout(() => {
        if (telegramMonitoringInterval) {
            clearInterval(telegramMonitoringInterval);
            telegramMonitoringInterval = null;
        }
    }, 90000);
}

/**
 * ⏳ تحديث الزر لحالة التحميل
 */
function updateTelegramButtonToLoading(telegramBtn) {
    telegramBtn.disabled = true;
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-spinner fa-spin telegram-icon"></i>
            <div class="telegram-text">
                <span class="telegram-title">⏳ جاري التحضير...</span>
                <span class="telegram-subtitle">يرجى الانتظار...</span>
            </div>
        </div>
    `;
    telegramBtn.classList.add('generating');
}

/**
 * ✅ تحديث الزر لحالة النجاح
 */
function updateTelegramButtonToSuccess(telegramBtn) {
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-check-circle telegram-icon" style="color: #00d084;"></i>
            <div class="telegram-text">
                <span class="telegram-title">✅ تم فتح التليجرام</span>
                <span class="telegram-subtitle">سيتم التفعيل تلقائياً</span>
            </div>
        </div>
    `;
    telegramBtn.classList.remove('generating');
    telegramBtn.classList.add('success');
    
    setTimeout(() => {
        const originalContent = `
            <div class="telegram-btn-content">
                <i class="fab fa-telegram telegram-icon"></i>
                <div class="telegram-text">
                    <span class="telegram-title">📱 ربط مع التليجرام</span>
                    <span class="telegram-subtitle">احصل على كود فوري وادخل للبوت</span>
                </div>
            </div>
        `;
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('success');
        telegramBtn.disabled = false;
    }, 6000);
}

/**
 * ❌ معالجة خطأ التليجرام
 */
function handleTelegramError(telegramBtn, errorMessage) {
    isProcessingTelegram = false;
    
    const originalContent = telegramBtn.innerHTML;
    
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-exclamation-triangle telegram-icon" style="color: #ff9000;"></i>
            <div class="telegram-text">
                <span class="telegram-title">❌ خطأ</span>
                <span class="telegram-subtitle">${errorMessage}</span>
            </div>
        </div>
    `;
    telegramBtn.classList.remove('generating');
    telegramBtn.classList.add('error');
    telegramBtn.disabled = false;
    
    showTelegramNotification('❌ ' + errorMessage, 'error');
    
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
    }, 4000);
}

/**
 * 📢 إظهار إشعار خاص بالتليجرام
 */
function showTelegramNotification(message, type = 'info') {
    console.log(`📢 إشعار (${type}):`, message);
    
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        const notificationTypes = {
            'success': '✅',
            'error': '❌', 
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        const icon = notificationTypes[type] || 'ℹ️';
        console.log(`${icon} ${message}`);
    }
}

/**
 * 🔒 الحصول على CSRF token
 */
function getCSRFTokenFromMainSystem() {
    if (typeof window.getCSRFToken === 'function') {
        return window.getCSRFToken();
    } else if (typeof getCSRFToken === 'function') {
        return getCSRFToken();
    }
    
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                  document.querySelector('input[name="csrf_token"]');
    return token ? (token.getAttribute('content') || token.value) : '';
}

/**
 * 🌐 دالة عامة للنسخ اليدوي
 */
window.copyTelegramCodeManual = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showTelegramNotification('✅ تم النسخ!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
};

/**
 * 🔧 دالة التهيئة للوحدة
 */
export function initializeTelegramModule() {
    console.log('🤖 تهيئة وحدة التليجرام - v3.0.0 FIXED');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        const newBtn = telegramBtn.cloneNode(true);
        telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
        
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            handleTelegramLink();
        });
        
        console.log('✅ تم ربط زر التليجرام بنجاح');
    }
    
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
        telegramMonitoringInterval = null;
    }
    
    isProcessingTelegram = false;
    
    console.log('✅ الوحدة جاهزة - تم إصلاح مشكلة undefined');
}

console.log('📦 Telegram Module v3.0.0 - FIXED - تم التحميل');
