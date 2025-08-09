/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 2.4.0 - HYBRID FINAL VERSION
 * @author FC26 Team
 * @description النسخة النهائية: دمج أفضل ما في الكودين
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
 * 🚀 الدالة الرئيسية المُصدَّرة - معالجة ربط التليجرام - HYBRID VERSION
 */
export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - HYBRID FINAL VERSION...');
    
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
 * 📋 جمع بيانات النموذج للتليجرام - ENHANCED VERSION للتطابق الكامل
 */
async function collectFormDataForTelegram() {
    console.log('📋 🔥 ENHANCED: جمع بيانات النموذج مع التطابق الكامل...');
    
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    const paymentDetails = getActivePaymentDetails();
    
    // 🔥 التطابق الكامل مع ما يتوقعه الخادم في app.py
    const formData = {
        platform: platform,
        whatsapp_number: whatsapp,        // ✅ يطابق data.get('whatsapp_number')
        payment_method: paymentMethod,    // ✅ يطابق data.get('payment_method')  
        payment_details: paymentDetails,  // ✅ يطابق data.get('payment_details')
        telegram_username: ''             // ✅ إضافة إضافية للتوافق
    };
    
    // 🔍 تشخيص مفصل للبيانات المرسلة
    console.log('📋 🔥 CRITICAL - البيانات المرسلة للخادم:', {
        platform: formData.platform || 'MISSING ❌',
        whatsapp_number: formData.whatsapp_number ? 
            formData.whatsapp_number.substring(0, 5) + '***' : 'MISSING ❌',
        payment_method: formData.payment_method || 'MISSING ❌',
        payment_details: formData.payment_details || 'MISSING ❌',
        telegram_username: formData.telegram_username || 'EMPTY (OK)',
        dataIntegrity: 'CHECKING...'
    });
    
    // 🚨 تحقق نهائي قبل الإرسال - منع إرسال بيانات ناقصة
    const validationErrors = [];
    
    if (!formData.platform) {
        validationErrors.push('Platform is missing');
    }
    if (!formData.whatsapp_number) {
        validationErrors.push('WhatsApp number is missing');
    }
    if (!formData.payment_method) {
        validationErrors.push('Payment method is missing');
    }
    if (!formData.payment_details) {
        validationErrors.push('Payment details are missing');
    }
    
    if (validationErrors.length > 0) {
        console.error('🚨 CRITICAL VALIDATION ERRORS:', validationErrors);
        throw new Error('بيانات مفقودة: ' + validationErrors.join(', '));
    }
    
    console.log('✅ All form data validation passed - ready to send');
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
 * 🌐 إرسال طلب ربط التليجرام للخادم - ULTRA ENHANCED VERSION
 */
async function sendTelegramLinkRequest(formData) {
    console.log('🌐 🔥 ENHANCED VERSION: إرسال طلب إلى /generate-telegram-code...');
    console.log('📤 🔥 EXACT DATA BEING SENT:', JSON.stringify(formData, null, 2));
    
    try {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem(),
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        };
        
        console.log('🔗 Request details:', {
            url: '/generate-telegram-code',
            method: requestOptions.method,
            headers: requestOptions.headers,
            bodySize: requestOptions.body.length + ' chars'
        });
        
        const response = await fetch('/generate-telegram-code', requestOptions);
        
        console.log('📡 🔥 RAW HTTP RESPONSE:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url,
            redirected: response.redirected
        });
        
        // 🔍 قراءة النص الخام أولاً للتشخيص الكامل
        const responseText = await response.text();
        console.log('📄 🔥 RAW RESPONSE TEXT:', responseText);
        console.log('📄 Response length:', responseText.length + ' chars');
        
        if (!response.ok) {
            console.error('❌ 🔥 HTTP ERROR DETAILS:', {
                status: response.status,
                statusText: response.statusText,
                responseText: responseText,
                url: response.url
            });
            throw new Error(`خطأ HTTP ${response.status}: ${responseText || response.statusText}`);
        }
        
        // 🔄 تحويل النص إلى JSON مع معالجة أخطاء متقدمة
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ 🔥 JSON PARSE ERROR:', {
                error: parseError.message,
                responseText: responseText,
                responseType: typeof responseText,
                isEmptyResponse: responseText.length === 0
            });
            throw new Error('استجابة الخادم ليست JSON صالح: ' + parseError.message);
        }
        
        // 🔍 تحليل شامل للاستجابة - دعم كلا الاسمين
        console.log('📦 🔥 PARSED JSON RESPONSE:', {
            success: result.success,
            hasMessage: !!result.message,
            message: result.message,
            // دعم كلا الاسمين: telegram_code (القديم) و code (الجديد)
            hasCode: !!(result.telegram_code || result.code),
            codeType: typeof (result.telegram_code || result.code),
            codeValue: result.telegram_code || result.code,
            codeLength: (result.telegram_code || result.code) ? (result.telegram_code || result.code).length : 0,
            hasWebUrl: !!result.telegram_web_url,
            webUrl: result.telegram_web_url,
            hasAppUrl: !!result.telegram_app_url,
            appUrl: result.telegram_app_url,
            hasBotUsername: !!result.bot_username,
            botUsername: result.bot_username,
            allKeys: Object.keys(result),
            fullResponse: result
        });
        
        // 🚨 فحص حاسم للكود قبل الإرجاع - دعم كلا الاسمين
        const telegramCode = result.telegram_code || result.code;
        if (result.success && (!telegramCode || telegramCode === 'undefined' || telegramCode === null)) {
            console.error('🚨 🔥 CRITICAL SERVER BUG: Success=true but code is invalid!');
            console.error('🚨 code value:', telegramCode);
            console.error('🚨 code type:', typeof telegramCode);
            console.error('🚨 Full server response:', JSON.stringify(result, null, 2));
            
            throw new Error('خطأ في الخادم: لم يتم إنشاء كود التليجرام صحيح (received: ' + telegramCode + ')');
        }
        
        // توحيد الاستجابة للتوافق مع الكود القديم
        if (!result.telegram_code && result.code) {
            result.telegram_code = result.code;
        }
        
        if (result.success && result.telegram_code) {
            console.log('✅ 🔥 SUCCESS: Valid code received:', result.telegram_code.substring(0, 15) + '...');
        }
        
        return result;
        
    } catch (networkError) {
        console.error('🌐 🔥 NETWORK/FETCH ERROR:', {
            name: networkError.name,
            message: networkError.message,
            stack: networkError.stack,
            cause: networkError.cause
        });
        throw new Error('خطأ في الاتصال بالخادم: ' + networkError.message);
    }
}

/**
 * 📱 فتح التليجرام بالطريقة الذكية - ENHANCED للـ auto-start
 */
async function openTelegramSmartly(data) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 كشف نوع الجهاز:', { isMobile, isIOS, isAndroid });
    
    // 🔥 إنشاء روابط محسّنة للتفعيل التلقائي
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    const telegramCode = data.telegram_code;
    
    // روابط محسّنة مع deep linking صحيح
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${telegramCode}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${telegramCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${telegramCode}`;
    
    console.log('🔗 الروابط المحسّنة:', {
        web: enhancedWebUrl,
        app: enhancedAppUrl,
        universal: universalUrl
    });
    
    if (isMobile) {
        // 🚀 للهواتف: استراتيجية Triple-Try المحسّنة
        console.log('📱 تطبيق استراتيجية Triple-Try للهواتف...');
        
        // المحاولة الأولى: التطبيق المباشر
        if (isIOS) {
            // iOS - استخدام الرابط المحسن مع fallback
            console.log('🍎 iOS: محاولة فتح التطبيق مباشرة');
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            // Android - Intent URL محسن للتفعيل التلقائي
            console.log('🤖 Android: محاولة Intent URL محسن');
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${telegramCode}#Intent;package=org.telegram.messenger;scheme=tg;launchFlags=0x10000000;end`;
            window.location.href = intentUrl;
        }
        
        // المحاولة الثانية: Universal Link بعد ثانية
        setTimeout(() => {
            console.log('🌍 المحاولة الثانية: Universal Link');
            const newWindow = window.open(universalUrl, '_blank');
            if (!newWindow) {
                // إذا فشل popup، استخدام التوجيه المباشر
                window.location.href = universalUrl;
            }
        }, 1000);
        
        // المحاولة الثالثة: Web Telegram بعد 3 ثوان
        setTimeout(() => {
            console.log('🌐 المحاولة الثالثة: Web Telegram');
            const webWindow = window.open(enhancedWebUrl, '_blank');
            if (!webWindow) {
                // إذا فشل popup، استخدام التوجيه المباشر
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
    
    // إيقاف المراقبة بعد دقيقة ونصف (زمن أطول)
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
 * 🔧 دالة التهيئة للوحدة (يتم استدعاؤها من الملف الرئيسي) - FINAL
 */
export function initializeTelegramModule() {
    console.log('🤖 تم تهيئة وحدة التليجرام المستقلة - HYBRID FINAL VERSION');
    
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
    
    console.log('🔧 تم إعداد وحدة التليجرام بالكامل - النسخة الهجينة النهائية');
}

// 📝 تسجيل تحميل الوحدة - FINAL VERSION
console.log('📦 Telegram Integration Module v2.4.0 - HYBRID FINAL - تم التحميل بنجاح');
console.log('🔒 الوحدة معزولة تماماً وتجمع أفضل ما في الكودين');
console.log('✅ التشغيل التلقائي: من الكود القديم (openTelegramSmartly)');
console.log('✅ حفظ البيانات: من الكود الجديد (collectFormData + sendRequest)');
console.log('🎯 جاهز للاستخدام بدون مشاكل!');
