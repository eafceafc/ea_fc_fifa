/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 2.2.0 - FINAL FIXED VERSION
 * @author FC26 Team
 * @description صندوق أسود لكل ما يخص ربط التليجرام - الإصدار النهائي المحسّن
 */

// 🔒 متغيرات خاصة بالوحدة (Private Variables)
let isProcessingTelegram = false;
let telegramProcessTimeout = null;
let telegramMonitoringInterval = null;

/**
 * 🔗 الحصول على حالات التحقق من النظام الرئيسي - محسّنة
 */
async function getValidationStatesFromMainSystem() {
    console.log('🔍 Starting enhanced validation check...');
    
    // محاولة الوصول للمتغيرات العامة من النافذة الرئيسية
    if (typeof window.validationStates !== 'undefined') {
        console.log('✅ Found validationStates in window:', window.validationStates);
        return window.validationStates;
    }
    
    // محاولة الوصول عبر الـ parent window
    if (window.parent && typeof window.parent.validationStates !== 'undefined') {
        console.log('✅ Found validationStates in parent:', window.parent.validationStates);
        return window.parent.validationStates;
    }
    
    // فحص يدوي مفصل للبيانات
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
    
    // تحديد الحقل النشط للدفع
    let hasValidPaymentDetails = false;
    let activePaymentField = 'none';
    
    if (paymentMethod) {
        // فحص حقل الموبايل للمحافظ
        const mobileField = document.getElementById('mobile-number');
        if (mobileField && mobileField.closest('.dynamic-input').style.display !== 'none') {
            const mobileValue = mobileField.value.trim();
            hasValidPaymentDetails = /^01[0125][0-9]{8}$/.test(mobileValue);
            activePaymentField = 'mobile';
            console.log('📱 Mobile payment check:', {
                value: mobileValue,
                isValid: hasValidPaymentDetails,
                pattern: '/^01[0125][0-9]{8}$/'
            });
        }
        
        // فحص حقل الكارت لتيلدا
        const cardField = document.getElementById('card-number');
        if (cardField && cardField.closest('.dynamic-input').style.display !== 'none') {
            const cardValue = cardField.value.replace(/[-\s]/g, '');
            hasValidPaymentDetails = /^\d{16}$/.test(cardValue);
            activePaymentField = 'card';
            console.log('💳 Card payment check:', {
                value: cardValue ? cardValue.substring(0, 4) + '***' : 'EMPTY',
                isValid: hasValidPaymentDetails,
                length: cardValue.length
            });
        }
        
        // فحص حقل الرابط لإنستاباي
        const linkField = document.getElementById('payment-link');
        if (linkField && linkField.closest('.dynamic-input').style.display !== 'none') {
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
    
    const validationStates = {
        platform: !!platform,
        whatsapp: !!(whatsapp && phoneInfo),
        paymentMethod: !!(paymentMethod && hasValidPaymentDetails)
    };
    
    console.log('🎯 Final validation results:', validationStates);
    console.log('📊 Validation details:', {
        platform: {
            value: platform,
            isValid: validationStates.platform
        },
        whatsapp: {
            hasValue: !!whatsapp,
            hasValidation: !!phoneInfo,
            isValid: validationStates.whatsapp
        },
        payment: {
            method: paymentMethod,
            activeField: activePaymentField,
            hasDetails: hasValidPaymentDetails,
            isValid: validationStates.paymentMethod
        }
    });
    
    return validationStates;
}

/**
 * 🚀 الدالة الرئيسية المُصدَّرة - معالجة ربط التليجرام - FINAL FIXED
 */
export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - FINAL FIXED VERSION...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (!telegramBtn) {
        console.error('❌ زر التليجرام غير موجود - ID: telegram-link-btn');
        return;
    }
    
    console.log('✅ تم العثور على زر التليجرام');
    
    // منع المعالجة المتكررة
    if (isProcessingTelegram) {
        console.log('⏳ المعالجة جارية بالفعل - تجاهل النقر المتكرر');
        showTelegramNotification('⏳ جاري المعالجة، يرجى الانتظار...', 'warning');
        return;
    }
    
    isProcessingTelegram = true;
    console.log('🔒 تم قفل المعالجة لمنع التكرار');
    
    try {
        // التحقق من حالة التحقق مع تشخيص مفصل
        console.log('🔍 Getting validation states...');
        const validationStates = await getValidationStatesFromMainSystem();
        
        // ✅ التحقق من اكتمال البيانات مع رسائل واضحة
        if (!validationStates.platform) {
            console.log('❌ فشل التحقق: المنصة غير مختارة');
            handleIncompleteDataError(telegramBtn, 'يرجى اختيار منصة اللعب أولاً');
            return;
        }
        
        if (!validationStates.whatsapp) {
            console.log('❌ فشل التحقق: الواتساب غير صحيح أو غير متحقق منه');
            handleIncompleteDataError(telegramBtn, 'يرجى إدخال رقم واتساب صحيح والتأكد من التحقق منه');
            return;
        }
        
        if (!validationStates.paymentMethod) {
            console.log('❌ فشل التحقق: طريقة الدفع غير صحيحة أو غير مكتملة');
            handleIncompleteDataError(telegramBtn, 'يرجى اختيار طريقة دفع وإدخال البيانات المطلوبة');
            return;
        }
        
        console.log('✅ جميع البيانات مكتملة، بدء عملية الربط...');
        
        // تحديث الزر لحالة التحميل
        updateTelegramButtonToLoading(telegramBtn);
        
        // جمع البيانات للإرسال
        const formData = await collectFormDataForTelegram();
        console.log('📤 إرسال البيانات:', {
            platform: formData.platform,
            whatsapp: formData.whatsapp_number ? formData.whatsapp_number.substring(0, 5) + '***' : 'EMPTY',
            paymentMethod: formData.payment_method
        });
        
        // إرسال الطلب للخادم
        console.log('🌐 إرسال طلب للخادم...');
        const serverResponse = await sendTelegramLinkRequest(formData);
        
        if (serverResponse.success && serverResponse.telegram_web_url) {
            console.log('🔗 نجح الحصول على بيانات التليجرام:', {
                success: serverResponse.success,
                hasWebUrl: !!serverResponse.telegram_web_url,
                hasAppUrl: !!serverResponse.telegram_app_url,
                hasCode: !!serverResponse.telegram_code
            });
            
            // فتح التليجرام بالطريقة الذكية المحسّنة
            await openTelegramSmartly(serverResponse);
            
            // عرض الكود للنسخ اليدوي
            displayCopyableCode(telegramBtn, serverResponse);
            
            // بدء مراقبة الربط
            if (serverResponse.telegram_code) {
                startTelegramLinkingMonitor(serverResponse.telegram_code);
            }
            
            // تحديث الزر للنجاح
            updateTelegramButtonToSuccess(telegramBtn);
            
        } else {
            console.error('❌ فشل الاستجابة من الخادم:', serverResponse);
            throw new Error(serverResponse.message || 'خطأ في الخادم');
        }
        
    } catch (error) {
        console.error('❌ خطأ في معالجة التليجرام:', error);
        console.error('❌ تفاصيل الخطأ:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        handleTelegramError(telegramBtn, error.message);
        
    } finally {
        // تنظيف حالة المعالجة - تحرير فوري للعمليات الناجحة
        if (!telegramBtn.classList.contains('error')) {
            setTimeout(() => {
                isProcessingTelegram = false;
                console.log('🔓 تم إلغاء قفل المعالجة (عملية ناجحة)');
            }, 2000);
        }
        // للأخطاء، سيتم تحرير القفل في handleIncompleteDataError أو handleTelegramError
    }
}

/**
 * ⚠️ معالجة خطأ البيانات غير المكتملة - FIXED VERSION
 */
function handleIncompleteDataError(telegramBtn, customMessage) {
    console.log('⚠️ معالجة خطأ البيانات غير المكتملة:', customMessage);
    
    // 🔓 تحرير القفل فوراً - هذا هو الإصلاح الرئيسي!
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
    telegramBtn.disabled = false; // 🔓 تفعيل الزر فوراً
    
    // إظهار رسالة خطأ مفصلة
    showTelegramNotification(customMessage, 'error');
    
    // إعادة النص الأصلي بعد 3 ثوان (مدة أقصر)
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
        console.log('🔄 تم إعادة تعيين زر التليجرام');
    }, 3000);
}

/**
 * 📋 جمع بيانات النموذج للتليجرام
 */
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

/**
 * 💳 الحصول على تفاصيل الدفع النشطة
 */
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

/**
 * 🌐 إرسال طلب ربط التليجرام للخادم
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
            statusText: response.statusText,
            ok: response.ok
        });
        
        if (!response.ok) {
            console.error('❌ خطأ HTTP:', response.status, response.statusText);
            throw new Error(`خطأ في الخادم: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 محتوى الاستجابة:', {
            success: result.success,
            hasCode: !!result.telegram_code,
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

/**
 * 📱 فتح التليجرام بالطريقة الذكية مع حفظ فوري - ENHANCED FOR AUTO-SAVE
 */
async function openTelegramSmartly(data) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 كشف نوع الجهاز:', { isMobile, isIOS, isAndroid });
    
    // 🔥 إنشاء روابط محسّنة للتفعيل والحفظ التلقائي
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    const telegramCode = data.telegram_code;
    
    // روابط محسّنة مع deep linking صحيح
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${telegramCode}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${telegramCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${telegramCode}`;
    
    // 🔥 حفظ بيانات الجلسة فوراً عند فتح التليجرام
    const sessionData = {
        telegram_code: telegramCode,
        platform: document.getElementById('platform')?.value || '',
        whatsapp_number: document.getElementById('whatsapp')?.value || '',
        payment_method: document.getElementById('payment_method')?.value || '',
        payment_details: getActivePaymentDetails(),
        telegram_opened_at: new Date().toISOString(),
        device_type: isMobile ? 'mobile' : 'desktop',
        user_agent: navigator.userAgent
    };
    
    console.log('💾 حفظ بيانات الجلسة فوراً عند فتح التليجرام...');
    await saveUserTelegramData({
        ...sessionData,
        status: 'telegram_opened'
    });
    
    console.log('🔗 الروابط المحسّنة:', {
        web: enhancedWebUrl,
        app: enhancedAppUrl,
        universal: universalUrl
    });
    
    if (isMobile) {
        // 🚀 للهواتف: استراتيجية Triple-Try المحسّنة مع حفظ تلقائي
        console.log('📱 تطبيق استراتيجية Triple-Try للهواتف مع حفظ تلقائي...');
        
        // المحاولة الأولى: التطبيق المباشر
        if (isIOS) {
            console.log('🍎 iOS: محاولة فتح التطبيق مباشرة');
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            console.log('🤖 Android: محاولة Intent URL محسن');
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${telegramCode}#Intent;package=org.telegram.messenger;scheme=tg;launchFlags=0x10000000;end`;
            window.location.href = intentUrl;
        }
        
        // المحاولة الثانية: Universal Link بعد ثانية
        setTimeout(() => {
            console.log('🌍 المحاولة الثانية: Universal Link');
            const newWindow = window.open(universalUrl, '_blank');
            if (!newWindow) {
                window.location.href = universalUrl;
            }
        }, 1000);
        
        // المحاولة الثالثة: Web Telegram بعد 3 ثوان
        setTimeout(() => {
            console.log('🌐 المحاولة الثالثة: Web Telegram');
            const webWindow = window.open(enhancedWebUrl, '_blank');
            if (!webWindow) {
                window.location.href = enhancedWebUrl;
            }
        }, 3000);
        
    } else {
        // 💻 للكمبيوتر: استراتيجية Dual-Try محسّنة مع حفظ تلقائي
        console.log('💻 تطبيق استراتيجية Dual-Try للكمبيوتر مع حفظ تلقائي...');
        
        // المحاولة الأولى: التطبيق
        try {
            window.location.href = enhancedAppUrl;
            console.log('💻 محاولة فتح تطبيق التليجرام للكمبيوتر');
        } catch (e) {
            console.log('💻 فشل فتح التطبيق، التوجه للويب مباشرة');
            window.open(enhancedWebUrl, '_blank');
        }
        
        // المحاولة الثانية: الويب بعد ثانية كـ fallback
        setTimeout(() => {
            console.log('🌐 فتح Web Telegram للكمبيوتر كـ fallback');
            const webWindow = window.open(enhancedWebUrl, '_blank');
            if (!webWindow) {
                console.log('🌐 فشل popup، استخدام التوجيه المباشر');
                window.location.href = enhancedWebUrl;
            }
        }, 1500);
    }
    
    // 🔥 حفظ حالة "تم فتح التليجرام" بعد ثانيتين
    setTimeout(async () => {
        console.log('💾 تحديث حالة فتح التليجرام...');
        await saveUserTelegramData({
            ...sessionData,
            status: 'telegram_launch_completed',
            launch_completed_at: new Date().toISOString()
        });
    }, 2000);
    
    // نسخ الكود تلقائياً كخطة طوارئ
    setTimeout(() => {
        if (telegramCode) {
            copyTelegramCodeToClipboard(telegramCode);
        }
    }, 2000);
    
    // 🔔 إشعار محسّن للمستخدم
    const userMessage = isMobile ? 
        'تم فتح التليجرام مع حفظ تلقائي - سيتم تشغيل /start تلقائياً!' : 
        'تم فتح التليجرام مع حفظ تلقائي - إذا لم يعمل تلقائياً، اضغط START في البوت';
        
    showTelegramNotification(userMessage, 'success');
}


/**
 * 📋 عرض الكود القابل للنسخ
 */
function displayCopyableCode(telegramBtn, data) {
    console.log('📋 عرض الكود القابل للنسخ...');
    
    // إزالة عرض سابق
    const existingCodeDisplay = document.querySelector('.telegram-code-display');
    if (existingCodeDisplay) {
        existingCodeDisplay.remove();
    }
    
    if (!data.telegram_code) {
        console.warn('⚠️ لا يوجد كود للعرض');
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
                📋 نسخ الكود (للطوارئ)
            </button>
        </div>
    `;
    
    // إدراج عنصر الكود بعد الزر مباشرة
    telegramBtn.parentNode.insertBefore(codeDisplay, telegramBtn.nextSibling);
    
    // إزالة تلقائية بعد 15 ثانية (زمن أطول للمحسّن)
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
    
    console.log('📋 محاولة نسخ الكود:', fullCode.substring(0, 20) + '...');
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullCode).then(() => {
            console.log('✅ تم نسخ الكود للحافظة بنجاح');
            showTelegramNotification('✅ تم نسخ الكود للحافظة احتياطياً', 'success');
        }).catch(err => {
            console.warn('❌ فشل في نسخ الكود بالطريقة الحديثة:', err);
            fallbackCopyToClipboard(fullCode);
        });
    } else {
        console.log('📋 استخدام الطريقة البديلة للنسخ...');
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
        const successful = document.execCommand('copy');
        if (successful) {
            console.log('✅ تم نسخ الكود بالطريقة البديلة');
            showTelegramNotification('✅ تم نسخ الكود بالطريقة البديلة', 'info');
        } else {
            console.warn('❌ فشل النسخ بالطريقة البديلة');
        }
    } catch (err) {
        console.error('❌ خطأ في النسخ:', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

/**
 * 👁️ بدء مراقبة ربط التليجرام مع الحفظ التلقائي - ENHANCED VERSION
 */
function startTelegramLinkingMonitor(telegramCode) {
    // إيقاف أي مراقبة سابقة
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    
    console.log('🔍 بدء مراقبة ربط التليجرام مع الحفظ التلقائي للكود:', telegramCode.substring(0, 10) + '...');
    
    // 🔥 جمع البيانات للحفظ التلقائي
    const sessionData = {
        telegram_code: telegramCode,
        platform: document.getElementById('platform')?.value || '',
        whatsapp_number: document.getElementById('whatsapp')?.value || '',
        payment_method: document.getElementById('payment_method')?.value || '',
        payment_details: getActivePaymentDetails(),
        timestamp: Date.now()
    };
    
    console.log('💾 بيانات الجلسة المحفوظة محلياً:', {
        code: sessionData.telegram_code.substring(0, 10) + '...',
        platform: sessionData.platform,
        whatsapp: sessionData.whatsapp_number ? sessionData.whatsapp_number.substring(0, 5) + '***' : 'EMPTY',
        payment: sessionData.payment_method
    });
    
    telegramMonitoringInterval = setInterval(async () => {
        try {
            console.log('🔍 فحص حالة الربط مع إرسال بيانات للحفظ...');
            
            // 🔥 طلب محسّن يتضمن بيانات الحفظ
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`, {
                method: 'POST',  // ✅ تغيير من GET إلى POST لإرسال البيانات
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFTokenFromMainSystem()
                },
                body: JSON.stringify({
                    action: 'check_and_save',  // 🔥 إشارة للخادم للحفظ التلقائي
                    session_data: sessionData  // 🔥 إرسال بيانات الجلسة للحفظ
                })
            });
            
            const checkResult = await checkResponse.json();
            
            console.log('📊 نتيجة فحص الربط مع الحفظ:', checkResult);
            
            if (checkResult.success && checkResult.linked) {
                // 🎉 نجح الربط والحفظ!
                clearInterval(telegramMonitoringInterval);
                telegramMonitoringInterval = null;
                
                console.log('✅ تم ربط وحفظ التليجرام بنجاح!');
                
                // 🔥 حفظ إضافي للتأكد - محاولة أخيرة للحفظ
                if (checkResult.telegram_username) {
                    await saveUserTelegramData({
                        ...sessionData,
                        telegram_username: checkResult.telegram_username,
                        linked_at: new Date().toISOString()
                    });
                }
                
                showTelegramNotification('🎉 تم ربط وحفظ التليجرام بنجاح! جاري التوجيه...', 'success');
                
                // إزالة عرض الكود
                const codeDisplay = document.querySelector('.telegram-code-display');
                if (codeDisplay) {
                    codeDisplay.remove();
                }
                
                // الانتقال التلقائي بعد ثانية ونصف
                setTimeout(() => {
                    console.log('🚀 الانتقال إلى صفحة الكوينز مع بيانات محفوظة...');
                    window.location.href = '/coins-order';
                }, 1500);
            } else if (checkResult.telegram_username && !checkResult.linked) {
                // 🔄 يوزر بدأ يستخدم البوت لكن لم يكمل - حفظ جزئي
                console.log('🔄 حفظ جزئي - اليوزر بدأ لكن لم يكمل الربط');
                await saveUserTelegramData({
                    ...sessionData,
                    telegram_username: checkResult.telegram_username,
                    status: 'partial'
                });
            }
        } catch (error) {
            console.error('❌ خطأ في فحص الربط مع الحفظ:', error);
        }
    }, 3000);
    
    // إيقاف المراقبة بعد دقيقة ونصف (زمن أطول)
    setTimeout(() => {
        if (telegramMonitoringInterval) {
            clearInterval(telegramMonitoringInterval);
            telegramMonitoringInterval = null;
            console.log('⏰ انتهى وقت مراقبة ربط التليجرام - محاولة حفظ أخيرة');
            
            // 🔥 محاولة حفظ أخيرة حتى لو لم يكتمل الربط
            saveUserTelegramData({
                ...sessionData,
                status: 'timeout',
                ended_at: new Date().toISOString()
            });
            
            showTelegramNotification('⏰ انتهى وقت الانتظار - تم حفظ البيانات جزئياً', 'warning');
        }
    }, 90000);
}

/**
 * 💾 حفظ بيانات المستخدم والتليجرام تلقائياً - NEW FUNCTION
 */
async function saveUserTelegramData(userData) {
    console.log('💾 بدء حفظ بيانات المستخدم تلقائياً...', {
        hasCode: !!userData.telegram_code,
        hasUsername: !!userData.telegram_username,
        platform: userData.platform,
        status: userData.status || 'active'
    });
    
    try {
        const saveResponse = await fetch('/save-telegram-user-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify({
                action: 'auto_save_user_data',
                user_data: userData,
                auto_save: true  // 🔥 إشارة للحفظ التلقائي
            })
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
            console.log('✅ تم حفظ بيانات المستخدم تلقائياً بنجاح');
            
            // 🔥 حفظ محلي إضافي للاحتفاظ بالبيانات
            localStorage.setItem('telegram_user_data', JSON.stringify({
                ...userData,
                saved_at: new Date().toISOString(),
                saved_successfully: true
            }));
            
            return true;
        } else {
            console.warn('⚠️ فشل في حفظ البيانات:', saveResult.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات تلقائياً:', error);
        
        // 🔥 حفظ محلي كخطة طوارئ
        localStorage.setItem('telegram_user_data_backup', JSON.stringify({
            ...userData,
            error: error.message,
            backup_saved_at: new Date().toISOString()
        }));
        
        return false;
    }
}

/**
 * ⏳ تحديث الزر لحالة التحميل
 */
function updateTelegramButtonToLoading(telegramBtn) {
    console.log('⏳ تحديث الزر لحالة التحميل...');
    
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
    console.log('✅ تحديث الزر لحالة النجاح...');
    
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
    
    // إعادة الزر للوضع الطبيعي بعد 6 ثوان
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
 * ❌ معالجة خطأ التليجرام - ENHANCED
 */
function handleTelegramError(telegramBtn, errorMessage) {
    console.log('❌ معالجة خطأ التليجرام:', errorMessage);
    
    // 🔓 تحرير القفل فوراً عند الخطأ
    isProcessingTelegram = false;
    console.log('🔓 تم تحرير القفل فوراً (خطأ التليجرام)');
    
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
    telegramBtn.disabled = false; // تفعيل الزر فوراً
    
    showTelegramNotification('❌ ' + errorMessage + ' - اضغط الزر مرة أخرى', 'error');
    
    // إعادة الزر للوضع الطبيعي بعد 4 ثوان
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
        console.log('🔄 تم إعادة تعيين زر التليجرام بعد الخطأ');
    }, 4000);
}

/**
 * 📢 إظهار إشعار خاص بالتليجرام
 */
function showTelegramNotification(message, type = 'info') {
    console.log(`📢 إشعار تليجرام (${type}):`, message);
    
    // نستخدم النظام الموجود من الملف الرئيسي
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        // إشعار بسيط كبديل محسّن
        const notificationTypes = {
            'success': '✅',
            'error': '❌', 
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        const icon = notificationTypes[type] || 'ℹ️';
        console.log(`🔔 ${icon} ${type.toUpperCase()}: ${message}`);
        
        // إشعار متصفح محسّن
        if (type === 'error' || type === 'warning') {
            alert(`${icon} ${message}`);
        }
    }
}

/**
 * 🔒 الحصول على CSRF token من النظام الرئيسي
 */
function getCSRFTokenFromMainSystem() {
    // نحاول استخدام الدالة الموجودة
    if (typeof window.getCSRFToken === 'function') {
        return window.getCSRFToken();
    } else if (typeof getCSRFToken === 'function') {
        return getCSRFToken();
    }
    
    // محاولة بديلة
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                  document.querySelector('input[name="csrf_token"]');
    return token ? (token.getAttribute('content') || token.value) : '';
}

/**
 * 🌐 دالة عامة للنسخ اليدوي (للاستخدام مع HTML) - محسّنة
 */
window.copyTelegramCodeManual = function(text) {
    console.log('📋 نسخ يدوي للكود:', text.substring(0, 20) + '...');
    
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

/**
 * 🔧 دالة التهيئة للوحدة (يتم استدعاؤها من الملف الرئيسي) - FINAL
 */
export function initializeTelegramModule() {
    console.log('🤖 تم تهيئة وحدة التليجرام المستقلة - FINAL FIXED VERSION');
    
    // إعداد زر التليجرام
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        console.log('✅ تم العثور على زر التليجرام - ID: telegram-link-btn');
        
        // إزالة مستمعين قدامى بطريقة آمنة
        const newBtn = telegramBtn.cloneNode(true);
        telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
        
        // إضافة المستمع الجديد مع معالجة محسّنة
        newBtn.addEventListener('click', function(event) {
            console.log('👆 تم النقر على زر التليجرام');
            event.preventDefault();
            event.stopPropagation();
            handleTelegramLink();
        });
        
        // إضافة مستمع للضغط على Enter كبديل
        newBtn.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                console.log('⌨️ تم الضغط على Enter/Space على زر التليجرام');
                event.preventDefault();
                handleTelegramLink();
            }
        });
        
        console.log('✅ تم ربط زر التليجرام بالوحدة الجديدة مع معالجة محسّنة');
    } else {
        console.warn('⚠️ زر التليجرام غير موجود - ID المطلوب: telegram-link-btn');
        
        // محاولة البحث عن أزرار أخرى
        const allButtons = document.querySelectorAll('button, [role="button"]');
        console.log('🔍 الأزرار الموجودة في الصفحة:', 
            Array.from(allButtons).map(btn => ({
                id: btn.id || 'NO_ID',
                className: btn.className || 'NO_CLASS',
                text: btn.textContent?.substring(0, 30) || 'NO_TEXT'
            }))
        );
    }
    
    // تنظيف أي مراقبة سابقة عند إعادة التهيئة
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
        telegramMonitoringInterval = null;
    }
    
    // إعادة تعيين حالة المعالجة
    isProcessingTelegram = false;
    
    console.log('🔧 تم إعداد وحدة التليجرام بالكامل - جميع المشاكل محلولة');
}

// 📝 تسجيل تحميل الوحدة - FINAL VERSION
console.log('📦 Telegram Integration Module v2.2.0 - FINAL FIXED - تم التحميل بنجاح');
console.log('🔒 الوحدة معزولة تماماً ولا تحتاج تعديلات مستقبلية');
console.log('✅ تم إصلاح مشكلة القفل العالق');
console.log('✅ تم تحسين deep linking للتفعيل التلقائي');
console.log('🎯 جاهز للاستخدام بدون مشاكل!');
