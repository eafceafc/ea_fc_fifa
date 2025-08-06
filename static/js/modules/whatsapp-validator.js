/**
 * ===== SHAHD AL-SENIORA WHATSAPP VALIDATOR SYSTEM =====
 * نظام التحقق المتقدم من أرقام الواتساب المصرية لشهد السنيورة
 * تحقق فوري ومتطور مع عرض معلومات الرقم والمشغل والحالة
 */

class WhatsAppValidator {
    constructor() {
        this.isReady = false;
        this.validationCache = new Map();
        this.validationHistory = [];
        
        // قاعدة بيانات الشبكات المصرية
        this.networks = {
            '010': { name: 'فودافون', brand: 'Vodafone', color: '#e60000', icon: 'V' },
            '011': { name: 'اتصالات', brand: 'Etisalat', color: '#00b04f', icon: 'E' },
            '012': { name: 'أورانج', brand: 'Orange', color: '#ff7900', icon: 'O' },
            '014': { name: 'اتصالات', brand: 'Etisalat', color: '#00b04f', icon: 'E' },
            '015': { name: 'وي', brand: 'WE', color: '#5f2c91', icon: 'W' }
        };
        
        // أنماط التحقق المختلفة
        this.validationPatterns = {
            whatsapp: {
                // أرقام الواتساب المصرية (10 أرقام تبدأ بـ 1)
                regex: /^1[0-5]\d{8}$/,
                description: 'رقم واتساب مصري (10 أرقام يبدأ بـ 1)'
            },
            mobile: {
                // أرقام المحمول المصرية العادية (11 رقم تبدأ بـ 01)
                regex: /^01[0-5]\d{8}$/,
                description: 'رقم محمول مصري (11 رقم يبدأ بـ 01)'
            },
            international: {
                // الأرقام الدولية
                regex: /^\+20(1[0-5]\d{8}|01[0-5]\d{8})$/,
                description: 'رقم دولي مصري'
            }
        };
        
        // إعدادات النظام
        this.config = {
            enableRealTimeValidation: true,
            showNetworkInfo: true,
            autoFormat: true,
            cacheValidation: true,
            validateOnServer: false,
            animateValidation: true,
            showStatusIcon: true
        };
        
        // إحصائيات الاستخدام
        this.stats = {
            totalValidations: 0,
            validNumbers: 0,
            invalidNumbers: 0,
            networkDistribution: {},
            averageValidationTime: 0,
            cacheHits: 0
        };

        this.log('📞 تم تهيئة نظام التحقق من أرقام الواتساب');
    }

    /**
     * تهيئة النظام
     */
    initialize(coreInstance) {
        this.core = coreInstance;
        this.utils = this.core.getModule('utils');
        this.ui = this.core.getModule('ui');
        this.validation = this.core.getModule('validation');
        
        this.setupEventListeners();
        this.enhanceWhatsAppInput();
        this.loadValidationHistory();
        this.isReady = true;
        
        this.log('✅ نظام التحقق من الواتساب جاهز للعمل');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لتغييرات حقل الواتساب
        this.core.on('input:changed', (data) => {
            if (data.name === 'whatsapp') {
                this.handleWhatsAppInput(data);
            }
        });

        // الاستماع لطلبات التحقق من النظام الأساسي
        this.core.on('whatsapp:validate_request', (data) => {
            this.validateNumber(data.number, data.callback);
        });

        // الاستماع لطلبات التنسيق
        this.core.on('whatsapp:format_request', (data) => {
            const formatted = this.formatNumber(data.number);
            data.callback?.(formatted);
        });

        this.log('👂 تم إعداد مستمعي أحداث الواتساب');
    }

    /**
     * تحسين حقل إدخال الواتساب
     */
    enhanceWhatsAppInput() {
        const whatsappInput = document.getElementById('whatsapp');
        if (!whatsappInput) {
            this.logError('لم يتم العثور على حقل الواتساب');
            return;
        }

        // إضافة المستمعات المحسنة
        this.setupInputListeners(whatsappInput);
        
        // إضافة عناصر المساعدة
        this.createValidationElements(whatsappInput);
        
        // إضافة أنماط التحسين
        this.addValidationStyles();
        
        this.log('🎨 تم تحسين حقل الواتساب');
    }

    /**
     * إعداد مستمعي الإدخال
     */
    setupInputListeners(input) {
        // التحقق أثناء الكتابة
        input.addEventListener('input', (e) => {
            if (this.config.enableRealTimeValidation) {
                this.handleRealTimeValidation(e);
            }
        });

        // التحقق عند فقدان التركيز
        input.addEventListener('blur', (e) => {
            this.handleBlurValidation(e);
        });

        // التنسيق التلقائي
        input.addEventListener('keyup', (e) => {
            if (this.config.autoFormat) {
                this.handleAutoFormatting(e);
            }
        });

        // منع الأحرف غير الرقمية
        input.addEventListener('keypress', (e) => {
            this.handleKeyPress(e);
        });

        // التحقق من اللصق
        input.addEventListener('paste', (e) => {
            setTimeout(() => this.handlePasteValidation(e), 10);
        });

        this.log('🎯 تم إعداد مستمعي الإدخال');
    }

    /**
     * إنشاء عناصر التحقق
     */
    createValidationElements(input) {
        const container = input.parentNode;
        
        // إنشاء عنصر معلومات الشبكة
        const networkInfo = document.createElement('div');
        networkInfo.id = 'whatsapp-network-info';
        networkInfo.className = 'network-info hidden';
        container.appendChild(networkInfo);
        
        // إنشاء عنصر حالة التحقق
        const validationStatus = document.createElement('div');
        validationStatus.id = 'whatsapp-validation-status';
        validationStatus.className = 'validation-status';
        container.appendChild(validationStatus);
        
        // إنشاء مؤشر القوة
        const strengthIndicator = document.createElement('div');
        strengthIndicator.id = 'whatsapp-strength';
        strengthIndicator.className = 'number-strength';
        strengthIndicator.innerHTML = `
            <div class="strength-bars">
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
                <div class="strength-bar"></div>
            </div>
            <span class="strength-label">قوة الرقم</span>
        `;
        container.appendChild(strengthIndicator);

        this.log('🔧 تم إنشاء عناصر التحقق');
    }

    /**
     * إضافة أنماط التحقق
     */
    addValidationStyles() {
        if (document.getElementById('whatsapp-validator-styles')) return;

        const style = document.createElement('style');
        style.id = 'whatsapp-validator-styles';
        style.textContent = `
            .network-info {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin-top: 8px;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(-10px);
            }
            
            .network-info.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .network-info.hidden {
                display: none;
            }
            
            .network-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 0.9rem;
            }
            
            .network-details {
                flex: 1;
            }
            
            .network-name {
                font-weight: 600;
                color: #333;
                font-size: 0.9rem;
            }
            
            .network-type {
                font-size: 0.8rem;
                color: #666;
            }
            
            .validation-status {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 4px;
                font-size: 0.85rem;
                min-height: 20px;
            }
            
            .status-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                color: white;
            }
            
            .status-icon.valid {
                background: #4caf50;
            }
            
            .status-icon.invalid {
                background: #f44336;
            }
            
            .status-icon.checking {
                background: #ff9800;
                animation: pulse 1s infinite;
            }
            
            .status-message {
                color: #666;
            }
            
            .status-message.valid {
                color: #4caf50;
            }
            
            .status-message.invalid {
                color: #f44336;
            }
            
            .number-strength {
                margin-top: 8px;
                padding: 8px 0;
            }
            
            .strength-bars {
                display: flex;
                gap: 4px;
                margin-bottom: 4px;
            }
            
            .strength-bar {
                width: 20px;
                height: 4px;
                background: #e0e0e0;
                border-radius: 2px;
                transition: background 0.3s ease;
            }
            
            .strength-bar.active.weak {
                background: #f44336;
            }
            
            .strength-bar.active.medium {
                background: #ff9800;
            }
            
            .strength-bar.active.strong {
                background: #4caf50;
            }
            
            .strength-bar.active.excellent {
                background: #2196f3;
            }
            
            .strength-label {
                font-size: 0.8rem;
                color: #666;
            }
            
            .whatsapp-input.valid {
                border-color: #4caf50;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            }
            
            .whatsapp-input.invalid {
                border-color: #f44336;
                box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
            }
            
            .whatsapp-input.checking {
                border-color: #ff9800;
                box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
            }
            
            @keyframes pulse {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.1);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .network-info.animate-in {
                animation: slideInUp 0.4s ease;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .validation-typing {
                position: relative;
                overflow: hidden;
            }
            
            .validation-typing::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(233, 30, 99, 0.2), transparent);
                animation: typing-indicator 1.5s infinite;
            }
            
            @keyframes typing-indicator {
                to {
                    left: 100%;
                }
            }
        `;

        document.head.appendChild(style);
        this.log('🎨 تم إضافة أنماط التحقق');
    }

    /**
     * معالجة الإدخال في الوقت الفعلي
     */
    handleRealTimeValidation(event) {
        const input = event.target;
        const value = input.value;
        
        // إضافة تأثير الكتابة
        input.classList.add('validation-typing');
        
        // إزالة التأثير بعد فترة
        setTimeout(() => {
            input.classList.remove('validation-typing');
        }, 500);
        
        // تأجيل التحقق لتجنب الكثرة
        clearTimeout(input.validationTimeout);
        input.validationTimeout = setTimeout(() => {
            this.performRealTimeValidation(input, value);
        }, 300);
    }

    /**
     * تنفيذ التحقق في الوقت الفعلي
     */
    async performRealTimeValidation(input, value) {
        if (!value || value.length < 3) {
            this.clearValidationDisplay();
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // عرض حالة التحقق
            this.showValidationStatus('checking', 'جاري التحقق...');
            input.classList.add('checking');
            
            // تنفيذ التحقق
            const result = await this.validateNumber(value);
            
            // تحديث العرض
            this.updateValidationDisplay(result, input);
            
            // تسجيل الوقت
            const validationTime = Date.now() - startTime;
            this.updateValidationStats(result, validationTime);
            
        } catch (error) {
            this.logError('خطأ في التحقق الفوري', error);
            this.showValidationStatus('invalid', 'خطأ في التحقق');
        }
    }

    /**
     * معالجة التحقق عند فقدان التركيز
     */
    handleBlurValidation(event) {
        const input = event.target;
        const value = input.value.trim();
        
        if (value) {
            this.validateNumber(value).then(result => {
                this.updateValidationDisplay(result, input);
                
                // إشعار النظام الأساسي
                this.core?.emit('whatsapp:validation_completed', {
                    value,
                    result,
                    element: input
                });
            });
        }
    }

    /**
     * معالجة التنسيق التلقائي
     */
    handleAutoFormatting(event) {
        const input = event.target;
        const value = input.value;
        const cursorPosition = input.selectionStart;
        
        const formatted = this.formatNumber(value);
        
        if (formatted !== value) {
            input.value = formatted;
            
            // إعادة تعيين موضع المؤشر
            const newPosition = this.calculateCursorPosition(value, formatted, cursorPosition);
            input.setSelectionRange(newPosition, newPosition);
        }
    }

    /**
     * معالجة ضغط المفاتيح
     */
    handleKeyPress(event) {
        const char = String.fromCharCode(event.which);
        
        // السماح فقط بالأرقام والمفاتيح الخاصة
        if (!/[0-9]/.test(char) && !this.isSpecialKey(event)) {
            event.preventDefault();
            
            // عرض رسالة تنبيه
            this.showValidationStatus('invalid', 'يرجى إدخال الأرقام فقط', 2000);
        }
    }

    /**
     * التحقق من المفاتيح الخاصة
     */
    isSpecialKey(event) {
        const specialKeys = [8, 9, 13, 27, 37, 38, 39, 40, 46]; // Backspace, Tab, Enter, Esc, Arrows, Delete
        return specialKeys.includes(event.keyCode) || event.ctrlKey || event.metaKey;
    }

    /**
     * معالجة اللصق
     */
    handlePasteValidation(event) {
        const input = event.target;
        const value = input.value;
        
        // تنظيف القيمة الملصقة
        const cleaned = this.cleanNumber(value);
        
        if (cleaned !== value) {
            input.value = cleaned;
        }
        
        // تشغيل التحقق
        this.performRealTimeValidation(input, cleaned);
    }

    /**
     * التحقق من صحة الرقم
     */
    async validateNumber(number, callback = null) {
        const startTime = Date.now();
        
        try {
            // فحص الكاش أولاً
            if (this.config.cacheValidation && this.validationCache.has(number)) {
                this.stats.cacheHits++;
                const cached = this.validationCache.get(number);
                callback?.(cached);
                return cached;
            }
            
            // تنظيف الرقم
            const cleaned = this.cleanNumber(number);
            
            // التحقق المحلي
            const localResult = this.performLocalValidation(cleaned);
            
            // التحقق من الخادم إذا كان مطلوباً
            let serverResult = null;
            if (this.config.validateOnServer && localResult.isValid) {
                serverResult = await this.performServerValidation(cleaned);
            }
            
            // دمج النتائج
            const finalResult = this.mergeValidationResults(localResult, serverResult);
            
            // حفظ في الكاش
            if (this.config.cacheValidation) {
                this.validationCache.set(number, finalResult);
            }
            
            // حفظ في التاريخ
            this.saveToHistory(number, finalResult);
            
            callback?.(finalResult);
            return finalResult;
            
        } catch (error) {
            this.logError('فشل في التحقق من الرقم', error);
            
            const errorResult = {
                isValid: false,
                error: error.message,
                message: 'حدث خطأ أثناء التحقق'
            };
            
            callback?.(errorResult);
            return errorResult;
        }
    }

    /**
     * التحقق المحلي
     */
    performLocalValidation(number) {
        const result = {
            number,
            isValid: false,
            type: null,
            network: null,
            message: '',
            details: {},
            strength: 0,
            recommendations: []
        };
        
        // فحص الطول والتنسيق
        if (!number || number.length < 10) {
            result.message = 'الرقم قصير جداً';
            result.recommendations.push('يرجى إدخال رقم مكون من 10 أرقام');
            return result;
        }
        
        if (number.length > 11) {
            result.message = 'الرقم طويل جداً';
            result.recommendations.push('يرجى إدخال رقم صحيح');
            return result;
        }
        
        // فحص أنماط التحقق
        let matchedPattern = null;
        for (const [type, pattern] of Object.entries(this.validationPatterns)) {
            if (pattern.regex.test(number)) {
                matchedPattern = type;
                result.type = type;
                break;
            }
        }
        
        if (!matchedPattern) {
            result.message = 'تنسيق الرقم غير صحيح';
            result.recommendations.push('يرجى إدخال رقم واتساب مصري صحيح');
            return result;
        }
        
        // تحديد الشبكة
        const networkCode = this.extractNetworkCode(number);
        const networkInfo = this.networks[networkCode];
        
        if (!networkInfo) {
            result.message = 'شبكة غير مدعومة';
            result.recommendations.push('يرجى استخدام رقم من شبكة مصرية معروفة');
            return result;
        }
        
        // الرقم صحيح
        result.isValid = true;
        result.network = networkInfo;
        result.message = `رقم ${networkInfo.name} صحيح`;
        result.strength = this.calculateNumberStrength(number, networkInfo);
        result.details = this.extractNumberDetails(number, networkInfo);
        
        // إضافة توصيات تحسين
        if (result.strength < 4) {
            result.recommendations = this.generateRecommendations(number, networkInfo);
        }
        
        return result;
    }

    /**
     * التحقق من الخادم
     */
    async performServerValidation(number) {
        try {
            const response = await this.utils?.fetchJSON('/validate-whatsapp', {
                method: 'POST',
                body: JSON.stringify({ number })
            });
            
            return response;
        } catch (error) {
            this.log('التحقق من الخادم غير متاح:', error.message);
            return null;
        }
    }

    /**
     * دمج نتائج التحقق
     */
    mergeValidationResults(localResult, serverResult) {
        if (!serverResult) {
            return localResult;
        }
        
        // دمج البيانات من الخادم
        return {
            ...localResult,
            serverValidated: true,
            serverData: serverResult,
            isRegistered: serverResult.isRegistered || false,
            lastSeen: serverResult.lastSeen || null,
            businessAccount: serverResult.businessAccount || false
        };
    }

    /**
     * استخراج كود الشبكة
     */
    extractNetworkCode(number) {
        // إزالة البادئات الدولية
        const cleaned = number.replace(/^\+?20?0?/, '');
        
        // استخراج أول 3 أرقام
        if (cleaned.startsWith('01')) {
            return cleaned.substring(0, 3);
        } else if (cleaned.startsWith('1')) {
            return '0' + cleaned.substring(0, 2);
        }
        
        return null;
    }

    /**
     * حساب قوة الرقم
     */
    calculateNumberStrength(number, networkInfo) {
        let strength = 1;
        
        // الشبكة الأساسية
        if (networkInfo.name === 'فودافون' || networkInfo.name === 'اتصالات') {
            strength++;
        }
        
        // التنوع في الأرقام
        const digits = number.split('');
        const uniqueDigits = new Set(digits);
        if (uniqueDigits.size >= 6) {
            strength++;
        }
        
        // عدم وجود تكرار زائد
        const hasRepeatedPattern = /(\d)\1{3,}/.test(number);
        if (!hasRepeatedPattern) {
            strength++;
        }
        
        return Math.min(strength, 4);
    }

    /**
     * استخراج تفاصيل الرقم
     */
    extractNumberDetails(number, networkInfo) {
        return {
            formatted: this.formatNumber(number),
            networkCode: this.extractNetworkCode(number),
            region: this.guessRegion(number),
            type: 'mobile',
            country: 'مصر',
            countryCode: '+20'
        };
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations(number, networkInfo) {
        const recommendations = [];
        
        // فحص الأنماط المتكررة
        if (/(\d)\1{3,}/.test(number)) {
            recommendations.push('الرقم يحتوي على تكرار زائد للأرقام');
        }
        
        // فحص التنوع
        const digits = number.split('');
        const uniqueDigits = new Set(digits);
        if (uniqueDigits.size < 5) {
            recommendations.push('يُفضل رقم بتنوع أكبر في الأرقام');
        }
        
        return recommendations;
    }

    /**
     * تخمين المنطقة
     */
    guessRegion(number) {
        // يمكن إضافة منطق تخمين المنطقة بناءً على أنماط معينة
        return 'مصر';
    }

    /**
     * تنسيق الرقم
     */
    formatNumber(number) {
        if (!number) return '';
        
        const cleaned = this.cleanNumber(number);
        
        // تنسيق 10 أرقام (1xx xxx xxxx)
        if (cleaned.length === 10 && cleaned.startsWith('1')) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        
        // تنسيق 11 رقم (01x xxxx xxxx)
        if (cleaned.length === 11 && cleaned.startsWith('01')) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        
        return cleaned;
    }

    /**
     * تنظيف الرقم
     */
    cleanNumber(number) {
        if (!number) return '';
        
        // إزالة جميع غير الأرقام
        let cleaned = number.replace(/\D/g, '');
        
        // إزالة البادئات الدولية
        if (cleaned.startsWith('2001')) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith('001')) {
            cleaned = cleaned.substring(1);
        } else if (cleaned.startsWith('01')) {
            // تحويل 11 رقم إلى 10 أرقام
            cleaned = cleaned.substring(1);
        }
        
        return cleaned;
    }

    /**
     * حساب موضع المؤشر بعد التنسيق
     */
    calculateCursorPosition(oldValue, newValue, oldPosition) {
        let newPosition = oldPosition;
        
        // حساب عدد الأحرف المضافة قبل الموضع
        const oldSpacesBefore = (oldValue.substring(0, oldPosition).match(/\s/g) || []).length;
        const newSpacesBefore = (newValue.substring(0, oldPosition).match(/\s/g) || []).length;
        
        newPosition += (newSpacesBefore - oldSpacesBefore);
        
        return Math.min(newPosition, newValue.length);
    }

    /**
     * تحديث عرض التحقق
     */
    updateValidationDisplay(result, input) {
        // تحديث فئات الإدخال
        input.classList.remove('valid', 'invalid', 'checking');
        input.classList.add(result.isValid ? 'valid' : 'invalid');
        
        // عرض حالة التحقق
        this.showValidationStatus(
            result.isValid ? 'valid' : 'invalid',
            result.message
        );
        
        // عرض معلومات الشبكة
        if (result.isValid && result.network) {
            this.showNetworkInfo(result.network, result.details);
        } else {
            this.hideNetworkInfo();
        }
        
        // تحديث مؤشر القوة
        this.updateStrengthIndicator(result.strength || 0);
        
        // عرض التوصيات
        if (result.recommendations && result.recommendations.length > 0) {
            this.showRecommendations(result.recommendations);
        }
    }

    /**
     * عرض حالة التحقق
     */
    showValidationStatus(type, message, duration = 0) {
        const statusElement = document.getElementById('whatsapp-validation-status');
        if (!statusElement) return;
        
        const icons = {
            valid: '✓',
            invalid: '✗',
            checking: '⏳'
        };
        
        statusElement.innerHTML = `
            <div class="status-icon ${type}">${icons[type] || '?'}</div>
            <span class="status-message ${type}">${message}</span>
        `;
        
        if (duration > 0) {
            setTimeout(() => {
                statusElement.innerHTML = '';
            }, duration);
        }
    }

    /**
     * عرض معلومات الشبكة
     */
    showNetworkInfo(network, details) {
        const networkElement = document.getElementById('whatsapp-network-info');
        if (!networkElement) return;
        
        networkElement.innerHTML = `
            <div class="network-icon" style="background-color: ${network.color}">
                ${network.icon}
            </div>
            <div class="network-details">
                <div class="network-name">${network.name}</div>
                <div class="network-type">واتساب - ${details.region}</div>
            </div>
        `;
        
        networkElement.classList.remove('hidden');
        networkElement.classList.add('show', 'animate-in');
        
        // إزالة فئة الأنيميشن بعد انتهائها
        setTimeout(() => {
            networkElement.classList.remove('animate-in');
        }, 400);
    }

    /**
     * إخفاء معلومات الشبكة
     */
    hideNetworkInfo() {
        const networkElement = document.getElementById('whatsapp-network-info');
        if (networkElement) {
            networkElement.classList.remove('show');
            networkElement.classList.add('hidden');
        }
    }

    /**
     * تحديث مؤشر القوة
     */
    updateStrengthIndicator(strength) {
        const strengthElement = document.getElementById('whatsapp-strength');
        if (!strengthElement) return;
        
        const bars = strengthElement.querySelectorAll('.strength-bar');
        const labels = ['ضعيف', 'متوسط', 'قوي', 'ممتاز'];
        
        bars.forEach((bar, index) => {
            bar.classList.remove('active', 'weak', 'medium', 'strong', 'excellent');
            
            if (index < strength) {
                bar.classList.add('active');
                
                if (strength === 1) bar.classList.add('weak');
                else if (strength === 2) bar.classList.add('medium');
                else if (strength === 3) bar.classList.add('strong');
                else if (strength === 4) bar.classList.add('excellent');
            }
        });
        
        const label = strengthElement.querySelector('.strength-label');
        if (label && strength > 0) {
            label.textContent = `قوة الرقم: ${labels[strength - 1]}`;
        }
    }

    /**
     * عرض التوصيات
     */
    showRecommendations(recommendations) {
        if (!recommendations.length) return;
        
        this.ui?.showNotification({
            type: 'info',
            title: '💡 نصائح',
            message: recommendations[0],
            duration: 5000
        });
    }

    /**
     * مسح عرض التحقق
     */
    clearValidationDisplay() {
        this.showValidationStatus('', '');
        this.hideNetworkInfo();
        this.updateStrengthIndicator(0);
        
        const input = document.getElementById('whatsapp');
        if (input) {
            input.classList.remove('valid', 'invalid', 'checking');
        }
    }

    /**
     * تحديث إحصائيات التحقق
     */
    updateValidationStats(result, validationTime) {
        this.stats.totalValidations++;
        
        if (result.isValid) {
            this.stats.validNumbers++;
            
            // توزيع الشبكات
            const networkName = result.network?.name || 'غير معروف';
            this.stats.networkDistribution[networkName] = 
                (this.stats.networkDistribution[networkName] || 0) + 1;
        } else {
            this.stats.invalidNumbers++;
        }
        
        // متوسط وقت التحقق
        this.stats.averageValidationTime = (
            (this.stats.averageValidationTime * (this.stats.totalValidations - 1)) + validationTime
        ) / this.stats.totalValidations;
    }

    /**
     * حفظ في التاريخ
     */
    saveToHistory(number, result) {
        const entry = {
            number,
            result,
            timestamp: new Date(),
            isValid: result.isValid
        };
        
        this.validationHistory.unshift(entry);
        
        // الاحتفاظ بـ 50 عنصر فقط
        if (this.validationHistory.length > 50) {
            this.validationHistory = this.validationHistory.slice(0, 50);
        }
        
        // حفظ محلياً
        this.saveValidationHistory();
    }

    /**
     * حفظ تاريخ التحقق
     */
    saveValidationHistory() {
        this.utils?.setStorage('whatsapp_validation_history', {
            history: this.validationHistory.slice(0, 20), // حفظ 20 عنصر فقط
            stats: this.stats
        });
    }

    /**
     * تحميل تاريخ التحقق
     */
    loadValidationHistory() {
        const saved = this.utils?.getStorage('whatsapp_validation_history');
        if (saved) {
            this.validationHistory = saved.history || [];
            this.stats = { ...this.stats, ...saved.stats };
            this.log('📂 تم تحميل تاريخ التحقق');
        }
    }

    /**
     * الحصول على إحصائيات التحقق
     */
    getValidationStats() {
        return {
            ...this.stats,
            cacheSize: this.validationCache.size,
            historySize: this.validationHistory.length,
            successRate: this.stats.totalValidations > 0 ? 
                (this.stats.validNumbers / this.stats.totalValidations) * 100 : 0
        };
    }

    /**
     * مسح الكاش
     */
    clearCache() {
        this.validationCache.clear();
        this.log('🗑️ تم مسح كاش التحقق');
    }

    /**
     * مسح التاريخ
     */
    clearHistory() {
        this.validationHistory = [];
        this.utils?.removeStorage('whatsapp_validation_history');
        this.log('🗑️ تم مسح تاريخ التحقق');
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
                this.clearValidationDisplay();
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        this.clearCache();
        
        // إزالة الأنماط
        const style = document.getElementById('whatsapp-validator-styles');
        if (style) {
            style.remove();
        }
        
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام التحقق من الواتساب');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - واتساب] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - واتساب - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام التحقق من الواتساب =====

// إنشاء المثيل
window.WhatsAppValidator = new WhatsAppValidator();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('whatsappValidator', window.WhatsAppValidator);
        window.WhatsAppValidator.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppValidator;
}
