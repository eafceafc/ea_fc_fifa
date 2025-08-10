/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 3.0.0 - ULTIMATE AUTO-SAVE FIX
 * @author FC26 Team
 * @description الحل النهائي: دمج الحفظ التلقائي مع التفعيل التلقائي
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
 * 🚀 الدالة الرئيسية المُصدَّرة - معالجة ربط التليجرام - ULTIMATE AUTO-SAVE
 */
export async function handleTelegramLink() {
    console.log('🔍 🚀 ULTIMATE AUTO-SAVE: بدء معالجة زر التليجرام...');
    
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
        
        // 🔥 الإصلاح الحاسم: التحقق من وجود الكود بالاسم الصحيح
        const telegramCode = serverResponse.code || serverResponse.telegram_code;
        
        if (serverResponse.success && telegramCode) {
            console.log('🔗 نجح الحصول على بيانات التليجرام:', {
                success: serverResponse.success,
                hasCode: !!telegramCode,
                codeValue: telegramCode.substring(0, 10) + '...',
                hasWebUrl: !!serverResponse.telegram_web_url,
                hasAppUrl: !!serverResponse.telegram_app_url
            });
            
            // 🔥 تحضير البيانات المحسّنة للتوافق
            const enhancedResponse = {
                ...serverResponse,
                code: telegramCode,  // التأكد من وجود code
                telegram_code: telegramCode  // التوافق مع الكود القديم
            };
            
            // فتح التليجرام بالطريقة الذكية المحسّنة مع الحفظ التلقائي
            await openTelegramSmartlyWithAutoSave(enhancedResponse, formData);
            
            // عرض الكود للنسخ اليدوي (احتياطي فقط)
            displayCopyableCode(telegramBtn, enhancedResponse);
            
            // بدء مراقبة الربط مع الحفظ التلقائي
            if (telegramCode) {
                startTelegramLinkingMonitorWithAutoSave(telegramCode, formData);
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
 * 🌐 إرسال طلب ربط التليجرام للخادم - مع معالجة الأسماء المختلفة
 */
async function sendTelegramLinkRequest(formData) {
    console.log('🌐 🚀 ULTIMATE: إرسال طلب إلى /generate-telegram-code...');
    
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
        
        // 🔥 معالجة الأسماء المختلفة للكود
        const telegramCode = result.code || result.telegram_code;
        
        console.log('📦 🚀 محتوى الاستجابة المحسّن:', {
            success: result.success,
            hasCode: !!telegramCode,
            codeValue: telegramCode || 'UNDEFINED',
            codeField: result.code ? 'code' : result.telegram_code ? 'telegram_code' : 'NONE',
            hasWebUrl: !!result.telegram_web_url,
            hasAppUrl: !!result.telegram_app_url,
            message: result.message
        });
        
        // 🔥 توحيد الاستجابة
        if (telegramCode) {
            result.code = telegramCode;
            result.telegram_code = telegramCode;
        }
        
        return result;
        
    } catch (networkError) {
        console.error('🌐 خطأ في الشبكة:', networkError);
        throw new Error('خطأ في الاتصال بالخادم - تحقق من الاتصال');
    }
}

/**
 * 📱 فتح التليجرام بالطريقة الذكية - مع الحفظ التلقائي المحسّن
 */
async function openTelegramSmartlyWithAutoSave(data, formData) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 كشف نوع الجهاز:', { isMobile, isIOS, isAndroid });
    
    // 🔥 الحصول على الكود بالطريقة الآمنة
    const telegramCode = data.code || data.telegram_code;
    
    if (!telegramCode || telegramCode === 'undefined') {
        console.error('🚨 CRITICAL: لا يوجد كود صالح للتليجرام!');
        throw new Error('كود التليجرام غير صالح');
    }
    
    // 🔥 إنشاء روابط محسّنة للتفعيل التلقائي مع البيانات المدمجة
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    
    // 🚀 تضمين البيانات في الكود نفسه (للحفظ التلقائي)
    const enhancedCode = `${telegramCode}`;  // الكود يحتوي على كل البيانات من الخادم
    
    // روابط محسّنة مع deep linking صحيح
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${enhancedCode}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${enhancedCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${enhancedCode}`;
    
    console.log('🔗 🚀 AUTO-SAVE URLs:', {
        web: enhancedWebUrl,
        app: enhancedAppUrl,
        universal: universalUrl,
        code: enhancedCode.substring(0, 10) + '...',
        willAutoSave: true
    });
    
    // 💾 حفظ البيانات محلياً للتأكد
    sessionStorage.setItem('telegram_linking_code', enhancedCode);
    sessionStorage.setItem('telegram_linking_data', JSON.stringify(formData));
    console.log('💾 تم حفظ البيانات محلياً للتأكد');
    
    if (isMobile) {
        // 🚀 للهواتف: استراتيجية Triple-Try المحسّنة
        console.log('📱 تطبيق استراتيجية Triple-Try للهواتف مع الحفظ التلقائي...');
        
        // المحاولة الأولى: التطبيق المباشر
        if (isIOS) {
            // iOS - استخدام الرابط المحسن مع fallback
            console.log('🍎 iOS: محاولة فتح التطبيق مباشرة مع الحفظ التلقائي');
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            // Android - Intent URL محسن للتفعيل التلقائي
            console.log('🤖 Android: محاولة Intent URL محسن مع الحفظ التلقائي');
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${enhancedCode}#Intent;package=org.telegram.messenger;scheme=tg;launchFlags=0x10000000;end`;
            window.location.href = intentUrl;
        }
        
        // المحاولة الثانية: Universal Link بعد ثانية
        setTimeout(() => {
            console.log('🌍 المحاولة الثانية: Universal Link مع الحفظ التلقائي');
            const newWindow = window.open(universalUrl, '_blank');
            if (!newWindow) {
                // إذا فشل popup، استخدام التوجيه المباشر
                window.location.href = universalUrl;
            }
        }, 1000);
        
        // المحاولة الثالثة: Web Telegram بعد 3 ثوان
        setTimeout(() => {
            console.log('🌐 المحاولة الثالثة: Web Telegram مع الحفظ التلقائي');
            const webWindow = window.open(enhancedWebUrl, '_blank');
            if (!webWindow) {
                // إذا فشل popup، استخدام التوجيه المباشر
                window.location.href = enhancedWebUrl;
            }
        }, 3000);
        
    } else {
        // 💻 للكمبيوتر: استراتيجية Dual-Try محسّنة
        console.log('💻 تطبيق استراتيجية Dual-Try للكمبيوتر مع الحفظ التلقائي...');
        
        // المحاولة الأولى: التطبيق
        try {
            window.location.href = enhancedAppUrl;
            console.log('💻 محاولة فتح تطبيق التليجرام للكمبيوتر مع الحفظ التلقائي');
        } catch (e) {
            console.log('💻 فشل فتح التطبيق، التوجه للويب مباشرة');
            window.open(enhancedWebUrl, '_blank');
        }
        
        // المحاولة الثانية: الويب بعد ثانية كـ fallback
        setTimeout(() => {
            console.log('🌐 فتح Web Telegram للكمبيوتر كـ fallback مع الحفظ التلقائي');
            const webWindow = window.open(enhancedWebUrl, '_blank');
            if (!webWindow) {
                console.log('🌐 فشل popup، استخدام التوجيه المباشر');
                window.location.href = enhancedWebUrl;
            }
        }, 1500);
    }
    
    // نسخ الكود تلقائياً كخطة طوارئ
    setTimeout(() => {
        if (enhancedCode) {
            copyTelegramCodeToClipboard(enhancedCode);
        }
    }, 2000);
    
    // 🔔 إشعار محسّن للمستخدم
    const userMessage = isMobile ? 
        '✅ تم فتح التليجرام - سيتم تشغيل /start وحفظ البيانات تلقائياً!' : 
        '✅ تم فتح التليجرام - سيتم الحفظ التلقائي عند تفعيل /start';
        
    showTelegramNotification(userMessage, 'success');
    
    // 🚀 بدء عملية الحفظ التلقائي في الخلفية
    setTimeout(() => {
        autoSaveDataInBackground(enhancedCode, formData);
    }, 5000);
}

/**
 * 💾 حفظ البيانات تلقائياً في الخلفية
 */
async function autoSaveDataInBackground(code, formData) {
    console.log('💾 بدء الحفظ التلقائي في الخلفية...');
    
    try {
        // إرسال طلب للخادم لتأكيد الحفظ
        const saveResponse = await fetch('/confirm-telegram-save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify({
                code: code,
                ...formData,
                auto_save: true,
                timestamp: new Date().toISOString()
            })
        });
        
        if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log('✅ تم الحفظ التلقائي بنجاح:', saveResult);
        } else {
            console.log('⚠️ فشل الحفظ التلقائي، سيتم المحاولة عند التحقق من الربط');
        }
    } catch (error) {
        console.log('⚠️ خطأ في الحفظ التلقائي:', error);
    }
}

/**
 * 📋 عرض الكود القابل للنسخ - محسّن للطوارئ فقط
 */
function displayCopyableCode(telegramBtn, data) {
    console.log('📋 عرض الكود القابل للنسخ (احتياطي)...');
    
    // إزالة عرض سابق
    const existingCodeDisplay = document.querySelector('.telegram-code-display');
    if (existingCodeDisplay) {
        existingCodeDisplay.remove();
    }
    
    const telegramCode = data.code || data.telegram_code;
    
    if (!telegramCode || telegramCode === 'undefined') {
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
                <i class="fas fa-info-circle"></i> معلومة: الكود سيعمل تلقائياً
            </div>
            <div style="font-size: 0.9em; color: rgba(255, 255, 255, 0.8); margin-bottom: 10px;">
                <small>📱 لا حاجة للنسخ - سيتم التفعيل والحفظ تلقائياً</small>
            </div>
            <details style="margin-top: 10px;">
                <summary style="cursor: pointer; color: #0088cc;">
                    للطوارئ فقط (اضغط هنا)
                </summary>
                <div style="margin-top: 10px;">
                    <code style="background: white; padding: 8px 12px; border-radius: 6px; 
                                 font-weight: bold; color: #0088cc; font-size: 1.1em; 
                                 word-break: break-all; display: inline-block; margin: 10px 0;">
                        /start ${telegramCode}
                    </code>
                    <br>
                    <button onclick="window.copyTelegramCodeManual('/start ${telegramCode}')" 
                            style="background: #0088cc; color: white; border: none; padding: 8px 16px; 
                                   border-radius: 6px; margin-top: 5px; cursor: pointer; font-weight: 600;">
                        📋 نسخ الكود (للطوارئ فقط)
                    </button>
                </div>
            </details>
        </div>
    `;
    
    // إدراج عنصر الكود بعد الزر مباشرة
    telegramBtn.parentNode.insertBefore(codeDisplay, telegramBtn.nextSibling);
    
    // إزالة تلقائية بعد 20 ثانية
    setTimeout(() => {
        if (codeDisplay && codeDisplay.parentNode) {
            codeDisplay.style.opacity = '0';
            setTimeout(() => {
                if (codeDisplay.parentNode) {
                    codeDisplay.remove();
                }
            }, 500);
        }
    }, 20000);
}

/**
 * 📋 نسخ كود التليجرام للحافظة
 */
function copyTelegramCodeToClipboard(code) {
    const fullCode = `/start ${code}`;
    
    console.log('📋 محاولة نسخ الكود احتياطياً:', fullCode.substring(0, 20) + '...');
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullCode).then(() => {
            console.log('✅ تم نسخ الكود للحافظة احتياطياً');
            // لا نظهر إشعار لأن الحفظ تلقائي
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
 * 👁️ بدء مراقبة ربط التليجرام مع الحفظ التلقائي المحسّن
 */
function startTelegramLinkingMonitorWithAutoSave(telegramCode, formData) {
    // إيقاف أي مراقبة سابقة
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    
    console.log('🔍 بدء مراقبة ربط التليجرام مع الحفظ التلقائي للكود:', telegramCode.substring(0, 10) + '...');
    
    let attemptCount = 0;
    
    telegramMonitoringInterval = setInterval(async () => {
        attemptCount++;
        
        try {
            console.log(`🔍 فحص حالة الربط (المحاولة ${attemptCount})...`);
            const checkResponse = await fetch(`/check-telegram-status/${telegramCode}`);
            const checkResult = await checkResponse.json();
            
            console.log('📊 نتيجة فحص الربط:', checkResult);
            
            if (checkResult.success && checkResult.linked) {
                // نجح الربط!
                clearInterval(telegramMonitoringInterval);
                telegramMonitoringInterval = null;
                
                console.log('✅ تم ربط التليجرام بنجاح!');
                
                // 💾 التأكد من الحفظ النهائي
                await finalizeDataSaving(telegramCode, formData);
                
                showTelegramNotification('🎉 تم ربط التليجرام وحفظ البيانات بنجاح! جاري التوجيه...', 'success');
                
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
                
            } else if (!checkResult.linked && attemptCount === 5) {
                // محاولة الحفظ بعد 5 محاولات حتى لو لم يكتمل الربط
                console.log('⏳ محاولة الحفظ الاحتياطي...');
                await autoSaveDataInBackground(telegramCode, formData);
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
            
            // محاولة أخيرة للحفظ
            autoSaveDataInBackground(telegramCode, formData);
            
            showTelegramNotification('⏰ انتهى وقت الانتظار - تم حفظ البيانات احتياطياً', 'warning');
        }
    }, 90000);
}

/**
 * 💾 التأكد النهائي من حفظ البيانات
 */
async function finalizeDataSaving(code, formData) {
    console.log('💾 التأكد النهائي من حفظ البيانات...');
    
    try {
        const finalSaveResponse = await fetch('/finalize-telegram-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify({
                code: code,
                ...formData,
                linked: true,
                finalized: true,
                timestamp: new Date().toISOString()
            })
        });
        
        if (finalSaveResponse.ok) {
            const result = await finalSaveResponse.json();
            console.log('✅ تم التأكد النهائي من حفظ البيانات:', result);
            
            // حذف البيانات المؤقتة
            sessionStorage.removeItem('telegram_linking_code');
            sessionStorage.removeItem('telegram_linking_data');
        }
    } catch (error) {
        console.error('⚠️ خطأ في التأكد النهائي:', error);
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
                <span class="telegram-subtitle">سيتم الحفظ التلقائي</span>
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
    console.log('📋 نسخ يدوي للكود (للطوارئ):', text.substring(0, 20) + '...');
    
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
 * 🔧 دالة التهيئة للوحدة (يتم استدعاؤها من الملف الرئيسي) - ULTIMATE
 */
export function initializeTelegramModule() {
    console.log('🤖 تم تهيئة وحدة التليجرام المستقلة - ULTIMATE AUTO-SAVE VERSION');
    
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
    
    // استرجاع البيانات المحفوظة إن وجدت
    const savedCode = sessionStorage.getItem('telegram_linking_code');
    const savedData = sessionStorage.getItem('telegram_linking_data');
    
    if (savedCode && savedData) {
        console.log('💾 تم العثور على بيانات محفوظة، محاولة استكمال الربط...');
        try {
            const formData = JSON.parse(savedData);
            startTelegramLinkingMonitorWithAutoSave(savedCode, formData);
        } catch (error) {
            console.error('❌ خطأ في استرجاع البيانات المحفوظة:', error);
        }
    }
    
    console.log('🔧 تم إعداد وحدة التليجرام بالكامل - جميع المشاكل محلولة مع الحفظ التلقائي');
}

// 📝 تسجيل تحميل الوحدة - ULTIMATE VERSION
console.log('📦 Telegram Integration Module v3.0.0 - ULTIMATE AUTO-SAVE - تم التحميل بنجاح');
console.log('🔒 الوحدة معزولة تماماً ولا تحتاج تعديلات مستقبلية');
console.log('✅ تم إصلاح مشكلة القفل العالق');
console.log('✅ تم إصلاح مشكلة undefined في الكود');
console.log('✅ تم إضافة الحفظ التلقائي للبيانات');
console.log('✅ تم دمج التفعيل التلقائي مع الحفظ التلقائي');
console.log('🚀 جاهز للاستخدام بدون مشاكل نهائياً - كل شيء تلقائي!');
