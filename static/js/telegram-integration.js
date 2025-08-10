/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 2.3.0 - UNDEFINED BUG FIXED
 * @author FC26 Team
 * @description إصلاح مشكلة undefined في رابط التليجرام
 */

// 🔒 متغيرات خاصة بالوحدة (Private Variables)
let isProcessingTelegram = false;
let telegramProcessTimeout = null;
let telegramMonitoringInterval = null;

/**
 * 🌐 إرسال طلب ربط التليجرام للخادم - ENHANCED مع validation
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
        
        // 🔍 CRITICAL: التحقق المفصل من البيانات المستلمة
        console.log('📦 محتوى الاستجابة الكامل:', JSON.stringify(result, null, 2));
        
        // ✅ التحقق من وجود الكود المطلوب
        if (!result.telegram_code || result.telegram_code === null || result.telegram_code === 'undefined') {
            console.error('❌ CRITICAL: telegram_code مفقود أو غير صحيح:', result.telegram_code);
            throw new Error('فشل في الحصول على كود التليجرام من الخادم');
        }
        
        // ✅ التحقق من صحة نوع البيانات
        if (typeof result.telegram_code !== 'string') {
            console.error('❌ CRITICAL: telegram_code ليس نص:', typeof result.telegram_code, result.telegram_code);
            throw new Error('كود التليجرام المستلم غير صحيح');
        }
        
        // ✅ التحقق من طول الكود
        if (result.telegram_code.length < 5) {
            console.error('❌ CRITICAL: telegram_code قصير جداً:', result.telegram_code.length);
            throw new Error('كود التليجرام قصير جداً - خطأ في الخادم');
        }
        
        console.log('✅ telegram_code صحيح:', {
            type: typeof result.telegram_code,
            length: result.telegram_code.length,
            preview: result.telegram_code.substring(0, 10) + '...'
        });
        
        return result;
        
    } catch (networkError) {
        console.error('🌐 خطأ في الشبكة:', networkError);
        throw new Error('خطأ في الاتصال بالخادم - تحقق من الاتصال');
    }
}

/**
 * 📱 فتح التليجرام بالطريقة الذكية - FIXED للـ undefined bug
 */
async function openTelegramSmartly(data) {
    console.log('📱 بدء openTelegramSmartly مع البيانات:', {
        hasData: !!data,
        hasTelegramCode: !!data?.telegram_code,
        telegramCodeType: typeof data?.telegram_code,
        telegramCodeValue: data?.telegram_code?.substring(0, 10) + '...' || 'UNDEFINED'
    });
    
    // 🛡️ CRITICAL VALIDATION: التحقق الصارم من الكود
    if (!data || !data.telegram_code) {
        console.error('❌ CRITICAL: البيانات أو الكود مفقود:', { data, telegram_code: data?.telegram_code });
        throw new Error('كود التليجرام مفقود - لا يمكن فتح البوت');
    }
    
    if (typeof data.telegram_code !== 'string') {
        console.error('❌ CRITICAL: نوع الكود غير صحيح:', typeof data.telegram_code);
        throw new Error('كود التليجرام غير صحيح - نوع البيانات خطأ');
    }
    
    if (data.telegram_code === 'undefined' || data.telegram_code === 'null') {
        console.error('❌ CRITICAL: الكود يحتوي على نص undefined:', data.telegram_code);
        throw new Error('كود التليجرام يحتوي على قيمة undefined');
    }
    
    if (data.telegram_code.length < 5) {
        console.error('❌ CRITICAL: الكود قصير جداً:', data.telegram_code.length);
        throw new Error('كود التليجرام قصير جداً');
    }
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    console.log('📱 كشف نوع الجهاز:', { isMobile, isIOS, isAndroid });
    
    // 🔥 إنشاء روابط محسّنة مع VALIDATION
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    const telegramCode = data.telegram_code; // الآن متأكدين أنه صحيح
    
    // 🔍 تسجيل مفصل للكود المستخدم
    console.log('🔑 الكود المستخدم في الروابط:', {
        originalCode: telegramCode,
        codeLength: telegramCode.length,
        codeType: typeof telegramCode,
        firstChars: telegramCode.substring(0, 5),
        lastChars: telegramCode.substring(-5)
    });
    
    // روابط محسّنة مع deep linking صحيح
    const enhancedWebUrl = `https://t.me/${botUsername}?start=${telegramCode}`;
    const enhancedAppUrl = `tg://resolve?domain=${botUsername}&start=${telegramCode}`;
    const universalUrl = `https://telegram.me/${botUsername}?start=${telegramCode}`;
    
    console.log('🔗 الروابط المحسّنة النهائية:', {
        web: enhancedWebUrl,
        app: enhancedAppUrl,
        universal: universalUrl
    });
    
    // 🧪 اختبار الروابط قبل الاستخدام
    if (enhancedAppUrl.includes('undefined')) {
        console.error('❌ FATAL: الرابط يحتوي على undefined:', enhancedAppUrl);
        throw new Error('خطأ في بناء رابط التليجرام - يحتوي على undefined');
    }
    
    if (isMobile) {
        // 🚀 للهواتف: استراتيجية Triple-Try المحسّنة
        console.log('📱 تطبيق استراتيجية Triple-Try للهواتف...');
        
        // المحاولة الأولى: التطبيق المباشر
        if (isIOS) {
            console.log('🍎 iOS: فتح التطبيق مع الكود:', telegramCode.substring(0, 10) + '...');
            window.location.href = enhancedAppUrl;
        } else if (isAndroid) {
            console.log('🤖 Android: فتح Intent URL مع الكود:', telegramCode.substring(0, 10) + '...');
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
        // 💻 للكمبيوتر: استراتيجية Dual-Try محسّنة
        console.log('💻 تطبيق استراتيجية Dual-Try للكمبيوتر...');
        
        // المحاولة الأولى: التطبيق
        try {
            console.log('💻 فتح تطبيق التليجرام للكمبيوتر مع الكود:', telegramCode.substring(0, 10) + '...');
            window.location.href = enhancedAppUrl;
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
        copyTelegramCodeToClipboard(telegramCode);
    }, 2000);
    
    // 🔔 إشعار محسّن للمستخدم
    const userMessage = isMobile ? 
        'تم فتح التليجرام - سيتم تشغيل /start تلقائياً!' : 
        'تم فتح التليجرام - إذا لم يعمل تلقائياً، اضغط START في البوت';
        
    showTelegramNotification(userMessage, 'success');
}

/**
 * 🚀 الدالة الرئيسية المُصدَّرة - معالجة ربط التليجرام - UNDEFINED BUG FIXED
 */
export async function handleTelegramLink() {
    console.log('🔍 بدء معالجة زر التليجرام - UNDEFINED BUG FIXED VERSION...');
    
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
        
        // إرسال الطلب للخادم مع validation محسّن
        console.log('🌐 إرسال طلب للخادم...');
        const serverResponse = await sendTelegramLinkRequest(formData);
        
        // 🛡️ DOUBLE CHECK: التحقق النهائي من الاستجابة
        if (!serverResponse.success) {
            throw new Error(serverResponse.message || 'فشل في الحصول على استجابة ناجحة من الخادم');
        }
        
        if (!serverResponse.telegram_code) {
            throw new Error('لم يتم الحصول على كود التليجرام من الخادم');
        }
        
        console.log('🔗 نجح الحصول على بيانات التليجرام:', {
            success: serverResponse.success,
            hasWebUrl: !!serverResponse.telegram_web_url,
            hasAppUrl: !!serverResponse.telegram_app_url,
            hasCode: !!serverResponse.telegram_code,
            codePreview: serverResponse.telegram_code.substring(0, 10) + '...'
        });
        
        // فتح التليجرام بالطريقة الذكية المحسّنة (مع حماية من undefined)
        await openTelegramSmartly(serverResponse);
        
        // عرض الكود للنسخ اليدوي
        displayCopyableCode(telegramBtn, serverResponse);
        
        // بدء مراقبة الربط
        startTelegramLinkingMonitor(serverResponse.telegram_code);
        
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
    }
}

// باقي الدوال تبقى كما هي...
// (copyTelegramCodeToClipboard, displayCopyableCode, etc.)

// 📝 تسجيل تحميل الوحدة - UNDEFINED BUG FIXED VERSION
console.log('📦 Telegram Integration Module v2.3.0 - UNDEFINED BUG FIXED - تم التحميل بنجاح');
console.log('🔒 تم إصلاح مشكلة undefined في رابط التليجرام');
console.log('✅ تم إضافة validation صارم لمنع undefined');
console.log('🎯 جاهز للاستخدام بدون مشاكل undefined!');
