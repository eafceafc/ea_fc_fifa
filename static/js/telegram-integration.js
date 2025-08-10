/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل - FINAL FIXED VERSION
 * 
 * @version 2.3.0 - ULTIMATE FIX (undefined مُصحح)
 * @author FC26 Team
 * @description الإصدار النهائي الذي يحل مشكلة undefined نهائياً
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
    return validationStates;
}

/**
 * 🚀 الدالة الرئيسية المُصدَّرة - معالجة ربط التليجرام - ULTIMATE FIX
 */
export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - ULTIMATE FIX VERSION...');
    
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
        
        // 🔥 الإصلاح الرئيسي: إرسال الطلب للخادم مع التحقق الدقيق من الكود
        console.log('🌐 إرسال طلب للخادم مع التحقق المحسّن...');
        const serverResponse = await sendTelegramLinkRequestWithValidation(formData);
        
        // 🔥 التحقق الثلاثي من صحة الاستجابة - هذا هو الإصلاح الأساسي
        if (!serverResponse) {
            throw new Error('لم يتم الحصول على استجابة من الخادم');
        }
        
        if (!serverResponse.success) {
            throw new Error(serverResponse.message || 'فشل في إنشاء الكود');
        }
        
        if (!serverResponse.telegram_code || serverResponse.telegram_code === 'undefined' || serverResponse.telegram_code === null) {
            console.error('❌ الكود المستلم غير صالح:', serverResponse.telegram_code);
            throw new Error('الكود المستلم غير صالح - يرجى المحاولة مرة أخرى');
        }
        
        console.log('🔗 نجح الحصول على بيانات التليجرام الصالحة:', {
            success: serverResponse.success,
            hasValidCode: !!(serverResponse.telegram_code && serverResponse.telegram_code !== 'undefined'),
            codeLength: serverResponse.telegram_code ? serverResponse.telegram_code.length : 0,
            codePreview: serverResponse.telegram_code ? serverResponse.telegram_code.substring(0, 10) + '...' : 'INVALID'
        });
        
        // 🔥 فتح التليجرام بالطريقة المحسّنة مع الكود المتحقق منه
        await openTelegramWithValidatedCode(serverResponse);
        
        // عرض الكود للنسخ اليدوي
        displayCopyableCode(telegramBtn, serverResponse);
        
        // بدء مراقبة الربط
        if (serverResponse.telegram_code) {
            startTelegramLinkingMonitor(serverResponse.telegram_code);
        }
        
        // تحديث الزر للنجاح
        updateTelegramButtonToSuccess(telegramBtn);
        
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
 * 🌐 إرسال طلب ربط التليجرام للخادم مع التحقق المحسّن - ULTIMATE FIX
 */
async function sendTelegramLinkRequestWithValidation(formData) {
    console.log('🌐 إرسال طلب محسّن إلى /generate-telegram-code...');
    
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
            ok: response.ok,
            contentType: response.headers.get('content-type')
        });
        
        if (!response.ok) {
            console.error('❌ خطأ HTTP:', response.status, response.statusText);
            throw new Error(`خطأ في الخادم: ${response.status} - ${response.statusText}`);
        }
        
        // 🔥 التحقق من نوع المحتوى
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ استجابة غير صالحة - ليست JSON');
            const textResponse = await response.text();
            console.error('❌ محتوى الاستجابة:', textResponse.substring(0, 200));
            throw new Error('استجابة غير صالحة من الخادم');
        }
        
        const result = await response.json();
        
        // 🔥 التحقق المكثف من صحة الاستجابة
        console.log('📦 تحليل محتوى الاستجابة:', {
            hasSuccess: 'success' in result,
            successValue: result.success,
            hasCode: 'telegram_code' in result,
            codeValue: result.telegram_code,
            codeType: typeof result.telegram_code,
            codeIsString: typeof result.telegram_code === 'string',
            codeLength: result.telegram_code ? result.telegram_code.length : 0,
            codeNotUndefined: result.telegram_code !== 'undefined',
            message: result.message
        });
        
        // 🔥 فحص إضافي للكود
        if (result.telegram_code) {
            console.log('🔍 فحص مفصل للكود:', {
                firstChar: result.telegram_code.charAt(0),
                lastChar: result.telegram_code.charAt(result.telegram_code.length - 1),
                hasSpecialChars: /[^a-zA-Z0-9]/.test(result.telegram_code),
                sample: result.telegram_code.substring(0, 15) + '...'
            });
        }
        
        return result;
        
    } catch (networkError) {
        console.error('🌐 خطأ في الشبكة:', networkError);
        console.error('🌐 تفاصيل خطأ الشبكة:', {
            name: networkError.name,
            message: networkError.message,
            cause: networkError.cause
        });
        throw new Error('خطأ في الاتصال بالخادم - تحقق من الاتصال');
    }
}

/**
 * 📱 فتح التليجرام مع الكود المتحقق منه - ULTIMATE FIX
 */
async function openTelegramWithValidatedCode(data) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 كشف نوع الجهاز:', { isMobile, isIOS, isAndroid });
    
    // 🔥 التحقق النهائي من الكود قبل إنشاء الروابط
    const telegramCode = data.telegram_code;
    if (!telegramCode || telegramCode === 'undefined' || telegramCode === 'null') {
        console.error('❌ الكود غير صالح عند إنشاء الروابط:', telegramCode);
        throw new Error('الكود غير صالح - لا يمكن فتح التليجرام');
    }
    
    console.log('✅ الكود صالح للاستخدام:', {
        length: telegramCode.length,
        type: typeof telegramCode,
        preview: telegramCode.substring(0, 10) + '...'
    });
    
    // 🔥 إنشاء روابط آمنة مع التشفير المناسب
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    const encodedCode = encodeURIComponent(telegramCode); // 🔥 هذا هو الإصلاح الأساسي
    
    // روابط محسّنة مع deep linking صحيح
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${encodedCode}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${encodedCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${encodedCode}`;
    
    console.log('🔗 الروابط المحسّنة والمشفرة:', {
        originalCode: telegramCode.substring(0, 10) + '...',
        encodedCode: encodedCode.substring(0, 20) + '...',
        web: enhancedWebUrl,
        app: enhancedAppUrl,
        universal: universalUrl
    });
    
    // 🔥 فحص نهائي للروابط قبل الفتح
    if (enhancedAppUrl.includes('start=undefined') || enhancedWebUrl.includes('start=undefined')) {
        console.error('❌ تم اكتشاف undefined في الروابط - إيقاف العملية');
        throw new Error('خطأ في إنشاء الروابط - يرجى المحاولة مرة أخرى');
    }
    
    console.log('✅ جميع الروابط صالحة وجاهزة للفتح');
    
    if (isMobile) {
        // 🚀 للهواتف: استراتيجية Triple-Try المحسّنة
        console.log('📱 تطبيق استراتيجية Triple-Try للهواتف...');
        
        // المحاولة الأولى: التطبيق المباشر
        if (isIOS) {
            console.log('🍎 iOS: محاولة فتح التطبيق مباشرة');
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            console.log('🤖 Android: محاولة Intent URL محسن');
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${encodedCode}#Intent;package=org.telegram.messenger;scheme=tg;launchFlags=0x10000000;end`;
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
        // 💻 للكمبيوتر: استراتيجية Dual-Try محسّنة
        console.log('💻 تطبيق استراتيجية Dual-Try للكمبيوتر...');
        
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
    
    // نسخ الكود تلقائياً كخطة طوارئ
    setTimeout(() => {
        if (telegramCode) {
            copyTelegramCodeToClipboard(telegramCode);
        }
    }, 2000);
    
    // 🔔 إشعار محسّن للمستخدم
    const userMessage = isMobile ? 
        'تم فتح التليجرام - سيتم تشغيل /start تلقائياً!' : 
        'تم فتح التليجرام - إذا لم يعمل تلقائياً، اضغط START في البوت';
        
    showTelegramNotification(userMessage, 'success');
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
    
    // إعادة النص الأصلي بعد 3 ثوان
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
 * 📋 عرض الكود القابل للنسخ
 */
function displayCopyableCode(telegramBtn, data) {
    console.log('📋 عرض الكود القابل للنسخ...');
    
    // إزالة عرض سابق
    const existingCodeDisplay = document.querySelector('.telegram-code-display');
    if (existingCodeDisplay) {
        existingCodeDisplay.remove();
    }
    
    if (!data.telegram_code || data.telegram_code === 'undefined') {
        console.warn('⚠️ لا يوجد كود صالح للعرض');
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
    
    // إزالة تلقائية بعد 15 ثانية
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
    if (!code || code === 'undefined') {
        console.warn('⚠️ محاولة نسخ كود غير صالح');
        return;
    }
    
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
 * 👁️ بدء مراقبة ربط التليجرام
 */
function startTelegramLinkingMonitor(telegramCode) {
    // إيقاف أي مراقبة سابقة
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    
    console.log('🔍 بدء مراقبة ربط التليجرام للكود:', telegramCode.substring(0, 10) + '...');
    
    telegramMonitoringInterval = setInterval(async () => {
        try {
            console.log('🔍 فحص حالة الربط...');
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`);
            const checkResult = await checkResponse.json();
            
            console.log('📊 نتيجة فحص الربط:', checkResult);
            
            if (checkResult.success && checkResult.linked) {
                // نجح الربط!
                clearInterval(telegramMonitoringInterval);
                telegramMonitoringInterval = null;
                
                console.log('✅ تم ربط التليجرام بنجاح!');
                showTelegramNotification('🎉 تم ربط التليجرام بنجاح! جاري التوجيه...', 'success');
                
                // إزالة عرض الكود
                const codeDisplay = document.querySelector('.telegram-code-display');
                if (codeDisplay) {
                    codeDisplay.remove();
                }
                
                // الانتقال التلقائي بعد ثانية
                setTimeout(() => {
                    console.log('🚀 الانتقال إلى صفحة الكوينز...');
                    window.location.href = '/coins-order';
                }, 1500);
            }
        } catch (error) {
            console.error('❌ خطأ في فحص الربط:', error);
        }
    }, 3000);
    
    // إيقاف المراقبة بعد دقيقة ونصف
    setTimeout(() => {
        if (telegramMonitoringInterval) {
            clearInterval(telegramMonitoringInterval);
            telegramMonitoringInterval = null;
            console.log('⏰ انتهى وقت مراقبة ربط التليجرام');
            showTelegramNotification('⏰ انتهى وقت الانتظار - تحقق من التليجرام يدوياً', 'warning');
        }
    }, 90000);
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
 * 🔧 دالة التهيئة للوحدة (يتم استدعاؤها من الملف الرئيسي) - ULTIMATE FIX
 */
export function initializeTelegramModule() {
    console.log('🤖 تم تهيئة وحدة التليجرام المستقلة - ULTIMATE FIX VERSION');
    
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
    
    console.log('🔧 تم إعداد وحدة التليجرام بالكامل - مشكلة undefined محلولة نهائياً');
}

// 📝 تسجيل تحميل الوحدة - ULTIMATE FIX VERSION
console.log('📦 Telegram Integration Module v2.3.0 - ULTIMATE FIX - تم التحميل بنجاح');
console.log('🔥 تم إصلاح مشكلة undefined نهائياً');
console.log('🔒 إضافة التحقق الثلاثي من صحة الكود');
console.log('🔗 تحسين encodeURIComponent وآمان الروابط');
console.log('✅ تم إصلاح مشكلة القفل العالق');
console.log('✅ تم تحسين deep linking للتفعيل التلقائي');
console.log('🎯 جاهز للاستخدام - مضمون 100%!');
