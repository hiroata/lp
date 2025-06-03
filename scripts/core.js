// LP Generator Core Utilities
// Combines: env-loader.js, storage-utils.js, error-management.js

/**
 * APIキーの設定方法:
 * 
 * 1. デフォルト設定 (core.js 9行目):
 *    GROK_API_KEY: 'xai-your-actual-api-key-here'
 * 
 * 2. 環境変数:
 *    export GROK_API_KEY=xai-your-actual-api-key-here
 * 
 * 3. ブラウザのwindow.env:
 *    window.env = { GROK_API_KEY: 'xai-your-actual-api-key-here' };
 * 
 * 4. UI設定画面 (一時的):
 *    設定画面からAPIキーを入力
 */

// Environment Variable Loader
class EnvLoader {
  constructor() {
    // デフォルト設定（APIキーは実行時に入力）
    this.config = {
      GROK_API_KEY: this.getEnvVariable('GROK_API_KEY', ''),
      GROK_MODEL: 'grok-3-latest',
      GROK_API_URL: 'https://api.x.ai/v1',
      DEFAULT_AI_PROVIDER: 'grok',
      LOG_LEVEL: 'INFO'
    };
    
    this.loadFromLocalStorage();
    
    // Clean up old localStorage API keys for security
    this.cleanupOldApiKeys();
    
    // APIキーの状態を確認
    if (!this.config.GROK_API_KEY) {
      console.log('📝 APIキーは実行時に入力してください。');
    } else {
      console.log('✅ Grok APIキーが設定されました (core.js)');
    }
  }

  cleanupOldApiKeys() {
    // Clean up old localStorage API keys for security
    const oldKeys = ['GROK_API_KEY', 'GEMINI_API_KEY', 'SELECTED_AI_MODEL'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Removing old localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Also clean up LP_ENV prefixed API keys
    const lpEnvKeys = ['LP_ENV_GROK_API_KEY', 'LP_ENV_GEMINI_API_KEY'];
    lpEnvKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Removing old localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  getEnvVariable(key, defaultValue) {
    // Try to get from various sources (excluding localStorage for security)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    
    // Try to get from window environment (if set)
    if (typeof window !== 'undefined' && window.env && window.env[key]) {
      return window.env[key];
    }
    
    // Return default value (no localStorage check for API keys)
    return defaultValue;
  }

  loadFromLocalStorage() {
    Object.keys(this.config).forEach(key => {
      // Skip API keys for security (use session-only storage)
      if (key.includes('API_KEY')) {
        return;
      }
      
      const stored = localStorage.getItem(`LP_ENV_${key}`);
      if (stored) {
        this.config[key] = stored;
      }
    });
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    localStorage.setItem(`LP_ENV_${key}`, value);
  }

  initialize(geminiKey, grokKey) {
    if (grokKey) this.set('GROK_API_KEY', grokKey);
  }

  validate() {
    const hasGrok = !!this.config.GROK_API_KEY;
    
    return {
      valid: hasGrok,
      issues: [],
      hasGrok
    };
  }

  clear() {
    Object.keys(this.config).forEach(key => {
      localStorage.removeItem(`LP_ENV_${key}`);
      if (key.includes('API_KEY')) {
        this.config[key] = ''; // Reset to empty
      }
    });
    
    // Also clear legacy localStorage keys
    localStorage.removeItem('GROK_API_KEY');
    localStorage.removeItem('SELECTED_AI_MODEL');
    
    // Clear session storage
    sessionStorage.removeItem('TEMP_GROK_API_KEY');
    
    // Also clear non-config data
    localStorage.removeItem('LP_ENV_ANALYSIS_DATA');
    localStorage.removeItem('LP_ENV_GENERATED_LP');
    localStorage.removeItem('LP_ENV_SELECTED_AI_MODEL');
    
    console.log('🗑️ All API keys and cached data cleared');
  }
}

// Enhanced Error Management
class ErrorWithDetails extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ErrorWithDetails';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static createAPIError(service, status, message, solution = null) {
    const solutions = {
      401: `${service} APIキーが無効です。設定を確認してください。`,
      403: `${service} APIキーの権限が不足しています。`,
      429: 'APIレート制限に達しました。しばらく待ってから再試行してください。',
      500: `${service}サーバーエラーです。しばらく待ってから再試行してください。`,
      'network': 'ネットワーク接続を確認してください。'
    };
    
    return new ErrorWithDetails(
      `${service} API Error: ${message}`,
      `${service.toUpperCase()}_API_ERROR`,
      {
        status,
        solution: solution || solutions[status] || solutions.network,
        service,
        timestamp: new Date().toISOString()
      }
    );
  }

  static createValidationError(field, value, expectedFormat) {
    return new ErrorWithDetails(
      `入力エラー: ${field}`,
      'VALIDATION_ERROR',
      {
        field,
        value: value ? value.substring(0, 10) + '...' : 'empty',
        expectedFormat,
        solution: `${field}を正しい形式で入力してください: ${expectedFormat}`
      }
    );
  }
}

// Storage Utilities
const StorageUtils = {
  saveApiKeys(keys) {
    Object.entries(keys).forEach(([key, value]) => {
      if (value && value.trim()) {
        window.envLoader.set(key.replace('_API_KEY', '_API_KEY'), value.trim());
      }
    });
  },

  getApiKey(service) {
    return window.envLoader.get(`${service}_API_KEY`);
  },

  clearApiKeys() {
    window.envLoader.clear();
  },

  saveAnalysisData(data) {
    window.envLoader.set('ANALYSIS_DATA', JSON.stringify(data));
  },

  getAnalysisData() {
    const data = window.envLoader.get('ANALYSIS_DATA');
    return data ? JSON.parse(data) : null;
  },

  saveGeneratedLP(lpData) {
    window.envLoader.set('GENERATED_LP', JSON.stringify(lpData));
  },

  getGeneratedLP() {
    const data = window.envLoader.get('GENERATED_LP');
    return data ? JSON.parse(data) : null;
  }
};

// Validation Utilities
const ValidationUtils = {
  validateApiKey(service, key) {
    if (!key || !key.trim()) return false;
    
    const patterns = {
      GROK: /^xai-/
    };

    return patterns[service] ? patterns[service].test(key) : true;
  },

  validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  },

  validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

// Error Display System
class ErrorDisplayManager {
  constructor() {
    this.errors = [];
    this.maxErrors = 10;
    this.container = null;
    this.isVisible = false;
  }

  init() {
    this.createContainer();
    this.injectStyles();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'errorDisplayContainer';
    this.container.className = 'error-display-container hidden';
    this.container.innerHTML = `
      <div class="error-display-header">
        <h3>🚨 エラーログ</h3>
        <div class="error-display-actions">
          <button class="btn-copy" onclick="window.errorDisplay.copyAllErrors()">📋 全てコピー</button>
          <button class="btn-clear" onclick="window.errorDisplay.clearErrors()">🗑️ クリア</button>
          <button class="btn-close" onclick="window.errorDisplay.hide()">✕</button>
        </div>
      </div>
      <div class="error-display-body" id="errorDisplayBody">
        <div class="no-errors">
          <div class="no-errors-icon">✅</div>
          <div class="no-errors-text">エラーはありません</div>
        </div>
      </div>
    `;
    document.body.appendChild(this.container);
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .error-display-container {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 70vh;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 9999;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .error-display-container.hidden {
        transform: translateX(120%);
        opacity: 0;
      }
      
      .error-display-header {
        background: #f8fafc;
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .error-display-header h3 {
        margin: 0;
        font-size: 16px;
        color: #1e293b;
      }
      
      .error-display-actions {
        display: flex;
        gap: 8px;
      }
      
      .error-display-actions button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .btn-copy {
        background: #3b82f6;
        color: white;
      }
      
      .btn-copy:hover {
        background: #2563eb;
      }
      
      .btn-clear {
        background: #ef4444;
        color: white;
      }
      
      .btn-clear:hover {
        background: #dc2626;
      }
      
      .btn-close {
        background: #6b7280;
        color: white;
      }
      
      .btn-close:hover {
        background: #4b5563;
      }
      
      .error-display-body {
        max-height: 50vh;
        overflow-y: auto;
        padding: 16px;
      }
      
      .error-item {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        position: relative;
      }
      
      .error-item:last-child {
        margin-bottom: 0;
      }
      
      .error-item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      
      .error-title {
        font-weight: 600;
        color: #dc2626;
        font-size: 14px;
        flex: 1;
        margin-right: 8px;
      }
      
      .error-time {
        font-size: 11px;
        color: #6b7280;
        white-space: nowrap;
      }
      
      .error-message {
        color: #991b1b;
        font-size: 13px;
        margin-bottom: 8px;
        line-height: 1.4;
      }
      
      .error-details {
        background: #fee2e2;
        border-radius: 4px;
        padding: 8px;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 11px;
        color: #7f1d1d;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 100px;
        overflow-y: auto;
      }
      
      .error-copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #dc2626;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 6px;
        font-size: 10px;
        cursor: pointer;
      }
      
      .error-copy-btn:hover {
        background: #b91c1c;
      }
      
      .no-errors {
        text-align: center;
        padding: 32px 16px;
        color: #6b7280;
      }
      
      .no-errors-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .no-errors-text {
        font-size: 16px;
        font-weight: 500;
      }
      
      .error-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc2626;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        cursor: pointer;
        transition: all 0.3s ease;
        max-width: 300px;
      }
      
      .error-toast:hover {
        background: #b91c1c;
      }
      
      .error-toast-message {
        font-size: 14px;
        font-weight: 500;
      }
      
      .error-toast-time {
        font-size: 11px;
        opacity: 0.8;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  addError(error) {
    const errorInfo = {
      id: Date.now() + Math.random(),
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {},
      stack: error.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString()
    };

    this.errors.unshift(errorInfo);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    this.showToast(errorInfo);
    this.updateDisplay();
  }

  showToast(errorInfo) {
    // Remove existing toast
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-toast-message">🚨 エラーが発生しました</div>
      <div class="error-toast-time">${errorInfo.time} - クリックで詳細表示</div>
    `;
    
    toast.onclick = () => {
      this.show();
      toast.remove();
    };

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  updateDisplay() {
    if (!this.container) return;

    const body = document.getElementById('errorDisplayBody');
    if (!body) return;

    if (this.errors.length === 0) {
      body.innerHTML = `
        <div class="no-errors">
          <div class="no-errors-icon">✅</div>
          <div class="no-errors-text">エラーはありません</div>
        </div>
      `;
      return;
    }

    body.innerHTML = this.errors.map(error => `
      <div class="error-item">
        <button class="error-copy-btn" onclick="window.errorDisplay.copyError('${error.id}')">📋</button>
        <div class="error-item-header">
          <div class="error-title">${error.code}</div>
          <div class="error-time">${error.time}</div>
        </div>
        <div class="error-message">${this.escapeHtml(error.message)}</div>
        <div class="error-details">${this.formatErrorDetails(error)}</div>
      </div>
    `).join('');
  }

  formatErrorDetails(error) {
    let details = `Code: ${error.code}\n`;
    details += `Time: ${error.timestamp}\n`;
    details += `Message: ${error.message}\n`;
    
    if (error.details && Object.keys(error.details).length > 0) {
      details += `\nDetails:\n${JSON.stringify(error.details, null, 2)}\n`;
    }
    
    if (error.stack) {
      details += `\nStack Trace:\n${error.stack}`;
    }
    
    return this.escapeHtml(details);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  show() {
    if (!this.container) return;
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  hide() {
    if (!this.container) return;
    this.container.classList.add('hidden');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  clearErrors() {
    this.errors = [];
    this.updateDisplay();
  }

  copyError(errorId) {
    const error = this.errors.find(e => e.id.toString() === errorId);
    if (!error) return;

    const errorText = this.formatErrorDetails(error).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
    
    navigator.clipboard.writeText(errorText).then(() => {
      this.showSuccessMessage('エラー詳細をコピーしました');
    }).catch(() => {
      console.error('Failed to copy error details');
    });
  }

  copyAllErrors() {
    if (this.errors.length === 0) return;

    const allErrorsText = this.errors.map(error => 
      this.formatErrorDetails(error).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    ).join('\n\n' + '='.repeat(50) + '\n\n');

    navigator.clipboard.writeText(allErrorsText).then(() => {
      this.showSuccessMessage(`${this.errors.length}件のエラーをコピーしました`);
    }).catch(() => {
      console.error('Failed to copy all errors');
    });
  }

  showSuccessMessage(message) {
    const existingSuccess = document.querySelector('.success-toast');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
    `;
    toast.textContent = `✅ ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }
}

// Global error handler
function handleGlobalError(error) {
  console.error('Global error caught:', error);
  
  if (window.errorDisplay) {
    window.errorDisplay.addError(error);
  }
}

// Override console.error to catch all errors
const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  
  if (window.errorDisplay && args.length > 0) {
    const errorMessage = args.join(' ');
    const syntheticError = new ErrorWithDetails(
      errorMessage,
      'CONSOLE_ERROR',
      {
        arguments: args,
        timestamp: new Date().toISOString()
      }
    );
    window.errorDisplay.addError(syntheticError);
  }
};

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (window.errorDisplay) {
    const error = event.reason instanceof Error ? event.reason : 
      new ErrorWithDetails(
        'Unhandled Promise Rejection: ' + String(event.reason),
        'UNHANDLED_PROMISE_REJECTION',
        { reason: event.reason }
      );
    window.errorDisplay.addError(error);
  }
});

// Catch global JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error || event.message);
  
  if (window.errorDisplay) {
    const error = event.error || new ErrorWithDetails(
      event.message || 'Unknown JavaScript error',
      'JAVASCRIPT_ERROR',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
    window.errorDisplay.addError(error);
  }
});

// Export utilities
window.EnvLoader = EnvLoader;
window.ErrorWithDetails = ErrorWithDetails;
window.StorageUtils = StorageUtils;
window.ValidationUtils = ValidationUtils;
window.ErrorDisplayManager = ErrorDisplayManager;

// Initialize environment loader and error display
window.envLoader = new EnvLoader();
window.errorDisplay = new ErrorDisplayManager();