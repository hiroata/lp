// Error prevention utilities

// Safe DOM element getter
window.safeGetElement = function(id) {
    try {
        return document.getElementById(id);
    } catch (e) {
        console.warn(`Failed to get element with id: ${id}`, e);
        return null;
    }
};

// Safe query selector
window.safeQuerySelector = function(selector) {
    try {
        return document.querySelector(selector);
    } catch (e) {
        console.warn(`Failed to query selector: ${selector}`, e);
        return null;
    }
};

// Safe query selector all
window.safeQuerySelectorAll = function(selector) {
    try {
        return document.querySelectorAll(selector) || [];
    } catch (e) {
        console.warn(`Failed to query selector all: ${selector}`, e);
        return [];
    }
};

// Override console methods to prevent errors in production
if (!window.console) {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {},
        info: function() {},
        debug: function() {},
        group: function() {},
        groupEnd: function() {}
    };
}

// Ensure global variables are initialized
window.selectedPrompts = window.selectedPrompts || [];
window.selectedCopywriterStyles = window.selectedCopywriterStyles || [];
window.isGenerating = window.isGenerating || false;

// Error boundary for async functions
window.safeAsync = function(fn) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            console.error('Async function error:', error);
            if (window.lpApp?.uiController?.showError) {
                window.lpApp.uiController.showError(`エラーが発生しました: ${error.message}`);
            }
            throw error;
        }
    };
};

// Safe storage access
window.safeStorage = {
    getItem: function(key, storage = 'session') {
        try {
            const store = storage === 'local' ? localStorage : sessionStorage;
            return store.getItem(key);
        } catch (e) {
            console.warn(`Failed to get ${storage} storage item: ${key}`, e);
            return null;
        }
    },
    
    setItem: function(key, value, storage = 'session') {
        try {
            const store = storage === 'local' ? localStorage : sessionStorage;
            store.setItem(key, value);
            return true;
        } catch (e) {
            console.warn(`Failed to set ${storage} storage item: ${key}`, e);
            return false;
        }
    },
    
    removeItem: function(key, storage = 'session') {
        try {
            const store = storage === 'local' ? localStorage : sessionStorage;
            store.removeItem(key);
            return true;
        } catch (e) {
            console.warn(`Failed to remove ${storage} storage item: ${key}`, e);
            return false;
        }
    }
};

// Initialize error prevention
console.log('✅ Error prevention utilities loaded');