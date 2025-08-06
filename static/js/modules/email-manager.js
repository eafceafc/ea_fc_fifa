/**
 * ===== SHAHD AL-SENIORA EMAIL MANAGER SYSTEM =====
 * نظام إدارة الإيميلات المتعددة لشهد السنيورة
 * إدارة متقدمة للبريد الإلكتروني مع دعم عناوين متعددة
 */

class EmailManager {
    constructor() {
        this.isReady = false;
        this.emails = [];
        this.maxEmails = 5;
        this.emailCounter = 1;
        this.validationCache = new Map();
        
        // قواعد التحقق من البريد الإلكتروني
        this.validationRules = {
            format: {
                regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'تنسيق البريد الإلكتروني غير صحيح'
            },
            domain: {
                allowed: [
                    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                    'live.com', 'msn.com', 'icloud.com', 'me.com', 'protonmail.com'
                ],
                message: 'يرجى استخدام بريد إلكتروني من مزود معروف'
            },
            length: {
                min: 5,
                max: 100,
                message: 'طول البريد الإلكتروني يجب أن يكون بين 5-100 حرف'
            }
        };
        
        // إعدادات النظام
        this.config = {
            enableRealTimeValidation: true,
            showDomainSuggestions: true,
            allowDuplicates: false,
            autoComplete: true,
            showEmailInfo: true,
            animateTransitions: true
        };
        
        // إحصائيات الاستخدام
        this.stats = {
            totalEmails: 0,
            validEmails: 0,
            invalidEmails: 0,
            domainDistribution: {},
            averageEmailsPerUser: 0,
            mostUsedDomains: []
        };

        this.log('📧 تم تهيئة نظام إدارة الإيميلات');
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
        this.enhanceEmailUI();
        this.loadEmailHistory();
        this.isReady = true;
        
        this.log('✅ نظام إدارة الإيميلات جاهز للعمل');
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        if (!this.core) return;

        // الاستماع لتغييرات الإيميل
        this.core.on('input:changed', (data) => {
            if (data.element.type === 'email') {
                this.handleEmailInput(data);
            }
        });

        // الاستماع لطلبات إضافة إيميل
        this.core.on('email:add_request', (data) => {
            this.addEmailField(data.email);
        });

        // الاستماع لطلبات حذف إيميل
        this.core.on('email:remove_request', (data) => {
            this.removeEmailField(data.index);
        });

        this.log('👂 تم إعداد مستمعي أحداث الإيميل');
    }

    /**
     * تحسين واجهة الإيميل
     */
    enhanceEmailUI() {
        this.setupAddButton();
        this.enhanceFirstEmailField();
        this.createEmailSuggestions();
        this.addEmailStyles();
        
        this.log('🎨 تم تحسين واجهة الإيميل');
    }

    /**
     * إعداد زر الإضافة
     */
    setupAddButton() {
        const addButton = document.getElementById('addEmailBtn');
        if (!addButton) {
            this.logError('زر إضافة الإيميل غير موجود');
            return;
        }

        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.addEmailField();
        });

        // تحديث حالة الزر
        this.updateAddButtonState();
    }

    /**
     * تحسين حقل الإيميل الأول
     */
    enhanceFirstEmailField() {
        const firstEmail = document.getElementById('email1');
        if (!firstEmail) {
            this.logError('حقل الإيميل الأول غير موجود');
            return;
        }

        this.enhanceEmailInput(firstEmail, 1);
        this.emails.push({ element: firstEmail, index: 1, isValid: false });
    }

    /**
     * إضافة حقل إيميل جديد
     */
    addEmailField(defaultValue = '') {
        if (this.emails.length >= this.maxEmails) {
            this.ui?.showNotification({
                type: 'warning',
                title: '⚠️ تنبيه',
                message: `الحد الأقصى ${this.maxEmails} عناوين بريد إلكتروني`,
                duration: 4000
            });
            return;
        }

        this.emailCounter++;
        const emailRow = this.createEmailRow(this.emailCounter, defaultValue);
        
        // إضافة الصف للحاوية
        const container = document.getElementById('additionalEmails');
        if (container) {
            container.appendChild(emailRow);
            
            // تأثير الظهور
            if (this.config.animateTransitions) {
                emailRow.style.opacity = '0';
                emailRow.style.transform = 'translateY(-10px)';
                
                requestAnimationFrame(() => {
                    emailRow.style.transition = 'all 0.3s ease';
                    emailRow.style.opacity = '1';
                    emailRow.style.transform = 'translateY(0)';
                });
            }
        }

        // تحديث قائمة الإيميلات
        const input = emailRow.querySelector('input[type="email"]');
        this.emails.push({ 
            element: input, 
            index: this.emailCounter, 
            isValid: false,
            row: emailRow
        });

        // تحديث حالة الزر
        this.updateAddButtonState();

        // تسجيل الحدث
        this.utils?.trackEvent('email_field_added', {
            total: this.emails.length,
            index: this.emailCounter
        });

        this.log(`📧 تم إضافة حقل إيميل جديد: ${this.emailCounter}`);
    }

    /**
     * إنشاء صف إيميل جديد
     */
    createEmailRow(index, defaultValue = '') {
        const row = document.createElement('div');
        row.className = 'email-row';
        row.setAttribute('data-email-index', index);
        
        row.innerHTML = `
            <div class="email-number">${index}</div>
            <input type="email" 
                   id="email${index}" 
                   name="email${index}" 
                   class="form-input email-input" 
                   placeholder="example${index}@gmail.com"
                   value="${defaultValue}">
            <button type="button" 
                    class="remove-email-btn" 
                    title="حذف هذا البريد الإلكتروني">
                <i class="fas fa-times"></i>
            </button>
        `;

        // ربط الأحداث
        this.bindEmailRowEvents(row, index);
        
        return row;
    }

    /**
     * ربط أحداث صف الإيميل
     */
    bindEmailRowEvents(row, index) {
        const input = row.querySelector('input[type="email"]');
        const removeBtn = row.querySelector('.remove-email-btn');

        if (input) {
            this.enhanceEmailInput(input, index);
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeEmailField(index);
            });
        }
    }

    /**
     * تحسين حقل الإيميل
     */
    enhanceEmailInput(input, index) {
        // التحقق الفوري
        input.addEventListener('input', (e) => {
            this.handleRealTimeValidation(e, index);
        });

        // التحقق عند فقدان التركيز
        input.addEventListener('blur', (e) => {
            this.handleBlurValidation(e, index);
        });

        // الإكمال التلقائي
        input.addEventListener('keyup', (e) => {
            this.handleAutoComplete(e, index);
        });

        // معالجة اللصق
        input.addEventListener('paste', (e) => {
            setTimeout(() => this.handlePasteValidation(e, index), 10);
        });

        // منع المسافات
        input.addEventListener('keypress', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
            }
        });

        // إنشاء عناصر المساعدة
        this.createEmailHelpers(input, index);
    }

    /**
     * إنشاء عناصر مساعدة للإيميل
     */
    createEmailHelpers(input, index) {
        const container = input.parentNode;
        
        // عنصر الحالة
        const status = document.createElement('div');
        status.id = `email-status-${index}`;
        status.className = 'email-status';
        container.appendChild(status);
        
        // عنصر الاقتراحات
        const suggestions = document.createElement('div');
        suggestions.id = `email-suggestions-${index}`;
        suggestions.className = 'email-suggestions hidden';
        container.appendChild(suggestions);
        
        // عنصر معلومات النطاق
        const domainInfo = document.createElement('div');
        domainInfo.id = `domain-info-${index}`;
        domainInfo.className = 'domain-info hidden';
        container.appendChild(domainInfo);
    }

    /**
     * حذف حقل إيميل
     */
    removeEmailField(index) {
        const emailObj = this.emails.find(e => e.index === index);
        if (!emailObj || index === 1) {
            // لا يمكن حذف الحقل الأول
            return;
        }

        // تأثير الإخفاء
        if (this.config.animateTransitions && emailObj.row) {
            emailObj.row.style.transition = 'all 0.3s ease';
            emailObj.row.style.opacity = '0';
            emailObj.row.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                if (emailObj.row && emailObj.row.parentNode) {
                    emailObj.row.parentNode.removeChild(emailObj.row);
                }
            }, 300);
        } else if (emailObj.row && emailObj.row.parentNode) {
            emailObj.row.parentNode.removeChild(emailObj.row);
        }

        // إزالة من القائمة
        this.emails = this.emails.filter(e => e.index !== index);

        // تحديث حالة الزر
        this.updateAddButtonState();

        // تسجيل الحدث
        this.utils?.trackEvent('email_field_removed', {
            total: this.emails.length,
            index
        });

        this.log(`🗑️ تم حذف حقل الإيميل: ${index}`);
    }

    /**
     * معالجة إدخال الإيميل
     */
    handleEmailInput(data) {
        const { element, value } = data;
        const emailObj = this.emails.find(e => e.element === element);
        
        if (emailObj) {
            this.handleRealTimeValidation({ target: element }, emailObj.index);
        }
    }

    /**
     * التحقق في الوقت الفعلي
     */
    handleRealTimeValidation(event, index) {
        const input = event.target;
        const value = input.value.trim();
        const emailObj = this.emails.find(e => e.index === index);
        
        if (!emailObj) return;

        // إزالة التأثيرات السابقة
        input.classList.remove('valid', 'invalid', 'checking');
        
        if (!value) {
            this.clearEmailStatus(index);
            emailObj.isValid = false;
            return;
        }

        // عرض حالة التحقق
        this.showEmailStatus(index, 'checking', 'جاري التحقق...');
        input.classList.add('checking');

        // تأجيل التحقق
        clearTimeout(input.validationTimeout);
        input.validationTimeout = setTimeout(async () => {
            await this.performEmailValidation(value, index, input);
        }, 500);
    }

    /**
     * تنفيذ التحقق من الإيميل
     */
    async performEmailValidation(email, index, input) {
        const startTime = Date.now();
        
        try {
            // فحص الكاش
            if (this.validationCache.has(email)) {
                const cached = this.validationCache.get(email);
                this.updateEmailValidationDisplay(cached, index, input);
                return cached;
            }

            // التحقق المحلي
            const result = await this.validateEmail(email);
            
            // حفظ في الكاش
            this.validationCache.set(email, result);
            
            // تحديث العرض
            this.updateEmailValidationDisplay(result, index, input);
            
            // تحديث إحصائيات
            this.updateEmailStats(result, Date.now() - startTime);
            
            return result;
            
        } catch (error) {
            this.logError('خطأ في التحقق من الإيميل', error);
            
            const errorResult = {
                isValid: false,
                message: 'حدث خطأ أثناء التحقق',
                error: error.message
            };
            
            this.updateEmailValidationDisplay(errorResult, index, input);
            return errorResult;
        }
    }

    /**
     * التحقق من صحة الإيميل
     */
    async validateEmail(email) {
        const result = {
            email: email.toLowerCase(),
            isValid: false,
            message: '',
            domain: '',
            domainInfo: null,
            suggestions: [],
            details: {}
        };

        try {
            // فحص التنسيق الأساسي
            if (!this.validationRules.format.regex.test(email)) {
                result.message = this.validationRules.format.message;
                return result;
            }

            // فحص الطول
            if (email.length < this.validationRules.length.min || 
                email.length > this.validationRules.length.max) {
                result.message = this.validationRules.length.message;
                return result;
            }

            // استخراج النطاق
            const domain = email.split('@')[1].toLowerCase();
            result.domain = domain;

            // فحص النطاق المسموح
            if (!this.validationRules.domain.allowed.includes(domain)) {
                result.message = this.validationRules.domain.message;
                result.suggestions = this.generateDomainSuggestions(email);
                return result;
            }

            // فحص التكرار
            if (!this.config.allowDuplicates && this.isDuplicateEmail(email)) {
                result.message = 'هذا البريد الإلكتروني مُدخل مسبقاً';
                return result;
            }

            // معلومات إضافية عن النطاق
            result.domainInfo = this.getDomainInfo(domain);

            // الإيميل صحيح
            result.isValid = true;
            result.message = `بريد ${result.domainInfo.provider} صحيح`;
            result.details = {
                provider: result.domainInfo.provider,
                security: result.domainInfo.security,
                features: result.domainInfo.features
            };

            return result;

        } catch (error) {
            this.logError('خطأ في تحليل الإيميل', error);
            result.message = 'خطأ في تحليل البريد الإلكتروني';
            return result;
        }
    }

    /**
     * فحص تكرار الإيميل
     */
    isDuplicateEmail(email) {
        const normalizedEmail = email.toLowerCase();
        return this.emails.some(emailObj => {
            const value = emailObj.element.value.toLowerCase();
            return value === normalizedEmail && value !== '';
        });
    }

    /**
     * توليد اقتراحات النطاق
     */
    generateDomainSuggestions(email) {
        const [username, domain] = email.split('@');
        const suggestions = [];
        
        // اقتراحات شائعة
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        
        commonDomains.forEach(suggestedDomain => {
            suggestions.push(`${username}@${suggestedDomain}`);
        });
        
        // اقتراح بناءً على التشابه
        if (domain) {
            const similar = this.findSimilarDomain(domain);
            if (similar) {
                suggestions.unshift(`${username}@${similar}`);
            }
        }
        
        return suggestions.slice(0, 3);
    }

    /**
     * البحث عن نطاق مشابه
     */
    findSimilarDomain(domain) {
        const domainMap = {
            'gmai.com': 'gmail.com',
            'gmial.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'yhoo.com': 'yahoo.com',
            'hotmial.com': 'hotmail.com',
            'outlok.com': 'outlook.com'
        };
        
        return domainMap[domain.toLowerCase()] || null;
    }

    /**
     * الحصول على معلومات النطاق
     */
    getDomainInfo(domain) {
        const domainData = {
            'gmail.com': {
                provider: 'Google Gmail',
                security: 'عالي',
                features: ['مكافحة البريد المزعج', 'تشفير', 'مساحة كبيرة'],
                icon: '📧',
                color: '#ea4335'
            },
            'yahoo.com': {
                provider: 'Yahoo Mail',
                security: 'متوسط',
                features: ['حماية أساسية', 'مساحة جيدة'],
                icon: '💌',
                color: '#7b0099'
            },
            'hotmail.com': {
                provider: 'Microsoft Hotmail',
                security: 'عالي',
                features: ['حماية متقدمة', 'تكامل Office'],
                icon: '📨',
                color: '#0078d4'
            },
            'outlook.com': {
                provider: 'Microsoft Outlook',
                security: 'عالي',
                features: ['حماية متقدمة', 'تكامل Office', 'مزامنة'],
                icon: '📬',
                color: '#0078d4'
            },
            'icloud.com': {
                provider: 'Apple iCloud',
                security: 'عالي جداً',
                features: ['تشفير قوي', 'مزامنة Apple'],
                icon: '☁️',
                color: '#007aff'
            }
        };
        
        return domainData[domain] || {
            provider: 'مزود غير معروف',
            security: 'غير محدد',
            features: [],
            icon: '📧',
            color: '#666666'
        };
    }

    /**
     * تحديث عرض التحقق
     */
    updateEmailValidationDisplay(result, index, input) {
        const emailObj = this.emails.find(e => e.index === index);
        if (emailObj) {
            emailObj.isValid = result.isValid;
        }

        // تحديث فئات الإدخال
        input.classList.remove('valid', 'invalid', 'checking');
        input.classList.add(result.isValid ? 'valid' : 'invalid');

        // عرض الحالة
        this.showEmailStatus(index, result.isValid ? 'valid' : 'invalid', result.message);

        // عرض معلومات النطاق
        if (result.isValid && result.domainInfo && this.config.showEmailInfo) {
            this.showDomainInfo(index, result.domainInfo);
        } else {
            this.hideDomainInfo(index);
        }

        // عرض الاقتراحات
        if (!result.isValid && result.suggestions && result.suggestions.length > 0) {
            this.showEmailSuggestions(index, result.suggestions);
        } else {
            this.hideEmailSuggestions(index);
        }
    }

    /**
     * عرض حالة الإيميل
     */
    showEmailStatus(index, type, message) {
        const statusElement = document.getElementById(`email-status-${index}`);
        if (!statusElement) return;

        const icons = {
            valid: '✓',
            invalid: '✗',
            checking: '⏳'
        };

        const colors = {
            valid: '#4caf50',
            invalid: '#f44336',
            checking: '#ff9800'
        };

        statusElement.innerHTML = `
            <div class="status-icon" style="background: ${colors[type]}">
                ${icons[type] || '?'}
            </div>
            <span class="status-message ${type}">${message}</span>
        `;

        statusElement.className = `email-status ${type}`;
    }

    /**
     * مسح حالة الإيميل
     */
    clearEmailStatus(index) {
        const statusElement = document.getElementById(`email-status-${index}`);
        if (statusElement) {
            statusElement.innerHTML = '';
            statusElement.className = 'email-status';
        }
    }

    /**
     * عرض معلومات النطاق
     */
    showDomainInfo(index, domainInfo) {
        const infoElement = document.getElementById(`domain-info-${index}`);
        if (!infoElement) return;

        infoElement.innerHTML = `
            <div class="domain-header">
                <span class="domain-icon">${domainInfo.icon}</span>
                <span class="domain-provider">${domainInfo.provider}</span>
            </div>
            <div class="domain-details">
                <div class="security-level">🔒 الأمان: ${domainInfo.security}</div>
                ${domainInfo.features.length > 0 ? `
                    <div class="features-list">
                        ${domainInfo.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        infoElement.classList.remove('hidden');
        infoElement.classList.add('show');
    }

    /**
     * إخفاء معلومات النطاق
     */
    hideDomainInfo(index) {
        const infoElement = document.getElementById(`domain-info-${index}`);
        if (infoElement) {
            infoElement.classList.remove('show');
            infoElement.classList.add('hidden');
        }
    }

    /**
     * عرض اقتراحات الإيميل
     */
    showEmailSuggestions(index, suggestions) {
        const suggestionsElement = document.getElementById(`email-suggestions-${index}`);
        if (!suggestionsElement) return;

        suggestionsElement.innerHTML = `
            <div class="suggestions-header">اقتراحات:</div>
            <div class="suggestions-list">
                ${suggestions.map(suggestion => `
                    <button type="button" class="suggestion-btn" data-suggestion="${suggestion}">
                        ${suggestion}
                    </button>
                `).join('')}
            </div>
        `;

        // ربط أحداث الاقتراحات
        suggestionsElement.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applySuggestion(index, btn.dataset.suggestion);
            });
        });

        suggestionsElement.classList.remove('hidden');
        suggestionsElement.classList.add('show');
    }

    /**
     * إخفاء اقتراحات الإيميل
     */
    hideEmailSuggestions(index) {
        const suggestionsElement = document.getElementById(`email-suggestions-${index}`);
        if (suggestionsElement) {
            suggestionsElement.classList.remove('show');
            suggestionsElement.classList.add('hidden');
        }
    }

    /**
     * تطبيق الاقتراح
     */
    applySuggestion(index, suggestion) {
        const emailObj = this.emails.find(e => e.index === index);
        if (emailObj) {
            emailObj.element.value = suggestion;
            this.handleRealTimeValidation({ target: emailObj.element }, index);
            this.hideEmailSuggestions(index);
            
            // تسجيل الحدث
            this.utils?.trackEvent('email_suggestion_applied', {
                index,
                suggestion,
                original: emailObj.element.value
            });
        }
    }

    /**
     * معالجة التحقق عند فقدان التركيز
     */
    handleBlurValidation(event, index) {
        const input = event.target;
        const value = input.value.trim();
        
        if (value) {
            this.performEmailValidation(value, index, input);
        }
    }

    /**
     * معالجة الإكمال التلقائي
     */
    handleAutoComplete(event, index) {
        if (!this.config.autoComplete) return;
        
        const input = event.target;
        const value = input.value;
        
        // اقتراح النطاق أثناء الكتابة
        if (value.includes('@') && !value.includes('.')) {
            const [username, partialDomain] = value.split('@');
            if (partialDomain.length > 0) {
                const suggestions = this.getAutoCompleteSuggestions(partialDomain);
                if (suggestions.length > 0) {
                    this.showInlineAutoComplete(input, username, suggestions[0]);
                }
            }
        }
    }

    /**
     * الحصول على اقتراحات الإكمال التلقائي
     */
    getAutoCompleteSuggestions(partialDomain) {
        const domains = this.validationRules.domain.allowed;
        return domains.filter(domain => 
            domain.startsWith(partialDomain.toLowerCase())
        );
    }

    /**
     * عرض الإكمال التلقائي المضمن
     */
    showInlineAutoComplete(input, username, suggestedDomain) {
        // يمكن إضافة منطق الإكمال التلقائي هنا
        // مثل عرض تلميح أو إكمال النص
    }

    /**
     * معالجة اللصق
     */
    handlePasteValidation(event, index) {
        const input = event.target;
        const value = input.value.trim();
        
        if (value) {
            this.performEmailValidation(value, index, input);
        }
    }

    /**
     * تحديث حالة زر الإضافة
     */
    updateAddButtonState() {
        const addButton = document.getElementById('addEmailBtn');
        if (!addButton) return;

        const canAdd = this.emails.length < this.maxEmails;
        
        addButton.disabled = !canAdd;
        addButton.style.opacity = canAdd ? '1' : '0.5';
        addButton.title = canAdd ? 
            'إضافة بريد إلكتروني آخر' : 
            `الحد الأقصى ${this.maxEmails} عناوين`;
    }

    /**
     * إنشاء اقتراحات الإيميل
     */
    createEmailSuggestions() {
        // يمكن إضافة قائمة اقتراحات عامة هنا
    }

    /**
     * إضافة أنماط الإيميل
     */
    addEmailStyles() {
        if (document.getElementById('email-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'email-manager-styles';
        style.textContent = `
            .email-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                animation: slideIn 0.3s ease;
            }
            
            .email-number {
                background: #ff9800;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .remove-email-btn {
                background: #f44336;
                color: white;
                border: none;
                border-radius: 6px;
                width: 36px;
                height: 36px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.9rem;
                flex-shrink: 0;
            }
            
            .remove-email-btn:hover {
                background: #d32f2f;
                transform: scale(1.05);
            }
            
            .email-status {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 4px;
                font-size: 0.8rem;
                min-height: 16px;
            }
            
            .email-status .status-icon {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                color: white;
            }
            
            .email-status .status-message.valid {
                color: #4caf50;
            }
            
            .email-status .status-message.invalid {
                color: #f44336;
            }
            
            .email-status .status-message.checking {
                color: #ff9800;
            }
            
            .email-suggestions {
                background: #fff3e0;
                border: 1px solid #ffcc02;
                border-radius: 6px;
                padding: 8px;
                margin-top: 6px;
                transition: all 0.3s ease;
            }
            
            .email-suggestions.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .email-suggestions.hidden {
                opacity: 0;
                transform: translateY(-5px);
                display: none;
            }
            
            .suggestions-header {
                font-size: 0.75rem;
                color: #f57c00;
                margin-bottom: 6px;
                font-weight: 600;
            }
            
            .suggestions-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .suggestion-btn {
                background: transparent;
                border: 1px solid #ffcc02;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 0.8rem;
                color: #f57c00;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: left;
            }
            
            .suggestion-btn:hover {
                background: #ffcc02;
                color: white;
            }
            
            .domain-info {
                background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                border: 1px solid #2196f3;
                border-radius: 8px;
                padding: 10px;
                margin-top: 8px;
                transition: all 0.3s ease;
            }
            
            .domain-info.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            .domain-info.hidden {
                opacity: 0;
                transform: translateY(-5px);
                display: none;
            }
            
            .domain-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }
            
            .domain-icon {
                font-size: 1.1rem;
            }
            
            .domain-provider {
                font-weight: 600;
                color: #1976d2;
                font-size: 0.9rem;
            }
            
            .domain-details {
                font-size: 0.8rem;
                color: #555;
            }
            
            .security-level {
                margin-bottom: 4px;
            }
            
            .features-list {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            
            .feature {
                background: rgba(33, 150, 243, 0.1);
                border: 1px solid rgba(33, 150, 243, 0.3);
                border-radius: 4px;
                padding: 2px 6px;
                font-size: 0.7rem;
                color: #1976d2;
            }
            
            .email-input.valid {
                border-color: #4caf50;
                box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            }
            
            .email-input.invalid {
                border-color: #f44336;
                box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
            }
            
            .email-input.checking {
                border-color: #ff9800;
                box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
            }
            
            .add-email-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @media (max-width: 480px) {
                .email-row {
                    flex-wrap: wrap;
                }
                
                .email-input {
                    flex: 1;
                    min-width: 200px;
                }
                
                .suggestions-list {
                    flex-direction: column;
                }
                
                .features-list {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(style);
        this.log('🎨 تم إضافة أنماط الإيميل');
    }

    /**
     * الحصول على جميع الإيميلات الصحيحة
     */
    getValidEmails() {
        return this.emails
            .filter(emailObj => emailObj.isValid && emailObj.element.value.trim())
            .map(emailObj => emailObj.element.value.trim().toLowerCase());
    }

    /**
     * الحصول على جميع الإيميلات
     */
    getAllEmails() {
        return this.emails
            .map(emailObj => emailObj.element.value.trim())
            .filter(email => email.length > 0);
    }

    /**
     * التحقق من صحة جميع الإيميلات
     */
    async validateAllEmails() {
        const results = [];
        
        for (const emailObj of this.emails) {
            const value = emailObj.element.value.trim();
            if (value) {
                const result = await this.performEmailValidation(value, emailObj.index, emailObj.element);
                results.push({
                    index: emailObj.index,
                    email: value,
                    result
                });
            }
        }
        
        return results;
    }

    /**
     * تحديث إحصائيات الإيميل
     */
    updateEmailStats(result, validationTime) {
        this.stats.totalEmails++;
        
        if (result.isValid) {
            this.stats.validEmails++;
            
            // توزيع النطاقات
            const domain = result.domain;
            this.stats.domainDistribution[domain] = 
                (this.stats.domainDistribution[domain] || 0) + 1;
        } else {
            this.stats.invalidEmails++;
        }
        
        // تحديث النطاقات الأكثر استخداماً
        this.updateMostUsedDomains();
        
        // متوسط الإيميلات لكل مستخدم
        this.stats.averageEmailsPerUser = this.emails.length;
    }

    /**
     * تحديث النطاقات الأكثر استخداماً
     */
    updateMostUsedDomains() {
        this.stats.mostUsedDomains = Object.entries(this.stats.domainDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));
    }

    /**
     * حفظ تاريخ الإيميل
     */
    saveEmailHistory() {
        const emailData = {
            emails: this.getAllEmails(),
            stats: this.stats,
            timestamp: new Date()
        };
        
        this.utils?.setStorage('email_history', emailData);
    }

    /**
     * تحميل تاريخ الإيميل
     */
    loadEmailHistory() {
        const saved = this.utils?.getStorage('email_history');
        if (saved) {
            this.stats = { ...this.stats, ...saved.stats };
            this.log('📂 تم تحميل تاريخ الإيميل');
        }
    }

    /**
     * إعادة تعيين النظام
     */
    reset() {
        // مسح جميع الحقول باستثناء الأول
        while (this.emails.length > 1) {
            const lastEmail = this.emails[this.emails.length - 1];
            this.removeEmailField(lastEmail.index);
        }
        
        // مسح الحقل الأول
        const firstEmail = this.emails[0];
        if (firstEmail) {
            firstEmail.element.value = '';
            firstEmail.isValid = false;
            this.clearEmailStatus(1);
            this.hideDomainInfo(1);
            this.hideEmailSuggestions(1);
        }
        
        // إعادة تعيين العداد
        this.emailCounter = 1;
        
        // تحديث حالة الزر
        this.updateAddButtonState();
        
        this.log('🔄 تم إعادة تعيين نظام الإيميل');
    }

    /**
     * الحصول على إحصائيات الإيميل
     */
    getEmailStats() {
        const validEmails = this.getValidEmails();
        
        return {
            ...this.stats,
            currentEmails: this.emails.length,
            validCurrentEmails: validEmails.length,
            maxEmails: this.maxEmails,
            cacheSize: this.validationCache.size,
            completionRate: this.emails.length > 0 ? 
                (validEmails.length / this.emails.length) * 100 : 0
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
            case 'form:submitted':
                this.saveEmailHistory();
                break;
        }
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        // مسح الكاش
        this.validationCache.clear();
        
        // إزالة الأنماط
        const style = document.getElementById('email-manager-styles');
        if (style) {
            style.remove();
        }
        
        this.isReady = false;
        this.log('🧹 تم تنظيف نظام إدارة الإيميل');
    }

    /**
     * تسجيل رسالة
     */
    log(message, data = null) {
        console.log(`[شهد السنيورة - إيميل] ${message}`, data || '');
    }

    /**
     * تسجيل خطأ
     */
    logError(message, error = null) {
        console.error(`[شهد السنيورة - إيميل - خطأ] ${message}`, error || '');
    }
}

// ===== تهيئة نظام إدارة الإيميل =====

// إنشاء المثيل
window.EmailManager = new EmailManager();

// التسجيل مع النظام الأساسي
document.addEventListener('DOMContentLoaded', () => {
    if (window.ShahdCore) {
        window.ShahdCore.registerModule('emailManager', window.EmailManager);
        window.EmailManager.initialize(window.ShahdCore);
    }
});

// تصدير للوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailManager;
}
