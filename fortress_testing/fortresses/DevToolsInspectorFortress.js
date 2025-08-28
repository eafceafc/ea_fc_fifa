// 🔍 Fort Knox Digital Identity - DevTools Inspector Fortress
// مراقب أدوات المطور المتقدم
// تاريخ الإنشاء: 2024-08-28
// الإصدار: v1.0.0

(function() {
    'use strict';
    
    const FORTRESS_NAME = 'DevToolsInspector';
    const VERSION = '1.0.0';
    
    // 🔒 مراقب أدوات المطور المحمي
    class DevToolsInspector {
        constructor() {
            this.isMonitoring = false;
            this.logs = {
                console: [],
                network: [],
                storage: [],
                performance: []
            };
            this.originalConsole = {};
        }
        
        // 🚀 بدء المراقبة
        startMonitoring() {
            if (this.isMonitoring) {
                console.warn(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] ⚠️ المراقبة نشطة بالفعل`, 
                    'color: #f59e0b; font-weight: bold;');
                return;
            }
            
            this.isMonitoring = true;
            this.interceptConsole();
            this.interceptNetwork();
            this.monitorStorage();
            this.monitorPerformance();
            
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🔍 بدء المراقبة المستمرة`, 
                'color: #22c55e; font-weight: bold;');
        }
        
        // 🛑 إيقاف المراقبة
        stopMonitoring() {
            this.isMonitoring = false;
            this.restoreConsole();
            
            console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] ⏹️ تم إيقاف المراقبة`, 
                'color: #ef4444; font-weight: bold;');
        }
        
        // 🖥️ اعتراض console
        interceptConsole() {
            const self = this;
            ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
                this.originalConsole[method] = console[method];
                console[method] = function(...args) {
                    self.logs.console.push({
                        type: method,
                        message: args.join(' '),
                        timestamp: new Date().toISOString(),
                        stack: method === 'error' ? new Error().stack : null
                    });
                    
                    // استدعاء الدالة الأصلية
                    self.originalConsole[method].apply(console, args);
                };
            });
        }
        
        // 🔄 استعادة console
        restoreConsole() {
            Object.keys(this.originalConsole).forEach(method => {
                console[method] = this.originalConsole[method];
            });
        }
        
        // 🌐 اعتراض Network
        interceptNetwork() {
            const self = this;
            
            // اعتراض fetch
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                const startTime = performance.now();
                
                return originalFetch.apply(this, arguments).then(response => {
                    const endTime = performance.now();
                    self.logs.network.push({
                        url: url,
                        method: options?.method || 'GET',
                        status: response.status,
                        statusText: response.statusText,
                        duration: endTime - startTime,
                        timestamp: new Date().toISOString(),
                        type: 'fetch'
                    });
                    
                    return response;
                }).catch(error => {
                    const endTime = performance.now();
                    self.logs.network.push({
                        url: url,
                        method: options?.method || 'GET',
                        status: 0,
                        statusText: 'Network Error',
                        duration: endTime - startTime,
                        timestamp: new Date().toISOString(),
                        error: error.message,
                        type: 'fetch'
                    });
                    
                    throw error;
                });
            };
        }
        
        // 💾 مراقبة Storage
        monitorStorage() {
            const self = this;
            
            // مراقبة localStorage
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function(key, value) {
                self.logs.storage.push({
                    type: 'localStorage',
                    action: 'setItem',
                    key: key,
                    value: value?.length > 100 ? value.substring(0, 100) + '...' : value,
                    timestamp: new Date().toISOString()
                });
                
                return originalSetItem.apply(this, arguments);
            };
        }
        
        // ⚡ مراقبة الأداء
        monitorPerformance() {
            const self = this;
            
            // مراقب الذاكرة
            if ('memory' in performance) {
                setInterval(() => {
                    if (!this.isMonitoring) return;
                    
                    self.logs.performance.push({
                        type: 'memory',
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit,
                        timestamp: new Date().toISOString()
                    });
                }, 30000); // كل 30 ثانية
            }
        }
        
        // 📊 الحصول على السجلات
        getLogs(type = null) {
            if (type) {
                return this.logs[type] || [];
            }
            return this.logs;
        }
        
        // 📈 إحصائيات
        getStats() {
            return {
                consoleLogs: this.logs.console.length,
                networkRequests: this.logs.network.length,
                storageOperations: this.logs.storage.length,
                performanceEntries: this.logs.performance.length,
                isMonitoring: this.isMonitoring
            };
        }
        
        // 🚨 أخطاء Console
        getConsoleErrors() {
            return this.logs.console.filter(log => log.type === 'error');
        }
        
        // 📋 تقرير شامل
        generateReport() {
            const errors = this.getConsoleErrors();
            const failedRequests = this.logs.network.filter(req => req.status >= 400);
            const stats = this.getStats();
            
            return {
                timestamp: new Date().toISOString(),
                fortress: FORTRESS_NAME,
                version: VERSION,
                stats: stats,
                errors: errors,
                failedRequests: failedRequests,
                summary: {
                    totalErrors: errors.length,
                    networkErrors: failedRequests.length,
                    monitoringActive: this.isMonitoring
                }
            };
        }
    }
    
    // 🏰 إنشاء مثيل المراقب
    const inspector = new DevToolsInspector();
    
    // 🔒 واجهة API محمية
    window.DevToolsInspectorAPI = Object.freeze({
        startMonitoring: () => inspector.startMonitoring(),
        stopMonitoring: () => inspector.stopMonitoring(),
        isMonitoring: () => inspector.isMonitoring,
        getLogs: (type) => inspector.getLogs(type),
        getStats: () => inspector.getStats(),
        getConsoleErrors: () => inspector.getConsoleErrors(),
        generateReport: () => inspector.generateReport(),
        getVersion: () => VERSION,
        getName: () => FORTRESS_NAME
    });
    
    console.log(`%c[${new Date().toLocaleTimeString()}] [${FORTRESS_NAME}] 🔍 تم تهيئة مفتش أدوات المطور`, 
        'color: #6366f1; font-weight: bold;');
    
    console.log(`%c🔍 DevToolsInspectorFortress loaded successfully!`, 
        'color: #6366f1; font-size: 14px; font-weight: bold;');
    
    // بدء المراقبة التلقائية
    inspector.startMonitoring();
    
})();