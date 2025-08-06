/**
 * ===== SHAHD AL-SENIORA UI MANAGEMENT SYSTEM =====
 * نظام إدارة واجهة المستخدم المتقدم لشهد السنيورة
 * إدارة التأثيرات البصرية والإشعارات والتفاعل مع المستخدم
 */

class ShahdUI {
    constructor() {
        this.isReady = false;
        this.animations = new Map();
        this.notifications = [];
        this.themes = new Map();
        this.currentTheme = 'elegant';
        
        // إعدادات التأثيرات
        this.animationSettings = {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            stagger: 50
        };

        // إعدادات الإشعارات
        this.notificationSettings = {
            position: 'top-right',
            autoHide: true,
            hideDelay: 5000,
            maxNotifications: 3
        };

        this.log('🎨 تم تهيئة نظام واجهة المستخدم');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.setupThemes();
        this.setupAnimations();
        this.setupEventListeners();
        this.createNotificationContainer();
        this.enhanceFormElements();
        this.setupResponsiveFeatures();
        this.isReady = true;
        
        this.log('✅ نظام واجهة المستخدم جاهز للعمل');
    }

    /**
     * إعداد السمات المرئية
     */
    setupThemes() {
        // سمة شهد السنيورة الأنيقة
        this.themes.set('elegant', {
            name: 'شهد السنيورة الأنيقة',
            colors: {
                primary: '#e91e63',
                secondary: '#9c27b0',
                accent: '#ff9800',
                success: '#4caf50',
                error: '#f44336',
                warning: '#ff9800',
                info: '#2196f3'
            },
            animations: {
                entrance: 'fadeInUp',
                exit: 'fadeOutDown',
                hover: 'pulse',
                focus: 'glow'
            }
        });

        // سمة ليلية
        this.themes.set('dark', {
            name: 'الوضع الليلي',
            colors: {
                primary: '#f8bbd9',
                secondary: '#e1bee7',
                accent: '#ffcc02',
                success: '#66bb6a',
                error: '#ef5350',
                warning: '#ffa726',
                info: '#42a5f5'
            },
            animations: {
                entrance: 'slideInRight',
                exit: 'slideOutLeft',
                hover: 'bounce',
                focus: 'shake'
            }
        });

        this.log('🎨 تم إعداد السمات المرئية');
    }

    /**
     * إعداد التأثيرات المتحركة
     */
    setupAnimations() {
        // تعريف التأثيرات المخصصة
        const customAnimations = `
            <style id="shahd-animations">
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeOutDown {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideOutLeft {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                }

                @keyframes pulse {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                @keyframes glow {
                    0% {
                        box-shadow: 0 0 5px rgba(233, 30, 99, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 20px rgba(233, 30, 99, 0.8);
                    }
                    100% {
                        box-shadow: 0 0 5px rgba(233, 30, 99, 0.5);
                    }
                }

                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% {
                        transform: translate3d(0,0,0);
                    }
                    40%, 43% {
                        transform: translate3d(0, -5px, 0);
                    }
                    70% {
                        transform: translate3d(0, -3px, 0);
                    }
                    90% {
                        transform: translate3d(0, -1px, 0);
                    }
                }

                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-5px);
                    }
                    75% {
                        transform: translateX(5px);
                    }
                }

                @keyframes sparkle {
                    0% {
                        opacity: 0;
                        transform: scale(0) rotate(0deg);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1) rotate(180deg);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0) rotate(360deg);
                    }
                }

                @keyframes heartbeat {
                    0% {
                        transform: scale(1);
                    }
                    14% {
                        transform: scale(1.1);
                    }
                    28% {
                        transform: scale(1);
                    }
                    42% {
                        transform: scale(1.1);
                    }
                    70% {
                        transform: scale(1);
                    }
                }

                .animate-entrance {
                    animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
                }

                .animate-exit {
                    animation: fadeOutDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
                }

                .hover-effect:hover {
                    animation: pulse 0.6s ease-in-out;
                }

                .focus-glow:focus {
                    animation: glow 2s ease-in-out infinite;
                }

                .success-sparkle {
                    position: relative;
                    overflow: hidden;
                }

                .success-sparkle::after {
                    content: '✨';
                    position: absolute;
                    top: 50%;
                    right: 10px;
                    transform: translateY(-50%);
                    animation: sparkle 1.5s ease-in-out;
                }

                .heartbeat-effect {
                    animation: heartbeat 1.5s ease-in-out infinite;
                }

                .notification-slide-in {
                    animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .notification-slide-out {
                    animation: slideOutLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
            </style>
        `;

        // إضافة التأثيرات إلى الصفحة
        document.head.insertAdjacentHTML('beforeend', customAnimations);
        
        this.log('✨ تم إعداد التأثيرات المتحركة');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لأحداث النظام
        this.core.on('form:submitted', (data) => {
            this.showSuccessAnimation();
            this.createCelebrationEffect();
        });

        this.core.on('form:error', (data) => {
            this.showErrorAnimation();
            this.shakePage();
        });

        this.core.on('validation:completed', (data) => {
            if (data.isValid) {
                this.highlightValidForm();
            } else {
                this.highlightInvalidForm();
            }
        });

        this.core.on('whatsapp:validation_updated', (data) => {
            this.updateWhatsAppFeedback(data);
        });

        this.core.on('email:validation_updated', (data) => {
            this.updateEmailFeedback(data);
        });

        this.core.on('payment_details:validation_updated', (data) => {
            this.updatePaymentDetailsFeedback(data);
        });

        this.core.on('telegram:connect_requested', () => {
            this.showTelegramConnectAnimation();
        });

        this.core.on('telegram:connected', () => {
            this.showTelegramSuccessAnimation();
        });

        // أحداث الفأرة واللمس
        this.setupInteractiveEffects();

        this.log('👂 تم إعداد مستمعي أحداث الواجهة');
    }

    /**
     * إعداد التأثيرات التفاعلية
     */
    setupInteractiveEffects() {
        // تأثيرات الأزرار
        document.querySelectorAll('button, .btn').forEach(button => {
            this.enhanceButton(button);
        });

        // تأثيرات حقول الإدخال
        document.querySelectorAll('input, textarea, select').forEach(input => {
            this.enhanceInput(input);
        });

        // تأثيرات البطاقات
        document.querySelectorAll('.form-container, .payment-label').forEach(card => {
            this.enhanceCard(card);
        });

        this.log('🎭 تم إعداد التأثيرات التفاعلية');
    }

    /**
     * تحسين الأزرار
     */
    enhanceButton(button) {
        button.classList.add('hover-effect');
        
        // تأثير الضغط
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        // تأثير التحميل
        const originalText = button.textContent;
        button.addEventListener('click', () => {
            if (button.classList.contains('loading')) return;
            
            if (button.type === 'submit' || button.classList.contains('submit-btn')) {
                this.showButtonLoading(button, originalText);
            }
        });
    }

    /**
     * تحسين حقول الإدخال
     */
    enhanceInput(input) {
        input.classList.add('focus-glow');
        
        // تأثير التركيز
        input.addEventListener('focus', () => {
            this.highlightInput(input, 'focus');
        });

        input.addEventListener('blur', () => {
            this.highlightInput(input, 'blur');
        });

        // تأثير الكتابة
        input.addEventListener('input', () => {
            this.addTypingEffect(input);
        });
    }

    /**
     * تحسين البطاقات
     */
    enhanceCard(card) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 8px 32px rgba(233, 30, 99, 0.2)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '';
        });
    }

    /**
     * إنشاء حاوية الإشعارات
     */
    createNotificationContainer() {
        if (document.getElementById('shahd-notifications')) return;

        const container = document.createElement('div');
        container.id = 'shahd-notifications';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;

        document.body.appendChild(container);
        this.notificationContainer = container;

        this.log('📢 تم إنشاء حاوية الإشعارات');
    }

    /**
     * عرض إشعار
     */
    showNotification(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = this.notificationSettings.hideDelay,
            icon = this.getNotificationIcon(type),
            persistent = false
        } = options;

        // إزالة الإشعارات الزائدة
        if (this.notifications.length >= this.notificationSettings.maxNotifications) {
            this.removeNotification(this.notifications[0]);
        }

        const notification = this.createNotificationElement({
            type, title, message, icon, persistent, duration
        });

        this.notificationContainer.appendChild(notification);
        this.notifications.push(notification);

        // تأثير الظهور
        requestAnimationFrame(() => {
            notification.classList.add('notification-slide-in');
        });

        // الإخفاء التلقائي
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        this.log(`📢 تم عرض إشعار: ${type} - ${message}`);
        return notification;
    }

    /**
     * إنشاء عنصر الإشعار
     */
    createNotificationElement(options) {
        const { type, title, message, icon, persistent } = options;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-left: 4px solid ${this.getTypeColor(type)};
            max-width: 350px;
            pointer-events: all;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 1.2rem; color: ${this.getTypeColor(type)};">
                    ${icon}
                </div>
                <div style="flex: 1;">
                    ${title ? `<div style="font-weight: 600; margin-bottom: 4px; color: #333;">${title}</div>` : ''}
                    <div style="color: #666; font-size: 0.9rem; line-height: 1.4;">${message}</div>
                </div>
                ${persistent ? '' : '<div style="position: absolute; top: 8px; right: 8px; cursor: pointer; color: #999; font-size: 0.8rem;">×</div>'}
            </div>
        `;

        // إضافة مستمع النقر للإغلاق
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    /**
     * إزالة إشعار
     */
    removeNotification(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.add('notification-slide-out');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 500);
    }

    /**
     * الحصول على أيقونة الإشعار
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || icons.info;
    }

    /**
     * الحصول على لون النوع
     */
    getTypeColor(type) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3',
            loading: '#9c27b0'
        };
        return colors[type] || colors.info;
    }

    /**
     * تحسين عناصر النموذج
     */
    enhanceFormElements() {
        // تحسين النموذج بأكمله
        const form = document.getElementById('profileForm');
        if (form) {
            form.classList.add('animate-entrance');
            
            // تأثير التدرج للعناصر
            const elements = form.querySelectorAll('.input-group');
            elements.forEach((element, index) => {
                element.style.animationDelay = `${index * 100}ms`;
                element.classList.add('animate-entrance');
            });
        }

        // تحسين طرق الدفع
        const paymentMethods = document.querySelectorAll('.payment-option');
        paymentMethods.forEach((method, index) => {
            method.style.animationDelay = `${index * 50}ms`;
            method.classList.add('animate-entrance');
            
            // تأثير الاختيار
            const radio = method.querySelector('input[type="radio"]');
            const label = method.querySelector('.payment-label');
            
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    label.classList.add('success-sparkle');
                    setTimeout(() => label.classList.remove('success-sparkle'), 1500);
                }
            });
        });

        this.log('🎨 تم تحسين عناصر النموذج');
    }

    /**
     * إعداد الميزات المتجاوبة
     */
    setupResponsiveFeatures() {
        // كشف حجم الشاشة
        this.checkScreenSize();
        window.addEventListener('resize', () => {
            this.checkScreenSize();
        });

        // كشف اللمس
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
            this.setupTouchEffects();
        }

        this.log('📱 تم إعداد الميزات المتجاوبة');
    }

    /**
     * فحص حجم الشاشة
     */
    checkScreenSize() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-device', isMobile);
        
        // تعديل إعدادات الإشعارات للأجهزة المحمولة
        if (isMobile) {
            this.notificationSettings.position = 'top-center';
            if (this.notificationContainer) {
                this.notificationContainer.style.right = '10px';
                this.notificationContainer.style.left = '10px';
                this.notificationContainer.style.top = '10px';
            }
        }
    }

    /**
     * إعداد تأثيرات اللمس
     */
    setupTouchEffects() {
        document.addEventListener('touchstart', (e) => {
            if (e.target.matches('button, .btn, .payment-label')) {
                e.target.style.transform = 'scale(0.95)';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (e.target.matches('button, .btn, .payment-label')) {
                setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                }, 100);
            }
        }, { passive: true });
    }

    /**
     * عرض تأثير النجاح
     */
    showSuccessAnimation() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.classList.add('success-sparkle');
            
            setTimeout(() => {
                form.classList.remove('success-sparkle');
            }, 1500);
        }

        // إشعار النجاح
        this.showNotification({
            type: 'success',
            title: '🎉 رائع!',
            message: 'تم حفظ بياناتك بنجاح',
            duration: 4000
        });
    }

    /**
     * عرض تأثير الخطأ
     */
    showErrorAnimation() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.style.animation = 'shake 0.5s ease-in-out';
            
            setTimeout(() => {
                form.style.animation = '';
            }, 500);
        }
    }

    /**
     * اهتزاز الصفحة
     */
    shakePage() {
        document.body.style.animation = 'shake 0.3s ease-in-out';
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 300);
    }

    /**
     * إنشاء تأثير الاحتفال
     */
    createCelebrationEffect() {
        // إنشاء كونفيتي
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createConfetti();
            }, i * 100);
        }
    }

    /**
     * إنشاء كونفيتي
     */
    createConfetti() {
        const confetti = document.createElement('div');
        confetti.innerHTML = '🎉';
        confetti.style.cssText = `
            position: fixed;
            top: -10px;
            left: ${Math.random() * 100}%;
            font-size: ${Math.random() * 20 + 10}px;
            z-index: 9999;
            pointer-events: none;
            animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
        `;

        // إضافة تأثير السقوط
        const fallAnimation = `
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;

        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = fallAnimation;
            document.head.appendChild(style);
        }

        document.body.appendChild(confetti);

        // تنظيف بعد الانتهاء
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }

    /**
     * إبراز النموذج الصحيح
     */
    highlightValidForm() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.3)';
            
            setTimeout(() => {
                form.style.boxShadow = '';
            }, 2000);
        }
    }

    /**
     * إبراز النموذج غير الصحيح
     */
    highlightInvalidForm() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.style.boxShadow = '0 0 20px rgba(244, 67, 54, 0.3)';
            
            setTimeout(() => {
                form.style.boxShadow = '';
            }, 2000);
        }
    }

    /**
     * تحديث ملاحظات الواتساب
     */
    updateWhatsAppFeedback(data) {
        const input = document.getElementById('whatsapp');
        if (!input) return;

        if (data.isValid) {
            input.classList.add('success-sparkle');
            setTimeout(() => input.classList.remove('success-sparkle'), 1000);
        } else {
            input.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => input.style.animation = '', 300);
        }
    }

    /**
     * تحديث ملاحظات الإيميل
     */
    updateEmailFeedback(data) {
        const { element, isValid } = data;
        
        if (isValid) {
            element.classList.add('success-sparkle');
            setTimeout(() => element.classList.remove('success-sparkle'), 1000);
        } else {
            element.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => element.style.animation = '', 300);
        }
    }

    /**
     * تحديث ملاحظات تفاصيل الدفع
     */
    updatePaymentDetailsFeedback(data) {
        const input = document.getElementById('paymentDetails');
        if (!input) return;

        if (data.isValid) {
            input.classList.add('success-sparkle');
            setTimeout(() => input.classList.remove('success-sparkle'), 1000);
        } else {
            input.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => input.style.animation = '', 300);
        }
    }

    /**
     * عرض تأثير ربط التليجرام
     */
    showTelegramConnectAnimation() {
        const telegramBtn = document.getElementById('telegramBtn');
        if (telegramBtn) {
            telegramBtn.classList.add('heartbeat-effect');
            
            this.showNotification({
                type: 'loading',
                title: '📱 ربط التليجرام',
                message: 'جاري فتح التليجرام...',
                persistent: true
            });
        }
    }

    /**
     * عرض تأثير نجاح التليجرام
     */
    showTelegramSuccessAnimation() {
        const telegramBtn = document.getElementById('telegramBtn');
        if (telegramBtn) {
            telegramBtn.classList.remove('heartbeat-effect');
            telegramBtn.classList.add('success-sparkle');
            
            // إزالة الإشعار المستمر
            this.notifications.forEach(notification => {
                if (notification.classList.contains('notification-loading')) {
                    this.removeNotification(notification);
                }
            });
            
            this.showNotification({
                type: 'success',
                title: '🎉 ممتاز!',
                message: 'تم ربط التليجرام بنجاح',
                duration: 3000
            });
            
            setTimeout(() => {
                telegramBtn.classList.remove('success-sparkle');
            }, 1500);
        }
    }

    /**
     * إظهار تحميل الزر
     */
    showButtonLoading(button, originalText) {
        button.classList.add('loading');
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>جاري المعالجة...</span>
            </div>
        `;
        button.disabled = true;
    }

    /**
     * إخفاء تحميل الزر
     */
    hideButtonLoading(button, originalText) {
        button.classList.remove('loading');
        button.innerHTML = originalText;
        button.disabled = false;
    }

    /**
     * إبراز الإدخال
     */
    highlightInput(input, action) {
        if (action === 'focus') {
            input.style.transform = 'scale(1.02)';
        } else {
            input.style.transform = 'scale(1)';
        }
    }

    /**
     * إضافة تأثير الكتابة
     */
    addTypingEffect(input) {
        input.style.borderColor = '#e91e63';
        
        clearTimeout(input.typingTimeout);
        input.typingTimeout = setTimeout(() => {
            input.style.borderColor = '';
        }, 500);
    }

    /**
     * معالجة أحداث النظام
     */
    handleEvent(eventName, data) {
        switch (eventName) {
            case 'system:initialized':
                this.log('📡 تم استلام إشعار تهيئة النظام');
                break;
            case 'form:reset':
                this.resetAnimations();
                break;
        }
    }

    /**
     * إعادة تعيين التأثيرات
     */
    resetAnimations() {
        // إزالة جميع التأثيرات النشطة
        document.querySelectorAll('.animate-entrance, .animate-exit, .success-sparkle')
            .forEach(element => {
                element.classList.remove('animate-entrance', 'animate-exit', 'success-sparkle');
                element.style.animation = '';
                element.style.transform = '';
            });

        this.log('🔄 تم إعادة تعيين التأثيرات');
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        // إزالة الإشعارات
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        
        // إزالة حاوية الإشعارات
        if (this.notificationContainer && this.notificationContainer.parentNode) {
            this.notificationContainer.parentNode.removeChild(this.notificationContainer);
        }

        // إزالة التأثيرات
        const animationStyle = document.getElementById('shahd-animations');
        if (animationStyle) {
            animationStyle.remove();
        }

        this.isReady = false;
        this.log('🧹 تم تنظيف نظام واجهة المستخدم');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - واجهة المستخدم] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - واجهة المستخدم - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام واجهة المستخدم =====

// إنشاء المثيل
window.ShahdUI = new ShahdUI();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('ui', window.ShahdUI);
        window.ShahdUI.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShahdUI;
}
