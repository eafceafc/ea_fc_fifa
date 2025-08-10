// 🤖 Telegram Integration Module - FC 26 Profile Setup
// نظام ربط التليجرام المعزول والمستقل

let isProcessingTelegram = false;
let telegramProcessTimeout = null;
let telegramMonitoringInterval = null;

async function getValidationStatesFromMainSystem() {
    console.log('🔍 Starting enhanced validation check...');
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
    console.log('📋 Raw data found:', {
        platform: platform || 'EMPTY',
        whatsapp: whatsapp ? whatsapp.substring(0, 5) + '***' : 'EMPTY',
        phoneInfoExists: !!phoneInfo,
        paymentMethod: paymentMethod || 'EMPTY'
    });

    let hasValidPaymentDetails = false;
    let activePaymentField = 'none';

    if (paymentMethod) {
        if (paymentMethod.includes('cash') || paymentMethod === 'bank_wallet') {
            const mobileField = document.getElementById('mobile-number');
            if (mobileField && getComputedStyle(mobileField.closest('.dynamic-input')).display !== 'none') {
                const mobileValue = mobileField.value.trim();
                hasValidPaymentDetails = /^01[0125][0-9]{8}$/.test(mobileValue);
                activePaymentField = 'mobile';
                console.log('📱 Mobile payment check:', {
                    value: mobileValue,
                    isValid: hasValidPaymentDetails,
                    pattern: '/^01[0125][0-9]{8}$/'
                });
            }
        } else if (paymentMethod === 'tilda') {
            const cardField = document.getElementById('card-number');
            if (cardField && getComputedStyle(cardField.closest('.dynamic-input')).display !== 'none') {
                const cardValue = cardField.value.replace(/[-\s]/g, '');
                hasValidPaymentDetails = /^\d{16}$/.test(cardValue);
                activePaymentField = 'card';
                console.log('💳 Card payment check:', {
                    value: cardValue ? cardValue.substring(0, 4) + '***' : 'EMPTY',
                    isValid: hasValidPaymentDetails,
                    length: cardValue.length
                });
            }
        } else if (paymentMethod === 'instapay') {
            const linkField = document.getElementById('payment-link');
            if (linkField && getComputedStyle(linkField.closest('.dynamic-input')).display !== 'none') {
                const linkValue = linkField.value.trim();
                hasValidPaymentDetails = linkValue.includes('instapay') || linkValue.includes('ipn.eg');
                activePaymentField = 'link';
                console.log('🔗 Link payment check:', {
                    hasInstapay: linkValue.includes('instapay'),
                    hasIpn: linkValue.includes('ipn.eg'),
                    isValid: hasValidPaymentDetails
                });
            }
        }
    }

    const validationStates = {
        platform: !!platform,
        whatsapp: !!(whatsapp && phoneInfo),
        paymentMethod: !!(paymentMethod && hasValidPaymentDetails)
    };

    console.log('🎯 Final validation results:', validationStates);
    console.log('📊 Validation details:', {
        platform: { value: platform, isValid: validationStates.platform },
        whatsapp: { hasValue: !!whatsapp, hasValidation: !!phoneInfo, isValid: validationStates.whatsapp },
        payment: {
            method: paymentMethod,
            activeField: activePaymentField,
            hasDetails: hasValidPaymentDetails,
            isValid: validationStates.paymentMethod
        }
    });

    return validationStates;
}

export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - FINAL FIXED VERSION...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (!telegramBtn) {
        console.error('❌ زر التليجرام غير موجود - ID: telegram-link-btn');
        return;
    }

    if (isProcessingTelegram) {
        console.log('⏳ المعالجة جارية بالفعل - تجاهل النقر المتكرر');
        showTelegramNotification('⏳ جاري المعالجة، يرجى الانتظار...', 'warning');
        return;
    }

    isProcessingTelegram = true;
    console.log('🔒 تم قفل المعالجة لمنع التكرار');

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

        updateTelegramButtonToLoading(telegramBtn);

        const formData = await collectFormDataForTelegram();
        console.log('📤 إرسال البيانات:', {
            platform: formData.platform,
            whatsapp: formData.whatsapp_number ? formData.whatsapp_number.substring(0, 5) + '***' : 'EMPTY',
            paymentMethod: formData.payment_method
        });

        const serverResponse = await sendTelegramLinkRequest(formData);

        // توحيد مفاتيح محتملة من السيرفر
        serverResponse.telegram_code = (serverResponse.telegram_code ?? serverResponse.start_param ?? serverResponse.code ?? '').toString().trim();
        serverResponse.bot_username  = serverResponse.bot_username || 'ea_fc_fifa_bot';

        console.log('🔎 فحص مفاتيح الاستجابة:', {
          success: !!serverResponse.success,
          telegram_code: serverResponse.telegram_code ? serverResponse.telegram_code.substring(0, 8) + '...' : 'EMPTY',
          bot_username: serverResponse.bot_username,
          message: serverResponse.message || ''
        });

        if (serverResponse.success && serverResponse.telegram_code) {
            await openTelegramSmartly(serverResponse);
            displayCopyableCode(telegramBtn, serverResponse);
            startTelegramLinkingMonitor(serverResponse.telegram_code);
            updateTelegramButtonToSuccess(telegramBtn);

            isProcessingTelegram = false;
            console.log('🔓 تم إلغاء قفل المعالجة (نجاح)');
        } else {
            throw new Error(serverResponse.message || 'خطأ في الخادم: كود التفعيل غير متاح');
        }

    } catch (error) {
        console.error('❌ خطأ في معالجة التليجرام:', error);
        handleTelegramError(telegramBtn, error.message);
    }
}

function handleIncompleteDataError(telegramBtn, customMessage) {
    console.log('⚠️ معالجة خطأ البيانات غير المكتملة:', customMessage);
    isProcessingTelegram = false;
    console.log('🔓 تم تحرير القفل فوراً (خطأ البيانات)');

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
        console.log('🔄 تم إعادة تعيين زر التليجرام');
    }, 3000);
}

async function collectFormDataForTelegram() {
    console.log('📋 جمع بيانات النموذج...');
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    const paymentDetails = getActivePaymentDetails();

    const formData = {
        platform: platform,
        whatsapp_number: whatsapp,
        payment_method: paymentMethod,
        payment_details: paymentDetails
    };

    console.log('📋 تم جمع البيانات:', {
        platform: formData.platform || 'EMPTY',
        whatsapp_number: formData.whatsapp_number ? formData.whatsapp_number.substring(0, 5) + '***' : 'EMPTY',
        payment_method: formData.payment_method || 'EMPTY',
        payment_details: formData.payment_details ? 'HAS_DATA' : 'EMPTY'
    });

    return formData;
}

function getActivePaymentDetails() {
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    console.log('💳 البحث عن تفاصيل الدفع لطريقة:', paymentMethod);

    if (paymentMethod.includes('cash') || paymentMethod === 'bank_wallet') {
        const mobileNumber = document.getElementById('mobile-number')?.value || '';
        console.log('📱 تفاصيل الموبايل:', mobileNumber ? 'موجود' : 'فارغ');
        return mobileNumber;
    } else if (paymentMethod === 'tilda') {
        const cardNumber = document.getElementById('card-number')?.value || '';
        console.log('💳 تفاصيل الكارت:', cardNumber ? 'موجود' : 'فارغ');
        return cardNumber;
    } else if (paymentMethod === 'instapay') {
        const paymentLink = document.getElementById('payment-link')?.value || '';
        console.log('🔗 تفاصيل الرابط:', paymentLink ? 'موجود' : 'فارغ');
        return paymentLink;
    }

    console.log('❓ لم يتم العثور على تفاصيل دفع');
    return '';
}

async function sendTelegramLinkRequest(formData) {
    console.log('🌐 إرسال طلب إلى /generate-telegram-code...');
    try {
        const response = await fetch('/generate-telegram-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        });

        console.log('📡 استجابة الخادم:', { status: response.status, statusText: response.statusText, ok: response.ok });

        if (!response.ok) {
            console.error('❌ خطأ HTTP:', response.status, response.statusText);
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }

        const result = await response.json();
        console.log('📦 محتوى الاستجابة:', {
            success: result.success,
            hasCode: !!result.telegram_code || !!result.start_param || !!result.code,
            hasWebUrl: !!result.telegram_web_url,
            hasAppUrl: !!result.telegram_app_url,
            message: result.message
        });

        return result;
    } catch (networkError) {
        console.error('🌐 خطأ في الشبكة:', networkError);
        throw new Error('خطأ في الاتصال بالخادم - تحقق من الاتصال');
    }
}

async function openTelegramSmartly(data) {
    const isMobile  = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    const botUsername  = (data?.bot_username || 'ea_fc_fifa_bot').toString().trim();
    const telegramCode = (data?.telegram_code ?? '').toString().trim();

    if (!telegramCode) {
        console.error('❌ لا يوجد telegram_code صالح في الاستجابة:', data);
        showTelegramNotification('❌ فشل إنشاء كود التفعيل. برجاء المحاولة مرة أخرى.', 'error');
        return;
    }

    const p = encodeURIComponent(telegramCode);
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${p}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${p}`;
    const universalUrl   = `https://telegram.me/${botUsername}?start=${p}`;

    console.log('🔗 الروابط المحسّنة:', { web: enhancedWebUrl, app: enhancedAppUrl, universal: universalUrl });

    if (isMobile) {
        if (isIOS) {
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            try { window.location.href = enhancedAppUrl; } catch(e) {}
        }

        setTimeout(() => {
            const w = window.open(universalUrl, '_blank');
            if (!w) window.location.href = universalUrl;
        }, 1000);

        setTimeout(() => {
            const w = window.open(enhancedWebUrl, '_blank');
            if (!w) window.location.href = enhancedWebUrl;
        }, 3000);
    } else {
        try {
            window.location.href = enhancedAppUrl;
        } catch(e) {
            window.open(enhancedWebUrl, '_blank');
        }
        setTimeout(() => {
            const w = window.open(enhancedWebUrl, '_blank');
            if (!w) window.location.href = enhancedWebUrl;
        }, 1500);
    }

    setTimeout(() => {
        if (telegramCode) {
            try {
                navigator.clipboard?.writeText(`/start ${telegramCode}`);
                showTelegramNotification('✅ تم نسخ الكود للحافظة احتياطياً', 'success');
            } catch (e) {
                // زر النسخ اليدوي موجود للتعويض
            }
        }
    }, 2000);

    const userMessage = isMobile ?
        'تم فتح التليجرام - سيتم تشغيل /start تلقائياً!' :
        'تم فتح التليجرام - إذا لم يعمل تلقائياً، اضغط START في البوت';
    showTelegramNotification(userMessage, 'success');
}

function displayCopyableCode(telegramBtn, data) {
    console.log('📋 عرض الكود القابل للنسخ...');
    const existingCodeDisplay = document.querySelector('.telegram-code-display');
    if (existingCodeDisplay) existingCodeDisplay.remove();

    const code = (data?.telegram_code ?? '').toString().trim();
    if (!code) {
        console.warn('⚠️ لا يوجد كود للعرض - إلغاء عرض الكود');
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
                /start ${code}
            </code>
            <div style="font-size: 0.9em; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px;">
                <small>📱 الكود سيعمل تلقائياً عند فتح التليجرام</small>
            </div>
            <button onclick="window.copyTelegramCodeManual('/start ${code}')" 
                    style="background: #0088cc; color: white; border: none; padding: 8px 16px; 
                           border-radius: 6px; margin-top: 5px; cursor: pointer; font-weight: 600;">
                📋 نسخ الكود (للطوارئ)
            </button>
        </div>
    `;
    telegramBtn.parentNode.insertBefore(codeDisplay, telegramBtn.nextSibling);

    setTimeout(() => {
        if (codeDisplay && codeDisplay.parentNode) {
            codeDisplay.style.opacity = '0';
            setTimeout(() => codeDisplay.parentNode && codeDisplay.remove(), 500);
        }
    }, 15000);
}

function startTelegramLinkingMonitor(telegramCode) {
    if (telegramMonitoringInterval) clearInterval(telegramMonitoringInterval);

    console.log('🔍 بدء مراقبة ربط التليجرام للكود:', telegramCode.substring(0, 10) + '...');

    telegramMonitoringInterval = setInterval(async () => {
        try {
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`);
            if (!checkResponse.ok) {
                console.error('❌ فشل الاستعلام عن حالة الربط:', checkResponse.status, checkResponse.statusText);
                return;
            }
            const checkResult = await checkResponse.json();
            console.log('📊 نتيجة فحص الربط:', checkResult);

            if (checkResult.success && checkResult.linked) {
                clearInterval(telegramMonitoringInterval);
                telegramMonitoringInterval = null;

                console.log('✅ تم ربط التليجرام بنجاح!');
                showTelegramNotification('🎉 تم ربط التليجرام بنجاح! جاري التوجيه...', 'success');

                const codeDisplay = document.querySelector('.telegram-code-display');
                if (codeDisplay) codeDisplay.remove();

                setTimeout(() => {
                    console.log('🚀 الانتقال إلى صفحة الكوينز...');
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
            console.log('⏰ انتهى وقت مراقبة ربط التليجرام');
            showTelegramNotification('⏰ انتهى وقت الانتظار - تحقق من التليجرام يدوياً', 'warning');
        }
    }, 90000);
}

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

function handleTelegramError(telegramBtn, errorMessage) {
    console.log('❌ معالجة خطأ التليجرام:', errorMessage);
    isProcessingTelegram = false;
    const originalContent = telegramBtn.innerHTML;
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-exclamation-triangle telegram-icon" style="color: #ff9000;"></i>
            <div class="telegram-text">
                <span class="telegram-title">❌ خطأ - اضغط للمحاولة مرة أخرى</span>
                <span class="telegram-subtitle">${errorMessage}</span>
            </div>
        </div>
    `;
    telegramBtn.classList.remove('generating');
    telegramBtn.classList.add('error');
    telegramBtn.disabled = false;
    showTelegramNotification('❌ ' + errorMessage + ' - اضغط الزر مرة أخرى', 'error');
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
        console.log('🔄 تم إعادة تعيين زر التليجرام بعد الخطأ');
    }, 4000);
}

function showTelegramNotification(message, type = 'info') {
    console.log(`📢 إشعار تليجرام (${type}):`, message);
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const icon = icons[type] || 'ℹ️';
        console.log(`🔔 ${icon} ${type.toUpperCase()}: ${message}`);
        if (type === 'error' || type === 'warning') alert(`${icon} ${message}`);
    }
}

function getCSRFTokenFromMainSystem() {
    if (typeof window.getCSRFToken === 'function') return window.getCSRFToken();
    else if (typeof getCSRFToken === 'function') return getCSRFToken();
    const token = document.querySelector('meta[name="csrf-token"]') ||
                  document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                  document.querySelector('input[name="csrf_token"]');
    return token ? (token.getAttribute('content') || token.value) : '';
}

window.copyTelegramCodeManual = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showTelegramNotification('✅ تم النسخ! الصق الكود في التليجرام', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
};

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
        const successful = document.execCommand('copy');
        if (successful) {
            showTelegramNotification('✅ تم النسخ بالطريقة البديلة', 'info');
        }
    } catch (err) {
        console.error('❌ خطأ في النسخ:', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

export function initializeTelegramModule() {
    console.log('🤖 تم تهيئة وحدة التليجرام المستقلة - FINAL FIXED VERSION');
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        const newBtn = telegramBtn.cloneNode(true);
        telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            handleTelegramLink();
        });
        newBtn.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleTelegramLink();
            }
        });
        console.log('✅ تم ربط زر التليجرام بالوحدة الجديدة مع معالجة محسّنة');
    } else {
        console.warn('⚠️ زر التليجرام غير موجود - حاول التأكد من ID');
    }
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
        telegramMonitoringInterval = null;
    }
    isProcessingTelegram = false;
    console.log('🔧 تم إعداد وحدة التليجرام بالكامل - جميع المشاكل محلولة');
}

console.log('📦 Telegram Integration Module v2.2.0 - FINAL FIXED - تم التحميل بنجاح');
console.log('🔒 الوحدة معزولة تماماً ولا تحتاج تعديلات مستقبلية');
console.log('✅ تم إصلاح مشكلة القفل العالق');
console.log('✅ تم تحسين deep linking للتفعيل التلقائي');
console.log('🎯 جاهز للاستخدام بدون مشاكل!');
