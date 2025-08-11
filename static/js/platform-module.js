// FC 26 Platform Module - وحدة المنصة المستقلة
// الهدف: فصل كامل لمنطق اختيار المنصة

/**
 * Platform Module - نظام اختيار المنصة المستقل
 * يدير PlayStation, Xbox, PC بشكل منفصل عن باقي الكود
 */

class PlatformModule {
    constructor() {
        this.selectedPlatform = null;
        this.platformCards = [];
        this.onPlatformChange = null; // callback للتواصل مع النظام الرئيسي
        this.initialized = false;
    }

    /**
     * تهيئة وحدة المنصة
     * @param {Function} onChangeCallback - دالة يتم استدعاؤها عند تغيير المنصة
     */
    init(onChangeCallback = null) {
        if (this.initialized) {
            console.warn('🎮 Platform Module already initialized');
            return;
        }

        this.onPlatformChange = onChangeCallback;
        this.setupPlatformCards();
        this.initialized = true;
        
        console.log('🎮 Platform Module initialized successfully');
    }

    /**
     * إعداد بطاقات المنصة مع مستمعي الأحداث
     */
    setupPlatformCards() {
        this.platformCards = document.querySelectorAll('.platform-card');
        
        if (this.platformCards.length === 0) {
            console.warn('⚠️ No platform cards found');
            return;
        }

        this.platformCards.forEach(card => {
            card.addEventListener('click', (event) => {
                this.handlePlatformSelection(event, card);
            });

            // تحسينات للهواتف
            if ('ontouchstart' in window) {
                card.addEventListener('touchstart', () => {
                    card.classList.add('touch-active');
                }, {passive: true});
                
                card.addEventListener('touchend', () => {
                    setTimeout(() => {
                        card.classList.remove('touch-active');
                    }, 150);
                }, {passive: true});
            }
        });

        console.log(`🎮 ${this.platformCards.length} platform cards initialized`);
    }

    /**
     * معالجة اختيار المنصة
     * @param {Event} event - حدث النقر
     * @param {HTMLElement} selectedCard - البطاقة المحددة
     */
    handlePlatformSelection(event, selectedCard) {
        event.preventDefault();
        
        // إزالة التحديد من جميع البطاقات
        this.clearAllSelections();
        
        // تحديد البطاقة المختارة
        selectedCard.classList.add('selected');
        
        // حفظ المنصة المختارة
        const platform = selectedCard.dataset.platform;
        this.selectedPlatform = platform;
        
        // تحديث الحقل المخفي
        this.updatePlatformInput(platform);
        
        // تأثيرات بصرية
        this.addSelectionEffects(selectedCard);
        
        // إشعار النظام الرئيسي
        this.notifyPlatformChange(platform, selectedCard);
        
        console.log(`🎮 Platform selected: ${platform}`);
    }

    /**
     * إزالة التحديد من جميع البطاقات
     */
    clearAllSelections() {
        this.platformCards.forEach(card => {
            card.classList.remove('selected', 'touch-active');
        });
    }

    /**
     * تحديث الحقل المخفي للمنصة
     * @param {string} platform - المنصة المختارة
     */
    updatePlatformInput(platform) {
        const platformInput = document.getElementById('platform');
        if (platformInput) {
            platformInput.value = platform;
        } else {
            console.warn('⚠️ Platform input field not found');
        }
    }

    /**
     * إضافة تأثيرات بصرية للاختيار
     * @param {HTMLElement} card - البطاقة المختارة
     */
    addSelectionEffects(card) {
        // اهتزاز للهواتف
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // تأثير نبضة
        card.classList.add('pulse-effect');
        setTimeout(() => {
            card.classList.remove('pulse-effect');
        }, 300);
    }

    /**
     * إشعار النظام الرئيسي بتغيير المنصة
     * @param {string} platform - المنصة المختارة
     * @param {HTMLElement} card - البطاقة المختارة
     */
    notifyPlatformChange(platform, card) {
        if (typeof this.onPlatformChange === 'function') {
            this.onPlatformChange({
                platform: platform,
                card: card,
                isValid: true,
                selectedPlatform: this.selectedPlatform
            });
        }

        // إرسال حدث مخصص للنظام
        const event = new CustomEvent('platformChanged', {
            detail: {
                platform: platform,
                card: card,
                module: this
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * الحصول على المنصة المختارة حالياً
     * @returns {string|null} المنصة المختارة أو null
     */
    getSelectedPlatform() {
        return this.selectedPlatform;
    }

    /**
     * تحديد منصة برمجياً
     * @param {string} platform - المنصة المطلوب تحديدها
     */
    selectPlatform(platform) {
        const targetCard = document.querySelector(`[data-platform="${platform}"]`);
        if (targetCard) {
            this.handlePlatformSelection(new Event('click'), targetCard);
        } else {
            console.warn(`⚠️ Platform card not found: ${platform}`);
        }
    }

    /**
     * التحقق من صحة اختيار المنصة
     * @returns {boolean} true إذا كانت منصة محددة
     */
    isValid() {
        return this.selectedPlatform !== null && this.selectedPlatform !== '';
    }

    /**
     * إعادة تعيين المنصة المختارة
     */
    reset() {
        this.clearAllSelections();
        this.selectedPlatform = null;
        this.updatePlatformInput('');
        console.log('🎮 Platform selection reset');
    }

    /**
     * الحصول على معلومات المنصة المختارة
     * @returns {Object} معلومات المنصة
     */
    getPlatformInfo() {
        if (!this.selectedPlatform) {
            return null;
        }

        const platformNames = {
            'playstation': 'PlayStation',
            'xbox': 'Xbox',
            'pc': 'PC'
        };

        const platformIcons = {
            'playstation': 'fab fa-playstation',
            'xbox': 'fab fa-xbox',
            'pc': 'fas fa-desktop'
        };

        return {
            key: this.selectedPlatform,
            name: platformNames[this.selectedPlatform] || this.selectedPlatform,
            icon: platformIcons[this.selectedPlatform] || 'fas fa-gamepad',
            isValid: this.isValid()
        };
    }

    /**
     * تدمير الوحدة وتنظيف المستمعين
     */
    destroy() {
        this.platformCards.forEach(card => {
            // إزالة مستمعي الأحداث (Clone and replace method)
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });

        this.reset();
        this.initialized = false;
        console.log('🎮 Platform Module destroyed');
    }
}

// إنشاء instance عام للوحدة
const platformModule = new PlatformModule();

// تصدير للاستخدام الخارجي
window.FC26PlatformModule = platformModule;

// تهيئة تلقائية عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        platformModule.init();
    });
} else {
    platformModule.init();
}

// تصدير ES6 للوحدات
export default platformModule;
export { PlatformModule };
