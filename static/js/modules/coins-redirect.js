/**
 * ===== SHAHD AL-SENIORA COINS REDIRECT SYSTEM =====
 * نظام الانتقال التلقائي لصفحة طلب الكوينز لشهد السنيورة
 * انتقال سلس وذكي مع خيارات متعددة للمستخدم
 */

class CoinsRedirectSystem {
    constructor() {
        this.isReady = false;
        this.redirectState = 'idle'; // idle, preparing, countdown, redirecting, cancelled
        this.countdownTimer = null;
        this.redirectTimer = null;
        
        // إعدادات النظام
        this.config = {
            autoRedirectDelay: 5000, // 5 ثواني افتراضي
            countdownDuration: 10, // 10 ثواني للعد التنازلي
            showOptions: true, // عرض خيارات المستخدم
            allowCancel: true, // السماح بالإلغاء
            coinsPageUrl: '/coins-order', // رابط صفحة الكوينز
            enableAnalytics: true // تسجيل الإحصائيات
        };
        
        // حالات الانتقال المختلفة
        this.redirectScenarios = {
            form_success: { delay: 3000, message: 'تم حفظ بياناتك بنجاح!' },
            telegram_connected: { delay: 2000, message: 'تم ربط التليجرام بنجاح!' },
            manual_request: { delay: 1000, message: 'جاري الانتقال...' },
            auto_flow: { delay: 5000, message: 'المتابعة للخطوة التالية...' }
        };
        
        // بيانات الانتقال
        this.redirectData = {
            reason: null,
            timestamp: null,
            userChoice: null,
            cancelled: false,
            completed: false
        };
        
        // إحصائيات الاستخدام
        this.stats = {
            redirectAttempts: 0,
            successfulRedirects: 0,
            cancelledRedirects: 0,
            averageDecisionTime: 0,
            scenarios: {}
        };

        this.log('🔄 تم تهيئة نظام الانتقال للكوينز');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.utils = this.core.getModule('utils');
        this.ui = this.core.getModule('ui');
        
        this.setupEventListeners();
        this.loadSettings();
        this.createRedirectUI();
        this.isReady = true;
        
        this.log('✅ نظام انتقال الكوينز جاهز للعمل');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لنجاح حفظ النموذج
        this.core.on('form:submitted', (data) => {
            this.scheduleRedirect('form_success', {
                formData: data,
                autoRedirect: true
            });
        });

        // الاستماع لنجاح ربط التليجرام
        this.core.on('telegram:connected', (data) => {
            this.scheduleRedirect('telegram_connected', {
                telegramData: data,
                autoRedirect: true
            });
        });

        // الاستماع لطلب الانتقال للمرحلة التالية
        this.core.on('telegram:ready_for_next_step', () => {
            this.scheduleRedirect('auto_flow', {
                autoRedirect: true
            });
        });

        // الاستماع لأحداث النظام
        this.core.on('system:initialized', () => {
            this.checkPendingRedirects();
        });

        this.log('👂 تم إعداد مستمعي أحداث الانتقال');
    }

    /**
     * جدولة الانتقال
     */
    scheduleRedirect(scenario, options = {}) {
        if (this.redirectState !== 'idle') {
            this.log('⚠️ انتقال جاري بالفعل، تم تجاهل الطلب الجديد');
            return;
        }

        try {
            this.log(`🎯 جدولة انتقال: ${scenario}`, options);
            
            this.redirectState = 'preparing';
            this.redirectData.reason = scenario;
            this.redirectData.timestamp = new Date();
            
            const scenarioConfig = this.redirectScenarios[scenario] || this.redirectScenarios.auto_flow;
            const delay = options.delay || scenarioConfig.delay;
            const message = options.message || scenarioConfig.message;
            
            // تسجيل الإحصائيات
            this.stats.redirectAttempts++;
            if (!this.stats.scenarios[scenario]) {
                this.stats.scenarios[scenario] = 0;
            }
            this.stats.scenarios[scenario]++;
            
            // حفظ البيانات المؤقتة
            this.saveRedirectState();
            
            // عرض رسالة التحضير
            this.showPreparationMessage(message);
            
            // بدء العد التنازلي أو الانتقال المباشر
            if (options.autoRedirect && this.config.showOptions) {
                this.startCountdown(delay);
            } else {
                this.executeRedirect(delay);
            }
            
        } catch (error) {
            this.logError('فشل في جدولة الانتقال', error);
            this.resetRedirectState();
        }
    }

    /**
     * عرض رسالة التحضير
     */
    showPreparationMessage(message) {
        this.ui?.showNotification({
            type: 'success',
            title: '🎉 ممتاز!',
            message: message,
            duration: 3000
        });

        // إضافة تأثير بصري للصفحة
        document.body.classList.add('preparing-redirect');
        
        setTimeout(() => {
            document.body.classList.remove('preparing-redirect');
        }, 2000);
    }

    /**
     * بدء العد التنازلي
     */
    startCountdown(initialDelay = null) {
        this.redirectState = 'countdown';
        const delay = initialDelay || this.config.autoRedirectDelay;
        let countdown = Math.ceil(delay / 1000);
        
        this.log(`⏱️ بدء العد التنازلي: ${countdown} ثانية`);
        
        // إنشاء واجهة العد التنازلي
        this.showCountdownUI(countdown);
        
        const startTime = Date.now();
        
        this.countdownTimer = setInterval(() => {
            countdown--;
            
            if (countdown <= 0) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
                
                if (this.redirectState === 'countdown') {
                    this.executeRedirect();
                }
            } else {
                this.updateCountdownDisplay(countdown);
            }
        }, 1000);
        
        // تسجيل وقت بداية اتخاذ القرار
        this.redirectData.decisionStartTime = startTime;
        
        // إشعار النظام ببدء العد التنازلي
        this.core?.emit('redirect:countdown_started', {
            scenario: this.redirectData.reason,
            countdown: countdown
        });
    }

    /**
     * عرض واجهة العد التنازلي
     */
    showCountdownUI(countdown) {
        // إزالة الواجهة السابقة إن وجدت
        this.hideCountdownUI();
        
        const countdownContainer = document.createElement('div');
        countdownContainer.id = 'countdown-redirect-container';
        countdownContainer.className = 'countdown-redirect-overlay';
        
        countdownContainer.innerHTML = `
            <div class="countdown-modal">
                <div class="countdown-header">
                    <h3>🎉 تم بنجاح!</h3>
                    <p>سيتم الانتقال لصفحة طلب الكوينز خلال:</p>
                </div>
                
                <div class="countdown-display">
                    <div class="countdown-number" id="countdown-number">${countdown}</div>
                    <div class="countdown-label">ثانية</div>
                </div>
                
                <div class="countdown-progress">
                    <div class="progress-bar" id="countdown-progress-bar"></div>
                </div>
                
                <div class="countdown-actions">
                    <button class="redirect-btn redirect-now" id="redirect-now-btn">
                        <i class="fas fa-fast-forward"></i>
                        انتقال فوري
                    </button>
                    
                    <button class="redirect-btn redirect-delay" id="redirect-delay-btn">
                        <i class="fas fa-clock"></i>
                        تأجيل دقيقة
                    </button>
                    
                    <button class="redirect-btn redirect-cancel" id="redirect-cancel-btn">
                        <i class="fas fa-times"></i>
                        إلغاء
                    </button>
                </div>
                
                <div class="countdown-info">
                    <small>يمكنك اختيار الانتقال فوراً أو تأجيل الانتقال أو الإلغاء</small>
                </div>
            </div>
        `;
        
        // إضافة الأنماط
        this.addCountdownStyles();
        
        // إضافة الحاوية للصفحة
        document.body.appendChild(countdownContainer);
        
        // ربط الأحداث
        this.bindCountdownEvents();
        
        // تأثير الظهور
        setTimeout(() => {
            countdownContainer.classList.add('show');
        }, 100);
    }

    /**
     * إضافة أنماط العد التنازلي
     */
    addCountdownStyles() {
        if (document.getElementById('countdown-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'countdown-styles';
        style.textContent = `
            .countdown-redirect-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .countdown-redirect-overlay.show {
                opacity: 1;
            }
            
            .countdown-modal {
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .countdown-redirect-overlay.show .countdown-modal {
                transform: scale(1);
            }
            
            .countdown-header h3 {
                color: #e91e63;
                margin-bottom: 8px;
                font-size: 1.5rem;
            }
            
            .countdown-header p {
                color: #666;
                margin-bottom: 20px;
            }
            
            .countdown-display {
                margin: 30px 0;
            }
            
            .countdown-number {
                font-size: 4rem;
                font-weight: bold;
                color: #e91e63;
                text-shadow: 0 0 20px rgba(233, 30, 99, 0.3);
                animation: countdown-pulse 1s ease-in-out infinite;
            }
            
            .countdown-label {
                font-size: 1rem;
                color: #999;
                margin-top: 8px;
            }
            
            .countdown-progress {
                width: 100%;
                height: 4px;
                background: #f0f0f0;
                border-radius: 2px;
                margin: 20px 0;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #e91e63, #9c27b0);
                border-radius: 2px;
                transition: width 1s linear;
            }
            
            .countdown-actions {
                display: flex;
                gap: 10px;
                margin: 20px 0;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .redirect-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
            }
            
            .redirect-now {
                background: #4caf50;
                color: white;
            }
            
            .redirect-now:hover {
                background: #45a049;
                transform: translateY(-2px);
            }
            
            .redirect-delay {
                background: #ff9800;
                color: white;
            }
            
            .redirect-delay:hover {
                background: #f57c00;
                transform: translateY(-2px);
            }
            
            .redirect-cancel {
                background: #f44336;
                color: white;
            }
            
            .redirect-cancel:hover {
                background: #d32f2f;
                transform: translateY(-2px);
            }
            
            .countdown-info {
                color: #999;
                font-size: 0.8rem;
                line-height: 1.4;
            }
            
            @keyframes countdown-pulse {
                0% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            @media (max-width: 480px) {
                .countdown-modal {
                    padding: 20px;
                }
                
                .countdown-number {
                    font-size: 3rem;
                }
                
                .countdown-actions {
                    flex-direction: column;
                }
                
                .redirect-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * ربط أحداث العد التنازلي
     */
    bindCountdownEvents() {
        const nowBtn = document.getElementById('redirect-now-btn');
        const delayBtn = document.getElementById('redirect-delay-btn');
        const cancelBtn = document.getElementById('redirect-cancel-btn');
        
        if (nowBtn) {
            nowBtn.addEventListener('click', () => {
                this.handleUserChoice('immediate');
            });
        }
        
        if (delayBtn) {
            delayBtn.addEventListener('click', () => {
                this.handleUserChoice('delay');
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleUserChoice('cancel');
            });
        }
        
        // إغلاق بالضغط على الخلفية
        const overlay = document.getElementById('countdown-redirect-container');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.handleUserChoice('cancel');
                }
            });
        }
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    /**
     * معالجة اختصارات لوحة المفاتيح
     */
    handleKeyboardShortcuts(event) {
        if (this.redirectState !== 'countdown') return;
        
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.handleUserChoice('immediate');
                break;
            case 'Escape':
                event.preventDefault();
                this.handleUserChoice('cancel');
                break;
            case ' ':
                event.preventDefault();
                this.handleUserChoice('delay');
                break;
        }
    }

    /**
     * تحديث عرض العد التنازلي
     */
    updateCountdownDisplay(countdown) {
        const numberElement = document.getElementById('countdown-number');
        const progressBar = document.getElementById('countdown-progress-bar');
        
        if (numberElement) {
            numberElement.textContent = countdown;
            
            // تأثير التغيير
            numberElement.classList.add('changing');
            setTimeout(() => {
                numberElement.classList.remove('changing');
            }, 200);
        }
        
        if (progressBar) {
            const totalTime = this.config.countdownDuration;
            const progress = ((totalTime - countdown) / totalTime) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * معالجة اختيار المستخدم
     */
    handleUserChoice(choice) {
        const decisionTime = this.redirectData.decisionStartTime ? 
            Date.now() - this.redirectData.decisionStartTime : 0;
        
        this.redirectData.userChoice = choice;
        this.updateAverageDecisionTime(decisionTime);
        
        this.log(`👤 اختيار المستخدم: ${choice} (${decisionTime}ms)`);
        
        // إيقاف العد التنازلي
        this.stopCountdown();
        
        switch (choice) {
            case 'immediate':
                this.executeRedirect(0);
                break;
            case 'delay':
                this.delayRedirect();
                break;
            case 'cancel':
                this.cancelRedirect();
                break;
        }
        
        // تسجيل الإحصائيات
        this.utils?.trackEvent('redirect_user_choice', {
            choice,
            scenario: this.redirectData.reason,
            decisionTime
        });
    }

    /**
     * تأجيل الانتقال
     */
    delayRedirect() {
        this.log('⏳ تأجيل الانتقال لمدة دقيقة');
        
        this.hideCountdownUI();
        
        // عرض رسالة التأجيل
        this.ui?.showNotification({
            type: 'info',
            title: '⏳ تم التأجيل',
            message: 'سيتم الانتقال تلقائياً بعد دقيقة واحدة',
            duration: 4000
        });
        
        // جدولة الانتقال بعد دقيقة
        this.redirectTimer = setTimeout(() => {
            this.executeRedirect();
        }, 60000);
        
        this.redirectState = 'delayed';
    }

    /**
     * إلغاء الانتقال
     */
    cancelRedirect() {
        this.log('❌ تم إلغاء الانتقال');
        
        this.redirectData.cancelled = true;
        this.stats.cancelledRedirects++;
        
        this.hideCountdownUI();
        this.resetRedirectState();
        
        // عرض رسالة الإلغاء
        this.ui?.showNotification({
            type: 'warning',
            title: '⚠️ تم الإلغاء',
            message: 'يمكنك الانتقال لصفحة الكوينز في أي وقت من القائمة',
            duration: 5000
        });
        
        // إشعار النظام بالإلغاء
        this.core?.emit('redirect:cancelled', {
            scenario: this.redirectData.reason,
            reason: 'user_choice'
        });
        
        // تسجيل الحدث
        this.utils?.trackEvent('redirect_cancelled', {
            scenario: this.redirectData.reason,
            method: 'user_choice'
        });
    }

    /**
     * تنفيذ الانتقال
     */
    executeRedirect(delay = 0) {
        this.redirectState = 'redirecting';
        
        this.log(`🚀 تنفيذ الانتقال... (تأخير: ${delay}ms)`);
        
        // إخفاء واجهة العد التنازلي
        this.hideCountdownUI();
        
        // عرض رسالة الانتقال
        this.showRedirectingMessage();
        
        // تنفيذ الانتقال بعد التأخير المحدد
        this.redirectTimer = setTimeout(() => {
            this.performActualRedirect();
        }, delay);
    }

    /**
     * عرض رسالة الانتقال
     */
    showRedirectingMessage() {
        this.ui?.showNotification({
            type: 'loading',
            title: '🔄 جاري الانتقال...',
            message: 'يتم تحضير صفحة الكوينز',
            persistent: true
        });
        
        // تأثير بصري للانتقال
        document.body.classList.add('redirecting');
    }

    /**
     * تنفيذ الانتقال الفعلي
     */
    async performActualRedirect() {
        try {
            // الحصول على الرابط الصحيح
            const redirectUrl = await this.getRedirectUrl();
            
            this.log(`🌐 الانتقال إلى: ${redirectUrl}`);
            
            // حفظ بيانات الانتقال
            this.redirectData.completed = true;
            this.redirectData.completedAt = new Date();
            this.saveRedirectState();
            
            // تحديث الإحصائيات
            this.stats.successfulRedirects++;
            
            // إشعار النظام بالانتقال
            this.core?.emit('redirect:completed', {
                url: redirectUrl,
                scenario: this.redirectData.reason
            });
            
            // تسجيل الحدث
            this.utils?.trackEvent('redirect_completed', {
                url: redirectUrl,
                scenario: this.redirectData.reason
            });
            
            // الانتقال الفعلي
            window.location.href = redirectUrl;
            
        } catch (error) {
            this.logError('فشل في الانتقال', error);
            this.handleRedirectError(error);
        }
    }

    /**
     * الحصول على رابط الانتقال
     */
    async getRedirectUrl() {
        try {
            // محاولة الحصول على الرابط من الخادم
            const response = await this.utils?.fetchJSON('/api/next-step', {
                method: 'GET'
            });
            
            if (response && response.url) {
                return response.url;
            }
        } catch (error) {
            this.log('فشل في الحصول على الرابط من الخادم، استخدام الرابط الافتراضي');
        }
        
        // استخدام الرابط الافتراضي
        return this.config.coinsPageUrl;
    }

    /**
     * معالجة خطأ الانتقال
     */
    handleRedirectError(error) {
        this.redirectState = 'failed';
        
        // إخفاء رسالة التحميل
        document.body.classList.remove('redirecting');
        
        // عرض رسالة الخطأ
        this.ui?.showNotification({
            type: 'error',
            title: '❌ فشل الانتقال',
            message: 'حدث خطأ أثناء الانتقال. يرجى المحاولة يدوياً',
            duration: 8000
        });
        
        // إشعار النظام بالفشل
        this.core?.emit('redirect:failed', {
            error: error.message,
            scenario: this.redirectData.reason
        });
        
        // تسجيل الحدث
        this.utils?.trackEvent('redirect_failed', {
            error: error.message,
            scenario: this.redirectData.reason
        });
        
        // إعادة تعيين الحالة
        this.resetRedirectState();
        
        // عرض رابط يدوي
        this.showManualRedirectOption();
    }

    /**
     * عرض خيار الانتقال اليدوي
     */
    showManualRedirectOption() {
        const manualButton = document.createElement('button');
        manualButton.innerHTML = `
            <i class="fas fa-external-link-alt"></i>
            انتقال يدوي لصفحة الكوينز
        `;
        manualButton.className = 'manual-redirect-btn';
        manualButton.style.cssText = `
            background: linear-gradient(135deg, #e91e63, #9c27b0);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            margin: 20px auto;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        `;
        
        manualButton.onclick = () => {
            window.open(this.config.coinsPageUrl, '_blank');
        };
        
        // إضافة الزر للصفحة
        const container = document.querySelector('.form-actions') || document.body;
        container.appendChild(manualButton);
    }

    /**
     * إيقاف العد التنازلي
     */
    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    /**
     * إخفاء واجهة العد التنازلي
     */
    hideCountdownUI() {
        const container = document.getElementById('countdown-redirect-container');
        if (container) {
            container.classList.remove('show');
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 300);
        }
        
        // إزالة مستمع لوحة المفاتيح
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * إنشاء واجهة الانتقال
     */
    createRedirectUI() {
        // إنشاء زر الانتقال اليدوي في حال الحاجة
        const redirectButton = document.createElement('button');
        redirectButton.id = 'manual-redirect-btn';
        redirectButton.innerHTML = `
            <i class="fas fa-coins"></i>
            <span>طلب الكوينز</span>
        `;
        redirectButton.className = 'redirect-btn manual-redirect hidden';
        redirectButton.style.display = 'none';
        
        redirectButton.addEventListener('click', () => {
            this.scheduleRedirect('manual_request', {
                autoRedirect: false
            });
        });
        
        // إضافة الزر للصفحة
        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.appendChild(redirectButton);
        }
    }

    /**
     * فحص الانتقالات المعلقة
     */
    checkPendingRedirects() {
        const saved = this.utils?.getStorage('redirect_state');
        if (saved && !saved.completed && !saved.cancelled) {
            this.log('🔄 العثور على انتقال معلق، استئناف...');
            this.redirectData = saved;
            // يمكن إضافة منطق الاستئناف هنا
        }
    }

    /**
     * حفظ حالة الانتقال
     */
    saveRedirectState() {
        this.utils?.setStorage('redirect_state', this.redirectData);
    }

    /**
     * تحديث متوسط وقت اتخاذ القرار
     */
    updateAverageDecisionTime(decisionTime) {
        if (this.stats.successfulRedirects === 0) {
            this.stats.averageDecisionTime = decisionTime;
        } else {
            this.stats.averageDecisionTime = (
                (this.stats.averageDecisionTime * this.stats.successfulRedirects) + decisionTime
            ) / (this.stats.successfulRedirects + 1);
        }
    }

    /**
     * تحميل الإعدادات
     */
    loadSettings() {
        const saved = this.utils?.getStorage('redirect_settings');
        if (saved) {
            this.config = { ...this.config, ...saved };
            this.log('📂 تم تحميل إعدادات الانتقال');
        }
    }

    /**
     * حفظ الإعدادات
     */
    saveSettings() {
        this.utils?.setStorage('redirect_settings', this.config);
    }

    /**
     * إعادة تعيين حالة الانتقال
     */
    resetRedirectState() {
        this.stopCountdown();
        
        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
            this.redirectTimer = null;
        }
        
        this.redirectState = 'idle';
        this.redirectData = {
            reason: null,
            timestamp: null,
            userChoice: null,
            cancelled: false,
            completed: false
        };
        
        document.body.classList.remove('preparing-redirect', 'redirecting');
        
        this.log('🔄 تم إعادة تعيين حالة الانتقال');
    }

    /**
     * الحصول على إحصائيات النظام
     */
    getStats() {
        return {
            ...this.stats,
            currentState: this.redirectState,
            config: { ...this.config },
            successRate: this.stats.redirectAttempts > 0 ? 
                (this.stats.successfulRedirects / this.stats.redirectAttempts) * 100 : 0
        };
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
                this.resetRedirectState();
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.resetRedirectState();
        this.hideCountdownUI();
        
        // إزالة الأنماط
        const style = document.getElementById('countdown-styles');
        if (style) {
            style.remove();
        }
        
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام انتقال الكوينز');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - انتقال الكوينز] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - انتقال الكوينز - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام انتقال الكوينز =====

// إنشاء المثيل
window.CoinsRedirectSystem = new CoinsRedirectSystem();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('coinsRedirect', window.CoinsRedirectSystem);
        window.CoinsRedirectSystem.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoinsRedirectSystem;
}
