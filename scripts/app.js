// LP Generator - Comprehensive Application
// Combined and optimized from all modules for a single-file solution

// ================================
// UTILITY FUNCTIONS AND HELPERS
// ================================

// ================================
// API CONFIGURATION FUNCTIONS
// ================================

// Current selected provider
let currentProvider = 'openai';

// Provider configurations
const providerConfigs = {
  openai: {
    name: 'OpenAI',
    icon: '🤖',
    model: 'gpt-4o',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyPrefix: 'sk-',
    placeholder: ''
  },
  anthropic: {
    name: 'Anthropic',
    icon: '🧠',
    model: 'claude-sonnet-4-20250514',  // Claude 4 Sonnet
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyPrefix: 'sk-ant-',
    placeholder: ''
  },
  grok: {
    name: 'Grok',
    icon: '🚀',
    model: 'grok-3-latest',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    keyPrefix: 'xai-',
    placeholder: ''
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🔍',
    model: 'deepseek-r1',  // DeepSeek R1 Reasoner
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    keyPrefix: 'sk-',
    placeholder: ''
  }
};

// Select provider tab
function selectProvider(provider) {
  currentProvider = provider;
  
  // Update tabs
  document.querySelectorAll('.provider-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Show/hide configs
  document.querySelectorAll('.provider-config').forEach(config => {
    config.style.display = 'none';
  });
  document.getElementById(`${provider}Config`).style.display = 'block';
  
  // Update status based on saved key
  checkProviderStatus(provider);
}

// Check if provider has saved API key
function checkProviderStatus(provider) {
  const apiKey = sessionStorage.getItem(`TEMP_${provider.toUpperCase()}_API_KEY`);
  if (apiKey) {
    updateApiStatus('success', '✅', `${providerConfigs[provider].name} APIキーが設定されています`);
  } else {
    updateApiStatus('info', '⚠️', `${providerConfigs[provider].name} APIキーを入力してください`);
  }
}

// Set default API key from the development guide
function setDefaultApiKey() {
  const apiKeyInput = document.getElementById('grokApiKeyInput');
  
  if (apiKeyInput) {
    apiKeyInput.placeholder = 'xai-で始まるAPIキーを入力してください';
    updateApiStatus('info', '⚠️', 'APIキーを入力してください。');
  }
}

// Save API key to storage
function saveApiKey() {
  const apiKeyInput = document.getElementById('grokApiKeyInput');
  const apiKey = apiKeyInput?.value?.trim();
  
  if (!apiKey) {
    updateApiStatus('error', '❌', 'APIキーが入力されていません');
    return;
  }
  
  if (!apiKey.startsWith('xai-')) {
    updateApiStatus('error', '❌', 'Grok APIキーは "xai-" で始まる必要があります');
    return;
  }
  
  try {
    // Save temporarily to sessionStorage only (cleared on page reload)
    sessionStorage.setItem('TEMP_GROK_API_KEY', apiKey);
    
    updateApiStatus('success', '✅', 'APIキーが一時保存されました（ページリロード時に消去）');
    
    // Update input placeholder to show key is temporarily saved
    if (apiKeyInput) {
      apiKeyInput.placeholder = `${apiKey.substring(0, 10)}... (一時保存中)`;
      apiKeyInput.value = ''; // Clear the input field
    }
    
    // Update model selector if present
    updateModelStatus();
    
    // Auto-select Grok after saving API key
    setTimeout(() => {
      if (window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
        const selectedModel = window.lpApp.core.aiService.getSelectedModel();
        const availableServices = window.lpApp.core.aiService.getAvailableServices();
        if (!selectedModel && availableServices.includes('grok')) {
          console.log('Auto-selecting Grok after API key save');
          window.lpApp.selectAIModel('grok');
        }
      }
    }, 100);
    
    // Show upload actions
    const uploadActions = document.getElementById('uploadActions');
    if (uploadActions) {
      uploadActions.style.display = 'flex';
    }
    
  } catch (error) {
    console.error('API key save error:', error);
    updateApiStatus('error', '❌', 'APIキーの保存に失敗しました');
  }
}

// Save all API keys
function saveAllApiKeys() {
  let savedCount = 0;
  
  for (const provider of Object.keys(providerConfigs)) {
    const input = document.getElementById(`${provider}ApiKeyInput`);
    const apiKey = input?.value?.trim();
    
    if (apiKey) {
      const config = providerConfigs[provider];
      
      // Validate key prefix
      if (!apiKey.startsWith(config.keyPrefix)) {
        showTestResult('error', `${config.name} APIキーは "${config.keyPrefix}" で始まる必要があります`);
        continue;
      }
      
      // Save to sessionStorage
      sessionStorage.setItem(`TEMP_${provider.toUpperCase()}_API_KEY`, apiKey);
      savedCount++;
      
      // Clear input and update placeholder
      input.value = '';
      input.placeholder = `${apiKey.substring(0, 10)}... (一時保存中)`;
    }
  }
  
  if (savedCount > 0) {
    updateApiStatus('success', '✅', `${savedCount}個のAPIキーが一時保存されました`);
    showTestResult('success', `${savedCount}個のAPIキーが保存されました。ページリロード時に消去されます。`);
  } else {
    updateApiStatus('info', '⚠️', 'APIキーが入力されていません');
    showTestResult('error', '保存するAPIキーを入力してください');
  }
}

// Test API connection for any provider
async function testApiConnection(provider) {
  console.log(`🔍 Testing API connection for provider: ${provider}`);
  
  // Get API key from session storage (new auto-detect system)
  const apiKey = sessionStorage.getItem(`TEMP_${provider.toUpperCase()}_API_KEY`);
  
  console.log(`🔍 API key from session storage: ${!!apiKey}`);
  
  if (!apiKey) {
    console.error(`❌ No API key found in session storage for ${provider}`);
    throw new Error(`APIキーが設定されていません: ${provider}`);
  }
  
  const config = providerConfigs[provider];
  
  if (!config) {
    console.error(`Provider config not found for: ${provider}`);
    throw new Error(`設定が見つかりません: ${provider}`);
  }
  
  if (!apiKey.startsWith(config.keyPrefix)) {
    throw new Error(`${config.name} APIキーは "${config.keyPrefix}" で始まる必要があります`);
  }
  
  // Use AIService to test the connection
  const aiService = new AIService();
  await aiService.testConnection(provider);
  
  console.log(`✅ ${config.name} API connection test successful`);
  return true;
}

// Show test result with proper styling
function showTestResult(type, content) {
  const testResult = document.getElementById('testResult');
  if (!testResult) return;
  
  testResult.style.display = 'block';
  testResult.className = `test-result ${type}`;
  testResult.innerHTML = content;
  
  // Auto-hide after 10 seconds for success
  if (type === 'success') {
    setTimeout(() => {
      testResult.style.display = 'none';
    }, 10000);
  }
}

// Toggle API key visibility
function toggleApiKeyVisibility(inputId) {
  const input = document.getElementById(inputId);
  const toggleIcon = document.getElementById(inputId + 'Toggle');
  
  if (!input || !toggleIcon) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    toggleIcon.textContent = '🙈';
  } else {
    input.type = 'password';
    toggleIcon.textContent = '👁️';
  }
}

// Update API status display
function updateApiStatus(type, indicator, text) {
  const statusElement = document.getElementById('apiStatus');
  const indicatorElement = document.getElementById('statusIndicator');
  const textElement = document.getElementById('statusText');
  
  // If elements don't exist (removed in UI), just log the status
  if (!statusElement || !indicatorElement || !textElement) {
    console.log(`API Status: ${indicator} ${text}`);
    return;
  }
  
  // Remove all status classes
  statusElement.className = 'api-status';
  
  // Add new status class
  if (type === 'success') {
    statusElement.classList.add('connected');
  } else if (type === 'error') {
    statusElement.classList.add('error');
  }
  
  indicatorElement.textContent = indicator;
  textElement.textContent = text;
}

// Check and update API configuration on page load
function initializeApiConfiguration() {
  const apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY') || 
                 window.envLoader?.get('GROK_API_KEY') || 
                 localStorage.getItem('GROK_API_KEY');
  const apiKeyInput = document.getElementById('grokApiKeyInput');
  const isValidKey = apiKey && apiKey.startsWith('xai-');
  
  console.log('🔧 Initializing API configuration:', {
    hasApiKey: !!apiKey,
    isValidKey: isValidKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
  });
  
  if (apiKeyInput) {
    if (isValidKey) {
      // Don't show the actual API key for security
      apiKeyInput.placeholder = `${apiKey.substring(0, 10)}... (設定済み)`;
      updateApiStatus('success', '✅', 'APIキーが設定されています');
    } else {
      // Show message when no API key is saved
      apiKeyInput.placeholder = 'APIキーが入力されていません';
      updateApiStatus('error', '❌', 'APIキーが設定されていません');
    }
  }
  
  // Update button states based on API key availability
  updateGenerationButtonStates(isValidKey);
  updatePromptButtonStates();
  
  if (isValidKey) {
    // Auto-select Grok if API key exists
    setTimeout(() => {
      if (window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
        const selectedModel = window.lpApp.core.aiService.getSelectedModel();
        if (!selectedModel) {
          console.log('Auto-selecting Grok because API key exists');
          window.lpApp.selectAIModel('grok');
        }
      }
    }, 300);
  }
  
  // Update model status
  updateModelStatus();
}

// Update generation button states based on API key availability
function updateGenerationButtonStates(hasValidKey) {
  const buttons = [
    document.querySelector('button[onclick="generateLPDirectly()"]'),
    document.getElementById('generateButton')
  ];
  
  buttons.forEach(button => {
    if (button) {
      button.disabled = !hasValidKey;
      if (!hasValidKey) {
        button.title = 'APIキーを設定してください';
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
      } else {
        button.title = 'LP生成を開始します';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    }
  });
  
  // Also update the upload actions visibility
  const uploadActions = document.getElementById('uploadActions');
  if (uploadActions) {
    uploadActions.style.display = hasValidKey ? 'flex' : 'none';
  }
}

// Update model status in the model selector
function updateModelStatus() {
  const providers = ['openai', 'anthropic', 'grok', 'deepseek'];
  let firstAvailable = null;
  
  providers.forEach(provider => {
    const card = document.getElementById(`${provider}Card`);
    const status = document.getElementById(`${provider}Status`);
    
    if (!card || !status) return;
    
    const apiKey = sessionStorage.getItem(`TEMP_${provider.toUpperCase()}_API_KEY`) ||
                   (provider === 'grok' ? window.envLoader?.get('GROK_API_KEY') || localStorage.getItem('GROK_API_KEY') : null);
    const statusIndicator = status.querySelector('.status-indicator');
    const statusText = status.querySelector('.status-text');
    
    if (apiKey) {
      statusIndicator.className = 'status-indicator available';
      statusText.textContent = '利用可能';
      card.classList.remove('disabled');
      
      if (!firstAvailable) {
        firstAvailable = provider;
      }
    } else {
      statusIndicator.className = 'status-indicator unavailable';
      statusText.textContent = 'APIキー未設定';
      card.classList.add('disabled');
    }
  });
  
  // Auto-select first available model if no model is selected
  if (firstAvailable && window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
    const selectedModel = window.lpApp.core.aiService.getSelectedModel();
    if (!selectedModel) {
      window.lpApp.selectAIModel(firstAvailable);
    }
  }
}



// File utility functions
const FileUtils = {
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  },

  // Get file icon based on extension
  getFileIcon(filename) {
    const ext = this.getFileExtension(filename).toLowerCase();
    const icons = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📊',
      'pptx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'txt': '📄',
      'default': '📎'
    };
    return icons[ext] || icons.default;
  },

  // Validate file type
  isValidFileType(filename) {
    const validExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'txt'];
    const ext = this.getFileExtension(filename).toLowerCase();
    return validExtensions.includes(ext);
  }
};

// Storage utility functions
// StorageUtils is already defined in core.js

// ValidationUtils is already defined in core.js

// Template utilities for HTML generation
const TemplateUtils = {
  createFileItemHTML(file, index) {
    const statusIcons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌'
    };

    const statusText = {
      pending: '待機中',
      processing: '処理中...',
      completed: '完了',
      failed: 'エラー'
    };

    return `
      <div class="file-item ${file.status}" data-index="${index}">
        <div class="file-info">
          <span class="file-icon">${FileUtils.getFileIcon(file.fileName)}</span>
          <div class="file-details">
            <div class="file-name">${file.fileName}</div>
            <div class="file-meta">
              ${FileUtils.formatFileSize(file.size)} • ${file.type}
              ${file.processedAt ? `• ${new Date(file.processedAt).toLocaleTimeString()}` : ''}
            </div>
            ${file.error ? `<div class="file-error">エラー: ${file.error}</div>` : ''}
          </div>
        </div>
        <div class="file-status">
          <span class="status-icon">${statusIcons[file.status] || '❓'}</span>
          <span class="status-text">${statusText[file.status] || file.status}</span>
        </div>
        <div class="file-actions">
          ${file.status === 'failed' ? `<button class="btn-icon" onclick="retryFileProcessing(${index})" title="再処理">🔄</button>` : ''}
          <button class="btn-icon" onclick="removeFile(${index})" title="削除">🗑️</button>
        </div>
      </div>
    `;
  },

  createAnalysisHTML(analysisData) {
    return {
      businessInfo: `
        <div class="info-card">
          <h4>📊 企業情報</h4>
          <p><strong>企業名:</strong> ${analysisData.businessInfo?.companyName || '分析中'}</p>
          <p><strong>サービス名:</strong> ${analysisData.businessInfo?.serviceName || '分析中'}</p>
          <p><strong>業界:</strong> ${analysisData.businessInfo?.industry || '分析中'}</p>
          <p><strong>ビジネスモデル:</strong> ${analysisData.businessInfo?.businessModel || '分析中'}</p>
        </div>
      `,
      targetInfo: `
        <div class="info-card">
          <h4>🎯 ターゲット分析</h4>
          <p><strong>主要ターゲット:</strong> ${analysisData.targetAudience?.primary || '分析中'}</p>
          <p><strong>課題・ニーズ:</strong></p>
          <ul>
            ${(analysisData.targetAudience?.painPoints || ['分析中']).map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      `,
      valueProposition: `
        <div class="info-card">
          <h4>💡 価値提案</h4>
          <p><strong>メインメッセージ:</strong> ${analysisData.valueProposition?.mainMessage || '分析中'}</p>
          <p><strong>独自性:</strong></p>
          <ul>
            ${(analysisData.valueProposition?.uniqueSellingPoints || ['分析中']).map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      `,
      designHints: `
        <div class="info-card">
          <h4>🎨 デザインヒント</h4>
          <p><strong>推奨カラー:</strong> ${(analysisData.designHints?.preferredColors || ['#2563eb']).join(', ')}</p>
          <p><strong>ブランドトーン:</strong> ${analysisData.designHints?.brandTone || '分析中'}</p>
          <p><strong>ロゴイメージ:</strong> ${analysisData.designHints?.logoDescription || '分析中'}</p>
        </div>
      `
    };
  },

  createReferenceCardHTML(ref) {
    const categoryIcon = {
      'hero': '🎯',
      'problem': '💭',
      'solution': '💡',
      'benefits': '🎁',
      'features': '⚙️',
      'testimonials': '💬',
      'pricing': '💰',
      'faq': '❓',
      'trust': '🏆',
      'cta': '🚀',
      'process': '📋',
      'stats': '📊',
      'demo': '🎮',
      'guarantee': '🛡️',
      'team': '👥',
      'integration': '🔗',
      'case-study': '📈',
      'onboarding': '🎯',
      'comparison': '⚖️',
      'credibility': '🏅',
      'calculator': '🧮',
      'social-proof': '👁️',
      'scarcity': '⏰',
      'app': '📱',
      'popup': '🔔',
      'form': '📝',
      'lead-capture': '🎣',
      'support': '💬'
    };

    const icon = categoryIcon[ref.category] || '📄';
    
    return `
      <div class="reference-card" data-id="${ref.id}" onclick="selectReference('${ref.id}')">
        <div class="card-overlay">
          <div class="overlay-actions">
            <button class="btn-primary" onclick="event.stopPropagation(); selectAndGenerate('${ref.id}')">
              🚀 このLPを参考に生成
            </button>
          </div>
        </div>
        <div class="reference-image">
          <div class="image-placeholder">
            <span class="placeholder-icon">${icon}</span>
            <span class="placeholder-text">${ref.title}</span>
            <span class="placeholder-category">${ref.category}</span>
          </div>
        </div>
        <div class="reference-info">
          <div class="reference-header">
            <div class="reference-title">${ref.title}</div>
            ${ref.expectedCVR ? `<div class="reference-cvr">${ref.expectedCVR}</div>` : ''}
          </div>
          <div class="reference-description">${ref.description}</div>
          ${ref.elements ? `
            <div class="reference-elements">
              <strong>含まれる要素:</strong>
              <ul style="margin: 0.5rem 0 0 1rem; font-size: 0.8rem; color: var(--text-secondary);">
                ${ref.elements.slice(0, 3).map(elem => `<li>${elem}</li>`).join('')}
                ${ref.elements.length > 3 ? `<li style="font-style: italic;">他${ref.elements.length - 3}個の要素</li>` : ''}
              </ul>
            </div>
          ` : ''}
          <div class="reference-tags">
            ${ref.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          ${ref.bestFor ? `
            <div class="reference-best-for" style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary);">
              <strong>最適:</strong> ${ref.bestFor.join(', ')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};

// Export utilities
const ExportUtils = {
  async createZipFile(files) {
    // This would use JSZip library in a real implementation
    // For now, we'll create a simple zip-like structure
    const zip = new JSZip();
    
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    return await zip.generateAsync({ type: 'blob' });
  },

  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  generateReadme(lpData) {
    return `# AI生成ランディングページ

## 概要
このランディングページはAIによって自動生成されました。

## ファイル構成
- \`index.html\` - メインHTMLファイル
- \`style.css\` - スタイルシート
- \`script.js\` - JavaScript
- \`proposal.json\` - クライアント提案資料

## 生成情報
- 生成日時: ${new Date().toLocaleString()}
- AIサービス: ${lpData.metadata?.aiService || 'Unknown'}
- 生成時間: ${lpData.metadata?.generationTime ? (lpData.metadata.generationTime / 1000).toFixed(1) + '秒' : 'Unknown'}

## カスタマイズ
CSS変数を使用してデザインを簡単にカスタマイズできます。
\`style.css\`の:rootセクションを編集してください。

## 注意事項
- 本番環境で使用する前に、内容とデザインを十分に確認してください
- フォーム送信先やアナリティクスコードを適切に設定してください
- 画像やコンテンツは適切なものに差し替えてください
`;
  }
};

// ================================
// AI SERVICE IS LOADED FROM ai-service.js
// ================================

// ================================
// FILE PROCESSOR CLASS
// ================================

class ClientFileProcessor {
  constructor() {
    this.supportedTypes = {
      'application/pdf': this.processPDF.bind(this),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.processWordDoc.bind(this),
      'application/msword': this.processWordDoc.bind(this),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': this.processExcel.bind(this),
      'application/vnd.ms-excel': this.processExcel.bind(this),
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': this.processPowerPoint.bind(this),
      'application/vnd.ms-powerpoint': this.processPowerPoint.bind(this),
      'text/plain': this.processTextFile.bind(this),
      'image/jpeg': this.processImage.bind(this),
      'image/jpg': this.processImage.bind(this),
      'image/png': this.processImage.bind(this),
      'image/gif': this.processImage.bind(this)
    };
  }

  // Main processing method
  async processFile(file) {
    try {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      if (!FileUtils.isValidFileType(file.name)) {
        throw new Error(`サポートされていないファイル形式です: ${file.name}`);
      }

      const processor = this.supportedTypes[file.type];
      if (!processor) {
        return await this.processByExtension(file);
      }

      const result = await processor(file);
      return {
        fileName: file.name,
        fileType: file.type,
        content: result,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`ファイル処理エラー (${file.name}): ${error.message}`);
    }
  }

  // Process PDF files using PDF.js
  async processPDF(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function(event) {
        try {
          if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js ライブラリが読み込まれていません');
          }

          const typedArray = new Uint8Array(event.target.result);
          
          const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            disableFontFace: false,
            disableStream: true,
            disableAutoFetch: true
          });
          
          const pdf = await loadingTask.promise;
          let fullText = '';
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              const pageText = textContent.items
                .filter(item => item.str && item.str.trim())
                .map(item => item.str)
                .join(' ');
              
              if (pageText.trim()) {
                fullText += `[ページ ${pageNum}]\n${pageText.trim()}\n\n`;
              }
            } catch (pageError) {
              console.warn(`ページ ${pageNum} の読み取りに失敗:`, pageError);
              fullText += `[ページ ${pageNum}]\n[読み取りエラー: ${pageError.message}]\n\n`;
            }
          }
          
          if (!fullText.trim()) {
            resolve('PDFファイルからテキストを抽出できませんでした。画像ベースのPDFの可能性があります。');
          } else {
            resolve(fullText.trim());
          }
          
        } catch (error) {
          console.error('PDF processing error:', error);
          reject(new Error(`PDF読み取りエラー: ${error.message}`));
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('PDFファイルの読み取りに失敗しました'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  // Process Word documents using mammoth.js
  async processWordDoc(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function(event) {
        try {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          
          if (result.messages.length > 0) {
            console.warn('Word document processing warnings:', result.messages);
          }
          
          resolve(result.value);
        } catch (error) {
          reject(new Error(`Word文書読み取りエラー: ${error.message}`));
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('Word文書の読み取りに失敗しました'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  // Process Excel files using SheetJS
  async processExcel(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = function(event) {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          let allSheetsText = '';
          
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            allSheetsText += `[シート: ${sheetName}]\n${csvData}\n\n`;
          });
          
          resolve(allSheetsText.trim());
        } catch (error) {
          reject(new Error(`Excel読み取りエラー: ${error.message}`));
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('Excelファイルの読み取りに失敗しました'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  // Process PowerPoint files
  async processPowerPoint(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async function(event) {
        try {
          const arrayBuffer = event.target.result;
          const zip = await JSZip.loadAsync(arrayBuffer);
          let extractedText = '';
          
          const slidePromises = [];
          zip.forEach((relativePath, file) => {
            if (relativePath.startsWith('ppt/slides/slide') && relativePath.endsWith('.xml')) {
              slidePromises.push(
                file.async('text').then(content => {
                  const slideNumber = relativePath.match(/slide(\d+)\.xml/)[1];
                  const textContent = this.extractTextFromSlideXML(content);
                  return `[スライド ${slideNumber}]\n${textContent}\n`;
                })
              );
            }
          });
          
          const slideTexts = await Promise.all(slidePromises);
          extractedText = slideTexts.join('\n');
          
          resolve(extractedText || 'PowerPointファイルからテキストを抽出できませんでした');
        } catch (error) {
          reject(new Error(`PowerPoint読み取りエラー: ${error.message}`));
        }
      }.bind(this);
      
      fileReader.onerror = () => {
        reject(new Error('PowerPointファイルの読み取りに失敗しました'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  extractTextFromSlideXML(xmlContent) {
    try {
      const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (!textMatches) return '';
      
      return textMatches
        .map(match => match.replace(/<a:t[^>]*>([^<]*)<\/a:t>/, '$1'))
        .filter(text => text.trim())
        .join(' ');
    } catch (error) {
      console.warn('Error extracting text from slide XML:', error);
      return '';
    }
  }

  // Process plain text files
  async processTextFile(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = function(event) {
        resolve(event.target.result);
      };
      
      fileReader.onerror = () => {
        reject(new Error('テキストファイルの読み取りに失敗しました'));
      };
      
      fileReader.readAsText(file, 'UTF-8');
    });
  }

  // Process image files with OCR
  async processImage(file) {
    const self = this;
    
    return new Promise(async (resolve, reject) => {
      try {
        const fileReader = new FileReader();
        
        fileReader.onload = async function(event) {
          const img = new Image();
          img.onload = async function() {
            const metadata = {
              fileName: file.name,
              dimensions: `${img.width}x${img.height}`,
              fileSize: FileUtils.formatFileSize(file.size),
              type: file.type
            };
            
            let result = `画像ファイル: ${file.name}\n寸法: ${metadata.dimensions}\nサイズ: ${metadata.fileSize}\n\n`;
            
            // OCR処理を試行
            try {
              if (typeof Tesseract !== 'undefined') {
                console.log(`OCR処理開始: ${file.name}`);
                
                const preprocessedImage = await self.preprocessImageForOCR(event.target.result, img);
                const extractedText = await self.performEnhancedOCR(preprocessedImage, file.name);
                
                if (extractedText.length > 0) {
                  result += `【OCR抽出テキスト】\n${extractedText}\n\n`;
                  console.log(`OCR完了: ${file.name} - ${extractedText.length}文字抽出`);
                } else {
                  result += `【OCR結果】\nテキストが検出されませんでした\n\n`;
                }
              } else {
                result += `【OCR機能】\nTesseract.jsが読み込まれていません\n\n`;
              }
            } catch (ocrError) {
              console.warn(`OCR処理エラー (${file.name}):`, ocrError);
              result += `【OCR処理エラー】\n${ocrError.message}\n\n`;
            }
            
            resolve(result);
          };
          
          img.onerror = () => {
            reject(new Error('画像ファイルの読み取りに失敗しました'));
          };
          
          img.src = event.target.result;
        };
        
        fileReader.onerror = () => {
          reject(new Error('ファイルの読み取りに失敗しました'));
        };
        
        fileReader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  async preprocessImageForOCR(imageSrc, originalImg) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const targetWidth = Math.min(originalImg.width * 2, 3000);
      const targetHeight = Math.min(originalImg.height * 2, 3000);
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(originalImg, 0, 0, targetWidth, targetHeight);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const value = avg > threshold ? 255 : 0;
        
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    });
  }

  async performEnhancedOCR(imageSrc, fileName) {
    const ocrConfigs = [
      {
        name: '日本語+英語（高精度）',
        lang: 'jpn+eng',
        options: {
          tessedit_pageseg_mode: '1',
          tessedit_ocr_engine_mode: '1',
          preserve_interword_spaces: '1'
        }
      },
      {
        name: '日本語+英語（標準）',
        lang: 'jpn+eng',
        options: {
          tessedit_pageseg_mode: '6',
          tessedit_ocr_engine_mode: '1'
        }
      }
    ];

    let bestResult = '';
    let bestScore = 0;

    for (const config of ocrConfigs) {
      try {
        console.log(`OCR試行: ${config.name} (${fileName})`);
        
        const ocrResult = await Tesseract.recognize(
          imageSrc,
          config.lang,
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                console.log(`${config.name}: ${Math.round(m.progress * 100)}%`);
              }
            },
            ...config.options
          }
        );

        const text = ocrResult.data.text.trim();
        const confidence = ocrResult.data.confidence || 0;
        const score = text.length * (confidence / 100);
        
        if (score > bestScore) {
          bestScore = score;
          bestResult = text;
        }

      } catch (error) {
        console.warn(`OCR設定 "${config.name}" でエラー:`, error);
      }
    }

    return bestResult;
  }

  async processByExtension(file) {
    const extension = FileUtils.getFileExtension(file.name).toLowerCase();
    
    switch (extension) {
      case 'txt':
        return await this.processTextFile(file);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return await this.processImage(file);
      default:
        throw new Error(`サポートされていないファイル形式: ${extension}`);
    }
  }

  validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const errors = [];

    if (file.size > maxSize) {
      errors.push(`ファイルサイズが大きすぎます (最大: 50MB, 実際: ${FileUtils.formatFileSize(file.size)})`);
    }

    if (!FileUtils.isValidFileType(file.name)) {
      errors.push(`サポートされていないファイル形式: ${FileUtils.getFileExtension(file.name)}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// ================================
// UI CONTROLLER CLASS
// ================================

class UIController {
  constructor(app) {
    this.app = app;
    this.currentDevice = 'desktop';
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      const settingsPanel = document.getElementById('settingsPanel');
      const settingsButton = e.target.closest('[onclick*="toggleSettings"]');
      
      if (settingsPanel && settingsPanel.classList.contains('open')) {
        if (!settingsPanel.contains(e.target) && !settingsButton) {
          settingsPanel.classList.remove('open');
        }
      }
    });
  }

  showLoading(message = '処理中...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) messageEl.textContent = message;
    if (overlay) overlay.style.display = 'flex';
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }




  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    toast.innerHTML = `
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-message">${formattedMessage}</span>
      </div>
    `;
    
    Object.assign(toast.style, {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      backgroundColor: '#059669',
      color: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      zIndex: '2000',
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: '400px',
      padding: '1rem',
      lineHeight: '1.5'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  showSection(sectionId) {
    console.log(`🔄 Switching to section: ${sectionId}`);
    
    // Hide all sections first
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      section.style.display = 'none';
    });

    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
      console.log(`✅ Section ${sectionId} is now visible`);
      
      // For generating section, ensure streaming display is visible
      if (sectionId === 'generatingSection') {
        setTimeout(() => {
          const streamingDisplay = document.getElementById('streamingDisplay');
          if (streamingDisplay) {
            streamingDisplay.style.display = 'block';
            streamingDisplay.style.opacity = '1';
            streamingDisplay.style.visibility = 'visible';
            console.log('✅ Streaming display visibility ensured');
          }
        }, 100);
      }
      
      // For result section, ensure it's properly positioned
      if (sectionId === 'resultSection') {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      console.error(`❌ Section ${sectionId} not found!`);
    }
  }

  updateProgress(percent, message = '') {
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progressPercent');
    const statusText = document.getElementById('generationStatus');

    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = percent + '%';
    if (statusText && message) statusText.textContent = message;

    this.updateGenerationSteps(percent);
  }

  updateGenerationSteps(percent) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
      const stepProgress = (index + 1) * 25;
      step.classList.remove('active', 'completed');
      
      if (percent >= stepProgress) {
        step.classList.add('completed');
      } else if (percent >= stepProgress - 25 && percent < stepProgress) {
        step.classList.add('active');
      }
    });
  }

  // === リアルタイム生成表示機能 ===
  
  initStreamingDisplay() {
    console.log('🌊 Initializing streaming display...');
    
    // ストリーミング表示用の要素を生成セクションに追加
    const generatingSection = document.getElementById('generatingSection');
    if (!generatingSection) {
      console.error('❌ generatingSection not found!');
      return;
    }
    
    // generatingSectionを確実に表示
    generatingSection.style.display = 'block';
    
    // 既存のストリーミング表示がある場合は再利用
    let existingDisplay = document.getElementById('streamingDisplay');
    if (existingDisplay) {
      console.log('✅ Reusing existing streaming display');
      existingDisplay.style.display = 'block';
      existingDisplay.style.opacity = '1';
      existingDisplay.style.visibility = 'visible';
      // コンテンツをクリア
      const textContent = document.getElementById('streamingTextContent');
      if (textContent) {
        textContent.innerHTML = '<div class="streaming-placeholder">AI生成を開始すると、ここにリアルタイムで内容が表示されます...</div>';
      }
      // 統計情報をリセット
      this.streamingStats = {
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        totalChars: 0,
        currentSpeed: 0,
        estimatedTotalChars: 8000,
        activeTab: 'text'
      };
      return;
    }
    
    const streamingDiv = document.createElement('div');
    streamingDiv.id = 'streamingDisplay';
    streamingDiv.className = 'streaming-display';
    streamingDiv.style.display = 'block'; // 確実に表示
    streamingDiv.style.marginTop = '2rem'; // 上部にマージンを追加
    streamingDiv.innerHTML = `
      <div class="streaming-header">
        <h4>🌊 リアルタイム生成プレビュー</h4>
        <div class="streaming-stats">
          <span id="streamingWordCount">0文字</span>
          <span id="streamingSpeed">0文字/秒</span>
        </div>
      </div>
      <div class="streaming-tabs">
        <button class="streaming-tab active" onclick="window.lpApp.uiController.switchStreamingTab('text')">📝 テキスト</button>
        <button class="streaming-tab" onclick="window.lpApp.uiController.switchStreamingTab('html')">🌐 HTMLプレビュー</button>
        <button class="streaming-tab" onclick="window.lpApp.uiController.switchStreamingTab('css')">🎨 CSSプレビュー</button>
      </div>
      <div class="streaming-content" id="streamingContent">
        <div class="streaming-tab-content active" id="streamingTextContent">
          <div class="streaming-placeholder">AI生成を開始すると、ここにリアルタイムで内容が表示されます...</div>
        </div>
        <div class="streaming-tab-content" id="streamingHtmlContent" style="display: none;">
          <iframe class="streaming-preview-frame" id="streamingPreviewFrame"></iframe>
        </div>
        <div class="streaming-tab-content" id="streamingCssContent" style="display: none;">
          <div class="css-preview-container">
            <div class="css-code" id="streamingCssCode">CSSが生成されるとここに表示されます...</div>
          </div>
        </div>
      </div>
      <div class="streaming-progress">
        <div class="streaming-progress-bar">
          <div class="streaming-progress-fill" id="streamingProgressFill" style="width: 0%"></div>
        </div>
        <div class="streaming-time-info">
          <span>経過時間: <span id="streamingElapsed">0秒</span></span>
          <span>予想残り時間: <span id="streamingEta">計算中...</span></span>
          <span>完了予定: <span id="streamingCompletion">計算中...</span></span>
        </div>
      </div>
    `;
    
    // generation-containerの外側（後）に追加して確実に表示されるようにする
    const generationContainer = generatingSection.querySelector('.generation-container');
    if (generationContainer) {
      // generation-containerの後に挿入
      generationContainer.insertAdjacentElement('afterend', streamingDiv);
      console.log('✅ Streaming display added after generation container');
    } else {
      // generation-containerがない場合は、generatingSectionの最後に追加
      generatingSection.appendChild(streamingDiv);
      console.log('✅ Streaming display added to generating section');
    }
    
    // 強制的に表示を確保
    streamingDiv.style.cssText = `
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      margin: 2rem auto !important;
      max-width: 1200px !important;
      width: 95% !important;
    `;
    
    // ストリーミング用の統計情報をリセット
    this.streamingStats = {
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      totalChars: 0,
      currentSpeed: 0,
      estimatedTotalChars: 8000, // 予想文字数
      activeTab: 'text'
    };
    
    // デバッグ: 要素が正しく追加されたか確認
    const addedElement = document.getElementById('streamingDisplay');
    if (addedElement) {
      console.log('✅ Streaming display element found:', {
        id: addedElement.id,
        className: addedElement.className,
        display: addedElement.style.display,
        parentElement: addedElement.parentElement?.id || 'unknown'
      });
    } else {
      console.error('❌ Streaming display element NOT found after insertion!');
    }
  }
  
  updateStreamingDisplay(chunk, fullContent) {
    console.log('📝 Updating streaming display with chunk:', chunk.substring(0, 50) + '...');
    
    // ストリーミング表示がない場合は初期化
    let streamingDisplay = document.getElementById('streamingDisplay');
    if (!streamingDisplay) {
      console.log('🆕 Streaming display not found, initializing...');
      this.initStreamingDisplay();
      streamingDisplay = document.getElementById('streamingDisplay');
    }
    
    // 表示を確実に
    if (streamingDisplay) {
      streamingDisplay.style.display = 'block';
      streamingDisplay.style.opacity = '1';
      streamingDisplay.style.visibility = 'visible';
    }
    
    const streamingContent = document.getElementById('streamingContent');
    const streamingWordCount = document.getElementById('streamingWordCount');
    const streamingSpeed = document.getElementById('streamingSpeed');
    const streamingElapsed = document.getElementById('streamingElapsed');
    const streamingEta = document.getElementById('streamingEta');
    const streamingCompletion = document.getElementById('streamingCompletion');
    const streamingProgressFill = document.getElementById('streamingProgressFill');
    
    if (!streamingContent) {
      console.error('❌ streamingContent element not found!');
      return;
    }
    
    // 統計情報を更新
    const now = Date.now();
    const elapsed = (now - this.streamingStats.startTime) / 1000;
    const timeSinceLastUpdate = (now - this.streamingStats.lastUpdateTime) / 1000;
    const charsInChunk = chunk.length;
    
    this.streamingStats.totalChars += charsInChunk;
    this.streamingStats.currentSpeed = timeSinceLastUpdate > 0 ? charsInChunk / timeSinceLastUpdate : 0;
    this.streamingStats.lastUpdateTime = now;
    
    // 平均速度を計算
    const avgSpeed = elapsed > 0 ? this.streamingStats.totalChars / elapsed : 0;
    
    // ETA（予想残り時間）を計算
    const remainingChars = Math.max(0, this.streamingStats.estimatedTotalChars - this.streamingStats.totalChars);
    const eta = avgSpeed > 0 ? remainingChars / avgSpeed : 0;
    
    // プログレスバーを更新
    const progress = Math.min(100, (this.streamingStats.totalChars / this.streamingStats.estimatedTotalChars) * 100);
    
    // UI要素を更新
    if (streamingWordCount) {
      streamingWordCount.textContent = `${this.streamingStats.totalChars}文字`;
    }
    
    if (streamingSpeed) {
      streamingSpeed.textContent = `${Math.round(avgSpeed)}文字/秒`;
    }
    
    if (streamingElapsed) {
      streamingElapsed.textContent = `${Math.round(elapsed)}秒`;
    }
    
    if (streamingEta) {
      if (eta > 0 && eta < 300) { // 5分以内の場合のみ表示
        streamingEta.textContent = `約${Math.round(eta)}秒`;
      } else {
        streamingEta.textContent = '計算中...';
      }
    }
    
    if (streamingCompletion) {
      if (eta > 0 && eta < 300) {
        const completionTime = new Date(now + eta * 1000);
        streamingCompletion.textContent = completionTime.toLocaleTimeString();
      } else {
        streamingCompletion.textContent = '計算中...';
      }
    }
    
    if (streamingProgressFill) {
      streamingProgressFill.style.width = `${progress}%`;
    }
    
    // アクティブなタブに応じてコンテンツを更新
    this.updateActiveStreamingTab(chunk, fullContent);
  }
  
  // ストリーミングタブの切り替え
  switchStreamingTab(tabType) {
    // タブの切り替え
    document.querySelectorAll('.streaming-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelectorAll('.streaming-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // アクティブなタブを設定
    const activeTab = document.querySelector(`.streaming-tab[onclick*="'${tabType}'"]`);
    const activeContent = document.getElementById(`streaming${tabType.charAt(0).toUpperCase() + tabType.slice(1)}Content`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.style.display = 'block';
    
    this.streamingStats.activeTab = tabType;
  }
  
  // アクティブなタブに応じてコンテンツを更新
  updateActiveStreamingTab(chunk, fullContent) {
    const activeTab = this.streamingStats.activeTab;
    
    if (activeTab === 'text') {
      this.updateTextStreamingTab(chunk, fullContent);
    } else if (activeTab === 'html') {
      this.updateHtmlStreamingTab(fullContent);
    } else if (activeTab === 'css') {
      this.updateCssStreamingTab(fullContent);
    }
  }
  
  // テキストタブの更新
  updateTextStreamingTab(chunk, fullContent) {
    const textContent = document.getElementById('streamingTextContent');
    if (!textContent) return;
    
    // プレースホルダーを削除
    const placeholder = textContent.querySelector('.streaming-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    // 新しいコンテンツを追加
    const newContent = document.createElement('div');
    newContent.className = 'streaming-chunk';
    newContent.textContent = chunk;
    textContent.appendChild(newContent);
    
    // スクロールを最下部に維持
    textContent.scrollTop = textContent.scrollHeight;
  }
  
  // HTMLプレビュータブの更新
  updateHtmlStreamingTab(fullContent) {
    const previewFrame = document.getElementById('streamingPreviewFrame');
    if (!previewFrame) return;
    
    try {
      // JSON形式の内容からHTMLを抽出
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.code && parsed.code.html) {
          const htmlContent = parsed.code.html;
          const cssContent = parsed.code.css || '';
          
          // CSSを含む完全なHTMLを作成
          const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${cssContent}</style>
            </head>
            <body>
              ${htmlContent.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '')}
            </body>
            </html>
          `;
          
          // iframeに内容を設定
          previewFrame.srcdoc = fullHtml;
        }
      }
    } catch (error) {
      // JSON解析エラーの場合は、生のコンテンツをHTMLとして表示
      previewFrame.srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>body { font-family: sans-serif; padding: 20px; white-space: pre-wrap; }</style>
        </head>
        <body>${fullContent}</body>
        </html>
      `;
    }
  }
  
  // CSSプレビュータブの更新
  updateCssStreamingTab(fullContent) {
    const cssCode = document.getElementById('streamingCssCode');
    if (!cssCode) return;
    
    try {
      // JSON形式の内容からCSSを抽出
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.code && parsed.code.css) {
          cssCode.textContent = parsed.code.css;
        } else {
          cssCode.textContent = 'CSSコードが生成されるまでお待ちください...';
        }
      } else {
        cssCode.textContent = 'CSS抽出中...';
      }
    } catch (error) {
      cssCode.textContent = 'CSS解析中...';
    }
  }
  
  clearStreamingDisplay() {
    const streamingContent = document.getElementById('streamingContent');
    if (streamingContent) {
      streamingContent.innerHTML = '<div class="streaming-placeholder">AIが応答を生成し始めると、ここにリアルタイムで表示されます...</div>';
    }
    
    const charsCount = document.querySelector('.streaming-chars-count');
    if (charsCount) {
      charsCount.textContent = '0文字';
    }
    
    const progressBar = document.getElementById('streamingProgressBar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }
  
  toggleStreamingDisplay() {
    const streamingDisplay = document.getElementById('streamingDisplay');
    if (streamingDisplay) {
      const isVisible = streamingDisplay.style.display !== 'none';
      streamingDisplay.style.display = isVisible ? 'none' : 'block';
      
      // ボタンのアイコンを更新
      const toggleBtn = streamingDisplay.querySelector('.btn-icon');
      if (toggleBtn) {
        toggleBtn.textContent = isVisible ? '🙈' : '👁️';
        toggleBtn.title = isVisible ? '表示する' : '非表示にする';
      }
    }
  }
  
  showDetailedProgress(step, details) {
    const statusText = document.getElementById('generationStatus');
    if (statusText) {
      statusText.innerHTML = `
        <div class="detailed-progress">
          <div class="progress-step">${step}</div>
          <div class="progress-details">${details}</div>
        </div>
      `;
    }
  }

  // 部分結果表示機能
  showPartialResults(content, progress) {
    // ストリーミング中にプレビューの一部を更新
    try {
      // JSONの一部が含まれているかチェック
      if (content.includes('"html"') && content.includes('<')) {
        const match = content.match(/"html":\s*"([^"]*(?:\\.[^"]*)*)/);
        if (match) {
          let htmlSnippet = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          // 部分的なHTMLでもプレビューを更新
          if (htmlSnippet.length > 100) {
            this.updatePartialPreview(htmlSnippet, progress);
          }
        }
      }
    } catch (error) {
      console.log('部分結果解析エラー:', error);
    }
  }

  updatePartialPreview(htmlSnippet, progress) {
    const previewFrame = document.getElementById('previewFrame');
    if (previewFrame) {
      // 部分的なHTMLを表示用に補完
      const partialHTML = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>プレビュー生成中...</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 20px; background: #f9f9f9; }
            .preview-banner { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="preview-banner">
            <strong>🚧 生成プレビュー (${Math.round(progress)}%)</strong><br>
            AIが生成中のコンテンツをリアルタイムでプレビューしています...
          </div>
          <div class="content">
            ${htmlSnippet}
          </div>
        </body>
        </html>
      `;
      
      previewFrame.srcdoc = partialHTML;
    }
  }

  displayUploadedFiles() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    if (this.app.uploadedFiles.length === 0) {
      fileList.innerHTML = '';
      fileList.style.display = 'none';
      return;
    }
    
    fileList.style.display = 'block';
    fileList.innerHTML = this.app.uploadedFiles
      .map((file, index) => TemplateUtils.createFileItemHTML(file, index))
      .join('');
    
    this.showAnalyzeButton();
    this.app.showModelSelectorAndActions();
  }

  showAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.style.display = 'inline-block';
    }
  }

  hideAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.style.display = 'none';
    }
  }

  updateSelectedModelDisplay(model) {
    const selectedInfo = document.getElementById('selectedModelInfo');
    const selectedName = document.getElementById('selectedModelName');
    
    if (selectedInfo && selectedName) {
      if (model) {
        selectedName.textContent = model.toUpperCase();
        selectedInfo.style.display = 'block';
        
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
          card.style.display = 'none';
        });
      } else {
        selectedInfo.style.display = 'none';
        
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
          card.style.display = 'block';
        });
      }
    }
  }

  displayAnalysisResults() {
    if (!this.app.analysisData) return;
    
    const analysisHTML = TemplateUtils.createAnalysisHTML(this.app.analysisData);
    
    document.getElementById('businessInfo').innerHTML = analysisHTML.businessInfo;
    document.getElementById('targetInfo').innerHTML = analysisHTML.targetInfo;
    document.getElementById('valueProposition').innerHTML = analysisHTML.valueProposition;
    document.getElementById('designHints').innerHTML = analysisHTML.designHints;
    
    this.showSection('analysisSection');
  }

  displayReferences() {
    const grid = document.getElementById('referenceGrid');
    const resultCount = document.getElementById('referenceResultCount');
    
    if (!grid) return;
    
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const cvrFilter = document.getElementById('cvrFilter')?.value || '';
    
    let filteredRefs = this.app.referenceDatabase;
    
    if (categoryFilter) {
      filteredRefs = filteredRefs.filter(ref => ref.category === categoryFilter);
    }
    
    if (cvrFilter === 'high') {
      filteredRefs = filteredRefs.filter(ref => {
        const cvrStr = ref.expectedCVR || ref.cvr || '0%';
        const cvr = parseFloat(cvrStr.replace('%', ''));
        return cvr >= 15;
      });
    } else if (cvrFilter === 'medium') {
      filteredRefs = filteredRefs.filter(ref => {
        const cvrStr = ref.expectedCVR || ref.cvr || '0%';
        const cvr = parseFloat(cvrStr.replace('%', ''));
        return cvr >= 10 && cvr < 15;
      });
    } else if (cvrFilter === 'low') {
      filteredRefs = filteredRefs.filter(ref => {
        const cvrStr = ref.expectedCVR || ref.cvr || '0%';
        const cvr = parseFloat(cvrStr.replace('%', ''));
        return cvr < 10;
      });
    }
    
    if (resultCount) {
      const totalCount = this.app.referenceDatabase.length;
      if (filteredRefs.length === totalCount) {
        resultCount.textContent = `全${totalCount}種類のLP要素テンプレートを表示中`;
      } else {
        resultCount.textContent = `${filteredRefs.length}件のテンプレートが該当`;
      }
    }
    
    grid.innerHTML = filteredRefs
      .map(ref => TemplateUtils.createReferenceCardHTML(ref))
      .join('');
  }

  displayGenerationResults() {
    // Check both possible locations for generatedLP - prioritize window.lpApp
    const lp = window.lpApp?.core?.generatedLP || window.lpApp?.generatedLP || this.app?.core?.generatedLP || this.app?.generatedLP;
    console.log('🔍 DisplayGenerationResults:', {
      hasAppCore: !!this.app.core,
      hasAppGeneratedLP: !!this.app.generatedLP,
      hasCoreGeneratedLP: !!this.app.core?.generatedLP,
      hasWindowLpAppCore: !!window.lpApp?.core?.generatedLP,
      hasWindowLpApp: !!window.lpApp?.generatedLP,
      finalLP: !!lp,
      lpKeys: lp ? Object.keys(lp) : 'none'
    });
    
    if (!lp) {
      console.error('⚠️ No generatedLP found for display - checking all possible locations failed');
      // Create a fallback LP if nothing is found
      const fallbackLP = {
        code: {
          html: '<h1>LP生成エラー</h1><p>生成結果が見つかりませんでした</p>',
          css: 'body { font-family: sans-serif; padding: 20px; }',
          js: 'console.log("Fallback LP");'
        }
      };
      this.updatePreview(fallbackLP);
      return;
    }
    
    const htmlCode = document.getElementById('htmlCode');
    const cssCode = document.getElementById('cssCode');
    const jsCode = document.getElementById('jsCode');
    
    if (htmlCode) htmlCode.value = lp.code?.html || '';
    if (cssCode) cssCode.value = lp.code?.css || '';
    if (jsCode) jsCode.value = lp.code?.js || '';
    
    if (lp.proposal) {
      const proposalContent = document.getElementById('proposalContent');
      if (proposalContent) {
        proposalContent.innerHTML = this.formatProposal(lp.proposal);
      }
    }
    
    if (lp.performance) {
      if (document.getElementById('cvrPrediction')) {
        document.getElementById('cvrPrediction').textContent = lp.performance.expectedCvr || '-';
      }
      if (document.getElementById('speedScore')) {
        document.getElementById('speedScore').textContent = lp.performance.speedScore || '-';
      }
      if (document.getElementById('seoScore')) {
        document.getElementById('seoScore').textContent = lp.performance.seoScore || '-';
      }
      if (document.getElementById('accessibilityScore')) {
        document.getElementById('accessibilityScore').textContent = lp.performance.accessibilityScore || '-';
      }
    }
    
    this.updatePreview();
  }


  formatProposal(proposal) {
    let html = `<h3>${proposal.proposalTitle}</h3>`;
    html += `<p class="executive-summary">${proposal.executiveSummary}</p>`;
    
    if (proposal.sections) {
      proposal.sections.forEach(section => {
        html += `
          <div class="proposal-section">
            <h4>${section.title}</h4>
            <p>${section.content}</p>
          </div>
        `;
      });
    }
    
    if (proposal.investment) {
      html += `
        <div class="investment-section">
          <h4>投資対効果</h4>
          <ul>
            <li>従来の方法: ${proposal.investment.traditionalApproach}</li>
            <li>AI活用: ${proposal.investment.aiApproach}</li>
            <li>削減効果: ${proposal.investment.savings}</li>
          </ul>
        </div>
      `;
    }
    
    return html;
  }

  displayUsageSummary(usageData) {
    console.log('📊 DisplayUsageSummary called with:', usageData);
    const summaryContent = document.getElementById('usageSummaryContent');
    if (!summaryContent) {
      console.error('⚠️ usageSummaryContent element not found');
      return;
    }
    if (!usageData) {
      console.error('⚠️ No usage data provided');
      return;
    }
    
    const usage = usageData.usage || {};
    const inputTokens = usage.promptTokens || usage.prompt_tokens || 0;
    const outputTokens = usage.completionTokens || usage.completion_tokens || usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokens || usage.total_tokens || (inputTokens + outputTokens) || 0;
    
    const modelIcon = {
      'grok': '🚀',
      'openai': '🤖',
      'anthropic': '🧠',
      'deepseek': '🔍'
    };
    
    const modelName = usageData.model || usageData.service || 'unknown';
    
    summaryContent.innerHTML = `
      <div class="usage-summary-card ${modelName}">
        <div class="usage-card-header">
          <span class="usage-model-name">${modelName.toUpperCase()}</span>
          <span class="usage-model-icon">${modelIcon[usageData.model] || '🤖'}</span>
        </div>
        <div class="usage-stats">
          <div class="usage-stat">
            <span class="usage-label">🤖 使用モデル:</span>
            <span class="usage-value">${usageData.modelName || usageData.model}</span>
          </div>
          <div class="usage-stat">
            <span class="usage-label">📊 入力トークン:</span>
            <span class="usage-value">${inputTokens.toLocaleString()}</span>
          </div>
          <div class="usage-stat">
            <span class="usage-label">📝 出力トークン:</span>
            <span class="usage-value">${outputTokens.toLocaleString()}</span>
          </div>
          <div class="usage-stat usage-total">
            <span class="usage-label">🔢 総トークン:</span>
            <span class="usage-value">${totalTokens.toLocaleString()}</span>
          </div>
          <div class="usage-stat">
            <span class="usage-label">⏱️ 生成時間:</span>
            <span class="usage-value">${(usageData.generationTime / 1000).toFixed(1)} 秒</span>
          </div>
          <div class="usage-stat">
            <span class="usage-label">📄 応答サイズ:</span>
            <span class="usage-value">${usageData.responseSize.toLocaleString()} 文字</span>
          </div>
          <div class="usage-stat">
            <span class="usage-label">🕐 生成日時:</span>
            <span class="usage-value">${new Date(usageData.timestamp).toLocaleString('ja-JP')}</span>
          </div>
        </div>
      </div>
    `;
  }

  updatePreview(fallbackLP = null) {
    const previewFrame = document.getElementById('previewFrame');
    // Check both possible locations for generatedLP
    const lp = fallbackLP || this.app.core?.generatedLP || this.app.generatedLP || window.lpApp?.core?.generatedLP || window.lpApp?.generatedLP;
    console.log('🔍 UpdatePreview:', {
      hasPreviewFrame: !!previewFrame,
      hasLP: !!lp,
      lpCode: lp?.code ? 'exists' : 'missing',
      isFallback: !!fallbackLP
    });
    
    if (!previewFrame || !lp) return;
    const fullHTML = this.combineCodeForPreview(lp.code);
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    previewFrame.src = url;
    
    previewFrame.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }

  combineCodeForPreview(code) {
    if (!code) return '';
    
    let html = code.html || '<!DOCTYPE html><html><head></head><body><p>No content</p></body></html>';
    
    if (code.css) {
      const styleTag = `<style>${code.css}</style>`;
      html = html.replace('</head>', styleTag + '</head>');
    }
    
    if (code.js) {
      const scriptTag = `<script>${code.js}</script>`;
      html = html.replace('</body>', scriptTag + '</body>');
    }
    
    return html;
  }

  setDevice(device) {
    this.currentDevice = device;
    const previewFrame = document.getElementById('previewFrame');
    
    if (previewFrame) {
      previewFrame.classList.remove('desktop', 'tablet', 'mobile');
      previewFrame.classList.add(device);
    }
    
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.device === device);
    });
  }

  showTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
      targetTab.style.display = 'block';
      targetTab.classList.add('active');
    }

    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  async copyCode(type) {
    const codeElement = document.getElementById(type + 'Code');
    if (codeElement) {
      try {
        await navigator.clipboard.writeText(codeElement.value);
        // コピー成功（メッセージを簡略化）
      } catch (err) {
        console.log('コピーに失敗しました');
      }
    }
  }

  updateAIUsageDisplay(model, status, usage, generationTime, responseSize, errorMessage) {
    // Only log to console, don't show confusing UI
    console.log('🤖 AI Usage:', {
      model,
      status,
      usage,
      generationTime,
      responseSize,
      errorMessage
    });
    
    // Remove any existing display to avoid confusion
    const existingDisplay = document.getElementById('aiUsageDisplay');
    if (existingDisplay) {
      existingDisplay.remove();
    }
    
    return; // Don't show UI

    let statusIcon = '';
    let statusClass = '';
    let details = '';

    switch (status) {
      case 'starting':
        statusIcon = '🚀';
        statusClass = 'starting';
        details = 'リクエスト送信中...';
        break;
      case 'completed':
        statusIcon = '✅';
        statusClass = 'completed';
        const inputTokens = usage?.promptTokens || usage?.prompt_tokens || 0;
        const outputTokens = usage?.completionTokens || usage?.completion_tokens || usage?.candidatesTokenCount || 0;
        const totalTokens = usage?.totalTokens || usage?.total_tokens || (inputTokens + outputTokens) || 0;
        
        details = `
          <div class="usage-details">
            <div class="usage-row">📊 入力トークン: ${inputTokens.toLocaleString()}</div>
            <div class="usage-row">📝 出力トークン: ${outputTokens.toLocaleString()}</div>
            <div class="usage-row">🔢 総トークン: ${totalTokens.toLocaleString()}</div>
            <div class="usage-row">⏱️ 生成時間: ${(generationTime/1000).toFixed(1)}秒</div>
            <div class="usage-row">📄 応答サイズ: ${responseSize?.toLocaleString() || 0} 文字</div>
          </div>
        `;
        break;
      case 'error':
        statusIcon = '❌';
        statusClass = 'error';
        details = `エラー: ${errorMessage}`;
        break;
    }

    usageDisplay.innerHTML = `
      <div class="usage-header ${statusClass}">
        <span class="usage-icon">${statusIcon}</span>
        <span class="usage-model">🤖 ${model.toUpperCase()}</span>
        <span class="usage-status">${status === 'starting' ? '処理中' : status === 'completed' ? '完了' : 'エラー'}</span>
      </div>
      <div class="usage-content">${details}</div>
    `;
  }

  toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.classList.toggle('open');
      
      if (panel.classList.contains('open')) {
        this.loadCurrentApiKeys();
        this.updateSettingsModelStatus();
      }
    }
  }

  loadCurrentApiKeys() {
    const grokKey = StorageUtils.getApiKey('GROK');
    const grokInput = document.getElementById('grokApiKey');
    
    if (grokInput) {
      grokInput.value = grokKey || '';
    }
  }

  updateSettingsModelStatus() {
    const key = StorageUtils.getApiKey('GROK');
    const statusEl = document.getElementById('settingsGrokStatus');
    
    if (statusEl) {
      statusEl.textContent = key ? '✅' : '❌';
      statusEl.title = key ? 'APIキー設定済み' : 'APIキー未設定';
    }
  }

  toggleApiKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(inputId + 'Toggle');
    
    if (input && toggle) {
      if (input.type === 'password') {
        input.type = 'text';
        toggle.textContent = '🙈';
      } else {
        input.type = 'password';
        toggle.textContent = '👁️';
      }
    }
  }

  closeAllModals() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) settingsPanel.classList.remove('open');
    
    
    const errorLogModal = document.getElementById('errorLogModal');
    if (errorLogModal) errorLogModal.style.display = 'none';
    
    const setupModal = document.getElementById('setupModal');
    if (setupModal) setupModal.style.display = 'none';
  }
}

// ================================
// FILE UPLOAD HANDLER CLASS
// ================================

class FileUploadHandler {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (dropZone) {
      dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
      dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
      dropZone.addEventListener('drop', this.handleDrop.bind(this));
    }

    if (fileInput) {
      fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.add('drag-over');
    document.getElementById('dropOverlay').style.display = 'flex';
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === document.getElementById('dropZone') || 
        e.target === document.getElementById('dropOverlay')) {
      document.getElementById('dropZone').classList.remove('drag-over');
      document.getElementById('dropOverlay').style.display = 'none';
    }
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    document.getElementById('dropZone').classList.remove('drag-over');
    document.getElementById('dropOverlay').style.display = 'none';
    
    const files = Array.from(e.dataTransfer.files);
    this.processFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.processFiles(files);
  }

  async processFiles(files) {
    if (files.length === 0) return;
    
    if (this.app.uploadedFiles.length + files.length > 20) {
      console.log('最大20ファイルまでアップロード可能です');
      return;
    }
    
    const validFiles = [];
    for (const file of files) {
      const validation = this.app.fileProcessor.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        console.log(`${file.name}: ${validation.errors.join(', ')}`);
      }
    }
    
    if (validFiles.length === 0) return;
    
    await this.processFilesWithProgress(validFiles);
  }

  async processFilesWithProgress(files) {
    window.UIUtils.showLoading(`${files.length}個のファイルを処理中...`);
    
    const fileEntries = files.map(file => ({
      fileName: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      content: null,
      error: null
    }));
    
    this.app.uploadedFiles.push(...fileEntries);
    this.app.uiController.displayUploadedFiles();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = this.app.uploadedFiles.length - files.length + i;
      const fileEntry = this.app.uploadedFiles[fileIndex];
      
      try {
        fileEntry.status = 'processing';
        this.updateFileItemStatus(fileIndex);
        
        const result = await this.app.fileProcessor.processFile(file);
        
        fileEntry.content = result.content;
        fileEntry.status = 'completed';
        fileEntry.processedAt = result.processedAt;
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        fileEntry.status = 'failed';
        fileEntry.error = error.message;
      }
      
      this.updateFileItemStatus(fileIndex);
    }
    
    window.UIUtils.hideLoading();
    
    const successCount = fileEntries.filter(f => f.status === 'completed').length;
    const failedCount = fileEntries.filter(f => f.status === 'failed').length;
    
    if (successCount > 0) {
      window.UIUtils.showSuccess(
        `${successCount}個のファイルを正常に処理しました` +
        (failedCount > 0 ? `\n${failedCount}個のファイルでエラーが発生しました` : '')
      );
    } else {
      console.log('すべてのファイル処理に失敗しました');
    }
    
    this.app.saveData();
  }

  updateFileItemStatus(index) {
    const fileItem = document.querySelector(`.file-item[data-index="${index}"]`);
    if (!fileItem) return;
    
    const file = this.app.uploadedFiles[index];
    const newHTML = TemplateUtils.createFileItemHTML(file, index);
    
    const temp = document.createElement('div');
    temp.innerHTML = newHTML;
    const newFileItem = temp.firstElementChild;
    
    fileItem.replaceWith(newFileItem);
  }

  removeFile(index) {
    if (index >= 0 && index < this.app.uploadedFiles.length) {
      this.app.uploadedFiles.splice(index, 1);
      this.app.uiController.displayUploadedFiles();
      this.app.saveData();
      // ファイル削除成功（メッセージを簡略化）
    }
  }

  viewFile(index) {
    const file = this.app.uploadedFiles[index];
    if (!file || !file.content) {
      console.log('ファイル内容を表示できません');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'file-content-modal';
    modal.innerHTML = `
      <div class="file-content-dialog">
        <div class="file-content-header">
          <h3>${FileUtils.getFileIcon(file.fileName)} ${file.fileName}</h3>
          <button class="btn-icon" onclick="this.closest('.file-content-modal').remove()">✕</button>
        </div>
        <div class="file-content-body">
          <pre>${this.escapeHtml(file.content)}</pre>
        </div>
        <div class="file-content-footer">
          <button class="btn-secondary" onclick="navigator.clipboard.writeText(this.dataset.content).then(() => window.UIUtils.showSuccess('コピーしました'))" data-content="${this.escapeHtml(file.content)}">
            📋 コピー
          </button>
          <button class="btn-primary" onclick="this.closest('.file-content-modal').remove()">
            閉じる
          </button>
        </div>
      </div>
    `;
    
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    });
    
    document.body.appendChild(modal);
  }

  async retryFileProcessing(index) {
    const fileEntry = this.app.uploadedFiles[index];
    if (!fileEntry || fileEntry.status !== 'failed') return;
    
    const fileInput = document.getElementById('fileInput');
    if (!fileInput || !fileInput.files) {
      console.log('元のファイルが見つかりません。再度アップロードしてください。');
      return;
    }
    
    let originalFile = null;
    for (const file of fileInput.files) {
      if (file.name === fileEntry.fileName) {
        originalFile = file;
        break;
      }
    }
    
    if (!originalFile) {
      console.log('元のファイルが見つかりません。再度アップロードしてください。');
      return;
    }
    
    try {
      fileEntry.status = 'processing';
      fileEntry.error = null;
      this.updateFileItemStatus(index);
      
      window.UIUtils.showLoading(`${fileEntry.fileName} を再処理中...`);
      
      const result = await this.app.fileProcessor.processFile(originalFile);
      
      fileEntry.content = result.content;
      fileEntry.status = 'completed';
      fileEntry.processedAt = result.processedAt;
      
      window.UIUtils.hideLoading();
      // ファイル処理成功（メッセージを簡略化）
      
    } catch (error) {
      console.error(`Retry error for ${fileEntry.fileName}:`, error);
      fileEntry.status = 'failed';
      fileEntry.error = error.message;
      
      window.UIUtils.hideLoading();
      console.log(`再処理エラー: ${error.message}`);
    }
    
    this.updateFileItemStatus(index);
    this.app.saveData();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ================================
// CORE APPLICATION CLASS
// ================================

class AppCore {
  constructor() {
    try {
      this.fileProcessor = new ClientFileProcessor();
      this.aiService = new AIService();
      
      // Application state
      this.uploadedFiles = [];
      this.analysisData = null;
      this.selectedReference = null;
      this.generatedLP = null;
      this.referenceDatabase = [];
      this.lastRawResponse = null;
      
      // Initialize UI and file handlers after creation
      this.uiController = null;
      this.fileHandler = null;
      
    } catch (error) {
      console.error('App initialization error:', error);
      setTimeout(() => {
        if (window.UIUtils) {
          console.log('アプリケーションの初期化に失敗しました');
        }
      }, 100);
    }
  }

  async init() {
    console.log('Initializing LP Generator App...');
    
    await this.loadReferenceDatabase();
    this.loadSavedData();
    this.checkModelAvailability();
    this.showModelSelectorAndActions();
    
    console.log('App initialized successfully');
  }


  async checkModelAvailability() {
    console.log('Checking model availability...');
    
    const models = ['grok'];
    const availableServices = this.aiService.getAvailableServices();
    
    for (const model of models) {
      const statusEl = document.getElementById(`${model}Status`);
      const cardEl = document.getElementById(`${model}Card`);
      
      if (statusEl) {
        const isAvailable = availableServices.includes(model);
        const statusText = statusEl.querySelector('.status-text');
        const statusIndicator = statusEl.querySelector('.status-indicator');
        
        if (isAvailable) {
          statusText.textContent = '利用可能';
          statusIndicator.style.backgroundColor = '#059669';
          if (cardEl) {
            cardEl.classList.remove('disabled');
            cardEl.style.opacity = '1';
            cardEl.style.cursor = 'pointer';
          }
        } else {
          statusText.textContent = 'APIキー未設定';
          statusIndicator.style.backgroundColor = '#dc2626';
          if (cardEl) {
            cardEl.classList.add('disabled');
            cardEl.style.opacity = '0.5';
          }
        }
      }
    }
    
    const settingsModels = ['Grok'];
    settingsModels.forEach(model => {
      const statusEl = document.getElementById(`settings${model}Status`);
      if (statusEl) {
        const modelKey = model.toLowerCase().replace('claudecode', 'claude-code');
        const isAvailable = availableServices.includes(modelKey);
        statusEl.textContent = isAvailable ? '✅' : '❌';
      }
    });
    
    const selectedModel = this.aiService.getSelectedModel();
    if (selectedModel && !availableServices.includes(selectedModel)) {
      console.warn(`Previously selected model ${selectedModel} is no longer available`);
      this.aiService.setSelectedModel(null);
      if (this.uiController) {
        this.uiController.updateSelectedModelDisplay(null);
      }
    }
    
    // Auto-select Grok if no model is selected and Grok is available
    if (!selectedModel && availableServices.includes('grok')) {
      console.log('Auto-selecting Grok as it is available');
      this.selectAIModel('grok');
    }
  }

  selectAIModel(model) {
    console.log('Selecting AI model:', model);
    
    const availableServices = this.aiService.getAvailableServices();
    if (!availableServices.includes(model)) {
      if (model === 'claude-code') {
        console.log('Claude Codeは専用環境でのみ利用可能です');
      } else {
        console.log(`${model.toUpperCase()} APIキーが設定されていません。設定画面から入力してください。`);
      }
      return;
    }
    
    this.aiService.setSelectedModel(model);
    
    if (this.uiController) {
      this.uiController.updateSelectedModelDisplay(model);
    }
    
    const models = ['grok'];
    models.forEach(m => {
      const card = document.getElementById(`${m}Card`);
      if (card) {
        if (m === model) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      }
    });
    
    const radioButton = document.querySelector(`input[name="selectedModel"][value="${model}"]`);
    if (radioButton) {
      radioButton.checked = true;
    }
    
    console.log('✅ Model selected:', model);
  }

  changeAIModel() {
    const selectedInfo = document.getElementById('selectedModelInfo');
    const modelCards = document.querySelectorAll('.model-card');
    
    if (selectedInfo) selectedInfo.style.display = 'none';
    
    modelCards.forEach(card => {
      card.classList.remove('selected');
      card.style.display = 'block';
    });
    
    this.aiService.setSelectedModel(null);
  }

  async testSelectedModel() {
    const selectedModel = this.aiService.getSelectedModel();
    if (!selectedModel) {
      console.log('テストするモデルを選択してください');
      return;
    }
    
    try {
      window.UIUtils.showLoading(`${selectedModel} の接続をテスト中...`);
      
      const result = await this.aiService.testConnection(selectedModel);
      
      window.UIUtils.hideLoading();
      window.UIUtils.showSuccess(
        `✅ ${selectedModel.toUpperCase()} 接続成功！\n` +
        `モデル: ${result.model}\n` +
        `応答: ${result.content.substring(0, 50)}...`
      );
      
    } catch (error) {
      window.UIUtils.hideLoading();
      console.log(`${selectedModel} 接続テストエラー: ${error.message}`);
    }
  }

  showModelSelectorAndActions() {
    const modelSection = document.getElementById('modelSelectorSection');
    const uploadActions = document.getElementById('uploadActions');
    
    if (modelSection) {
      modelSection.style.display = 'block';
      console.log('✅ Model selector shown');
    }
    
    if (uploadActions) {
      uploadActions.style.display = 'flex';
      console.log('✅ Action buttons shown');
    }
  }

  async loadReferenceDatabase() {
    try {
      this.referenceDatabase = this.getEmbeddedReferences();
      console.log(`Loaded ${this.referenceDatabase.length} reference LPs`);
    } catch (error) {
      console.error('Failed to load reference database:', error);
      this.referenceDatabase = [];
    }
  }

  getEmbeddedReferences() {
    return [
      {
        id: 'ref001',
        title: 'Notion',
        category: 'saas',
        description: 'オールインワンワークスペース。ドキュメント、データベース、タスク管理を統合',
        tags: ['ワークスペース', 'ドキュメント', 'コラボレーション'],
        cvr: '18.5%',
        features: ['シンプルなUI', 'パワフルな機能', '豊富なテンプレート'],
        targetAudience: 'スタートアップ、クリエイター、学生',
        colorScheme: ['#000000', '#FFFFFF'],
        url: 'https://www.notion.so/',
        image: 'https://via.placeholder.com/400x300?text=Notion'
      },
      {
        id: 'ref002',
        title: 'Slack',
        category: 'saas',
        description: 'チームコミュニケーションツール。効率的なワークスペース',
        tags: ['コミュニケーション', 'チーム', 'ワークフロー'],
        cvr: '16.2%',
        features: ['リアルタイム通信', '外部サービス連携', 'カスタマイズ可能'],
        targetAudience: '企業、開発チーム、リモートワーカー',
        colorScheme: ['#4A154B', '#FFFFFF'],
        url: 'https://slack.com/',
        image: 'https://via.placeholder.com/400x300?text=Slack'
      },
      {
        id: 'ref003',
        title: 'Zoom',
        category: 'saas',
        description: 'ビデオ会議・ウェビナープラットフォーム',
        tags: ['ビデオ会議', 'ウェビナー', 'コミュニケーション'],
        cvr: '14.8%',
        features: ['HD画質', '大規模会議対応', 'セキュリティ'],
        targetAudience: '企業、教育機関、個人事業主',
        colorScheme: ['#2D8CFF', '#FFFFFF'],
        url: 'https://zoom.us/',
        image: 'https://via.placeholder.com/400x300?text=Zoom'
      }
    ];
  }

  saveData() {
    try {
      const dataToSave = {
        uploadedFiles: this.uploadedFiles,
        analysisData: this.analysisData,
        selectedReference: this.selectedReference,
        selectedModel: this.aiService.getSelectedModel()
      };
      
      StorageUtils.saveAnalysisData(dataToSave);
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  loadSavedData() {
    try {
      const savedData = StorageUtils.getAnalysisData();
      if (savedData) {
        if (savedData.uploadedFiles) {
          this.uploadedFiles = savedData.uploadedFiles;
          if (this.uiController) {
            this.uiController.displayUploadedFiles();
          }
        }
        
        if (savedData.analysisData) {
          this.analysisData = savedData.analysisData;
        }
        
        if (savedData.selectedReference) {
          this.selectedReference = savedData.selectedReference;
        }
        
        if (savedData.selectedModel) {
          const availableServices = this.aiService.getAvailableServices();
          if (availableServices.includes(savedData.selectedModel)) {
            this.selectAIModel(savedData.selectedModel);
          }
        }
        
        console.log('Saved data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  clearData() {
    try {
      localStorage.removeItem('ANALYSIS_DATA');
      localStorage.removeItem('GENERATED_LP');
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  handleBeforeUnload(e) {
    if (this.uploadedFiles.length > 0 || this.analysisData) {
      e.preventDefault();
      e.returnValue = '作業中のデータがあります。本当にページを離れますか？';
    }
  }

  handleKeyShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveData();
      // データ保存成功（メッセージを簡略化）
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      if (this.analysisData || this.uploadedFiles.length > 0) {
        this.generateLPDirectly();
      }
    }
    
    if (e.key === 'Escape') {
      if (this.uiController) {
        this.uiController.closeAllModals();
      }
    }
  }
}

// ================================
// MAIN APPLICATION CLASS
// ================================

class LPGeneratorApp {
  constructor() {
    // Create core app instance
    this.core = new AppCore();
    
    // Create UI controller
    this.uiController = new UIController(this.core);
    this.core.uiController = this.uiController;
    
    // Create file handler
    this.fileHandler = new FileUploadHandler(this.core);
    this.core.fileHandler = this.fileHandler;
    
    // Store reference for global access
    window.uiController = this.uiController;
    
    // Setup additional event listeners
    this.setupEventListeners();
  }

  async init() {
    await this.core.init();
  }

  setupEventListeners() {
    document.addEventListener('keydown', this.core.handleKeyShortcuts.bind(this.core));
    window.addEventListener('beforeunload', this.core.handleBeforeUnload.bind(this.core));
  }

  // File operations
  removeFile(index) {
    this.fileHandler.removeFile(index);
  }

  viewFile(index) {
    this.fileHandler.viewFile(index);
  }

  retryFileProcessing(index) {
    this.fileHandler.retryFileProcessing(index);
  }

  // LP Generation
  async generateLPDirectly() {
    await this.generateLP();
  }

  async generateLP() {
    let selectedModel = this.core.aiService.getSelectedModel();
    console.log('Current selected model:', selectedModel);
    
    // If no model is selected, try to auto-select Grok if available
    if (!selectedModel) {
      const availableServices = this.core.aiService.getAvailableServices();
      console.log('Available services:', availableServices);
      
      if (availableServices.includes('grok')) {
        console.log('Auto-selecting Grok for LP generation');
        this.selectAIModel('grok');  // Use the app's selectAIModel method
        
        // Wait a moment for the selection to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the selected model again
        selectedModel = this.core.aiService.getSelectedModel();
        console.log('Selected model after auto-selection:', selectedModel);
        
        if (!selectedModel) {
          console.log('モデルの選択に失敗しました。ページをリロードしてください。');
          return;
        }
      } else {
        console.log('先にGrok APIキーを設定してください');
        return;
      }
    }

    let content = '';
    if (this.core.uploadedFiles.length === 0) {
      console.log('ファイルがアップロードされていません。クライアント資料をアップロードしてからLP生成を実行してください。');
      return;
    } else {
      content = this.core.uploadedFiles
        .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
        .join('\n\n---\n\n');
    }

    try {
      this.uiController.showSection('generatingSection');
      this.uiController.updateProgress(0, `${selectedModel.toUpperCase()}でLP生成を開始しています...`);

      const startTime = Date.now();
      
      // Progress step 1: Analyzing uploaded files
      this.uiController.updateProgress(15, 'アップロードされた資料を分析中...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Progress step 2: Preparing generation context
      this.uiController.updateProgress(30, 'コンテンツ生成の準備中...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.uiController.updateAIUsageDisplay(selectedModel, 'starting', 0, 0);
      
      // Progress step 3: AI generation in progress
      this.uiController.updateProgress(45, 'AIがランディングページを生成中...');

      const result = await this.core.aiService.generateLP(content, this.core.selectedReference);
      
      const generationTime = Date.now() - startTime;
      
      this.uiController.updateAIUsageDisplay(selectedModel, 'completed', result.usage, generationTime, result.content?.length);
      
      this.uiController.updateProgress(75, 'AI応答を解析中...');
      
      // Parse the result and ensure it's saved properly
      let parsedResult = this.parseLPGenerationResult(result.content, selectedModel, result);
      
      // Ensure we have at least basic content
      if (!parsedResult || !parsedResult.code || !parsedResult.code.html) {
        console.warn('⚠️ Parsed result missing HTML, creating fallback');
        parsedResult = {
          code: {
            html: this.generateBasicHTML(result.content || 'LP生成が完了しました'),
            css: this.generateBasicCSS(),
            js: ''
          },
          analysis: {
            targetAudience: 'AI分析結果',
            keyMessages: ['生成されたコンテンツ'],
            designConcept: 'AIによる自動生成'
          },
          performance: {
            expectedCvr: '評価中',
            seoScore: '評価中',
            speedScore: '評価中'
          }
        };
      }
      
      this.core.generatedLP = parsedResult;
      
      // Also save to window.lpApp for backup
      if (window.lpApp) {
        window.lpApp.generatedLP = parsedResult;
        window.lpApp.core.generatedLP = parsedResult;
      }
      
      console.log('💾 Saved generatedLP:', {
        hasCore: !!this.core.generatedLP,
        hasAppCore: !!window.lpApp?.core?.generatedLP,
        hasApp: !!window.lpApp?.generatedLP,
        parsedKeys: Object.keys(parsedResult || {})
      });
      
      // Save usage data for display
      this.core.lastUsageData = {
        model: selectedModel,
        modelName: result.model || this.core.aiService.defaultModels[selectedModel] || selectedModel,
        usage: result.usage,
        generationTime: generationTime,
        responseSize: result.content?.length || 0,
        timestamp: new Date().toISOString()
      };
      
      this.uiController.updateProgress(85, 'コンテンツ構造を検証中...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.uiController.updateProgress(90, '結果画面を準備中...');
      
      // Force update preview before showing results
      if (parsedResult && parsedResult.code && parsedResult.code.html) {
        console.log('📄 Updating preview with generated HTML');
        // updatePreview will use the generatedLP we just saved
        this.uiController.updatePreview();
      }
      
      this.uiController.displayGenerationResults();
      this.uiController.displayUsageSummary(this.core.lastUsageData);
      
      // Ensure result section is shown with delay for DOM update
      console.log('🎯 Showing result section...');
      setTimeout(() => {
        // Hide generating section and other sections first
        const generatingSection = document.getElementById('generatingSection');
        if (generatingSection) {
          generatingSection.style.display = 'none';
        }
        
        // Also hide API config and prompt sections
        const apiConfigSection = document.getElementById('apiConfigSection');
        if (apiConfigSection) {
          apiConfigSection.style.display = 'none';
        }
        
        const promptSection = document.getElementById('promptSelectionSection');
        if (promptSection) {
          promptSection.style.display = 'none';
        }
        
        this.uiController.showSection('resultSection');
        // Double-check visibility
        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
          resultSection.style.display = 'block';
          console.log('✅ Result section displayed');
          
          // Scroll to result section
          resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.error('❌ Result section element not found!');
        }
      }, 300);
      
      this.uiController.updateProgress(95, '最終チェック中...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.uiController.updateProgress(90, 'LP生成完了！');
      
      const successMessage = `LP生成が完了しました！\n\n🤖 使用モデル: ${selectedModel.toUpperCase()}\n⏱️ 生成時間: ${(generationTime/1000).toFixed(1)}秒\n📝 応答サイズ: ${result.content?.length || 0} 文字`;
      this.uiController.showSuccess(successMessage);
      
      this.core.lastRawResponse = {
        model: selectedModel,
        content: result.content,
        usage: result.usage,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.uiController.hideLoading();
      this.uiController.updateAIUsageDisplay(selectedModel, 'error', null, 0, 0, error.message);
      
      console.error('LP generation detailed error:', {
        model: selectedModel,
        error: error,
        stack: error.stack,
        time: new Date().toISOString()
      });
      
      console.log(`LP生成エラー (${selectedModel}): ${error.message}`);
    }
  }

  // Parse AI response
  parseAIResponse(content) {
    try {
      let cleanContent = content.trim();
      
      if (cleanContent.includes('```json') && cleanContent.includes('```')) {
        console.log('Detected multiple JSON blocks in response');
        
        const jsonBlocks = [];
        const regex = /```json\s*([\s\S]*?)\s*```/g;
        let match;
        
        while ((match = regex.exec(cleanContent)) !== null) {
          try {
            const parsed = JSON.parse(match[1].trim());
            if (parsed && typeof parsed === 'object') {
              jsonBlocks.push(parsed);
            }
          } catch (e) {
            console.warn('Failed to parse JSON block:', match[1].substring(0, 100));
          }
        }
        
        const validBlock = jsonBlocks.find(block => 
          block.code && block.code.html && block.code.html.includes('<!DOCTYPE html>')
        );
        
        if (validBlock) {
          console.log('Found valid JSON block with complete HTML');
          return validBlock;
        }
        
        if (jsonBlocks.length > 0) {
          console.log('Using largest JSON block as fallback');
          return jsonBlocks.reduce((largest, current) => 
            JSON.stringify(current).length > JSON.stringify(largest).length ? current : largest
          );
        }
      }
      
      if (cleanContent.includes('{') && !cleanContent.startsWith('{')) {
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
          console.log('Cleaned mixed content, extracted JSON portion');
        }
      }
      
      return JSON.parse(cleanContent);
    } catch (error) {
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1].trim());
        }
        
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          return JSON.parse(codeMatch[1].trim());
        }
        
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = content.substring(jsonStart, jsonEnd + 1);
          return JSON.parse(jsonStr);
        }
        
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('{')) {
            const remainingContent = lines.slice(i).join('\n');
            const endBrace = remainingContent.lastIndexOf('}');
            if (endBrace !== -1) {
              const possibleJson = remainingContent.substring(0, endBrace + 1);
              return JSON.parse(possibleJson);
            }
          }
        }
        
        throw new Error('No valid JSON found in response');
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON:', parseError);
        console.log('Raw response:', content);
        
        return {
          businessInfo: {
            companyName: '分析中',
            serviceName: '分析中',
            industry: '分析中',
            businessModel: '分析中'
          },
          targetAudience: {
            primary: '分析中',
            painPoints: ['分析中']
          },
          valueProposition: {
            mainMessage: '分析中',
            uniqueSellingPoints: ['分析中']
          },
          designHints: {
            preferredColors: ['#2563eb'],
            brandTone: '分析中',
            logoDescription: '分析中'
          }
        };
      }
    }
  }

  // Parse LP generation result
  parseLPGenerationResult(content, model, fullResult) {
    try {
      console.log(`Parsing ${model} response:`, {
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 200) + '...',
        fullResultKeys: Object.keys(fullResult || {})
      });
      
      const parsed = this.parseAIResponse(content);
      
      console.log(`${model} parsed structure:`, {
        hasCode: !!parsed.code,
        hasHtml: !!parsed.code?.html,
        hasCss: !!parsed.code?.css,
        hasAnalysis: !!parsed.analysis,
        hasPerformance: !!parsed.performance
      });
      
      return {
        code: {
          html: parsed.code?.html || this.generateBasicHTML(content),
          css: parsed.code?.css || this.generateBasicCSS(),
          js: parsed.code?.js || ''
        },
        analysis: parsed.analysis || {
          targetAudience: '分析中',
          keyMessages: ['メッセージ抽出中'],
          designConcept: 'コンセプト分析中'
        },
        performance: parsed.performance || {
          expectedCvr: '計算中',
          seoScore: '評価中',
          speedScore: '測定中'
        },
        proposal: {
          proposalTitle: 'AI生成LP提案',
          executiveSummary: parsed.analysis?.designConcept || 'アップロードされた資料を基にAIが生成したランディングページです。',
          sections: [
            {
              title: 'ターゲット分析',
              content: parsed.analysis?.targetAudience || '分析中'
            },
            {
              title: '主要メッセージ',
              content: parsed.analysis?.keyMessages?.join('、') || 'メッセージ抽出中'
            }
          ],
          investment: {
            traditionalApproach: '従来の手動制作: 2-4週間',
            aiApproach: 'AI自動生成: 1時間以内',
            savings: '制作時間90%短縮'
          }
        }
      };
    } catch (error) {
      console.error(`${model} JSON parsing failed:`, {
        error: error.message,
        contentLength: content?.length || 0,
        contentStart: content?.substring(0, 300),
        contentEnd: content?.substring(content?.length - 300),
        parseAttempt: 'parseLPGenerationResult'
      });
      
      setTimeout(() => {
        console.log(`${model}の応答をJSONとして解析できませんでした。別のモデルを試してください。`);
      }, 1000);
      
      return {
        code: {
          html: this.extractCodeBlock(content, 'html') || this.generateBasicHTML(content),
          css: this.extractCodeBlock(content, 'css') || this.generateBasicCSS(),
          js: this.extractCodeBlock(content, 'js') || ''
        },
        proposal: {
          proposalTitle: 'AI生成LP提案',
          executiveSummary: 'アップロードされた資料を基にAIが生成したランディングページです。',
          sections: [
            {
              title: '生成内容',
              content: content.substring(0, 500) + (content.length > 500 ? '...' : '')
            }
          ],
          investment: {
            traditionalApproach: '従来の手動制作: 2-4週間',
            aiApproach: 'AI自動生成: 1時間以内',
            savings: '制作時間90%短縮'
          }
        }
      };
    }
  }

  // Helper methods
  generateBasicHTML(content) {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ランディングページ</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1>生成されたランディングページ</h1>
        <p>AIによる自動生成コンテンツ</p>
        <div class="content">
            ${content ? content.substring(0, 1000) : 'コンテンツの生成に失敗しました'}
        </div>
    </main>
</body>
</html>`;
  }

  generateBasicCSS() {
    return `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2563eb;
    margin-bottom: 20px;
}

.content {
    background: #f8f8f8;
    padding: 20px;
    border-radius: 8px;
}`;
  }

  extractCodeBlock(content, type) {
    const patterns = [
      new RegExp(`\`\`\`${type}\\s*([\\s\\S]*?)\`\`\``, 'i'),
      new RegExp(`<${type}>([\\s\\S]*?)<\\/${type}>`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Reference operations
  proceedToReferences() {
    this.uiController.displayReferences();
    this.uiController.showSection('referenceSection');
  }

  selectReference(refId) {
    const reference = this.core.referenceDatabase.find(ref => ref.id === refId);
    if (reference) {
      this.core.selectedReference = reference;
      
      document.querySelectorAll('.reference-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === refId);
      });
    }
  }

  async selectAndGenerate(refId) {
    this.selectReference(refId);
    await this.generateLP();
  }

  // Model operations
  selectAIModel(model) {
    console.log('Selecting AI model:', model);
    
    const availableServices = this.core.aiService.getAvailableServices();
    if (!availableServices.includes(model)) {
      if (model === 'claude-code') {
        console.log('Claude Codeは専用環境でのみ利用可能です');
      } else {
        console.log(`${model.toUpperCase()} APIキーが設定されていません。設定画面から入力してください。`);
      }
      return;
    }
    
    this.core.aiService.setSelectedModel(model);
    
    if (this.uiController) {
      this.uiController.updateSelectedModelDisplay(model);
    }
    
    // Update model card selection
    document.querySelectorAll('.model-card').forEach(card => {
      card.classList.remove('selected');
    });
    const selectedCard = document.getElementById(`${model}Card`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
    
    // Update radio buttons
    const radioInput = document.querySelector(`input[name="selectedModel"][value="${model}"]`);
    if (radioInput) {
      radioInput.checked = true;
    }
    
    console.log(`AI Model ${model} selected successfully`);
  }

  changeAIModel() {
    this.core.changeAIModel();
  }

  testSelectedModel() {
    this.core.testSelectedModel();
  }

  // UI operations
  showTab(tabName) {
    this.uiController.showTab(tabName);
  }

  setDevice(device) {
    this.uiController.setDevice(device);
  }

  refreshPreview() {
    this.uiController.updatePreview();
  }

  openPreviewInNewTab() {
    // Check both possible locations for generatedLP
    const lp = this.core?.generatedLP || this.generatedLP;
    if (!lp || !lp.code) {
      console.log('プレビューするLPがありません');
      return;
    }
    
    const fullHTML = this.uiController.combineCodeForPreview(lp.code);
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    window.open(url, '_blank');
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async copyCode(type) {
    await this.uiController.copyCode(type);
  }

  // Download operations
  async downloadAll() {
    // Check both possible locations for generatedLP
    const lp = this.core?.generatedLP || this.generatedLP;
    if (!lp || !lp.code) {
      console.log('ダウンロードするLPがありません');
      return;
    }
    
    try {
      const files = {
        'index.html': lp.code.html || '',
        'style.css': lp.code.css || '',
        'script.js': lp.code.js || '',
        'README.md': ExportUtils.generateReadme(lp)
      };
      
      if (lp.proposal) {
        files['proposal.json'] = JSON.stringify(lp.proposal, null, 2);
      }
      
      const zipBlob = await ExportUtils.createZipFile(files);
      ExportUtils.downloadFile(
        zipBlob,
        `lp-${new Date().toISOString().slice(0, 10)}.zip`,
        'application/zip'
      );
      
      this.uiController.showSuccess('LPファイルをダウンロードしました');
      
    } catch (error) {
      console.error('Download error:', error);
      console.log('ダウンロードに失敗しました');
    }
  }

  downloadProposal() {
    // Check both possible locations for generatedLP
    const lp = this.core?.generatedLP || this.generatedLP;
    if (!lp || !lp.proposal) {
      console.log('ダウンロードする提案資料がありません');
      return;
    }
    
    const content = JSON.stringify(lp.proposal, null, 2);
    ExportUtils.downloadFile(
      content,
      `proposal-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    
    this.uiController.showSuccess('提案資料をダウンロードしました');
  }

  // Settings operations
  toggleSettings() {
    this.uiController.toggleSettings();
  }

  toggleApiKeyVisibility(inputId) {
    this.uiController.toggleApiKeyVisibility(inputId);
  }

  saveSettings() {
    const grokKey = document.getElementById('grokApiKey')?.value || '';
    
    const keys = {
      GROK_API_KEY: grokKey
    };
    
    let savedCount = 0;
    
    if (grokKey && ValidationUtils.validateApiKey('GROK', grokKey)) {
      // Save temporarily to sessionStorage only
      sessionStorage.setItem('TEMP_GROK_API_KEY', grokKey);
      savedCount++;
    }
    
    if (savedCount > 0) {
      this.core.checkModelAvailability();
      
      const selectedModel = document.querySelector('input[name="selectedModel"]:checked');
      if (selectedModel) {
        this.core.selectAIModel(selectedModel.value);
      }
      
      // 設定保存成功（メッセージを簡略化）
      this.toggleSettings();
    } else {
      console.log('有効なAPIキーを入力してください');
    }
  }

  clearSettings() {
    // 設定をクリア（確認ダイアログを削除）
    {
      StorageUtils.clearApiKeys();
      document.getElementById('grokApiKey').value = '';
      
      this.core.aiService.setSelectedModel(null);
      this.core.checkModelAvailability();
      // 設定クリア成功（メッセージを簡略化）
    }
  }

  // Setup operations
  skipSetup() {
    document.getElementById('setupModal').style.display = 'none';
  }

  saveSetup() {
    const grokKey = document.getElementById('setupGrokKey')?.value || '';
    
    if (!grokKey) {
      console.log('Grok APIキーを入力してください');
      return;
    }
    
    // Save temporarily to sessionStorage only
    if (grokKey && grokKey.startsWith('xai-')) {
      sessionStorage.setItem('TEMP_GROK_API_KEY', grokKey);
    }
    
    document.getElementById('setupModal').style.display = 'none';
    this.core.checkModelAvailability();
    // 初期設定完了（メッセージを簡略化）
  }
}

// ================================
// GLOBAL FUNCTION MAPPINGS
// ================================

// Make utilities globally available
window.FileUtils = FileUtils;
window.StorageUtils = StorageUtils;
window.ValidationUtils = ValidationUtils;
window.TemplateUtils = TemplateUtils;
window.ExportUtils = ExportUtils;
window.UIUtils = {
  showLoading: (msg) => window.uiController?.showLoading(msg),
  hideLoading: () => window.uiController?.hideLoading(),
  showSuccess: (msg) => window.uiController?.showSuccess(msg),
  showSection: (id) => window.uiController?.showSection(id),
  updateProgress: (p, m) => window.uiController?.updateProgress(p, m),
  showTab: (name) => window.uiController?.showTab(name),
  copyCode: async (type) => window.uiController?.copyCode(type)
};

// Global function mappings for compatibility
// Make API functions globally available
window.saveApiKey = saveApiKey;
window.testApiConnection = testApiConnection;
window.selectAIModel = selectAIModel;
window.changeAIModel = changeAIModel;
window.generateLPDirectly = generateLPDirectly;
window.selectCopywriterStyle = selectCopywriterStyle;
window.generateWithSelectedPrompts = generateWithSelectedPrompts;
window.togglePrompt = togglePrompt;
window.clearSelectedPrompts = clearSelectedPrompts;
window.showSelectedPrompts = showSelectedPrompts;
window.sendImprovementRequest = sendImprovementRequest;
window.togglePrompt = togglePrompt;
window.clearSelectedPrompts = clearSelectedPrompts;
window.showSelectedPrompts = showSelectedPrompts;
window.clearImprovementForm = clearImprovementForm;

function removeFile(index) {
  window.lpApp?.removeFile(index);
}

function viewFile(index) {
  window.lpApp?.viewFile(index);
}

function retryFileProcessing(index) {
  window.lpApp?.retryFileProcessing(index);
}


function filterReferences() {
  window.lpApp?.uiController.displayReferences();
}

function selectReference(refId) {
  window.lpApp?.selectReference(refId);
}

function previewReference(refId) {
  const reference = window.lpApp?.core.referenceDatabase.find(ref => ref.id === refId);
  if (reference && reference.url) {
    window.open(reference.url, '_blank');
  }
}

function selectAndGenerate(refId) {
  window.lpApp?.selectAndGenerate(refId);
}

function generateVariations() {
  console.log('バリエーション生成機能は開発中です');
}





function improveLP() {
  console.log('改善提案機能は開発中です');
}

function generateABTests() {
  console.log('A/Bテスト生成機能は開発中です');
}

function downloadAll() {
  window.lpApp?.downloadAll();
}

function downloadProposal() {
  window.lpApp?.downloadProposal();
}

function showTab(tabName) {
  window.lpApp?.showTab(tabName);
}

function setDevice(device) {
  window.lpApp?.setDevice(device);
}

function refreshPreview() {
  window.lpApp?.refreshPreview();
}

function openPreviewInNewTab() {
  window.lpApp?.openPreviewInNewTab();
}

function copyCode(type) {
  window.lpApp?.copyCode(type);
}

function selectAIModel(model) {
  window.lpApp?.selectAIModel(model);
}

function changeAIModel() {
  window.lpApp?.changeAIModel();
}

// Manual function to ensure Grok is selected
function ensureGrokSelected() {
  if (window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
    const availableServices = window.lpApp.core.aiService.getAvailableServices();
    if (availableServices.includes('grok')) {
      console.log('Manually selecting Grok');
      window.lpApp.selectAIModel('grok');
      const selectedModel = window.lpApp.core.aiService.getSelectedModel();
      console.log('Selected model is now:', selectedModel);
      return true;
    } else {
      console.log('Grok is not available. Please set API key first.');
      return false;
    }
  }
  console.log('App not initialized yet');
  return false;
}

// Add to window for easy access
window.ensureGrokSelected = ensureGrokSelected;

// LP Improvement Functions
// Global array to store selected prompts
window.selectedPrompts = window.selectedPrompts || [];

// Safe DOM element access utility
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id '${id}' not found`);
    return null;
  }
  return element;
}

// Safe DOM query selector utility
function safeQuerySelector(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element with selector '${selector}' not found`);
    return null;
  }
  return element;
}

// Safe JSON parsing utility
function safeJSONParse(content, fallbackData = null) {
  try {
    // Clean the content first
    let cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Try to find JSON boundaries
    const startIdx = cleanContent.indexOf('{');
    const endIdx = cleanContent.lastIndexOf('}');
    
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      cleanContent = cleanContent.substring(startIdx, endIdx + 1);
      return JSON.parse(cleanContent);
    } else {
      throw new Error('No valid JSON structure found in content');
    }
  } catch (error) {
    console.error('JSON parse error in safeJSONParse:', error);
    console.error('Content preview:', content?.substring(0, 200));
    return fallbackData;
  }
}

function insertPrompt(promptText) {
  const textarea = safeGetElement('improvementRequest');
  if (textarea) {
    textarea.value = promptText;
    textarea.focus();
  }
}

// New function for toggling prompts (multiple selection)
function togglePrompt(buttonElement) {
  const promptText = buttonElement.getAttribute('data-prompt');
  const isSelected = buttonElement.classList.contains('selected');
  
  if (isSelected) {
    // Remove from selection
    buttonElement.classList.remove('selected');
    window.selectedPrompts = window.selectedPrompts.filter(p => p !== promptText);
  } else {
    // Add to selection
    buttonElement.classList.add('selected');
    window.selectedPrompts.push(promptText);
  }
  
  updateSelectedPromptsDisplay();
  updateImprovementTextarea();
}

// Update the selected prompts display area
function updateSelectedPromptsDisplay() {
  const selectedArea = safeGetElement('selectedPromptsArea');
  const selectedList = safeGetElement('selectedPromptsList');
  const selectedCount = safeGetElement('selectedPromptsCount');
  
  if (window.selectedPrompts.length === 0) {
    if (selectedArea) selectedArea.style.display = 'none';
    return;
  }
  
  if (selectedArea) selectedArea.style.display = 'block';
  if (selectedCount) selectedCount.textContent = window.selectedPrompts.length;
  
  if (selectedList) {
    selectedList.innerHTML = window.selectedPrompts.map((prompt, index) => `
      <div class="selected-prompt-item">
        <span class="prompt-number">${index + 1}.</span>
        <span class="prompt-text">${prompt}</span>
        <button class="remove-prompt-btn" onclick="removePrompt(${index})" title="削除">✕</button>
      </div>
    `).join('');
  }
}

// Update the main improvement textarea with combined prompts
function updateImprovementTextarea() {
  const textarea = safeGetElement('improvementRequest');
  if (textarea) {
    if (window.selectedPrompts.length > 0) {
      const combinedPrompt = window.selectedPrompts.join('\n\n');
      textarea.value = combinedPrompt;
    } else {
      textarea.value = '';
    }
  }
}

// Remove a specific prompt
function removePrompt(index) {
  window.selectedPrompts.splice(index, 1);
  
  // Update button states
  const buttons = document.querySelectorAll('.prompt-btn[data-prompt]');
  buttons.forEach(button => {
    const promptText = button.getAttribute('data-prompt');
    if (!window.selectedPrompts.includes(promptText)) {
      button.classList.remove('selected');
    }
  });
  
  updateSelectedPromptsDisplay();
  updateImprovementTextarea();
}

// Clear all selected prompts
function clearSelectedPrompts() {
  window.selectedPrompts = [];
  
  // Remove selected class from all buttons
  const buttons = document.querySelectorAll('.prompt-btn.selected');
  buttons.forEach(button => button.classList.remove('selected'));
  
  updateSelectedPromptsDisplay();
  updateImprovementTextarea();
}

// Show/hide selected prompts area
function showSelectedPrompts() {
  const selectedArea = document.getElementById('selectedPromptsArea');
  if (window.selectedPrompts.length === 0) {
    console.log('プロンプトが未選択のためスキップ');
    return;
  }
  
  if (selectedArea.style.display === 'none') {
    selectedArea.style.display = 'block';
  } else {
    selectedArea.style.display = 'none';
  }
}

function clearImprovementForm() {
  const textarea = document.getElementById('improvementRequest');
  const fileInput = document.getElementById('additionalFiles');
  const filesList = document.getElementById('additionalFilesList');
  
  if (textarea) textarea.value = '';
  if (fileInput) fileInput.value = '';
  if (filesList) filesList.innerHTML = '';
  
  // Also clear selected prompts
  clearSelectedPrompts();
}

async function sendImprovementRequest() {
  const textarea = document.getElementById('improvementRequest');
  const request = textarea?.value?.trim();
  
  // selectedPromptsが存在しない場合は空配列として扱う
  const selectedPrompts = window.selectedPrompts || [];
  
  if (!request && selectedPrompts.length === 0) {
    console.log('再生成する内容を入力するか、プロンプトを選択してください');
    return;
  }
  
  // Combine selected prompts with manual input
  const allRequests = [];
  if (selectedPrompts.length > 0) {
    allRequests.push(...selectedPrompts);
  }
  if (request) {
    allRequests.push(request);
  }
  const finalRequest = allRequests.join('\n\n');
  
  // Check both possible locations for generatedLP
  const currentLP = window.lpApp?.core?.generatedLP || window.lpApp?.generatedLP;
  if (!currentLP) {
    console.log('再生成するLPが見つかりません。先にLPを生成してください。');
    return;
  }
  
  try {
    // Show streaming section with improvements
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.initStreamingDisplay();
    window.lpApp.uiController.updateProgress(10, 'AI分析を開始中...');
    
    // Show loading state
    const sendBtn = document.querySelector('.regeneration-actions .btn-primary');
    const originalText = sendBtn?.textContent;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '🤖 AIがLPを再生成中...';
    }
    
    // Add user message to chat
    addChatMessage('user', finalRequest);
    
    // Get additional files content
    const additionalContent = await getAdditionalFilesContent();
    
    // Create improvement prompt
    const improvementPrompt = createImprovementPrompt(finalRequest, currentLP, additionalContent);
    
    window.lpApp.uiController.updateProgress(40, 'AIによる改善案生成中...');
    
    // Send to AI with streaming enabled
    const result = await window.lpApp.core.aiService.generateLP(improvementPrompt, null, { stream: true });
    
    window.lpApp.uiController.updateProgress(80, '改善結果を処理中...');
    
    // Parse and update LP
    if (result.parsedContent) {
      window.lpApp.core.generatedLP = {
        ...currentLP,
        code: result.parsedContent.code,
        analysis: result.parsedContent.analysis,
        performance: result.parsedContent.performance
      };
      
      window.lpApp.uiController.updateProgress(100, '改善完了!');
      
      // Update display after a brief delay
      setTimeout(() => {
        window.lpApp.uiController.displayGenerationResults();
        window.lpApp.uiController.showSection('resultSection');
        
        // Add AI response to chat
        addChatMessage('ai', '✅ LPを再生成しました！新しいバージョンがプレビューに反映されています。');
        
        // Clear form
        clearImprovementForm();
      }, 1000);
    } else {
      addChatMessage('ai', '❌ LP再生成中にエラーが発生しました。もう一度お試しください。');
      window.lpApp.uiController.showSection('resultSection');
    }
    
  } catch (error) {
    console.error('Improvement request error:', error);
    addChatMessage('ai', `❌ エラー: ${error.message}`);
    console.log(`LP再生成エラー: ${error.message}`);
    window.lpApp.uiController.showSection('resultSection');
  } finally {
    // Restore button state
    const sendBtn = document.querySelector('.regeneration-actions .btn-primary');
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = '🚀 選択した内容でLPを再生成';
    }
  }
}

function createImprovementPrompt(request, currentLP, additionalContent) {
  return `あなたは経験豊富なWebデザイナー兼コピーライターです。以下の既存のランディングページを、ユーザーの依頼に基づいて再生成してください。

【再生成依頼】
${request}

【現在のLP】
HTML: ${currentLP.code?.html || ''}
CSS: ${currentLP.code?.css || ''}
JavaScript: ${currentLP.code?.js || ''}

${additionalContent ? `【追加資料】\n${additionalContent}` : ''}

【重要な指示】
1. ユーザーの依頼内容を最優先に反映させてください
2. 既存のLPの良い部分は残しつつ、改善点のみを修正してください
3. 全体的な一貫性とデザインクオリティを維持してください
4. Dan Kennedy式のダイレクトレスポンスマーケティング手法を活用してください
5. 改善後も8000文字以上の充実した内容を維持してください

【CSSの重要な改善点】
1. CTAボタンに必ず十分なmargin（上下最低40px以上）を設定
2. P.S.セクションは独立したコンテナに配置し、margin-top: 60px以上を確保
3. 全てのセクション間に適切な余白（margin: 40px 0以上）を設定
4. 要素の重なりを防ぐため、z-indexの過度な使用を避ける
5. モバイルレスポンシブ対応で、小さい画面でも要素が重ならないようにする

必ず以下のJSON形式で応答してください：

{
  "code": {
    "html": "改善されたHTML全体",
    "css": "改善されたCSS全体（要素の重なりを防ぐ適切なmargin、padding、z-index設定を含む）", 
    "js": "改善されたJavaScript全体"
  },
  "analysis": {
    "targetAudience": "改善後のターゲット層",
    "keyMessages": ["改善されたキーメッセージ1", "キーメッセージ2", "キーメッセージ3"],
    "designConcept": "改善されたデザインコンセプト",
    "improvementsSummary": "今回の改善内容の要約"
  },
  "performance": {
    "expectedCvr": "改善後の予想CVR",
    "seoScore": "SEOスコア",
    "speedScore": "表示速度スコア"
  }
}`;
}

async function getAdditionalFilesContent() {
  const filesList = document.getElementById('additionalFilesList');
  if (!filesList || !filesList.children.length) return '';
  
  // This would process additional files similar to the main file processor
  // For now, return empty string - would need to implement file processing
  return '';
}

function addChatMessage(type, content) {
  const chatHistory = document.getElementById('chatHistory');
  const chatMessages = document.getElementById('chatMessages');
  
  if (!chatHistory || !chatMessages) return;
  
  // Show chat history if hidden
  if (chatHistory.style.display === 'none') {
    chatHistory.style.display = 'block';
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;
  
  const timestamp = new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  messageDiv.innerHTML = `
    <div class="chat-message-header">
      ${type === 'user' ? '👤 あなた' : '🤖 Grok3'}
    </div>
    <div class="chat-message-content">${content}</div>
    <div class="chat-timestamp">${timestamp}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function toggleSettings() {
  console.log('toggleSettings called');
  
  // Direct implementation as fallback
  const panel = document.getElementById('settingsPanel');
  if (panel) {
    console.log('Settings panel found, toggling...');
    panel.classList.toggle('open');
    
    if (panel.classList.contains('open')) {
      console.log('Panel opened, loading API keys...');
      // Load current API keys if lpApp is available
      if (window.lpApp) {
        window.lpApp.loadCurrentApiKeys?.();
        window.lpApp.updateSettingsModelStatus?.();
      }
    }
  } else {
    console.error('Settings panel not found!');
  }
  
  // Also try the lpApp method
  if (window.lpApp) {
    window.lpApp.toggleSettings?.();
  }
}

function toggleApiKeyVisibility(inputId) {
  window.lpApp?.toggleApiKeyVisibility(inputId);
}

function saveSettings() {
  window.lpApp?.saveSettings();
}

function clearSettings() {
  window.lpApp?.clearSettings();
}

function testSelectedModel() {
  window.lpApp?.testSelectedModel();
}

function skipSetup() {
  window.lpApp?.skipSetup();
}

function saveSetup() {
  window.lpApp?.saveSetup();
}

function generateLPDirectly() {
  window.lpApp?.generateLPDirectly();
}

// Test API connection (removed duplicate - using the main testApiConnection function instead)

// Back to top (reset app) function
function backToTop() {
  // 生成中はリセットをブロック
  if (window.isGenerating) {
    alert('LP生成中です。完了するまでお待ちください。');
    return;
  }
  
  const generatingSection = document.getElementById('generatingSection');
  if (generatingSection && generatingSection.style.display !== 'none') {
    console.log('⚠️ 生成中はリセットできません');
    return;
  }
  
  // 確認ダイアログを表示
  const confirmReset = confirm('本当に最初からやり直しますか？アップロードしたファイルや生成結果、APIキーは失われます。');
  if (!confirmReset) {
    return;
  }
  
  // APIキーをクリア
  sessionStorage.removeItem('TEMP_GROK_API_KEY');
  sessionStorage.removeItem('TEMP_OPENAI_API_KEY');
  sessionStorage.removeItem('TEMP_ANTHROPIC_API_KEY');
  sessionStorage.removeItem('TEMP_DEEPSEEK_API_KEY');
  
  // API設定入力フィールドもクリア
  const autoDetectInput = document.getElementById('autoDetectInput');
  if (autoDetectInput) autoDetectInput.value = '';
  
  const grokApiKey = document.getElementById('grokApiKey');
  if (grokApiKey) grokApiKey.value = '';
  
  if (window.lpApp) {
    window.lpApp.core.uploadedFiles = [];
    window.lpApp.core.analysisData = null;
    window.lpApp.core.selectedReference = null;
    window.lpApp.core.generatedLP = null;
    
    window.lpApp.core.aiService.setSelectedModel(null);
    
    window.lpApp.uiController.showSection('uploadSection');
    window.lpApp.uiController.updateSelectedModelDisplay(null);
    
    const fileList = document.getElementById('fileList');
    if (fileList) {
      fileList.innerHTML = '';
      fileList.style.display = 'none';
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
    
    window.lpApp.uiController.hideAnalyzeButton();
    
    const modelSelectorSection = document.getElementById('modelSelectorSection');
    if (modelSelectorSection) modelSelectorSection.style.display = 'none';
    
    window.lpApp.core.clearData();
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // アプリリセット成功（メッセージを簡略化）
  }
}

// Go to home - return to top page
// goToHome function removed - use backToTop instead

// Initialize back to top functionality
function initBackToTop() {
  const backBtn = document.getElementById('backToTopBtn');
  if (!backBtn) return;

  function toggleBackButton() {
    // Hide button during generation
    if (window.isGenerating) {
      backBtn.classList.remove('visible');
      return;
    }
    
    const currentSection = getCurrentActiveSection();
    
    if (currentSection !== 'uploadSection' || 
        (window.lpApp && window.lpApp.core.uploadedFiles.length > 0)) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  }
  
  function getCurrentActiveSection() {
    const sections = ['uploadSection', 'analysisSection', 'referenceSection', 'generatingSection', 'resultSection'];
    
    for (const sectionId of sections) {
      const section = document.getElementById(sectionId);
      if (section && section.style.display !== 'none') {
        return sectionId;
      }
    }
    
    return 'uploadSection';
  }

  // Fixed memory leak: store interval ID for cleanup
  let backButtonInterval = setInterval(toggleBackButton, 1000);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (backButtonInterval) {
      clearInterval(backButtonInterval);
      backButtonInterval = null;
    }
  });
  
  let ticking = false;
  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        toggleBackButton();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', handleScroll);
  setTimeout(toggleBackButton, 500);
}

// ================================
// APPLICATION INITIALIZATION
// ================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize global variables
  window.selectedPrompts = window.selectedPrompts || [];
  
  window.lpApp = new LPGeneratorApp();
  window.lpApp.init();
  
  // Initialize API configuration section
  initializeApiConfiguration();
  
  // Ensure Grok is selected if available after initialization
  setTimeout(() => {
    const selectedModel = window.lpApp?.core?.aiService?.getSelectedModel();
    const availableServices = window.lpApp?.core?.aiService?.getAvailableServices() || [];
    if (!selectedModel && availableServices.includes('grok')) {
      console.log('Post-init: Auto-selecting Grok');
      window.lpApp.selectAIModel('grok');
    }
  }, 100);
  
  initBackToTop();
  
  // Check for existing results immediately
  setTimeout(() => {
    console.log('🔍 Checking for any existing generation results...');
    
    // Check for stored LP data
    const storedLP = window.lpApp?.core?.generatedLP || window.lpApp?.generatedLP;
    if (storedLP) {
      console.log('✅ Found existing generated LP!', storedLP);
      
      // Show the results
      const resultSection = document.getElementById('resultSection');
      if (resultSection) {
        ['uploadSection', 'apiConfigSection', 'promptSelectionSection', 'generatingSection'].forEach(id => {
          const section = document.getElementById(id);
          if (section) section.style.display = 'none';
        });
        
        resultSection.style.display = 'block';
        window.lpApp.uiController.displayGenerationResults();
        window.lpApp.uiController.displayUsageSummary(storedLP);
        console.log('✅ Existing results displayed!');
      }
    } else {
      console.log('⚠️ No existing results found');
    }
  }, 500);
  
  // Setup debug helpers after app initialization
  setTimeout(() => {
    window.debugLP = {
      recoverResults() {
        console.log('🔍 手動復旧を試行中...');
        
        // Check all possible storage locations
        const locations = {
          'core.generatedLP': window.lpApp?.core?.generatedLP,
          'generatedLP': window.lpApp?.generatedLP,
          'core.lastRawResponse': window.lpApp?.core?.lastRawResponse
        };
        
        Object.entries(locations).forEach(([name, data]) => {
          if (data) {
            console.log(`✅ Found data in ${name}:`, data);
            
            // If it's a raw response, create a basic LP
            if (data.content && !data.code) {
              const basicLP = {
                code: {
                  html: `<!DOCTYPE html>\n<html lang="ja">\n<head>\n    <meta charset="UTF-8">\n    <title>復旧された生成結果</title>\n    <style>body{font-family:sans-serif;padding:20px;background:#f5f5f5}.content{background:white;padding:20px;border-radius:5px}pre{white-space:pre-wrap}</style>\n</head>\n<body>\n    <div class="content">\n        <h1>復旧されたAI応答</h1>\n        <pre>${data.content}</pre>\n    </div>\n</body>\n</html>`,
                  css: '',
                  js: ''
                },
                service: 'grok',
                model: 'grok-3-latest',
                usage: data.usage || {},
                isRecovered: true
              };
              
              window.lpApp.core.generatedLP = basicLP;
              window.lpApp.generatedLP = basicLP;
              console.log('✅ Basic LP created from raw response');
            }
            
            // Display results
            const resultSection = document.getElementById('resultSection');
            if (resultSection) {
              ['uploadSection', 'apiConfigSection', 'promptSelectionSection', 'generatingSection'].forEach(id => {
                const section = document.getElementById(id);
                if (section) section.style.display = 'none';
              });
              
              resultSection.style.display = 'block';
              window.lpApp.uiController.displayGenerationResults();
              window.lpApp.uiController.displayUsageSummary(data);
              console.log('✅ Results recovered and displayed!');
            }
            return;
          }
        });
        
        console.log('⚠️ No recoverable data found');
      },
      
      showLastResponse() {
        if (window.lpApp.core.lastRawResponse) {
          console.log('=== 最新のAI応答 ===');
          console.log('モデル:', window.lpApp.core.lastRawResponse.model);
          console.log('時刻:', window.lpApp.core.lastRawResponse.timestamp);
          console.log('使用量:', window.lpApp.core.lastRawResponse.usage);
          console.log('応答内容:');
          console.log(window.lpApp.core.lastRawResponse.content);
          console.log('===================');
          
          return window.lpApp.core.lastRawResponse;
        } else {
          console.log('まだAI応答がありません。LP生成を実行してください。');
          return null;
        }
      },
      
      testParse(content) {
        try {
          console.log('=== JSON解析テスト ===');
          console.log('入力内容長:', content?.length || 0);
          console.log('プレビュー:', content?.substring(0, 200) + '...');
          
          const result = window.lpApp.parseAIResponse(content);
          console.log('解析結果:', result);
          console.log('==================');
          return result;
        } catch (error) {
          console.error('JSONパースエラー:', error);
          return null;
        }
      },
      
      showState() {
        console.log('=== アプリ状態 ===');
        console.log('アップロードファイル数:', window.lpApp.core.uploadedFiles.length);
        console.log('選択モデル:', window.lpApp.core.aiService.getSelectedModel());
        console.log('利用可能モデル:', window.lpApp.core.aiService.getAvailableServices());
        console.log('分析データ:', !!window.lpApp.core.analysisData);
        console.log('生成LP:', !!window.lpApp.core.generatedLP);
        console.log('================');
      }
    };

    console.log('🛠️ デバッグヘルパー利用可能:');
    console.log('- debugLP.showLastResponse() : 最新のAI応答を表示');
    console.log('- debugLP.testParse(content) : JSON解析をテスト');
    console.log('- debugLP.showState() : アプリ状態を表示');
  }, 1000);
});

// ================================
// COPYWRITER STYLE & PROMPT SELECTION FUNCTIONS
// ================================

// Store selected options
window.selectedCopywriterStyles = []; // 複数選択対応、初期状態は未選択
window.selectedCopywriterStyle = ''; // 後方互換性のため残す、初期状態は未選択

// Copywriter style definitions
const copywriterStyles = {
  'david-ogilvy': {
    name: 'デイビッド・オグルビー',
    instructions: `あなたはデイビッド・オグルビーのブランド重視スタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【デイビッド・オグルビースタイルの特徴】
- 品質と信頼性を重視したメッセージ
- エレガントで洗練された表現
- ブランドイメージを損なわない訴求
- 事実に基づいた説得力
- 長期的なブランド価値の構築
- 上品で知的な印象
- 誠実さと透明性の重視`
  },  'dan-kennedy': {
    name: 'ダン・ケネディ',
    instructions: `あなたはダン・ケネディの実践的ダイレクトレスポンスマーケティングスタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ダン・ケネディスタイルの特徴】
- 挑発的で注意を引く導入
- 「不都合な真実」を正直に語る
- 実践的で具体的な成果を提示
- 他との違いを明確に示す
- 今すぐ行動すべき理由を強調
- 読者を選別する強気な姿勢
- 時間的切迫感とスケアシティの活用
- 個人的な成功ストーリーの活用
- 結果にコミットした保証の提示`
  },
  'joe-sugarman': {
    name: 'ジョー・シュガーマン',
    instructions: `あなたはジョー・シュガーマンの教育的セールススタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ジョー・シュガーマンスタイルの特徴】
- 読者を教育しながら販売する
- 商品の仕組みや背景を詳しく説明
- 好奇心を刺激する導入部
- 論理的で分かりやすい説明
- 読者を賢い消費者として扱う
- 技術的な優位性を平易に解説
- 購入の正当性を理論的に提供`
  },
};


// Select copywriter style (multiple selection support)
function selectCopywriterStyle(element) {
  const style = element.dataset.style;
  
  // Toggle selection
  if (element.classList.contains('selected')) {
    // Deselect
    element.classList.remove('selected');
    const index = window.selectedCopywriterStyles.indexOf(style);
    if (index > -1) {
      window.selectedCopywriterStyles.splice(index, 1);
    }
  } else {
    // Select
    element.classList.add('selected');
    if (!window.selectedCopywriterStyles.includes(style)) {
      window.selectedCopywriterStyles.push(style);
    }
  }
    // 後方互換性のため、最後に選択されたものを単一選択として保持
  if (window.selectedCopywriterStyles.length > 0) {
    window.selectedCopywriterStyle = window.selectedCopywriterStyles[window.selectedCopywriterStyles.length - 1];
  } else {
    // 何も選択されていない場合は空のまま
    window.selectedCopywriterStyle = '';
  }
  
  console.log('Selected copywriter styles:', window.selectedCopywriterStyles);
  updateSelectionCount();
}

// Update selection count display
function updateSelectionCount() {
  const count = window.selectedCopywriterStyles.length;
  const button = document.getElementById('generateWithPromptsButton');
  if (button) {
    if (count === 1) {
      button.textContent = '🚀 選択したスタイルで生成';
    } else if (count > 1) {
      button.textContent = `🚀 ${count}人のスタイルで比較生成`;
    }
  }
}


// Generate LP with selected prompts
async function generateWithSelectedPrompts() {
  try {
    if (!window.lpApp) {
      console.error('LP App not initialized');
      console.error('アプリケーション未初期化');
      return;
    }
    
    // Check if any API key is set (not just Grok)
    const providers = ['GROK', 'OPENAI', 'ANTHROPIC', 'DEEPSEEK'];
    let hasApiKey = false;
    
    for (const provider of providers) {
      const apiKey = sessionStorage.getItem(`TEMP_${provider}_API_KEY`);
      if (apiKey) {
        hasApiKey = true;
        break;
      }
    }
    
    if (!hasApiKey) {
      const errorDetails = {
        message: '先にAPIキーを設定してください',
        code: 'MISSING_API_KEY',
        location: 'generateWithSelectedPrompts function',
        timestamp: new Date().toLocaleString(),
        solution: '1. 画面上部の「API設定」でAPIキーを入力してください\n2. Grok、OpenAI、Anthropic、DeepSeekのいずれかのAPIキーが必要です'
      };
      console.log('先にAPIキーを設定してください');
      return;
    }
    
    // Check if multiple styles are selected
    if (window.selectedCopywriterStyles && window.selectedCopywriterStyles.length > 1) {
      // For multiple selection, use comparison logic
      await compareSelectedIntros();
      return;
    }
    
    // Validate copywriter style selection for single selection
    if (!window.selectedCopywriterStyle) {
      console.error('No copywriter style selected');
      const errorDetails = {
        message: 'コピーライタースタイルが選択されていません',
        code: 'NO_COPYWRITER_STYLE',
        location: 'generateWithSelectedPrompts function',
        timestamp: new Date().toLocaleString(),
        solution: '1. 6つのコピーライタースタイルから1つを選択してください\n2. ダン・ケネディ、ゲイリー・ハルバート、ジョン・カールトンなどから選べます\n3. 選択後に青色に変わることを確認してください'
      };
      console.log('コピーライタースタイルが選択されていません');
      return;
    }
    
    // Get selected copywriter style with validation
    const selectedStyle = copywriterStyles[window.selectedCopywriterStyle];
    if (!selectedStyle) {
      console.error('Invalid copywriter style selected:', window.selectedCopywriterStyle);
      const errorDetails = {
        message: `無効なコピーライタースタイルが選択されました: ${window.selectedCopywriterStyle}`,
        code: 'INVALID_COPYWRITER_STYLE',
        location: 'generateWithSelectedPrompts function',
        timestamp: new Date().toLocaleString(),
        solution: '1. ページをリロードしてください\n2. 有効なコピーライタースタイルを再選択してください\n3. ブラウザのキャッシュをクリアしてください'
      };
      console.log(`無効なコピーライタースタイルが選択されました: ${window.selectedCopywriterStyle}`);
      return;
    }
  
  // Check for uploaded files and use them if available
  let combinedContent = '';
  if (window.lpApp.core.uploadedFiles.length === 0) {
    console.log('ファイルがアップロードされていません。クライアント資料をアップロードしてからLP生成を実行してください。');
    return;
  } else {
    combinedContent = window.lpApp.core.uploadedFiles
      .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
      .join('\n\n---\n\n');
    console.log(`Using ${window.lpApp.core.uploadedFiles.length} uploaded files for ${selectedStyle.name} style generation`);
  }
  
    // Show generation section
    console.log('🚀 Starting LP generation with style:', selectedStyle.name);
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, `${selectedStyle.name}スタイルでLP生成を開始しています...`);
    
    // Set flag to prevent resets during generation
    window.isGenerating = true;

    const startTime = Date.now();
    
    // Progress step 1: Analyzing files
    window.lpApp.uiController.updateProgress(10, 'アップロードされた資料を分析中...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Progress step 2: Preparing copywriter style
    window.lpApp.uiController.updateProgress(25, `${selectedStyle.name}のスタイル特性を適用中...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the actual selected model
    const selectedModel = window.lpApp.core.aiService.getSelectedModel() || 'unknown';
    console.log('🎯 Using AI model:', selectedModel);
    window.lpApp.uiController.updateAIUsageDisplay(selectedModel, 'starting', 0, 0);

    // Create custom prompt with selected style
    const customPrompt = `${selectedStyle.instructions}

以下のビジネス情報を基に、${selectedStyle.name}のスタイルで超長文のランディングページを生成してください：

${combinedContent}

【重要な指示】
- ${selectedStyle.name}の特徴的なスタイルを強く反映させること
- 15,000文字以上の充実したコンテンツにすること
- 心理トリガーと感情訴求を効果的に使用すること
- 具体的な数字と証拠を多用すること
- 読者を行動に駆り立てる強力なCTAを配置すること

必ず以下のJSON形式で応答してください：

{
  "code": {
    "html": "<!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>タイトル</title></head><body><!-- 15000文字以上の充実したHTML --></body></html>",
    "css": "/* モダンで充実したCSS（2000行以上） */",
    "js": "// スムーズスクロール、アニメーション制御等のJavaScript"
  },
  "analysis": {
    "targetAudience": "ターゲット層の詳細分析",
    "keyMessages": ["キーメッセージ1", "キーメッセージ2", "キーメッセージ3"],
    "designConcept": "デザインコンセプトの詳細説明",
    "copywriterStyle": "${selectedStyle.name}"
  },
  "performance": {
    "expectedCvr": "12.5%",
    "seoScore": "85",
    "speedScore": "90"
  }
}`;

    // Progress step 3: Generating content
    window.lpApp.uiController.updateProgress(35, `${selectedStyle.name}流のコピーライティングを実行中...`);
    window.lpApp.uiController.showDetailedProgress(
      'AI分析中', 
      `${selectedStyle.name}のスタイル特性を分析し、あなたの資料に最適なコピーライティングを準備しています...`
    );
    
    // Call AI service with timeout
    console.log('🚀 Calling AI service...');
    // ストリーミング表示は既に初期化済みなのでスキップ
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('タイムアウト: AIサービスからの応答が5分でタイムアウトしました')), 300000); // 5 minutes
    });
    
    // ストリーミング有効でAI呼び出し
    const aiPromise = window.lpApp.core.aiService.generateWithSelectedModel(customPrompt, { 
      maxTokens: 16384,
      stream: true  // ストリーミングを有効化
    });
    
    const result = await Promise.race([aiPromise, timeoutPromise]);
    console.log('✅ AI service responded successfully');
    
    // Progress step 4: Processing AI response
    window.lpApp.uiController.updateProgress(65, 'AI応答を処理中...');
    
    const generationTime = Date.now() - startTime;
    
    // Get the actual model used from the result or the selected model
    const usedModel = result.service || window.lpApp.core.aiService.getSelectedModel() || 'unknown';
    window.lpApp.uiController.updateAIUsageDisplay(usedModel, 'completed', result.usage, generationTime, result.content?.length);
    
    window.lpApp.uiController.updateProgress(80, 'コンテンツ構造を解析中...');
    
    // Parse the result
    let parsedContent;
    try {
      let jsonContent = result.content;
      
      // Remove markdown code blocks
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Extract JSON from first { to last }
      const startIdx = jsonContent.indexOf('{');
      const endIdx = jsonContent.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
      
      parsedContent = JSON.parse(jsonContent);
      
      // Add copywriter style info to analysis
      if (parsedContent.analysis) {
        parsedContent.analysis.copywriterStyle = selectedStyle.name;
      }
      
    } catch (parseError) {
      console.error('JSON parse error in generateWithSelectedPrompts:', parseError);
      console.error('Original content (first 500 chars):', result.content?.substring(0, 500));
      console.error('Attempted to parse JSON content:', jsonContent?.substring(0, 300));
      
      // Show detailed error to user with click-to-view details
      const errorDetails = {
        message: `JSON解析エラー: ${parseError.message}`,
        code: 'JSON_PARSE_ERROR',
        location: 'generateWithSelectedPrompts function',
        timestamp: new Date().toLocaleString(),
        solution: '1. APIキーが正しく設定されているか確認してください\n2. 別のコピーライタースタイルを試してください\n3. ファイルサイズを小さくしてみてください',
        originalContent: result.content?.substring(0, 300),
        parseError: parseError.message
      };
      
      console.log(`JSON解析エラー: ${parseError.message}. フォールバックコンテンツで継続します。`);
      
      // Enhanced fallback response with more content
      parsedContent = {
        code: {
          html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedStyle.name}スタイルで生成されたランディングページ</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .error-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .content { white-space: pre-wrap; }
        h1 { color: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-notice">
            <strong>注意:</strong> AI応答の解析中にエラーが発生したため、フォールバックコンテンツを表示しています。
        </div>
        <div class="header">
            <h1>${selectedStyle.name}スタイルのランディングページ</h1>
            <p>コピーライタースタイル: ${selectedStyle.name}</p>
        </div>
        <div class="content">${result.content ? result.content.substring(0, 2000) + '...' : 'コンテンツの生成に失敗しました'}</div>
    </div>
</body>
</html>`,
          css: `
body { 
  font-family: 'Helvetica Neue', Arial, sans-serif; 
  line-height: 1.6; 
  margin: 0; 
  padding: 20px; 
  background: #f8f9fa; 
}
.container { 
  max-width: 1200px; 
  margin: 0 auto; 
  background: white; 
  padding: 40px; 
  border-radius: 10px; 
  box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
}`,
          js: 'console.log("Fallback content loaded due to JSON parse error");'
        },
        analysis: {
          targetAudience: 'JSON解析エラーのため特定できませんでした',
          keyMessages: ['JSON解析エラーが発生しました', 'フォールバックコンテンツを表示中'],
          designConcept: 'エラー対応用のシンプルなデザイン',
          copywriterStyle: selectedStyle.name
        },
        performance: {
          expectedCvr: 'N/A (解析エラー)',
          seoScore: 'N/A (解析エラー)',
          speedScore: 'N/A (解析エラー)'
        }
      };
    }
    
    // Store generated LP
    const actualService = result.service || window.lpApp.core.aiService.getSelectedModel() || 'unknown';
    window.lpApp.core.generatedLP = {
      ...parsedContent,
      service: actualService,
      model: result.model || window.lpApp.core.aiService.defaultModels[actualService] || 'unknown',
      usage: result.usage,
      generationTime: generationTime,
      responseSize: result.content?.length || 0,
      timestamp: new Date().toISOString(),
      copywriterStyle: selectedStyle.name
    };
    
    console.log('✅ Generation successful, preparing results...');
    
    // Don't update progress to avoid UI confusion - keep at last progress level
    
    // Store generatedLP in both places to ensure it's found
    if (!window.lpApp.core.generatedLP) {
      console.error('⚠️ generatedLP not stored in core!');
    }
    if (!window.lpApp.generatedLP) {
      window.lpApp.generatedLP = window.lpApp.core.generatedLP;
      console.log('🔄 Copied generatedLP to window.lpApp');
    }
    
    // Show results immediately without delay
    console.log('🎯 Preparing to show results...');
    console.log('🔍 Checking generatedLP:', {
      hasCore: !!window.lpApp.core.generatedLP,
      hasCode: !!window.lpApp.core.generatedLP?.code,
      codeKeys: window.lpApp.core.generatedLP?.code ? Object.keys(window.lpApp.core.generatedLP.code) : 'none'
    });
    
    // Clear generation flag before showing results
    window.isGenerating = false;
    console.log('✅ Generation flag cleared');
    
    // Immediately show results without delay
    console.log('🎯 Now showing results section...');
    
    // Hide generating section
    const generatingSection = document.getElementById('generatingSection');
    if (generatingSection) {
      generatingSection.style.display = 'none';
      console.log('❌ Hidden generating section');
    }
    
    // Show result section immediately
    const resultSection = document.getElementById('resultSection');
    if (!resultSection) {
      console.error('⚠️ Result section not found in DOM!');
      return;
    }
    
    console.log('✅ Found result section, making it visible...');
    resultSection.style.display = 'block';
    
    // Display the results immediately
    try {
      console.log('📝 Calling displayGenerationResults...');
      window.lpApp.uiController.displayGenerationResults();
      console.log('📊 Calling displayUsageSummary...');
      window.lpApp.uiController.displayUsageSummary(window.lpApp.core.generatedLP);
      console.log('✅ Display functions completed');
      
      // Scroll to results
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('✅ Scrolled to result section');
    } catch (displayError) {
      console.error('⚠️ Error displaying results:', displayError);
      console.error('Stack:', displayError.stack);
      
      // Force show basic content if there's an error
      resultSection.innerHTML = `
        <div style="padding: 40px; text-align: center;">
          <h2>生成完了</h2>
          <p>結果の表示中にエラーが発生しました。</p>
          <p>コンソールを確認してください。</p>
        </div>
      `;
    }
    
  } catch (error) {
    console.error('Error in generateWithSelectedPrompts:', error);
    console.error('Error stack:', error.stack);
    
    // Clear generation flag on error
    window.isGenerating = false;
    
    // Save partial result if available
    if (result && result.content) {
      console.log('💾 Saving partial result before error...');
      
      // Try to show whatever content we got
      const partialLP = {
        code: {
          html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>部分的な生成結果</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .content { background: white; padding: 20px; border-radius: 5px; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <div class="warning">
        <h2>⚠️ 生成中にエラーが発生しました</h2>
        <p>以下は部分的な生成結果です。APIクレジットは消費されています。</p>
        <p>エラー: ${error.message}</p>
    </div>
    <div class="content">
        <h3>AIからの応答内容:</h3>
        <pre>${result.content}</pre>
    </div>
</body>
</html>`,
          css: '',
          js: ''
        },
        service: result.service || selectedModel,
        model: result.model || 'unknown',
        usage: result.usage,
        generationTime: Date.now() - startTime,
        responseSize: result.content?.length || 0,
        timestamp: new Date().toISOString(),
        isPartial: true,
        error: error.message
      };
      
      // Store partial result
      window.lpApp.core.generatedLP = partialLP;
      if (!window.lpApp.generatedLP) {
        window.lpApp.generatedLP = partialLP;
      }
      
      // Show result section with partial content
      setTimeout(() => {
        const generatingSection = document.getElementById('generatingSection');
        if (generatingSection) {
          generatingSection.style.display = 'none';
        }
        
        window.lpApp.uiController.showSection('resultSection');
        window.lpApp.uiController.displayGenerationResults();
        window.lpApp.uiController.displayUsageSummary(partialLP);
      }, 500);
    }
    
    // Hide loading/generating UI
    window.lpApp.uiController.hideLoading();
    const generatingSection = document.getElementById('generatingSection');
    if (generatingSection) {
      generatingSection.style.display = 'none';
    }
    
    // Detailed error information
    let errorMessage = 'LP生成中にエラーが発生しました';
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    const errorDetails = {
      message: error.message || 'Unknown error',
      code: 'LP_GENERATION_ERROR',
      location: 'generateWithSelectedPrompts function',
      timestamp: new Date().toLocaleString(),
      solution: '1. APIキーが正しく設定されているか確認してください\n2. インターネット接続を確認してください\n3. しばらく待ってから再試行してください',
      stack: error.stack,
      errorType: error.constructor.name
    };
    
    console.log(errorMessage);
    console.error('Error details:', errorDetails);
    
    // Show error message in UI
    window.lpApp.uiController.updateProgress(0, `エラー: ${error.message || 'Unknown error'}`);
    
    // Return to prompt selection after delay
    setTimeout(() => {
      window.lpApp.uiController.showSection('promptSelectionSection');
    }, 3000);
  } finally {
    // Always clear generation flag
    window.isGenerating = false;
    console.log('🎯 Generation process completed');
  }
}

// Update prompt button states based on API key
function updatePromptButtonStates() {
  // Check if Grok API key is set
  const apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY');
  const hasValidKey = !!(apiKey && apiKey.trim());
  
  const promptButton = document.getElementById('generateWithPromptsButton');
  if (promptButton) {
    promptButton.disabled = !hasValidKey;
    if (!hasValidKey) {
      promptButton.title = 'APIキーを設定してください';
      promptButton.style.opacity = '0.5';
      promptButton.style.cursor = 'not-allowed';
    } else {
      promptButton.title = '選択したスタイルでLP生成を開始します';
      promptButton.style.opacity = '1';
      promptButton.style.cursor = 'pointer';
    }
  }
}

// Compare selected copywriter intros
async function compareSelectedIntros() {
  console.log('Starting comparison of selected copywriter intros');
  
  // Check if files are uploaded
  if (!window.lpApp || !window.lpApp.core.uploadedFiles || window.lpApp.core.uploadedFiles.length === 0) {
    console.log('ファイルがアップロードされていません。クライアント資料をアップロードしてから実行してください。');
    return;
  }
  
  // Auto-select Grok model if needed
  let selectedModel = window.lpApp.core.aiService.getSelectedModel();
  console.log('🤖 Selected model for selected intros comparison:', selectedModel);
  
  const selectedStyles = window.selectedCopywriterStyles || [];
  if (selectedStyles.length === 0) {
    console.log('コピーライタースタイルが選択されていません。');
    return;
  }
  
  try {
    // Show loading state
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, `${selectedStyles.length}人の冒頭を生成中...`);
    
    // ストリーミング表示は比較モードでは不要
    
    // Get content from uploaded files
    const combinedContent = window.lpApp.core.uploadedFiles
      .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
      .join('\n\n---\n\n');
    
    // Array to store all intros
    const intros = [];
    
    // Generate intro for each selected copywriter style
    for (let i = 0; i < selectedStyles.length; i++) {
      const styleKey = selectedStyles[i];
      const style = copywriterStyles[styleKey];
      
      if (!style) continue;
      
      window.lpApp.uiController.updateProgress(
        Math.floor((i / selectedStyles.length) * 100),
        `${style.name}の冒頭を生成中... (${i + 1}/${selectedStyles.length})`
      );
      
      // Create prompt for intro only
      const introPrompt = `${style.instructions}

以下の内容に基づいて、ランディングページの冒頭部分（ヘッドラインとリード文）のみを作成してください。

内容: ${combinedContent}

【重要】以下のJSON形式で、冒頭部分のみ返してください：
{
  "copywriter": "${style.name}",
  "headline": "強力なヘッドライン（1行）",
  "subheadline": "サブヘッドライン（1-2行）",
  "leadText": "リード文（3-5行程度の導入文）"
}`;
      
      try {
        const result = await window.lpApp.core.aiService.generateWithSelectedModel(introPrompt, { 
          maxTokens: 1000 // 冒頭のみなので少なくて良い
        });
        
        // Parse result
        let parsed;
        try {
          let jsonContent = result.content;
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          
          const startIdx = jsonContent.indexOf('{');
          const endIdx = jsonContent.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1) {
            jsonContent = jsonContent.substring(startIdx, endIdx + 1);
          }
          
          parsed = JSON.parse(jsonContent);
          intros.push(parsed);
        } catch (parseError) {
          console.error(`Parse error for ${style.name}:`, parseError);
          // フォールバック
          intros.push({
            copywriter: style.name,
            headline: '解析エラー',
            subheadline: '',
            leadText: result.content.substring(0, 200) + '...'
          });
        }
        
      } catch (error) {
        console.error(`Error generating intro for ${style.name}:`, error);
        intros.push({
          copywriter: style.name,
          headline: 'エラー',
          subheadline: '',
          leadText: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Display comparison results
    displayIntroComparison(intros);
    
  } catch (error) {
    console.error('Error in compareSelectedIntros:', error);
    console.log('比較生成中にエラーが発生しました: ' + error.message);
  }
}

// Compare all copywriter intros
async function compareAllIntros() {
  console.log('Starting comparison of all copywriter intros');
  
  // Check if files are uploaded
  if (!window.lpApp || !window.lpApp.core.uploadedFiles || window.lpApp.core.uploadedFiles.length === 0) {
    console.log('ファイルがアップロードされていません。クライアント資料をアップロードしてから実行してください。');
    return;
  }
  
  // Auto-select Grok model if needed
  let selectedModel = window.lpApp.core.aiService.getSelectedModel();
  console.log('🤖 Selected model for intro comparison:', selectedModel);
  
  try {
    // Show loading state
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, '9人全員の冒頭を生成中...');
    
    // Get content from uploaded files
    const combinedContent = window.lpApp.core.uploadedFiles
      .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
      .join('\n\n---\n\n');
    
    // Array to store all intros
    const intros = [];
    const allStyles = Object.keys(copywriterStyles);
    
    // Generate intro for each copywriter style
    for (let i = 0; i < allStyles.length; i++) {
      const styleKey = allStyles[i];
      const style = copywriterStyles[styleKey];
      
      window.lpApp.uiController.updateProgress(
        Math.floor((i / allStyles.length) * 100),
        `${style.name}の冒頭を生成中... (${i + 1}/9)`
      );
      
      // Create prompt for intro only
      const introPrompt = `${style.instructions}

以下の内容に基づいて、ランディングページの冒頭部分（ヘッドラインとリード文）のみを作成してください。

内容: ${combinedContent}

【重要】以下のJSON形式で、冒頭部分のみ返してください：
{
  "copywriter": "${style.name}",
  "headline": "強力なヘッドライン（1行）",
  "subheadline": "サブヘッドライン（1-2行）",
  "leadText": "リード文（3-5行程度の導入文）"
}`;
      
      try {
        const result = await window.lpApp.core.aiService.generateWithSelectedModel(introPrompt, { 
          maxTokens: 1000 // 冒頭のみなので少なくて良い
        });
        
        // Parse result
        let parsed;
        try {
          let jsonContent = result.content;
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
          
          const startIdx = jsonContent.indexOf('{');
          const endIdx = jsonContent.lastIndexOf('}');
          
          if (startIdx !== -1 && endIdx !== -1) {
            jsonContent = jsonContent.substring(startIdx, endIdx + 1);
          }
          
          parsed = JSON.parse(jsonContent);
          intros.push(parsed);
        } catch (parseError) {
          console.error(`Parse error for ${style.name}:`, parseError);
          // フォールバック
          intros.push({
            copywriter: style.name,
            headline: '解析エラー',
            subheadline: '',
            leadText: result.content.substring(0, 200) + '...'
          });
        }
        
      } catch (error) {
        console.error(`Error generating intro for ${style.name}:`, error);
        intros.push({
          copywriter: style.name,
          headline: 'エラー',
          subheadline: '',
          leadText: error.message
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Display comparison results
    displayIntroComparison(intros);
    
  } catch (error) {
    console.error('Error in compareAllIntros:', error);
    console.log('比較生成中にエラーが発生しました: ' + error.message);
  }
}

// Display intro comparison results
function displayIntroComparison(intros) {
  // Find style key for each copywriter
  const getStyleKey = (copywriterName) => {
    for (const [key, value] of Object.entries(copywriterStyles)) {
      if (value.name === copywriterName) {
        return key;
      }
    }
    return null;
  };
  
  // Create comparison HTML
  const comparisonHTML = `
    <div class="intro-comparison-container">
      <h2>🎭 ${intros.length}人のコピーライター冒頭比較</h2>
      <p class="comparison-instruction">気に入ったスタイルを選択して、完全なLPを生成できます</p>
      <div class="intro-comparison-grid">
        ${intros.map((intro, index) => {
          const styleKey = getStyleKey(intro.copywriter);
          return `
          <div class="intro-card" id="intro-card-${index}">
            <div class="intro-header">
              <h3>${intro.copywriter}</h3>
            </div>
            <div class="intro-content">
              <h4 class="intro-headline">${intro.headline || 'ヘッドラインなし'}</h4>
              ${intro.subheadline ? `<p class="intro-subheadline">${intro.subheadline}</p>` : ''}
              <p class="intro-lead">${intro.leadText || 'リード文なし'}</p>
            </div>
            <div class="intro-actions">
              <button class="btn-primary intro-select-btn" onclick="generateFullLPFromComparison('${styleKey}', '${intro.copywriter}')">
                🚀 このスタイルで完全なLPを生成
              </button>
            </div>
          </div>
        `;
        }).join('')}
      </div>
      <div class="comparison-actions">
        <button class="btn-secondary" onclick="window.lpApp.uiController.showSection('promptSelectionSection')">← 戻る</button>
        <button class="btn-primary" onclick="downloadComparison()">📥 比較結果をダウンロード</button>
      </div>
    </div>
  `;
  
  // Show in result section
  window.lpApp.uiController.showSection('resultSection');
  
  // Update result section content
  const resultSection = document.getElementById('resultSection');
  if (resultSection) {
    // Hide normal tabs
    const tabsElement = resultSection.querySelector('.result-tabs');
    if (tabsElement) tabsElement.style.display = 'none';
    
    const tabContents = resultSection.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.style.display = 'none');
    
    // Hide other result section elements
    const aiUsageSummary = document.getElementById('aiUsageSummary');
    if (aiUsageSummary) aiUsageSummary.style.display = 'none';
    
    const actionButtons = resultSection.querySelector('.action-buttons');
    if (actionButtons) actionButtons.style.display = 'none';
    
    const lpImprovementSection = document.getElementById('lpImprovementSection');
    if (lpImprovementSection) lpImprovementSection.style.display = 'none';
    
    // Add comparison content
    const comparisonDiv = document.createElement('div');
    comparisonDiv.id = 'introComparisonDisplay';
    comparisonDiv.innerHTML = comparisonHTML;
    
    // Remove existing comparison if any
    const existingComparison = document.getElementById('introComparisonDisplay');
    if (existingComparison) {
      existingComparison.remove();
    }
    
    // Insert after header
    const header = resultSection.querySelector('.section-header');
    if (header) {
      header.insertAdjacentElement('afterend', comparisonDiv);
    } else {
      resultSection.insertAdjacentElement('afterbegin', comparisonDiv);
    }
  }
  
  // Store for download
  window.lastIntroComparison = intros;
}

// Generate full LP from comparison selection
async function generateFullLPFromComparison(styleKey, copywriterName) {
  console.log(`Generating full LP with style: ${styleKey} (${copywriterName})`);
  
  // Set the selected style
  window.selectedCopywriterStyle = styleKey;
  window.selectedCopywriterStyles = [styleKey];
  
  // Update UI to show selected style
  document.querySelectorAll('.copywriter-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedCard = document.querySelector(`.copywriter-card[data-style="${styleKey}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  // Get the style definition
  const selectedStyle = copywriterStyles[styleKey];
  if (!selectedStyle) {
    console.log('選択されたスタイルが見つかりません');
    return;
  }
  
  try {
    // Show loading
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, `${selectedStyle.name}スタイルで完全なLPを生成中...`);
    
    // Get content from uploaded files
    const combinedContent = window.lpApp.core.uploadedFiles
      .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
      .join('\n\n---\n\n');
    
    const startTime = Date.now();
    
    // Create custom prompt with selected style
    const customPrompt = `${selectedStyle.instructions}

以下の内容に基づいて、超長文の高コンバージョンランディングページを生成してください。

内容: ${combinedContent}

【重要な指示】
1. 必ず${selectedStyle.name}のスタイルを徹底的に適用してください
2. HTML全体で8000文字以上の充実した内容にしてください
3. 以下のセクションすべてを含めてください：
   - ヘッドライン（読者の注意を引く強烈なキャッチコピー）
   - リード（問題提起と共感で読者を引き込む導入文500文字以上）
   - 問題提起（現状の課題を10個以上具体的に）
   - 解決策の提示（なぜこれが最適解なのか）
   - ベネフィット（得られる利益を20個以上）
   - 社会的証明（詳細な成功事例5件以上）
   - 価格とオファー
   - FAQ（15個以上）
   - 追伸（3つ以上）

必ず以下のJSON形式で応答してください：

{
  "code": {
    "html": "<!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>タイトル</title></head><body><!-- 8000文字以上の充実したHTML --></body></html>",
    "css": "/* モダンで充実したCSS（2000行以上） */",
    "js": "// インタラクティブなJavaScript"
  },
  "analysis": {
    "targetAudience": "ターゲット層の詳細分析",
    "keyMessages": ["キーメッセージ1", "キーメッセージ2", "キーメッセージ3"],
    "designConcept": "デザインコンセプトの詳細説明",
    "copywriterStyle": "${selectedStyle.name}"
  },
  "performance": {
    "expectedCvr": "12.5%",
    "seoScore": "85",
    "speedScore": "90"
  }
}`;
    
    // Progress updates
    window.lpApp.uiController.updateProgress(20, 'AIに生成指示を送信中...');
    
    // ストリーミング表示は別の箇所で初期化済み
    
    // Call AI service with streaming enabled
    const result = await window.lpApp.core.aiService.generateWithSelectedModel(customPrompt, { 
      maxTokens: 16384,
      stream: true  // ストリーミングを有効化
    });
    
    window.lpApp.uiController.updateProgress(60, 'AI応答を処理中...');
    
    const generationTime = Date.now() - startTime;
    
    // Parse result
    let parsedContent;
    try {
      let jsonContent = result.content;
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      const startIdx = jsonContent.indexOf('{');
      const endIdx = jsonContent.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
      
      parsedContent = JSON.parse(jsonContent);
      
      // Add copywriter style info
      if (parsedContent.analysis) {
        parsedContent.analysis.copywriterStyle = selectedStyle.name;
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback
      parsedContent = {
        code: {
          html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${selectedStyle.name}スタイルLP</title>
</head>
<body>
    <h1>${selectedStyle.name}スタイルで生成されたLP</h1>
    <div>${result.content.substring(0, 1000)}...</div>
</body>
</html>`,
          css: 'body { font-family: sans-serif; padding: 20px; }',
          js: ''
        },
        analysis: {
          targetAudience: '解析エラー',
          keyMessages: ['解析エラー'],
          designConcept: '解析エラー',
          copywriterStyle: selectedStyle.name
        },
        performance: {
          expectedCvr: 'N/A',
          seoScore: 'N/A',
          speedScore: 'N/A'
        }
      };
    }
    
    window.lpApp.uiController.updateProgress(80, 'LP生成を完了中...');
    
    // Store generated LP
    window.lpApp.generatedLP = parsedContent;
    window.lpApp.core.generatedLP = parsedContent;
    
    // Update AI usage display
    // Get the actual model used from the result or the selected model
    const usedModel = result.service || window.lpApp.core.aiService.getSelectedModel() || 'unknown';
    window.lpApp.uiController.updateAIUsageDisplay(usedModel, 'completed', result.usage, generationTime, result.content?.length);
    
    window.lpApp.uiController.updateProgress(100, '完了！');
    
    // Hide comparison display and show normal result
    const introComparisonDisplay = document.getElementById('introComparisonDisplay');
    if (introComparisonDisplay) {
      introComparisonDisplay.remove();
    }
    
    // Show normal result tabs
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
      const tabsElement = resultSection.querySelector('.result-tabs');
      if (tabsElement) tabsElement.style.display = 'flex';
      
      const tabContents = resultSection.querySelectorAll('.tab-content');
      tabContents.forEach(content => content.style.display = 'none');
      
      const previewTab = document.getElementById('previewTab');
      if (previewTab) {
        previewTab.style.display = 'block';
        previewTab.classList.add('active');
      }
      
      const aiUsageSummary = document.getElementById('aiUsageSummary');
      if (aiUsageSummary) aiUsageSummary.style.display = 'block';
      
      const actionButtons = resultSection.querySelector('.action-buttons');
      if (actionButtons) actionButtons.style.display = 'flex';
      
      const lpImprovementSection = document.getElementById('lpImprovementSection');
      if (lpImprovementSection) lpImprovementSection.style.display = 'block';
    }
    
    // Show result section explicitly
    window.lpApp.uiController.showSection('resultSection');
    
    // Update result display
    window.lpApp.uiController.displayGenerationResults();
    
    // Force update preview
    window.lpApp.uiController.updatePreview();
    
    // Force scroll to results
    setTimeout(() => {
      const resultSection = document.getElementById('resultSection');
      if (resultSection) {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    
  } catch (error) {
    console.error('Error generating full LP:', error);
    console.log('LP生成中にエラーが発生しました: ' + error.message);
  }
}

// Download comparison results
function downloadComparison() {
  if (!window.lastIntroComparison) return;
  
  const csv = [
    ['コピーライター', 'ヘッドライン', 'サブヘッドライン', 'リード文'],
    ...window.lastIntroComparison.map(intro => [
      intro.copywriter,
      intro.headline || '',
      intro.subheadline || '',
      intro.leadText || ''
    ])
  ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `copywriter_comparison_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Reset to top function - accessed by logo click
function resetToTop() {
  // 生成中はリセットをブロック
  if (window.isGenerating) {
    alert('LP生成中です。完了するまでお待ちください。');
    return;
  }
  
  const generatingSection = document.getElementById('generatingSection');
  if (generatingSection && generatingSection.style.display !== 'none') {
    console.log('⚠️ 生成中はリセットできません');
    return;
  }
  
  try {
    // Reset UI to initial state (upload section)
    const allSections = document.querySelectorAll('section');
    allSections.forEach(section => {
      if (section.id === 'uploadSection') {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
    
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    console.log('🔄 トップページに戻りました');
  } catch (error) {
    console.error('トップページに戻る際にエラーが発生しました:', error);
  }
}

// Reset API settings function - accessed by reset button
function resetApiSettings() {
  // API設定をリセット（確認ダイアログを削除）
  {
    try {
      // Clear all API key inputs
      const apiKeyInputs = document.querySelectorAll('.api-key-input');
      apiKeyInputs.forEach(input => {
        input.value = '';
      });
      
      // Clear stored API keys
      if (window.envLoader && window.envLoader.clear) {
        window.envLoader.clear();
      }
      
      // Clear storage utilities API keys
      if (window.StorageUtils && window.StorageUtils.clearApiKeys) {
        window.StorageUtils.clearApiKeys();
      }
      
      // Reset to default provider (OpenAI)
      if (typeof selectProvider === 'function') {
        selectProvider('openai');
      }
      
      // Clear selected model
      if (window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
        window.lpApp.core.aiService.setSelectedModel(null);
      }
      
      // Update model availability check
      if (window.lpApp && window.lpApp.core && window.lpApp.core.checkModelAvailability) {
        window.lpApp.core.checkModelAvailability();
      }
      
      // Update API status display
      if (typeof updateApiStatus === 'function') {
        updateApiStatus();
      }
      
      // Show success message
      // API設定リセット成功（メッセージを簡略化）
      
      console.log('🗑️ API設定がリセットされました');
    } catch (error) {
      console.error('API設定リセット中にエラーが発生しました:', error);
      console.log('API設定リセット中にエラーが発生しました');
    }
  }
}

// Make functions globally available
window.resetToTop = resetToTop;
window.resetApiSettings = resetApiSettings;

// APIキー自動検出機能
const keyDetector = new APIKeyDetector();

// APIキー自動検出
function autoDetectAPIKey() {
  const input = document.getElementById('autoDetectInput');
  const resultDiv = document.getElementById('autoDetectResult');
  const apiKey = input.value.trim();
  
  if (!apiKey) {
    resultDiv.style.display = 'none';
    return;
  }
  
  const detection = keyDetector.detectProvider(apiKey);
  resultDiv.style.display = 'block';
  
  if (detection.valid) {
    // 自動的にAPIキーを適用（ボタンなし）
    applyDetectedKey(detection.provider, detection.key);
  } else {
    resultDiv.innerHTML = `
      <div style="padding: 1rem; background: var(--error-bg); color: var(--error); border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.5rem;">❌</span>
          <strong>不明なAPIキー形式です</strong>
        </div>
        ${detection.suggestion ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">${detection.suggestion}</p>` : ''}
      </div>
    `;
  }
}

// 検出されたAPIキーを適用
function applyDetectedKey(provider, apiKey) {
  // APIキーをセッションストレージに保存
  sessionStorage.setItem(`TEMP_${provider.toUpperCase()}_API_KEY`, apiKey);
  
  // 自動検出結果を表示
  const resultDiv = document.getElementById('autoDetectResult');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div style="padding: 1rem; background: var(--success-bg); color: var(--success); border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.5rem;">✅</span>
        <strong>${getProviderIcon(provider)} ${getProviderName(provider)} APIキーを保存しました</strong>
      </div>
      <div style="margin-top: 0.5rem; font-size: 0.9rem;">
        🔄 接続テスト中...
      </div>
    </div>
  `;
  
  // 自動検出入力欄をクリア
  document.getElementById('autoDetectInput').value = '';
  
  // 自動的に接続テストを実行
  setTimeout(async () => {
    try {
      await testApiConnection(provider);
      // 接続テスト成功時の表示更新
      resultDiv.innerHTML = `
        <div style="padding: 1rem; background: var(--success-bg); color: var(--success); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">✅</span>
            <strong>${getProviderIcon(provider)} ${getProviderName(provider)} 接続確認済み</strong>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.9rem;">
            🎉 APIキーが正常に動作しています
          </div>
        </div>
      `;
      
      // 説明文は変更しない（接続成功後も元のメッセージを保持）
    } catch (error) {
      console.log('接続テスト失敗:', error);
      // 接続テスト失敗時の表示更新
      resultDiv.innerHTML = `
        <div style="padding: 1rem; background: #fef2f2; color: #dc2626; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">⚠️</span>
            <strong>${getProviderIcon(provider)} ${getProviderName(provider)} 接続エラー</strong>
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.9rem;">
            APIキーが無効か、ネットワークエラーが発生しました
          </div>
        </div>
      `;
      
      // エラー時も説明文は変更しない
    }
    
    // ボタンの状態を更新
    updatePromptButtonStates();
  }, 500);
  
  // 即座にボタンの状態も更新
  updatePromptButtonStates();
}


// プロバイダーアイコンを取得
function getProviderIcon(provider) {
  const icons = {
    grok: '🚀',
    openai: '🤖',
    anthropic: '🧠',
    deepseek: '🔍'
  };
  return icons[provider] || '❓';
}

// プロバイダー名を取得
function getProviderName(provider) {
  const names = {
    grok: 'xAI Grok',
    openai: 'OpenAI GPT',
    anthropic: 'Anthropic Claude',
    deepseek: 'DeepSeek'
  };
  return names[provider] || provider;
}

// リアルタイム検出（入力欄での自動検出）
function setupRealtimeDetection() {
  // 各プロバイダーの入力欄にリアルタイム検出を追加
  const providers = ['openai', 'anthropic', 'grok', 'deepseek'];
  
  providers.forEach(provider => {
    const input = document.getElementById(`${provider}ApiKeyInput`);
    if (input) {
      input.addEventListener('paste', function(e) {
        setTimeout(() => {
          const pastedKey = input.value.trim();
          const detection = keyDetector.detectProvider(pastedKey);
          
          if (detection.valid && detection.provider !== provider) {
            // 間違ったプロバイダーに貼り付けた場合の警告
            // 自動で正しいプロバイダーに適用（確認ダイアログを削除）
            input.value = '';
            applyDetectedKey(detection.provider, pastedKey);
          }
        }, 10);
      });
      
      // 入力時の形式チェック
      input.addEventListener('input', function() {
        const validation = keyDetector.validateKeyFormat(provider, input.value);
        const testButton = input.parentElement.querySelector('button');
        
        if (input.value && !validation.valid) {
          input.style.borderColor = 'var(--error)';
          if (testButton) {
            testButton.title = validation.message;
          }
        } else {
          input.style.borderColor = '';
          if (testButton) {
            testButton.title = '接続テスト';
          }
        }
      });
    }
  });
}



// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 DOM loaded, setting up API connection test buttons');
  
  setupRealtimeDetection();
  
  // ボタンの初期状態を更新
  updatePromptButtonStates();
  
  // Ensure testApiConnection buttons work by adding event listeners
  const providers = ['openai', 'anthropic', 'grok', 'deepseek'];
  providers.forEach(provider => {
    const button = document.querySelector(`#${provider}Config .btn-secondary`);
    if (button) {
      // Remove existing onclick to avoid conflicts
      button.removeAttribute('onclick');
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🔘 Button clicked for provider: ${provider}`);
        testApiConnection(provider);
      });
      console.log(`✅ Event listener added for ${provider} test button`);
    } else {
      console.warn(`⚠️ Test button not found for provider: ${provider}`);
    }
  });
});

// Make functions globally available
window.autoDetectAPIKey = autoDetectAPIKey;
window.applyDetectedKey = applyDetectedKey;

// Export classes for debugging and extensibility
window.LPGeneratorApp = LPGeneratorApp;
window.AppCore = AppCore;
window.UIController = UIController;
window.FileUploadHandler = FileUploadHandler;
window.ClientFileProcessor = ClientFileProcessor;
window.AIService = AIService;

// === 生成結果復旧機能 ===
window.debugLP = {
  recoverResults() {
    console.log('🔍 手動復旧を試行中...');
    
    // Check all possible storage locations
    const locations = {
      'core.generatedLP': window.lpApp?.core?.generatedLP,
      'generatedLP': window.lpApp?.generatedLP,
      'core.lastRawResponse': window.lpApp?.core?.lastRawResponse,
      'window.lastGrokResponse': window.lastGrokResponse,
      'lastGenerationResult': window.lastGenerationResult
    };
    
    console.log('📂 チェック中の保存場所:', Object.keys(locations));
    
    let found = false;
    for (const [location, data] of Object.entries(locations)) {
      if (data && typeof data === 'object') {
        console.log(`✅ データ発見: ${location}`, data);
        found = true;
        
        // Try to display this data
        try {
          if (location === 'core.lastRawResponse' && data.content) {
            // Raw AI response - create basic HTML
            const basicHTML = this.createBasicHTMLFromText(data.content);
            const lpData = {
              code: {
                html: basicHTML,
                css: 'body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 20px; } .container { max-width: 800px; margin: 0 auto; }',
                js: ''
              },
              analysis: {
                targetAudience: '復旧されたデータ',
                keyMessages: ['データを復旧しました'],
                designConcept: 'シンプルなレイアウト'
              }
            };
            
            // Set the data and show results
            window.lpApp.core.generatedLP = lpData;
            this.forceShowResults(lpData);
            
          } else if (data.code && data.code.html) {
            // Properly formatted LP data
            window.lpApp.core.generatedLP = data;
            this.forceShowResults(data);
          }
          
          break; // Use first found data
        } catch (displayError) {
          console.error(`⚠️ ${location}のデータ表示エラー:`, displayError);
        }
      }
    }
    
    if (!found) {
      console.log('❌ 復旧可能なデータが見つかりませんでした');
      // Show manual instructions
      alert('復旧可能なデータが見つかりませんでした。\n\n再度生成を実行してください。');
    }
    
    return found;
  },
  
  createBasicHTMLFromText(content) {
    // Extract key parts if it looks like JSON
    let title = 'AI生成ランディングページ';
    let body = content;
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.analysis?.keyMessages) {
        title = parsed.analysis.keyMessages[0] || title;
      }
      if (parsed.code?.html) {
        return parsed.code.html;
      }
    } catch (e) {
      // Not JSON, use as text
    }
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .content { white-space: pre-wrap; margin: 20px 0; }
        .recovery-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="recovery-notice">
            <strong>🔄 データ復旧</strong><br>
            生成されたコンテンツを復旧しました。完全な表示のために再生成を推奨します。
        </div>
        <h1>${title}</h1>
        <div class="content">${body.substring(0, 2000)}${body.length > 2000 ? '...' : ''}</div>
    </div>
</body>
</html>`;
  },
  
  forceShowResults(lpData) {
    console.log('🎯 結果を強制表示中...');
    
    try {
      // Hide generating section
      const generatingSection = document.getElementById('generatingSection');
      if (generatingSection) {
        generatingSection.style.display = 'none';
      }
      
      // Show result section
      const resultSection = document.getElementById('resultSection');
      if (resultSection) {
        resultSection.style.display = 'block';
        
        // Update preview
        if (window.lpApp?.uiController?.updatePreview) {
          window.lpApp.uiController.updatePreview();
        }
        
        // Update displays
        if (window.lpApp?.uiController?.displayGenerationResults) {
          window.lpApp.uiController.displayGenerationResults();
        }
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        console.log('✅ 結果表示完了');
        alert('✅ 生成結果を復旧しました！\n\n支払い済みのAPI料金でのコンテンツを表示しています。');
      } else {
        console.error('❌ Result section not found');
      }
    } catch (error) {
      console.error('⚠️ 強制表示エラー:', error);
    }
  },
  
  // Check current generation state
  checkState() {
    console.log('🔍 現在の状態:');
    console.log('- isGenerating:', window.isGenerating);
    console.log('- generatedLP:', window.lpApp?.core?.generatedLP);
    console.log('- lastRawResponse:', window.lpApp?.core?.lastRawResponse);
    console.log('- lastGrokResponse:', window.lastGrokResponse);
    
    const resultSection = document.getElementById('resultSection');
    const generatingSection = document.getElementById('generatingSection');
    
    console.log('- resultSection display:', resultSection?.style?.display);
    console.log('- generatingSection display:', generatingSection?.style?.display);
    
    return {
      isGenerating: window.isGenerating,
      hasGeneratedLP: !!window.lpApp?.core?.generatedLP,
      hasRawResponse: !!window.lpApp?.core?.lastRawResponse,
      resultVisible: resultSection?.style?.display === 'block',
      generatingVisible: generatingSection?.style?.display === 'block'
    };
  }
};

// Global recovery function for console access
window.recoverLP = () => window.debugLP.recoverResults();