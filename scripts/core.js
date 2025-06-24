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
    const oldKeys = ['GROK_API_KEY', 'SELECTED_AI_MODEL'];
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Removing old localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Also clean up LP_ENV prefixed API keys
    const lpEnvKeys = ['LP_ENV_GROK_API_KEY'];
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

  initialize(grokKey) {
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

// Error Display System - Console Only
class ErrorDisplayManager {
  constructor() {
    // Simplified constructor - no UI elements
  }

  addError(error) {
    // Only log to console - no UI display
    const errorInfo = {
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {},
      stack: error.stack || 'No stack trace',
      timestamp: new Date().toISOString()
    };

    console.error('[ErrorDisplay]', errorInfo.code + ':', errorInfo.message);
    if (Object.keys(errorInfo.details).length > 0) {
      console.error('[ErrorDisplay] Details:', errorInfo.details);
    }
  }

  // All UI methods removed - console logging only
}

// Global error handler - console only
function handleGlobalError(error) {
  console.error('Global error caught:', error);
}

// Keep original console.error behavior only
const originalConsoleError = console.error;

// Catch unhandled promise rejections - console only
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Catch global JavaScript errors - console only
window.addEventListener('error', (event) => {
  console.error('Global JavaScript error:', event.error || event.message);
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