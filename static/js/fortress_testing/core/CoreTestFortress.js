// 🏰 Fort Knox Digital Identity - Core Testing Fortress
// نواة نظام الاختبار الذاتي المتكامل
// تاريخ الإنشاء: 2024-08-28
// الإصدار: v1.0.0

(function() {
    'use strict';
    
    const FORTRESS_NAME = 'CoreTestFortress';
    const VERSION = '1.0.0';
    
    // 🔒 نواة الاختبار المحمية
    class CoreTestFortress {
        constructor() {
            this.results = [];
            this.isRunning = false;
            this.startTime = null;
        }
        
        // 🚀 تشغيل جميع الاختبارات
        async runAllTests() {
            if (this.isRunning) {
                console.warn(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] ⚠️ الاختبارات قيد التشغيل بالفعل`, 
                    'color: #f59e0b; font-weight: bold;');
                return this.results;
            }
            
            this.isRunning = true;
            this.startTime = performance.now();
            this.results = [];
            
            console.log(`%c🚀 Starting Fort Knox Auto-Tests...`, 'color: #3b82f6; font-size: 12px;');
            
            // تشغيل مجموعات الاختبار
            await this.runCryptoTests();
            await this.runIdentityTests();
            await this.runIntegrationTests();
            await this.runPerformanceTests();
            await this.runSecurityTests();
            
            this.isRunning = false;
            const totalTime = performance.now() - this.startTime;
            
            // إحصائيات النتائج
            const passed = this.results.filter(r => r.status === 'passed').length;
            const failed = this.results.filter(r => r.status === 'failed').length;
            const total = this.results.length;
            
            // طباعة الملخص
            console.group('🏰 Fort Knox Self-Testing Summary');
            console.log(`📊 إجمالي الاختبارات: ${total}`);
            console.log(`✅ نجح: ${passed}`);
            console.log(`❌ فشل: ${failed}`);
            console.log(`📈 معدل النجاح: ${((passed/total)*100).toFixed(2)}%`);
            console.log(`⏱️ وقت التنفيذ: ${totalTime.toFixed(2)}ms`);
            console.groupEnd();
            
            return this.results;
        }
        
        // 🔐 اختبارات التشفير
        async runCryptoTests() {
            const testSuite = 'CryptoEngine Tests';
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🧪 تشغيل مجموعة: ${testSuite}`, 
                'color: #3b82f6; font-weight: bold;');
            
            // اختبار وجود CryptoEngine
            try {
                if (window.CryptoFortressAPI) {
                    this.logResult('CryptoEngine Exists', 'passed');
                } else {
                    this.logResult('CryptoEngine Exists', 'failed', 'CryptoFortressAPI not found');
                }
            } catch (error) {
                this.logResult('CryptoEngine Exists', 'failed', error.message);
            }
        }
        
        // 🕵️ اختبارات الهوية الصامتة
        async runIdentityTests() {
            const testSuite = 'SilentIdentity Tests';
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🧪 تشغيل مجموعة: ${testSuite}`, 
                'color: #3b82f6; font-weight: bold;');
            
            try {
                if (window.SilentIdentityAPI) {
                    this.logResult('SilentIdentity Exists', 'passed');
                } else {
                    this.logResult('SilentIdentity Exists', 'failed', 'SilentIdentityAPI not found');
                }
            } catch (error) {
                this.logResult('SilentIdentity Exists', 'failed', error.message);
            }
        }
        
        // 🌉 اختبارات التكامل
        async runIntegrationTests() {
            const testSuite = 'Integration Tests';
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🧪 تشغيل مجموعة: ${testSuite}`, 
                'color: #3b82f6; font-weight: bold;');
            
            try {
                if (window.FC26IntegrationBridge) {
                    this.logResult('Integration Bridge Test', 'passed');
                } else {
                    this.logResult('Integration Bridge Test', 'failed', 'FC26IntegrationBridge not found');
                }
            } catch (error) {
                this.logResult('Integration Bridge Test', 'failed', error.message);
            }
        }
        
        // ⚡ اختبارات الأداء
        async runPerformanceTests() {
            const testSuite = 'Performance Tests';
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🧪 تشغيل مجموعة: ${testSuite}`, 
                'color: #3b82f6; font-weight: bold;');
            
            try {
                const loadTime = performance.now();
                if (loadTime < 5000) {
                    this.logResult('Page Load Time', 'passed');
                } else {
                    this.logResult('Page Load Time', 'failed', 'Load time too slow');
                }
            } catch (error) {
                this.logResult('Page Load Time', 'failed', error.message);
            }
        }
        
        // 🔒 اختبارات الأمان
        async runSecurityTests() {
            const testSuite = 'Security Tests';
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🧪 تشغيل مجموعة: ${testSuite}`, 
                'color: #3b82f6; font-weight: bold;');
            
            try {
                if (window.crypto && window.crypto.subtle) {
                    this.logResult('Web Crypto Available', 'passed');
                } else {
                    this.logResult('Web Crypto Available', 'failed', 'Web Crypto API not available');
                }
            } catch (error) {
                this.logResult('Web Crypto Available', 'failed', error.message);
            }
        }
        
        // 📝 تسجيل النتائج
        logResult(testName, status, message = '') {
            const result = {
                name: testName,
                status: status,
                message: message,
                timestamp: new Date().toISOString()
            };
            
            this.results.push(result);
            
            const color = status === 'passed' ? '#22c55e' : '#ef4444';
            const icon = status === 'passed' ? '✅' : '❌';
            
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] ${icon} ${testName}${message ? ': ' + message : ''}`, 
                `color: ${color}; font-weight: bold;`);
        }
        
        // 📊 إحصائيات النتائج
        getStats() {
            const total = this.results.length;
            const passed = this.results.filter(r => r.status === 'passed').length;
            const failed = this.results.filter(r => r.status === 'failed').length;
            
            return {
                total,
                passed,
                failed,
                successRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0
            };
        }
    }
    
    // 🏰 إنشاء مثيل نواة الاختبار
    const fortress = new CoreTestFortress();
    
    // 🔒 واجهة API محمية
    window.CoreTestFortressAPI = Object.freeze({
        runAllTests: () => fortress.runAllTests(),
        getResults: () => fortress.results,
        getStats: () => fortress.getStats(),
        isRunning: () => fortress.isRunning,
        getVersion: () => VERSION,
        getName: () => FORTRESS_NAME
    });
    
    console.log(`%c🏰 CoreTestFortress loaded successfully!`, 
        'color: #10b981; font-size: 14px; font-weight: bold;');
    
    // 🚀 تشغيل تلقائي عند التحميل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => fortress.runAllTests(), 2000);
        });
    } else {
        setTimeout(() => fortress.runAllTests(), 2000);
    }
    
})();