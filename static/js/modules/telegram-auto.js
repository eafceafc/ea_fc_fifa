/**
 * ===== SHAHD AL-SENIORA TELEGRAM AUTO-CONNECT SYSTEM =====
 * نظام ربط التليجرام التلقائي الكامل لشهد السنيورة
 * ربط تلقائي مع بوت التليجرام بدون تدخل من المستخدم
 */

class TelegramAutoConnect {
    constructor() {
        this.isReady = false;
        this.connectionState = 'idle'; // idle, connecting, monitoring, connected, failed
        this.currentCode = null;
        this.monitoringTimer = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // إعدادات النظام
        this.config = {
            botUsername: 'ShahdCoinsBot', // اسم البوت
            monitorInterval: 3000, // 3 ثواني
            connectionTimeout: 60000, // دقيقة واحدة
            retryDelay: 5000, // 5 ثواني
            autoStartDelay: 2000, // تأخير البدء التلقائي
            deepLinkPrefix: 'https://t.me/',
            fallbackWebApp: 'https://web.telegram.org/a/'
        };
        
        // حالة الاتصال
        this.connectionData = {
            telegramCode: null,
            linkTime: null,
            userId: null,
            username: null,
            isLinked: false,
            linkUrl: null
        };
        
        // إحصائيات الأداء
        this.stats = {
            attempts: 0,
            successfulConnections: 0,
            averageConnectionTime: 0,
            lastConnectionTime: null
        };

        this.log('📱 تم تهيئة نظام ربط التليجرام التلقائي');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.utils = this.core.getModule('utils');
        this.ui = this.core.getModule('ui');
        
        this.setupEventListeners();
        this.loadSavedConnection();
        this.isReady = true;
        
        this.log('✅ نظام ربط التليجرام جاهز للعمل');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لطلب ربط التليجرام
        this.core.on('telegram:connect_requested', () => {
            this.startAutoConnection();
        });

        // الاستماع لنجاح حفظ النموذج
        this.core.on('form:submitted', (data) => {
            if (this.config.autoStartDelay > 0) {
                setTimeout(() => {
                    this.startAutoConnection();
                }, this.config.autoStartDelay);
            }
        });

        // الاستماع لأحداث الشبكة
        this.core.on('network:offline', () => {
            this.pauseMonitoring();
        });

        this.core.on('network:online', () => {
            if (this.connectionState === 'monitoring') {
                this.resumeMonitoring();
            }
        });

        this.log('👂 تم إعداد مستمعي أحداث التليجرام');
    }

    /**
     * بدء عملية الربط التلقائي
     */
    async startAutoConnection() {
        try {
            this.log('🚀 بدء عملية ربط التليجرام التلقائي...');
            
            if (this.connectionState === 'connecting' || this.connectionState === 'monitoring') {
                this.log('⚠️ عملية ربط جارية بالفعل');
                return;
            }

            // فحص الاتصال المحفوظ
            if (this.connectionData.isLinked && this.isConnectionValid()) {
                this.log('✅ التليجرام مربوط مسبقاً');
                this.handleConnectionSuccess();
                return;
            }

            // بدء عملية ربط جديدة
            await this.initiateTelegramConnection();
            
        } catch (error) {
            this.logError('فشل في بدء ربط التليجرام', error);
            this.handleConnectionError(error);
        }
    }

    /**
     * بدء الاتصال بالتليجرام
     */
    async initiateTelegramConnection() {
        this.connectionState = 'connecting';
        this.stats.attempts++;
        const startTime = Date.now();

        try {
            // عرض حالة الاتصال
            this.showConnectionStatus('جاري الحصول على كود الربط...', 'loading');

            // الحصول على كود التليجرام من الخادم
            const response = await this.getTelegramCode();
            
            if (!response.success || !response.code) {
                throw new Error(response.message || 'فشل في الحصول على كود الربط');
            }

            this.currentCode = response.code;
            this.connectionData.telegramCode = response.code;
            this.connectionData.linkTime = new Date();
            this.connectionData.linkUrl = this.generateTelegramLink(response.code);

            this.log('📋 تم الحصول على كود التليجرام:', this.currentCode);

            // حفظ البيانات محلياً
            this.saveConnectionData();

            // فتح التليجرام تلقائياً
            await this.openTelegramApp();

            // بدء مراقبة حالة الربط
            this.startConnectionMonitoring();

            // تحديث إحصائيات الأداء
            this.stats.lastConnectionTime = Date.now() - startTime;

        } catch (error) {
            this.connectionState = 'failed';
            throw error;
        }
    }

    /**
     * الحصول على كود التليجرام من الخادم
     */
    async getTelegramCode() {
        const url = '/api/link_telegram';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                timestamp: Date.now(),
                source: 'auto_connect'
            })
        };

        try {
            const response = await this.utils.fetchJSON(url, options);
            this.log('📡 استجابة الخادم:', response);
            return response;
        } catch (error) {
            this.logError('فشل في الحصول على كود التليجرام', error);
            throw new Error('فشل في الاتصال بالخادم');
        }
    }

    /**
     * توليد رابط التليجرام
     */
    generateTelegramLink(code) {
        const startParam = `start=${code}`;
        const botLink = `${this.config.deepLinkPrefix}${this.config.botUsername}?${startParam}`;
        
        this.log('🔗 تم توليد رابط التليجرام:', botLink);
        return botLink;
    }

    /**
     * فتح تطبيق التليجرام تلقائياً
     */
    async openTelegramApp() {
        const telegramUrl = this.connectionData.linkUrl;
        
        try {
            this.log('📱 محاولة فتح التليجرام...');
            
            // عرض رسالة للمستخدم
            this.showConnectionStatus('فتح تطبيق التليجرام...', 'info');

            // كشف نوع الجهاز
            const deviceType = this.utils.getDeviceType();
            
            if (deviceType === 'mobile') {
                await this.openTelegramMobile(telegramUrl);
            } else {
                await this.openTelegramDesktop(telegramUrl);
            }

            // تسجيل الحدث
            this.utils.trackEvent('telegram_app_opened', {
                device: deviceType,
                code: this.currentCode
            });

        } catch (error) {
            this.logError('فشل في فتح التليجرام', error);
            // المتابعة حتى لو فشل فتح التطبيق
        }
    }

    /**
     * فتح التليجرام على الأجهزة المحمولة
     */
    async openTelegramMobile(telegramUrl) {
        // محاولة فتح التطبيق مباشرة
        window.open(telegramUrl, '_blank');
        
        // إنشاء رابط احتياطي
        setTimeout(() => {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = telegramUrl;
            fallbackLink.target = '_blank';
            fallbackLink.rel = 'noopener noreferrer';
            fallbackLink.click();
        }, 1000);

        // عرض رسالة توضيحية
        this.ui?.showNotification({
            type: 'info',
            title: '📱 فتح التليجرام',
            message: 'إذا لم يتم فتح التليجرام تلقائياً، يرجى فتح التطبيق وإرسال أي رسالة للبوت',
            duration: 8000
        });
    }

    /**
     * فتح التليجرام على سطح المكتب
     */
    async openTelegramDesktop(telegramUrl) {
        // فتح نافذة جديدة
        const telegramWindow = window.open(telegramUrl, 'telegram', 'width=400,height=600');
        
        // رابط احتياطي للويب
        setTimeout(() => {
            if (!telegramWindow || telegramWindow.closed) {
                const webUrl = this.config.fallbackWebApp + '#/' + this.config.botUsername;
                window.open(webUrl, '_blank');
            }
        }, 2000);

        // عرض رسالة توضيحية
        this.ui?.showNotification({
            type: 'info',
            title: '💻 فتح التليجرام',
            message: 'تم فتح التليجرام في نافذة جديدة. ابحث عن البوت وأرسل أي رسالة',
            duration: 10000
        });
    }

    /**
     * بدء مراقبة حالة الربط
     */
    startConnectionMonitoring() {
        this.connectionState = 'monitoring';
        this.log('👁️ بدء مراقبة حالة الربط...');
        
        // عرض حالة المراقبة
        this.showConnectionStatus('انتظار الربط مع التليجرام...', 'loading');
        this.showMonitoringProgress();

        // بدء المراقبة الدورية
        this.monitoringTimer = setInterval(() => {
            this.checkConnectionStatus();
        }, this.config.monitorInterval);

        // تعيين مهلة زمنية للاتصال
        setTimeout(() => {
            if (this.connectionState === 'monitoring') {
                this.handleConnectionTimeout();
            }
        }, this.config.connectionTimeout);

        // إشعار المستخدم بالحالة
        this.core?.emit('telegram:monitoring_started', {
            code: this.currentCode,
            timeout: this.config.connectionTimeout
        });
    }

    /**
     * فحص حالة الاتصال
     */
    async checkConnectionStatus() {
        if (!this.currentCode || this.connectionState !== 'monitoring') {
            return;
        }

        try {
            const status = await this.fetchConnectionStatus(this.currentCode);
            
            if (status.success && status.connected) {
                this.handleConnectionSuccess(status);
            } else if (status.error) {
                throw new Error(status.error);
            } else {
                // التحديث العادي - لا يزال في انتظار الربط
                this.updateMonitoringDisplay();
            }

        } catch (error) {
            this.logError('خطأ في فحص حالة الاتصال', error);
            // لا نوقف المراقبة بسبب خطأ واحد
        }
    }

    /**
     * استرجاع حالة الاتصال من الخادم
     */
    async fetchConnectionStatus(code) {
        const url = `/check-telegram-status/${code}`;
        
        try {
            const response = await this.utils.fetchJSON(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            return response;
            
        } catch (error) {
            this.logError('فشل في فحص حالة الاتصال', error);
            throw error;
        }
    }

    /**
     * معالجة نجاح الاتصال
     */
    handleConnectionSuccess(statusData = {}) {
        this.connectionState = 'connected';
        this.stopMonitoring();
        
        // تحديث بيانات الاتصال
        this.connectionData.isLinked = true;
        this.connectionData.userId = statusData.user_id || null;
        this.connectionData.username = statusData.username || null;
        
        // حفظ البيانات
        this.saveConnectionData();
        
        // تحديث الإحصائيات
        this.stats.successfulConnections++;
        this.updateAverageConnectionTime();

        this.log('🎉 تم ربط التليجرام بنجاح!', this.connectionData);

        // عرض رسالة النجاح
        this.showConnectionStatus('تم ربط التليجرام بنجاح! 🎉', 'success');
        
        // إخفاء زر التليجرام وإظهار النجاح
        this.hideConnectionUI();
        
        // إشعار النظام بنجاح الربط
        this.core?.emit('telegram:connected', {
            userId: this.connectionData.userId,
            username: this.connectionData.username,
            linkTime: this.connectionData.linkTime
        });

        // إشعار مرئي للمستخدم
        this.ui?.showNotification({
            type: 'success',
            title: '🎉 ممتاز!',
            message: 'تم ربط حسابك مع التليجرام بنجاح',
            duration: 5000
        });

        // تسجيل الحدث
        this.utils?.trackEvent('telegram_connected_success', {
            attempts: this.stats.attempts,
            connectionTime: this.stats.lastConnectionTime
        });

        // الانتقال التلقائي للمرحلة التالية
        setTimeout(() => {
            this.core?.emit('telegram:ready_for_next_step');
        }, 2000);
    }

    /**
     * معالجة فشل الاتصال
     */
    handleConnectionError(error) {
        this.connectionState = 'failed';
        this.stopMonitoring();

        this.logError('فشل في ربط التليجرام', error);

        // عرض رسالة الخطأ
        this.showConnectionStatus(`فشل في الربط: ${error.message}`, 'error');

        // محاولة إعادة الربط
        if (this.retryCount < this.maxRetries) {
            this.scheduleRetry();
        } else {
            this.showFinalError();
        }

        // إشعار النظام بالفشل
        this.core?.emit('telegram:connection_failed', {
            error: error.message,
            attempts: this.stats.attempts,
            retryCount: this.retryCount
        });

        // تسجيل الحدث
        this.utils?.trackEvent('telegram_connection_failed', {
            error: error.message,
            attempts: this.stats.attempts,
            retryCount: this.retryCount
        });
    }

    /**
     * معالجة انتهاء المهلة الزمنية
     */
    handleConnectionTimeout() {
        this.log('⏰ انتهت مهلة انتظار ربط التليجرام');
        
        const error = new Error('انتهت مهلة انتظار ربط التليجرام');
        this.handleConnectionError(error);
    }

    /**
     * جدولة إعادة المحاولة
     */
    scheduleRetry() {
        this.retryCount++;
        
        this.log(`🔄 جدولة إعادة المحاولة ${this.retryCount}/${this.maxRetries}`);
        
        // عرض رسالة إعادة المحاولة
        this.showConnectionStatus(
            `إعادة المحاولة ${this.retryCount}/${this.maxRetries} خلال ${this.config.retryDelay/1000} ثانية...`, 
            'warning'
        );

        setTimeout(() => {
            if (this.connectionState === 'failed') {
                this.startAutoConnection();
            }
        }, this.config.retryDelay);
    }

    /**
     * عرض الخطأ النهائي
     */
    showFinalError() {
        this.showConnectionStatus('فشل في ربط التليجرام بعد عدة محاولات', 'error');
        
        // عرض خيارات بديلة
        this.showManualConnectionOption();
        
        // إشعار مرئي
        this.ui?.showNotification({
            type: 'error',
            title: '❌ فشل الربط',
            message: 'لم نتمكن من ربط التليجرام تلقائياً. يرجى المحاولة يدوياً',
            persistent: true
        });
    }

    /**
     * عرض خيار الربط اليدوي
     */
    showManualConnectionOption() {
        const telegramBtn = document.getElementById('telegramBtn');
        if (telegramBtn) {
            telegramBtn.innerHTML = `
                <i class="fab fa-telegram"></i>
                <span>ربط يدوي</span>
            `;
            
            telegramBtn.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            telegramBtn.onclick = () => {
                if (this.connectionData.linkUrl) {
                    window.open(this.connectionData.linkUrl, '_blank');
                    this.startConnectionMonitoring();
                }
            };
        }
    }

    /**
     * عرض حالة الاتصال
     */
    showConnectionStatus(message, type = 'info') {
        const statusElement = document.getElementById('telegram-status');
        if (statusElement) {
            statusElement.className = `connection-status status-${type}`;
            statusElement.innerHTML = `
                <div class="status-icon">${this.getStatusIcon(type)}</div>
                <div class="status-message">${message}</div>
            `;
            statusElement.style.display = 'flex';
        } else {
            // إنشاء عنصر الحالة إذا لم يكن موجوداً
            this.createStatusElement(message, type);
        }

        this.log(`📊 حالة التليجرام: ${message} (${type})`);
    }

    /**
     * إنشاء عنصر الحالة
     */
    createStatusElement(message, type) {
        const telegramBtn = document.getElementById('telegramBtn');
        if (!telegramBtn || !telegramBtn.parentNode) return;

        const statusElement = document.createElement('div');
        statusElement.id = 'telegram-status';
        statusElement.className = `connection-status status-${type}`;
        statusElement.innerHTML = `
            <div class="status-icon">${this.getStatusIcon(type)}</div>
            <div class="status-message">${message}</div>
        `;
        
        statusElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            font-size: 0.9rem;
            background: ${this.getStatusBackground(type)};
            border: 1px solid ${this.getStatusBorder(type)};
            color: ${this.getStatusColor(type)};
        `;

        telegramBtn.parentNode.insertBefore(statusElement, telegramBtn.nextSibling);
    }

    /**
     * الحصول على أيقونة الحالة
     */
    getStatusIcon(type) {
        const icons = {
            loading: '⏳',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * الحصول على خلفية الحالة
     */
    getStatusBackground(type) {
        const backgrounds = {
            loading: 'rgba(33, 150, 243, 0.1)',
            success: 'rgba(76, 175, 80, 0.1)',
            error: 'rgba(244, 67, 54, 0.1)',
            warning: 'rgba(255, 152, 0, 0.1)',
            info: 'rgba(156, 39, 176, 0.1)'
        };
        return backgrounds[type] || backgrounds.info;
    }

    /**
     * الحصول على حدود الحالة
     */
    getStatusBorder(type) {
        const borders = {
            loading: 'rgba(33, 150, 243, 0.3)',
            success: 'rgba(76, 175, 80, 0.3)',
            error: 'rgba(244, 67, 54, 0.3)',
            warning: 'rgba(255, 152, 0, 0.3)',
            info: 'rgba(156, 39, 176, 0.3)'
        };
        return borders[type] || borders.info;
    }

    /**
     * الحصول على لون النص
     */
    getStatusColor(type) {
        const colors = {
            loading: '#2196f3',
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#9c27b0'
        };
        return colors[type] || colors.info;
    }

    /**
     * عرض تقدم المراقبة
     */
    showMonitoringProgress() {
        let countdown = this.config.connectionTimeout / 1000;
        const progressTimer = setInterval(() => {
            countdown--;
            
            if (countdown <= 0 || this.connectionState !== 'monitoring') {
                clearInterval(progressTimer);
                return;
            }
            
            const minutes = Math.floor(countdown / 60);
            const seconds = countdown % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            this.showConnectionStatus(
                `انتظار الربط... (${timeStr})`,
                'loading'
            );
            
        }, 1000);
    }

    /**
     * تحديث عرض المراقبة
     */
    updateMonitoringDisplay() {
        const dots = '.'.repeat((Date.now() / 500) % 4);
        this.showConnectionStatus(`جاري فحص حالة الربط${dots}`, 'loading');
    }

    /**
     * إيقاف المراقبة
     */
    stopMonitoring() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
    }

    /**
     * إيقاف المراقبة مؤقتاً
     */
    pauseMonitoring() {
        this.stopMonitoring();
        this.showConnectionStatus('تم إيقاف المراقبة - لا يوجد اتصال بالإنترنت', 'warning');
    }

    /**
     * استئناف المراقبة
     */
    resumeMonitoring() {
        if (this.connectionState === 'monitoring') {
            this.startConnectionMonitoring();
            this.showConnectionStatus('تم استئناف المراقبة', 'info');
        }
    }

    /**
     * إخفاء واجهة الاتصال
     */
    hideConnectionUI() {
        const telegramBtn = document.getElementById('telegramBtn');
        const statusElement = document.getElementById('telegram-status');
        
        if (telegramBtn) {
            telegramBtn.style.display = 'none';
        }
        
        if (statusElement) {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * حفظ بيانات الاتصال
     */
    saveConnectionData() {
        this.utils?.setStorage('telegram_connection', this.connectionData);
        this.log('💾 تم حفظ بيانات الاتصال');
    }

    /**
     * تحميل بيانات الاتصال المحفوظة
     */
    loadSavedConnection() {
        const saved = this.utils?.getStorage('telegram_connection');
        if (saved) {
            this.connectionData = { ...this.connectionData, ...saved };
            this.log('📂 تم تحميل بيانات الاتصال المحفوظة');
        }
    }

    /**
     * التحقق من صحة الاتصال المحفوظ
     */
    isConnectionValid() {
        if (!this.connectionData.isLinked || !this.connectionData.linkTime) {
            return false;
        }
        
        // فحص انتهاء صلاحية الاتصال (24 ساعة)
        const linkTime = new Date(this.connectionData.linkTime);
        const now = new Date();
        const hoursDiff = (now - linkTime) / (1000 * 60 * 60);
        
        return hoursDiff < 24;
    }

    /**
     * تحديث متوسط وقت الاتصال
     */
    updateAverageConnectionTime() {
        if (this.stats.successfulConnections === 1) {
            this.stats.averageConnectionTime = this.stats.lastConnectionTime;
        } else {
            this.stats.averageConnectionTime = (
                (this.stats.averageConnectionTime * (this.stats.successfulConnections - 1)) +
                this.stats.lastConnectionTime
            ) / this.stats.successfulConnections;
        }
    }

    /**
     * إعادة تعيين النظام
     */
    reset() {
        this.stopMonitoring();
        this.connectionState = 'idle';
        this.currentCode = null;
        this.retryCount = 0;
        this.connectionData.isLinked = false;
        
        // إزالة البيانات المحفوظة
        this.utils?.removeStorage('telegram_connection');
        
        // إخفاء عناصر الحالة
        const statusElement = document.getElementById('telegram-status');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
        
        this.log('🔄 تم إعادة تعيين نظام التليجرام');
    }

    /**
     * الحصول على إحصائيات النظام
     */
    getStats() {
        return {
            ...this.stats,
            currentState: this.connectionState,
            isConnected: this.connectionData.isLinked,
            retryCount: this.retryCount,
            connectionData: { ...this.connectionData }
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
                this.reset();
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.stopMonitoring();
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام ربط التليجرام');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - تليجرام] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - تليجرام - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام ربط التليجرام =====

// إنشاء المثيل
window.TelegramAutoConnect = new TelegramAutoConnect();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('telegram', window.TelegramAutoConnect);
        window.TelegramAutoConnect.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramAutoConnect;
}
