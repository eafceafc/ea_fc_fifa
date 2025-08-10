/**
 * 🤖 Telegram Integration Module - FC 26 Profile Setup
 * نظام ربط التليجرام المعزول والمستقل
 * 
 * @version 3.0.0 - PRODUCTION READY
 * @author FC26 Team
 * @description النسخة النهائية المحسنة مع التفعيل التلقائي والحفظ المضمون
 */

// 🔒 متغيرات خاصة بالوحدة
let isProcessingTelegram = false;
let telegramMonitoringInterval = null;
let autoSaveInterval = null;
let profileData = null;

/**
 * 🔗 الحصول على حالات التحقق من النظام
 */
async function getValidationStatesFromMainSystem() {
    console.log('🔍 Starting validation check...');
    
    // Check for global validation states
    if (typeof window.validationStates !== 'undefined') {
        return window.validationStates;
    }
    
    // Manual validation
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const phoneInfo = document.querySelector('.phone-info.success-info');
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    
    let hasValidPaymentDetails = false;
    
    if (paymentMethod) {
        // Check mobile wallet
        const mobileField = document.getElementById('mobile-number');
        if (mobileField && mobileField.closest('.dynamic-input').style.display !== 'none') {
            hasValidPaymentDetails = /^01[0125][0-9]{8}$/.test(mobileField.value.trim());
        }
        
        // Check card
        const cardField = document.getElementById('card-number');
        if (cardField && cardField.closest('.dynamic-input').style.display !== 'none') {
            const cardValue = cardField.value.replace(/[-\s]/g, '');
            hasValidPaymentDetails = /^\d{16}$/.test(cardValue);
        }
        
        // Check payment link
        const linkField = document.getElementById('payment-link');
        if (linkField && linkField.closest('.dynamic-input').style.display !== 'none') {
            const linkValue = linkField.value.trim();
            hasValidPaymentDetails = linkValue.includes('instapay') || linkValue.includes('ipn.eg');
        }
    }
    
    return {
        platform: !!platform,
        whatsapp: !!(whatsapp && phoneInfo),
        paymentMethod: !!(paymentMethod && hasValidPaymentDetails)
    };
}

/**
 * 🚀 الدالة الرئيسية - معالجة ربط التليجرام
 */
export async function handleTelegramLink() {
    console.log('🔍 Starting Telegram link process...');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (!telegramBtn) {
        console.error('❌ Telegram button not found');
        return;
    }
    
    // Prevent duplicate processing
    if (isProcessingTelegram) {
        console.log('⏳ Already processing...');
        showTelegramNotification('⏳ جاري المعالجة، يرجى الانتظار...', 'warning');
        return;
    }
    
    isProcessingTelegram = true;
    
    try {
        // Validate data
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
        
        console.log('✅ All data validated successfully');
        
        // Update button to loading state
        updateTelegramButtonToLoading(telegramBtn);
        
        // Collect form data
        const formData = await collectFormDataForTelegram();
        profileData = formData; // Store for auto-save
        
        // Send to server
        const serverResponse = await sendTelegramLinkRequest(formData);
        
        // 🔥 FIX: Handle both 'code' and 'telegram_code' field names
        const telegramCode = serverResponse.code || serverResponse.telegram_code;
        
        if (serverResponse.success && telegramCode) {
            console.log('✅ Got Telegram code:', telegramCode.substring(0, 10) + '...');
            
            // Prepare enhanced response object
            const enhancedResponse = {
                ...serverResponse,
                telegram_code: telegramCode, // Ensure telegram_code exists
                bot_username: serverResponse.bot_username || 'ea_fc_fifa_bot'
            };
            
            // Open Telegram with auto-start
            await openTelegramWithAutoStart(enhancedResponse);
            
            // Start auto-save monitoring
            startAutoSaveMonitoring(telegramCode, formData);
            
            // Display copyable code
            displayCopyableCode(telegramBtn, enhancedResponse);
            
            // Update button to success
            updateTelegramButtonToSuccess(telegramBtn);
            
        } else {
            throw new Error(serverResponse.message || 'خطأ في الخادم');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        handleTelegramError(telegramBtn, error.message);
        
    } finally {
        // Release lock after delay
        if (!telegramBtn.classList.contains('error')) {
            setTimeout(() => {
                isProcessingTelegram = false;
            }, 2000);
        }
    }
}

/**
 * 📱 فتح التليجرام مع التفعيل التلقائي
 */
async function openTelegramWithAutoStart(data) {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    const botUsername = data.bot_username || 'ea_fc_fifa_bot';
    const telegramCode = data.telegram_code;
    
    // 🔥 Properly encoded URLs for auto-start
    const encodedCode = encodeURIComponent(telegramCode);
    const webUrl = `https://t.me/${botUsername}?start=${encodedCode}`;
    const appUrl = `tg://resolve?domain=${botUsername}&start=${encodedCode}`;
    
    console.log('🔗 Opening Telegram with:', {
        webUrl,
        appUrl,
        code: telegramCode
    });
    
    if (isMobile) {
        // Mobile strategy
        if (isIOS) {
            // iOS - Try app first, then web
            window.location.href = appUrl;
            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 1500);
        } else if (isAndroid) {
            // Android - Intent URL
            const intentUrl = `intent://resolve?domain=${botUsername}&start=${encodedCode}#Intent;package=org.telegram.messenger;scheme=tg;end`;
            window.location.href = intentUrl;
            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 1500);
        }
    } else {
        // Desktop - Open web directly
        window.open(webUrl, '_blank');
        
        // Try app as fallback
        setTimeout(() => {
            window.location.href = appUrl;
        }, 500);
    }
    
    // Auto-copy code as backup
    copyTelegramCodeToClipboard(`/start ${telegramCode}`);
    
    showTelegramNotification('تم فتح التليجرام - سيتم التفعيل تلقائياً!', 'success');
}

/**
 * 🔄 مراقبة الحفظ التلقائي
 */
function startAutoSaveMonitoring(telegramCode, formData) {
    console.log('🔄 Starting auto-save monitoring...');
    
    // Clear any existing intervals
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    
    // Save to session storage immediately
    sessionStorage.setItem('telegram_code', telegramCode);
    sessionStorage.setItem('profile_data', JSON.stringify(formData));
    
    // First save attempt after 3 seconds
    setTimeout(() => {
        autoSaveProfile(telegramCode, formData);
    }, 3000);
    
    // Regular save attempts every 10 seconds
    autoSaveInterval = setInterval(() => {
        autoSaveProfile(telegramCode, formData);
    }, 10000);
    
    // Check linking status
    telegramMonitoringInterval = setInterval(async () => {
        try {
            const response = await fetch(`/check-telegram-status/${telegramCode}`);
            const result = await response.json();
            
            if (result.success && result.linked) {
                // Success! Clear intervals and redirect
                clearInterval(autoSaveInterval);
                clearInterval(telegramMonitoringInterval);
                
                console.log('✅ Telegram linked successfully!');
                showTelegramNotification('🎉 تم ربط التليجرام بنجاح! جاري التوجيه...', 'success');
                
                // Remove code display
                const codeDisplay = document.querySelector('.telegram-code-display');
                if (codeDisplay) {
                    codeDisplay.remove();
                }
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/coins-order';
                }, 1500);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }, 3000);
    
    // Stop monitoring after 90 seconds
    setTimeout(() => {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
        if (telegramMonitoringInterval) {
            clearInterval(telegramMonitoringInterval);
            telegramMonitoringInterval = null;
        }
    }, 90000);
}

/**
 * 💾 حفظ البيانات تلقائياً
 */
async function autoSaveProfile(telegramCode, formData) {
    try {
        console.log('💾 Auto-saving profile...');
        
        const response = await fetch('/auto-save-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify({
                telegram_code: telegramCode,
                ...formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Profile auto-saved successfully');
        }
    } catch (error) {
        console.error('Auto-save error:', error);
    }
}

/**
 * 📋 جمع بيانات النموذج
 */
async function collectFormDataForTelegram() {
    const platform = document.getElementById('platform')?.value || '';
    const whatsapp = document.getElementById('whatsapp')?.value || '';
    const paymentMethod = document.getElementById('payment_method')?.value || '';
    const paymentDetails = getActivePaymentDetails();
    
    return {
        platform,
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
 * 🌐 إرسال طلب ربط التليجرام
 */
async function sendTelegramLinkRequest(formData) {
    console.log('🌐 Sending request to server...');
    
    try {
        const response = await fetch('/generate-telegram-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFTokenFromMainSystem()
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Server response:', result);
        
        return result;
        
    } catch (error) {
        console.error('Network error:', error);
        throw new Error('خطأ في الاتصال بالخادم');
    }
}

/**
 * 📋 عرض الكود القابل للنسخ
 */
function displayCopyableCode(telegramBtn, data) {
    // Remove any existing display
    const existingDisplay = document.querySelector('.telegram-code-display');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
    if (!data.telegram_code) return;
    
    const codeDisplay = document.createElement('div');
    codeDisplay.className = 'telegram-code-display';
    codeDisplay.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(0, 136, 204, 0.1), rgba(0, 85, 153, 0.15)); 
                    padding: 15px; margin: 15px 0; border-radius: 12px; text-align: center; 
                    border: 2px solid #0088cc;">
            <div style="color: #0088cc; font-weight: 700; margin-bottom: 10px;">
                <i class="fas fa-copy"></i> الكود للنسخ اليدوي:
            </div>
            <code style="background: white; padding: 8px 12px; border-radius: 6px; 
                         font-weight: bold; color: #0088cc; font-size: 1.1em;">
                /start ${data.telegram_code}
            </code>
            <div style="margin-top: 10px;">
                <button onclick="window.copyTelegramCodeManual('/start ${data.telegram_code}')" 
                        style="background: #0088cc; color: white; border: none; padding: 8px 16px; 
                               border-radius: 6px; cursor: pointer;">
                    📋 نسخ الكود
                </button>
            </div>
        </div>
    `;
    
    telegramBtn.parentNode.insertBefore(codeDisplay, telegramBtn.nextSibling);
    
    // Auto-remove after 20 seconds
    setTimeout(() => {
        if (codeDisplay.parentNode) {
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
 * 📋 نسخ الكود للحافظة
 */
function copyTelegramCodeToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('✅ Code copied to clipboard');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
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
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Copy error:', err);
    } finally {
        document.body.removeChild(textArea);
    }
}

/**
 * UI Update Functions
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
        telegramBtn.innerHTML = `
            <div class="telegram-btn-content">
                <i class="fab fa-telegram telegram-icon"></i>
                <div class="telegram-text">
                    <span class="telegram-title">📱 ربط مع التليجرام</span>
                    <span class="telegram-subtitle">احصل على كود فوري وادخل للبوت</span>
                </div>
            </div>
        `;
        telegramBtn.classList.remove('success');
        telegramBtn.disabled = false;
    }, 6000);
}

function handleIncompleteDataError(telegramBtn, message) {
    // 🔥 IMMEDIATE UNLOCK - Critical fix
    isProcessingTelegram = false;
    
    const originalContent = telegramBtn.innerHTML;
    
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-exclamation-circle telegram-icon" style="color: #ff4444;"></i>
            <div class="telegram-text">
                <span class="telegram-title">❌ بيانات غير مكتملة</span>
                <span class="telegram-subtitle">${message}</span>
            </div>
        </div>
    `;
    telegramBtn.classList.add('error');
    telegramBtn.disabled = false;
    
    showTelegramNotification(message, 'error');
    
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
    }, 3000);
}

function handleTelegramError(telegramBtn, message) {
    // 🔥 IMMEDIATE UNLOCK - Critical fix
    isProcessingTelegram = false;
    
    const originalContent = telegramBtn.innerHTML;
    
    telegramBtn.innerHTML = `
        <div class="telegram-btn-content">
            <i class="fas fa-exclamation-triangle telegram-icon" style="color: #ff9000;"></i>
            <div class="telegram-text">
                <span class="telegram-title">❌ خطأ</span>
                <span class="telegram-subtitle">${message}</span>
            </div>
        </div>
    `;
    telegramBtn.classList.add('error');
    telegramBtn.disabled = false;
    
    showTelegramNotification(message, 'error');
    
    setTimeout(() => {
        telegramBtn.innerHTML = originalContent;
        telegramBtn.classList.remove('error');
    }, 4000);
}

/**
 * 📢 إظهار الإشعارات
 */
function showTelegramNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`📢 ${type}: ${message}`);
    }
}

/**
 * 🔒 الحصول على CSRF Token
 */
function getCSRFTokenFromMainSystem() {
    if (typeof window.getCSRFToken === 'function') {
        return window.getCSRFToken();
    }
    
    const token = document.querySelector('meta[name="csrf-token"]') || 
                  document.querySelector('input[name="csrfmiddlewaretoken"]');
    return token ? (token.getAttribute('content') || token.value) : '';
}

/**
 * 🌐 Global copy function
 */
window.copyTelegramCodeManual = function(text) {
    copyTelegramCodeToClipboard(text);
    showTelegramNotification('✅ تم النسخ! الصق الكود في التليجرام', 'success');
};

/**
 * 🔧 Initialize module
 */
export function initializeTelegramModule() {
    console.log('🤖 Initializing Telegram Module v3.0.0');
    
    const telegramBtn = document.getElementById('telegram-link-btn');
    if (telegramBtn) {
        // Remove old listeners
        const newBtn = telegramBtn.cloneNode(true);
        telegramBtn.parentNode.replaceChild(newBtn, telegramBtn);
        
        // Add new listener
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            handleTelegramLink();
        });
        
        console.log('✅ Telegram button initialized');
    } else {
        console.warn('⚠️ Telegram button not found');
    }
    
    // Clear any existing intervals
    if (telegramMonitoringInterval) {
        clearInterval(telegramMonitoringInterval);
    }
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Reset processing state
    isProcessingTelegram = false;
    
    console.log('✅ Telegram Module Ready - Production Version');
}

// Module loaded message
console.log('📦 Telegram Integration Module v3.0.0 - PRODUCTION READY');
console.log('✅ Fixed: code/telegram_code field name issue');
console.log('✅ Fixed: Processing lock release');
console.log('✅ Added: Auto-save monitoring');
console.log('✅ Added: Enhanced auto-start');
console.log('🚀 Ready for production!');
