/**
 * ===== SHAHD AL-SENIORA UTILITY FUNCTIONS =====
 * الأدوات المساعدة العامة لشهد السنيورة
 * مجموعة من الوظائف المفيدة المشتركة بين جميع الوحدات
 */

class ShahdUtils {
    constructor() {
        this.isReady = false;
        this.cache = new Map();
        this.timers = new Map();
        this.formatters = new Map();
        
        // إعدادات افتراضية
        this.config = {
            dateLocale: 'ar-EG',
            currency: 'EGP',
            phoneCountryCode: '+20',
            supportedEmailDomains: [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                'live.com', 'msn.com', 'icloud.com', 'me.com'
            ]
        };

        this.setupFormatters();
        this.log('🔧 تم تهيئة الأدوات المساعدة');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.setupUtilities();
        this.isReady = true;
        
        this.log('✅ الأدوات المساعدة جاهزة للعمل');
    }

    /**
     * إعداد منسقات البيانات
     */
    setupFormatters() {
        // منسق الأرقام
        this.formatters.set('number', new Intl.NumberFormat(this.config.dateLocale));
        
        // منسق العملة
        this.formatters.set('currency', new Intl.NumberFormat(this.config.dateLocale, {
            style: 'currency',
            currency: this.config.currency
        }));
        
        // منسق التاريخ
        this.formatters.set('date', new Intl.DateTimeFormat(this.config.dateLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
        
        // منسق الوقت
        this.formatters.set('time', new Intl.DateTimeFormat(this.config.dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }));

        this.log('📊 تم إعداد منسقات البيانات');
    }

    /**
     * إعداد الأدوات العامة
     */
    setupUtilities() {
        // إعداد أدوات الشبكة
        this.setupNetworkUtils();
        
        // إعداد أدوات التخزين المحلي
        this.setupStorageUtils();
        
        // إعداد أدوات التحليل
        this.setupAnalyticsUtils();

        this.log('⚙️ تم إعداد الأدوات العامة');
    }

    // ===== أدوات النصوص والتنسيق =====

    /**
     * تنظيف النص
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[<>]/g, '');
    }

    /**
     * تنسيق رقم الهاتف
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';
        
        // إزالة جميع الأحرف غير الرقمية
        const cleaned = phone.replace(/\D/g, '');
        
        // التحقق من الطول والبداية
        if (cleaned.length === 10 && cleaned.startsWith('1')) {
            // تنسيق: 1xx xxx xxxx
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        } else if (cleaned.length === 11 && cleaned.startsWith('01')) {
            // تنسيق: 01x xxxx xxxx
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        
        return cleaned;
    }

    /**
     * التحقق من صحة رقم الهاتف
     */
    isValidPhoneNumber(phone) {
        if (!phone) return false;
        
        const cleaned = phone.replace(/\D/g, '');
        
        // أرقام الواتساب المصرية (10 أرقام تبدأ بـ 1)
        if (cleaned.length === 10 && cleaned.startsWith('1')) {
            const validPrefixes = ['10', '11', '12', '15'];
            return validPrefixes.some(prefix => cleaned.startsWith(prefix));
        }
        
        return false;
    }

    /**
     * تنسيق البريد الإلكتروني
     */
    formatEmail(email) {
        if (!email) return '';
        return email.toLowerCase().trim();
    }

    /**
     * التحقق من صحة البريد الإلكتروني
     */
    isValidEmail(email) {
        if (!email) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        const domain = email.split('@')[1]?.toLowerCase();
        return this.config.supportedEmailDomains.includes(domain);
    }

    /**
     * تنسيق رقم البطاقة الائتمانية
     */
    formatCreditCard(cardNumber) {
        if (!cardNumber) return '';
        
        const cleaned = cardNumber.replace(/\D/g, '');
        
        // تنسيق: xxxx xxxx xxxx xxxx
        return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    /**
     * إخفاء رقم البطاقة الائتمانية جزئياً
     */
    maskCreditCard(cardNumber) {
        if (!cardNumber) return '';
        
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length < 8) return cardNumber;
        
        const masked = '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
        return this.formatCreditCard(masked);
    }

    /**
     * استخلاص الرقم من النص
     */
    extractPhoneFromText(text) {
        if (!text) return '';
        
        // البحث عن أنماط الأرقام المختلفة
        const patterns = [
            /(\+20)?[\s-]?01[0-5]\d{8}/g,  // أرقام مصرية كاملة
            /01[0-5]\d{8}/g,               // أرقام مصرية بدون كود البلد
            /1[0-5]\d{8}/g                 // أرقام بدون 0
        ];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                return matches[0].replace(/\D/g, '');
            }
        }
        
        return '';
    }

    /**
     * استخلاص رابط إنستا باي
     */
    extractInstaPayLink(text) {
        if (!text) return '';
        
        // أنماط روابط إنستا باي
        const patterns = [
            /https?:\/\/[^\s]*instapay[^\s]*/gi,
            /@[a-zA-Z0-9_]+/g,
            /instapay\.com\.eg[^\s]*/gi
        ];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                return matches[0];
            }
        }
        
        return text;
    }

    // ===== أدوات التاريخ والوقت =====

    /**
     * الحصول على التاريخ الحالي
     */
    getCurrentDate() {
        return new Date();
    }

    /**
     * تنسيق التاريخ
     */
    formatDate(date, options = {}) {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        const formatter = new Intl.DateTimeFormat(this.config.dateLocale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        });
        
        return formatter.format(dateObj);
    }

    /**
     * تنسيق الوقت النسبي (منذ ...)
     */
    formatRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const dateObj = date instanceof Date ? date : new Date(date);
        const diffMs = now - dateObj;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 30) return `منذ ${diffDays} يوم`;
        
        return this.formatDate(dateObj);
    }

    // ===== أدوات الشبكة =====

    /**
     * إعداد أدوات الشبكة
     */
    setupNetworkUtils() {
        this.networkStatus = {
            online: navigator.onLine,
            lastCheck: new Date()
        };
        
        window.addEventListener('online', () => {
            this.networkStatus.online = true;
            this.networkStatus.lastCheck = new Date();
            this.core?.emit('network:online');
        });
        
        window.addEventListener('offline', () => {
            this.networkStatus.online = false;
            this.networkStatus.lastCheck = new Date();
            this.core?.emit('network:offline');
        });
    }

    /**
     * فحص الاتصال بالإنترنت
     */
    isOnline() {
        return this.networkStatus.online;
    }

    /**
     * طلب HTTP مع إعادة المحاولة
     */
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        const {
            timeout = 10000,
            retryDelay = 1000,
            ...fetchOptions
        } = options;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                    ...fetchOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
                
            } catch (error) {
                this.logError(`محاولة ${attempt} فشلت:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // انتظار قبل إعادة المحاولة
                await this.delay(retryDelay * attempt);
            }
        }
    }

    /**
     * طلب JSON مع معالجة الأخطاء
     */
    async fetchJSON(url, options = {}) {
        try {
            const response = await this.fetchWithRetry(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            this.logError('فشل في طلب JSON:', error);
            throw error;
        }
    }

    // ===== أدوات التخزين المحلي =====

    /**
     * إعداد أدوات التخزين
     */
    setupStorageUtils() {
        this.storagePrefix = 'shahd_';
        this.storageExpiry = 24 * 60 * 60 * 1000; // 24 ساعة
    }

    /**
     * حفظ في التخزين المحلي
     */
    setStorage(key, value, expiry = null) {
        try {
            const item = {
                value,
                timestamp: Date.now(),
                expiry: expiry || (Date.now() + this.storageExpiry)
            };
            
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(item));
            return true;
            
        } catch (error) {
            this.logError('فشل في الحفظ:', error);
            return false;
        }
    }

    /**
     * استرجاع من التخزين المحلي
     */
    getStorage(key) {
        try {
            const itemStr = localStorage.getItem(this.storagePrefix + key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            
            // فحص انتهاء الصلاحية
            if (Date.now() > item.expiry) {
                this.removeStorage(key);
                return null;
            }
            
            return item.value;
            
        } catch (error) {
            this.logError('فشل في الاسترجاع:', error);
            return null;
        }
    }

    /**
     * إزالة من التخزين المحلي
     */
    removeStorage(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            this.logError('فشل في الإزالة:', error);
            return false;
        }
    }

    /**
     * مسح جميع البيانات المحفوظة
     */
    clearStorage() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.storagePrefix))
                .forEach(key => localStorage.removeItem(key));
            
            return true;
        } catch (error) {
            this.logError('فشل في المسح:', error);
            return false;
        }
    }

    // ===== أدوات التحليل والإحصائيات =====

    /**
     * إعداد أدوات التحليل
     */
    setupAnalyticsUtils() {
        this.analytics = {
            events: [],
            startTime: Date.now(),
            pageViews: 0,
            interactions: 0
        };
        
        this.trackPageView();
    }

    /**
     * تسجيل حدث
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            name: eventName,
            properties,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        this.analytics.events.push(event);
        this.analytics.interactions++;
        
        this.log(`📊 حدث: ${eventName}`, properties);
        
        // إرسال للخادم إذا كان متاحاً
        this.sendAnalyticsEvent(event);
    }

    /**
     * تسجيل مشاهدة صفحة
     */
    trackPageView() {
        this.analytics.pageViews++;
        this.trackEvent('page_view', {
            url: window.location.href,
            title: document.title,
            referrer: document.referrer
        });
    }

    /**
     * الحصول على معرف الجلسة
     */
    getSessionId() {
        let sessionId = this.getStorage('session_id');
        if (!sessionId) {
            sessionId = this.generateId();
            this.setStorage('session_id', sessionId, Date.now() + (30 * 60 * 1000)); // 30 دقيقة
        }
        return sessionId;
    }

    /**
     * إرسال حدث للتحليل
     */
    async sendAnalyticsEvent(event) {
        if (!this.isOnline()) return;
        
        try {
            await this.fetchJSON('/api/analytics', {
                method: 'POST',
                body: JSON.stringify(event)
            });
        } catch (error) {
            // تجاهل أخطاء التحليل
        }
    }

    // ===== أدوات عامة =====

    /**
     * توليد معرف فريد
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * انتظار لفترة محددة
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * تنظيم عمليات الاستدعاء (Debounce)
     */
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * تحديد معدل الاستدعاء (Throttle)
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    /**
     * نسخ النص إلى الحافظة
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // طريقة بديلة للمتصفحات القديمة
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            return true;
        } catch (error) {
            this.logError('فشل في النسخ:', error);
            return false;
        }
    }

    /**
     * تحديث عداد
     */
    createCounter(initialValue = 0) {
        let count = initialValue;
        return {
            get: () => count,
            increment: (step = 1) => count += step,
            decrement: (step = 1) => count -= step,
            reset: () => count = initialValue,
            set: (value) => count = value
        };
    }

    /**
     * إنشاء مؤقت
     */
    createTimer(name, callback, interval) {
        if (this.timers.has(name)) {
            this.clearTimer(name);
        }
        
        const timerId = setInterval(callback, interval);
        this.timers.set(name, timerId);
        
        return timerId;
    }

    /**
     * إيقاف مؤقت
     */
    clearTimer(name) {
        const timerId = this.timers.get(name);
        if (timerId) {
            clearInterval(timerId);
            this.timers.delete(name);
            return true;
        }
        return false;
    }

    /**
     * إيقاف جميع المؤقتات
     */
    clearAllTimers() {
        this.timers.forEach((timerId, name) => {
            clearInterval(timerId);
        });
        this.timers.clear();
    }

    /**
     * فحص نوع الجهاز
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = /ipad|tablet|kindle|silk|android(?!.*mobile)/i.test(userAgent);
        
        if (isMobile && !isTablet) return 'mobile';
        if (isTablet) return 'tablet';
        return 'desktop';
    }

    /**
     * فحص المتصفح
     */
    getBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari')) return 'safari';
        if (userAgent.includes('Edge')) return 'edge';
        if (userAgent.includes('Opera')) return 'opera';
        
        return 'unknown';
    }

    /**
     * تشفير بسيط للنصوص
     */
    simpleEncrypt(text, key = 'shahd') {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    }

    /**
     * فك التشفير البسيط
     */
    simpleDecrypt(encryptedText, key = 'shahd') {
        const decoded = atob(encryptedText);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }

    /**
     * معالجة أحداث النظام
     */
    handleEvent(eventName, data) {
        switch (eventName) {
            case 'system:initialized':
                this.log('📡 تم استلام إشعار تهيئة النظام');
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.clearAllTimers();
        this.cache.clear();
        this.isReady = false;
        
        this.log('🧹 تم تنظيف الأدوات المساعدة');
    }

    /**
     * الحصول على معلومات النظام
     */
    getSystemInfo() {
        return {
            device: this.getDeviceType(),
            browser: this.getBrowser(),
            online: this.isOnline(),
            analytics: {
                events: this.analytics.events.length,
                interactions: this.analytics.interactions,
                pageViews: this.analytics.pageViews
            },
            timers: this.timers.size,
            cache: this.cache.size
        };
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - أدوات] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - أدوات - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة الأدوات المساعدة =====

// إنشاء المثيل
window.ShahdUtils = new ShahdUtils();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('utils', window.ShahdUtils);
        window.ShahdUtils.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShahdUtils;
}
