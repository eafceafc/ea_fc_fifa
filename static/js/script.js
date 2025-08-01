// متغيرات عامة
let isSubmitting = false;
let lastSubmitTime = 0;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    initializeEventListeners();
    
    // تحسين الأداء للهواتف
    if (window.innerWidth <= 768) {
        optimizeForMobile();
    }
});

// إنشاء الجسيمات المتحركة
function createParticles() {
    const container = document.getElementById('particlesBg');
    const particleCount = window.innerWidth <= 768 ? 15 : 25;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
        container.appendChild(particle);
    }
}

// تحسين للهواتف
function optimizeForMobile() {
    // تقليل عدد الجسيمات
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        if (index > 10) {
            particle.remove();
        }
    });
    
    // تحسين الانيميشن
    document.body.style.setProperty('--animation-duration', '0.2s');
}

// تهيئة مستمعي الأحداث
function initializeEventListeners() {
    const platformCards = document.querySelectorAll('.platform-card');
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const whatsappInput = document.getElementById('whatsapp');
    const form = document.getElementById('profileForm');

    // معالجة اختيار المنصة
    platformCards.forEach(card => {
        card.addEventListener('click', function() {
            // إزالة التحديد من الكل
            platformCards.forEach(c => c.classList.remove('selected'));
            
            // تحديد البطاقة المضغوطة
            this.classList.add('selected');
            document.getElementById('platform').value = this.dataset.platform;
            
            // إضافة تأثير اهتزاز خفيف (للهواتف)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            checkFormValidity();
        });
    });

    // معالجة اختيار طريقة الدفع
    paymentButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            const paymentType = this.dataset.type;
            const paymentValue = this.dataset.value;
            
            document.getElementById('payment_method').value = paymentValue;
            
            // إخفاء جميع الحقول الديناميكية
            document.querySelectorAll('.dynamic-input').forEach(input => {
                input.classList.remove('show');
                const inputField = input.querySelector('input');
                if (inputField) {
                    inputField.required = false;
                    inputField.value = '';
                }
            });
            
            // إخفاء رسائل الخطأ
            document.querySelectorAll('.error-message-field').forEach(error => {
                error.classList.remove('show');
            });
            
            // إظهار الحقل المناسب
            const targetInput = document.getElementById(paymentType + '-input');
            if (targetInput) {
                setTimeout(() => {
                    targetInput.classList.add('show');
                    targetInput.querySelector('input').required = true;
                    
                    // تركيز تلقائي للهواتف
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            targetInput.querySelector('input').focus();
                        }, 300);
                    }
                }, 150);
            }
            
            // اهتزاز للهواتف
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            
            checkFormValidity();
        });
    });

    // معالجة رقم الواتساب
    whatsappInput.addEventListener('input', function() {
        let value = this.value.replace(/[^\d+]/g, '');
        
        // إضافة +2 تلقائياً للأرقام المصرية
        if (value.match(/^01[0-9]/)) {
            value = '+2' + value;
        }
        
        this.value = value;
        checkFormValidity();
    });

    // معالجة الحقول الديناميكية
    setupDynamicInputs();

    // معالجة إرسال النموذج
    form.addEventListener('submit', handleFormSubmit);
    
    // منع إرسال النموذج بالضغط على Enter في الحقول
    form.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
        }
    });
}

// إعداد الحقول الديناميكية
function setupDynamicInputs() {
    const mobileInput = document.getElementById('mobile-number');
    const cardInput = document.getElementById('card-number');
    const linkInput = document.getElementById('payment-link');

    // معالجة رقم الهاتف للمحافظ
    mobileInput.addEventListener('input', function() {
        let value = this.value.replace(/[^\d]/g, '');
        this.value = value.substring(0, 11);
        
        validateMobileNumber(value);
        checkFormValidity();
    });

    // معالجة رقم البطاقة لتيلدا
    cardInput.addEventListener('input', function() {
        let value = this.value.replace(/[^\d\s\-]/g, '');
        this.value = value;
        
        validateCardNumber(value);
        checkFormValidity();
    });

    // معالجة رابط إنستا باي
    linkInput.addEventListener('input', function() {
        validateInstapayLink(this.value);
        checkFormValidity();
    });
}

// التحقق من رقم الهاتف للمحافظ
function validateMobileNumber(value) {
    const error = document.getElementById('mobile-error');
    const isValid = /^01[0125][0-9]{8}$/.test(value) && value.length === 11;
    
    if (value.length > 0 && !isValid) {
        error.classList.add('show');
        return false;
    } else {
        error.classList.remove('show');
        return value.length === 11;
    }
}

// التحقق من رقم البطاقة
function validateCardNumber(value) {
    const error = document.getElementById('card-error');
    const numbersOnly = value.replace(/[^\d]/g, '');
    const isValid = numbersOnly.length === 16;
    
    if (value.length > 0 && !isValid) {
        error.classList.add('show');
        return false;
    } else {
        error.classList.remove('show');
        return isValid;
    }
}

// التحقق من رابط إنستا باي
function validateInstapayLink(value) {
    const error = document.getElementById('link-error');
    const hasValidLink = /https:\/\/[^\s]+/i.test(value);
    
    if (value.length > 0 && !hasValidLink) {
        error.classList.add('show');
        return false;
    } else {
        error.classList.remove('show');
        return hasValidLink;
    }
}

// التحقق من صحة النموذج
function checkFormValidity() {
    const platform = document.getElementById('platform').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const paymentMethod = document.getElementById('payment_method').value;
    
    let paymentDetailsValid = true;
    const activeInput = document.querySelector('.dynamic-input.show input');
    
    if (activeInput && activeInput.required) {
        const value = activeInput.value.trim();
        
        if (activeInput.id === 'mobile-number') {
            paymentDetailsValid = validateMobileNumber(value);
        } else if (activeInput.id === 'card-number') {
            paymentDetailsValid = validateCardNumber(value);
        } else if (activeInput.id === 'payment-link') {
            paymentDetailsValid = validateInstapayLink(value);
        }
    }
    
    const whatsappValid = whatsapp.length > 0;
    const isValid = platform && whatsappValid && paymentMethod && paymentDetailsValid;
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = !isValid;
    
    // تغيير شكل الزر للإشارة للحالة
    if (isValid) {
        submitBtn.style.opacity = '1';
        submitBtn.style.transform = 'scale(1)';
    } else {
        submitBtn.style.opacity = '0.6';
        submitBtn.style.transform = 'scale(0.98)';
    }
}

// معالجة إرسال النموذج
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // منع الإرسال المتكرر
    const now = Date.now();
    if (isSubmitting || (now - lastSubmitTime < 3000)) {
        showNotification('يرجى الانتظار قبل المحاولة مرة أخرى', 'error');
        return;
    }
    
    isSubmitting = true;
    lastSubmitTime = now;
    
    const loading = document.getElementById('loading');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // إخفاء الرسائل السابقة
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
    
    // عرض شاشة التحميل
    loading.classList.add('show');
    
    // اهتزاز للهواتف
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    try {
        const formData = new FormData(e.target);
        
        const response = await fetch('/update-profile', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        
        // إخفاء شاشة التحميل
        loading.classList.remove('show');
        
        if (response.ok && result.success) {
            successMessage.classList.add('show');
            
            // اهتزاز نجاح
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            
            // إعادة تعيين النموذج بعد النجاح
            setTimeout(() => {
                // يمكن إعادة توجيه المستخدم أو إعادة تعيين النموذج
                console.log('تم حفظ البيانات بنجاح:', result.data);
            }, 2000);
            
        } else {
            errorMessage.textContent = result.message || 'حدث خطأ غير متوقع';
            errorMessage.classList.add('show');
            
            // اهتزاز خطأ
            if (navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 300]);
            }
        }
        
    } catch (error) {
        console.error('خطأ في الشبكة:', error);
        loading.classList.remove('show');
        errorMessage.textContent = 'خطأ في الاتصال، يرجى المحاولة مرة أخرى';
        errorMessage.classList.add('show');
        
        // اهتزاز خطأ شبكة
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
        }
    }
    
    isSubmitting = false;
}

// إظهار إشعار مؤقت
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#DC2626' : '#10B981'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// تحسينات أداء إضافية
window.addEventListener('resize', debounce(function() {
    if (window.innerWidth <= 768) {
        optimizeForMobile();
    }
}, 250));

// دالة تأخير التنفيذ
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تحسين تجربة اللمس للهواتف
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, {passive: true});
}

// منع التكبير عند التركيز على الحقول (iOS)
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, select, textarea')) {
            document.querySelector('meta[name=viewport]').setAttribute(
                'content', 
                'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
            );
        }
    });
    
    document.addEventListener('focusout', function() {
        document.querySelector('meta[name=viewport]').setAttribute(
            'content', 
            'width=device-width, initial-scale=1'
        );
    });
}
