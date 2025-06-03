// LP Generator - Comprehensive Application
// Combined and optimized from all modules for a single-file solution

// ================================
// UTILITY FUNCTIONS AND HELPERS
// ================================

// ================================
// API CONFIGURATION FUNCTIONS
// ================================

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

// Test API connection
async function testApiConnection(event) {
  const apiKeyInput = document.getElementById('grokApiKeyInput');
  const apiKey = apiKeyInput?.value?.trim();
  
  if (!apiKey) {
    updateApiStatus('error', '❌', 'APIキーが入力されていません');
    showTestResult('error', 'APIキーを入力してください');
    return;
  }
  
  if (!apiKey.startsWith('xai-')) {
    updateApiStatus('error', '❌', 'APIキーの形式が正しくありません');
    showTestResult('error', 'Grok APIキーは "xai-" で始まる必要があります');
    return;
  }
  
  const testResult = document.getElementById('testResult');
  const testButton = event ? event.target : document.querySelector('button[onclick*="testApiConnection"]');
  
  try {
    // Disable button during test
    testButton.disabled = true;
    testButton.textContent = '🔄 テスト中...';
    
    // Show testing status
    updateApiStatus('info', '🔄', 'API接続をテスト中...');
    showTestResult('testing', 'Grok APIに接続しています...');
    
    // Save original key to restore if test fails
    const originalKey = window.envLoader?.get('GROK_API_KEY') || localStorage.getItem('GROK_API_KEY');
    
    // Temporarily set the test key
    if (window.envLoader) {
      window.envLoader.set('GROK_API_KEY', apiKey);
    } else {
      localStorage.setItem('GROK_API_KEY', apiKey);
    }
    
    // Create new AI service instance for testing
    const aiService = new window.AIService();
    
    // Test with a simple prompt
    const testPrompt = "Test connection. Reply with 'OK' only.";
    const result = await aiService.callGrok(testPrompt, { 
      maxTokens: 50,
      temperature: 0.1
    });
    
    // Success!
    updateApiStatus('success', '✅', `API接続成功 (モデル: ${result.model || 'grok-3-latest'})`);
    showTestResult('success', `
      <strong>接続成功!</strong><br>
      モデル: ${result.model || 'grok-3-latest'}<br>
      レスポンス: "${result.content?.substring(0, 50)}..."<br>
      使用トークン: ${result.usage?.total_tokens || result.usage?.totalTokens || 'N/A'}
    `);
    
    // Update button states since test passed
    updateGenerationButtonStates(true);
    
  } catch (error) {
    console.error('API connection test failed:', error);
    
    // Restore original key since test failed
    if (originalKey) {
      if (window.envLoader) {
        window.envLoader.set('GROK_API_KEY', originalKey);
      } else {
        localStorage.setItem('GROK_API_KEY', originalKey);
      }
    } else {
      // Remove the failed key
      if (window.envLoader) {
        window.envLoader.set('GROK_API_KEY', null);
      }
      localStorage.removeItem('GROK_API_KEY');
    }
    
    let errorMessage = 'API接続に失敗しました';
    let errorDetail = error.message;
    
    if (error.code === 'MISSING_API_KEY_GROK') {
      errorMessage = 'APIキーが設定されていません';
    } else if (error.details?.status === 401 || error.message.includes('401')) {
      errorMessage = 'APIキーが無効です';
      errorDetail = '正しいAPIキーを入力してください';
    } else if (error.details?.status === 403 || error.message.includes('403')) {
      errorMessage = 'APIキーの権限が不足しています';
      errorDetail = 'APIキーの権限設定を確認してください';
    } else if (error.details?.status === 429 || error.message.includes('429')) {
      errorMessage = 'APIレート制限に達しています';
      errorDetail = 'しばらく待ってから再試行してください';
    } else if (error.name === 'TypeError' || error.message.includes('fetch') || error.code === 'NETWORK_ERROR_GROK') {
      errorMessage = 'ネットワークエラー';
      errorDetail = 'インターネット接続を確認してください';
    }
    
    updateApiStatus('error', '❌', errorMessage);
    showTestResult('error', `
      <strong>接続失敗</strong><br>
      ${errorMessage}<br>
      <small>${errorDetail}</small>
    `);
    
  } finally {
    // Re-enable button
    testButton.disabled = false;
    testButton.textContent = '🧪 接続テスト';
  }
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
  
  if (!statusElement || !indicatorElement || !textElement) return;
  
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
  const grokCard = document.getElementById('grokCard');
  const grokStatus = document.getElementById('grokStatus');
  
  if (!grokCard || !grokStatus) return;
  
  const apiKey = window.envLoader?.get('GROK_API_KEY') || localStorage.getItem('GROK_API_KEY');
  const statusIndicator = grokStatus.querySelector('.status-indicator');
  const statusText = grokStatus.querySelector('.status-text');
  
  if (apiKey) {
    statusIndicator.className = 'status-indicator available';
    statusText.textContent = '利用可能';
    grokCard.classList.remove('disabled');
    
    // Auto-select Grok if it's available and no model is selected
    if (window.lpApp && window.lpApp.core && window.lpApp.core.aiService) {
      const selectedModel = window.lpApp.core.aiService.getSelectedModel();
      if (!selectedModel) {
        window.lpApp.selectAIModel('grok');
      }
    }
  } else {
    statusIndicator.className = 'status-indicator unavailable';
    statusText.textContent = 'APIキー未設定';
    grokCard.classList.add('disabled');
  }
}

// Test error display (for development)
function testErrorDisplay() {
  if (!window.errorDisplay) return;
  
  // Create a test error
  const testError = new ErrorWithDetails(
    'これはテストエラーです',
    'TEST_ERROR',
    {
      solution: 'これはエラー表示のテストです。',
      timestamp: new Date().toISOString(),
      testData: { example: 'value' }
    }
  );
  
  window.errorDisplay.addError(testError);
}

// Make test function available globally for debugging
window.testErrorDisplay = testErrorDisplay;

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

  showError(message, details = null) {
    // console.log('showError called:', { message, details });
    
    const toast = document.getElementById('errorToast');
    const messageEl = document.getElementById('errorMessage');
    if (messageEl) messageEl.textContent = message;
    if (toast) {
      toast.style.display = 'block';
      
      // Always create details if not provided
      if (!details) {
        details = {
          message: message,
          code: 'GENERAL_ERROR',
          location: 'Unknown',
          timestamp: new Date().toLocaleString(),
          solution: '1. ページをリロードしてください\n2. しばらく待ってから再試行してください\n3. 問題が続く場合はブラウザのキャッシュをクリアしてください'
        };
      }
      
      // Store error details for click handler
      toast.dataset.errorDetails = JSON.stringify(details);
      toast.style.cursor = 'pointer';
      toast.title = 'クリックで詳細を表示';
      
      // console.log('Error details stored:', details);
    }

    // Clear any existing timeout
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    // Auto-hide after 10 seconds instead of 5
    this.errorTimeout = setTimeout(() => {
      this.hideError();
    }, 10000);
  }

  hideError() {
    const toast = document.getElementById('errorToast');
    if (toast) {
      toast.style.display = 'none';
      // Clear any existing timeout when manually hiding
      if (this.errorTimeout) {
        clearTimeout(this.errorTimeout);
        this.errorTimeout = null;
      }
    }
  }

  // Show detailed error modal
  showErrorDetails(errorDetails) {
    // console.log('showErrorDetails called with:', errorDetails);
    
    const modal = document.getElementById('errorModal');
    if (!modal) {
      console.error('Error modal not found');
      return;
    }

    // Populate error details
    const messageEl = document.getElementById('errorDetailMessage');
    const codeEl = document.getElementById('errorCode');
    const locationEl = document.getElementById('errorLocation');
    const timestampEl = document.getElementById('errorTimestamp');
    const solutionEl = document.getElementById('errorSolution');

    // console.log('Modal elements found:', { modal: !!modal, messageEl: !!messageEl, codeEl: !!codeEl, locationEl: !!locationEl, timestampEl: !!timestampEl, solutionEl: !!solutionEl });

    if (messageEl) messageEl.textContent = errorDetails.message || 'エラーメッセージがありません';
    if (codeEl) codeEl.textContent = errorDetails.code || 'エラーコードがありません';
    if (locationEl) locationEl.textContent = errorDetails.location || '場所が特定できません';
    if (timestampEl) timestampEl.textContent = errorDetails.timestamp || new Date().toLocaleString();
    if (solutionEl) solutionEl.textContent = errorDetails.solution || '解決方法を調査中です';

    modal.style.display = 'flex';
    // console.log('Modal displayed');
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
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      if (section.id !== 'uploadSection') {
        section.style.display = 'none';
      }
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.style.display = 'block';
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
    // Check both possible locations for generatedLP
    const lp = this.app.core?.generatedLP || this.app.generatedLP;
    console.log('🔍 DisplayGenerationResults:', {
      hasAppCore: !!this.app.core,
      hasAppGeneratedLP: !!this.app.generatedLP,
      hasCoreGeneratedLP: !!this.app.core?.generatedLP,
      finalLP: !!lp,
      lpKeys: lp ? Object.keys(lp) : 'none'
    });
    
    if (!lp) {
      console.warn('⚠️ No generatedLP found for display');
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

  // Alias method for backwards compatibility - fixes "displayResults is not a function" error
  displayResults() {
    console.log('⚠️ displayResults() called - this is deprecated, use displayGenerationResults() instead');
    return this.displayGenerationResults();
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
    const summaryContent = document.getElementById('usageSummaryContent');
    if (!summaryContent || !usageData) return;
    
    const usage = usageData.usage || {};
    const inputTokens = usage.promptTokens || usage.prompt_tokens || 0;
    const outputTokens = usage.completionTokens || usage.completion_tokens || usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokens || usage.total_tokens || (inputTokens + outputTokens) || 0;
    
    const modelIcon = {
      'grok': '🚀'
    };
    
    summaryContent.innerHTML = `
      <div class="usage-summary-card ${usageData.model}">
        <div class="usage-card-header">
          <span class="usage-model-name">${usageData.model.toUpperCase()}</span>
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

  updatePreview() {
    const previewFrame = document.getElementById('previewFrame');
    // Check both possible locations for generatedLP
    const lp = this.app.core?.generatedLP || this.app.generatedLP;
    console.log('🔍 UpdatePreview:', {
      hasPreviewFrame: !!previewFrame,
      hasLP: !!lp,
      lpCode: lp?.code ? 'exists' : 'missing'
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
        this.showSuccess(`${type.toUpperCase()} コードをコピーしました`);
      } catch (err) {
        this.showError('コピーに失敗しました');
      }
    }
  }

  updateAIUsageDisplay(model, status, usage, generationTime, responseSize, errorMessage) {
    let usageDisplay = document.getElementById('aiUsageDisplay');
    if (!usageDisplay) {
      usageDisplay = document.createElement('div');
      usageDisplay.id = 'aiUsageDisplay';
      usageDisplay.className = 'ai-usage-display';
      
      const generatingSection = document.getElementById('generatingSection');
      const generationContainer = generatingSection?.querySelector('.generation-container');
      if (generationContainer) {
        generationContainer.appendChild(usageDisplay);
      }
    }

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
    
    const errorModal = document.getElementById('errorModal');
    if (errorModal) errorModal.style.display = 'none';
    
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
      window.UIUtils.showError('最大20ファイルまでアップロード可能です');
      return;
    }
    
    const validFiles = [];
    for (const file of files) {
      const validation = this.app.fileProcessor.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        window.UIUtils.showError(`${file.name}: ${validation.errors.join(', ')}`);
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
      window.UIUtils.showError('すべてのファイル処理に失敗しました');
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
      window.UIUtils.showSuccess('ファイルを削除しました');
    }
  }

  viewFile(index) {
    const file = this.app.uploadedFiles[index];
    if (!file || !file.content) {
      window.UIUtils.showError('ファイル内容を表示できません');
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
      window.UIUtils.showError('元のファイルが見つかりません。再度アップロードしてください。');
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
      window.UIUtils.showError('元のファイルが見つかりません。再度アップロードしてください。');
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
      window.UIUtils.showSuccess('ファイルを正常に処理しました');
      
    } catch (error) {
      console.error(`Retry error for ${fileEntry.fileName}:`, error);
      fileEntry.status = 'failed';
      fileEntry.error = error.message;
      
      window.UIUtils.hideLoading();
      window.UIUtils.showError(`再処理エラー: ${error.message}`);
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
          window.UIUtils.showError('アプリケーションの初期化に失敗しました');
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
        window.UIUtils.showError('Claude Codeは専用環境でのみ利用可能です');
      } else {
        window.UIUtils.showError(`${model.toUpperCase()} APIキーが設定されていません。設定画面から入力してください。`);
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
      window.UIUtils.showError('テストするモデルを選択してください');
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
      window.UIUtils.showError(`${selectedModel} 接続テストエラー: ${error.message}`);
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
      window.UIUtils.showSuccess('データを保存しました');
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
          this.uiController.showError('モデルの選択に失敗しました。ページをリロードしてください。');
          return;
        }
      } else {
        this.uiController.showError('先にGrok APIキーを設定してください');
        return;
      }
    }

    let content = '';
    if (this.core.uploadedFiles.length === 0) {
      this.uiController.showError('ファイルがアップロードされていません。クライアント資料をアップロードしてからLP生成を実行してください。');
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
      
      this.core.generatedLP = this.parseLPGenerationResult(result.content, selectedModel, result);
      
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
      
      this.uiController.displayGenerationResults();
      this.uiController.displayUsageSummary(this.core.lastUsageData);
      this.uiController.showSection('resultSection');
      
      this.uiController.updateProgress(95, '最終チェック中...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.uiController.updateProgress(100, 'LP生成完了！');
      
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
      
      this.uiController.showError(`LP生成エラー (${selectedModel}): ${error.message}`);
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
        this.uiController.showError(`${model}の応答をJSONとして解析できませんでした。別のモデルを試してください。`);
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
        this.uiController.showError('Claude Codeは専用環境でのみ利用可能です');
      } else {
        this.uiController.showError(`${model.toUpperCase()} APIキーが設定されていません。設定画面から入力してください。`);
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
      this.uiController.showError('プレビューするLPがありません');
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
      this.uiController.showError('ダウンロードするLPがありません');
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
      this.uiController.showError('ダウンロードに失敗しました');
    }
  }

  downloadProposal() {
    // Check both possible locations for generatedLP
    const lp = this.core?.generatedLP || this.generatedLP;
    if (!lp || !lp.proposal) {
      this.uiController.showError('ダウンロードする提案資料がありません');
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
      
      this.uiController.showSuccess('設定を一時保存しました（ページリロード時に消去）');
      this.toggleSettings();
    } else {
      this.uiController.showError('有効なAPIキーを入力してください');
    }
  }

  clearSettings() {
    if (confirm('すべての設定をクリアしますか？')) {
      StorageUtils.clearApiKeys();
      document.getElementById('grokApiKey').value = '';
      
      this.core.aiService.setSelectedModel(null);
      this.core.checkModelAvailability();
      this.uiController.showSuccess('設定をクリアしました');
    }
  }

  // Setup operations
  skipSetup() {
    document.getElementById('setupModal').style.display = 'none';
  }

  saveSetup() {
    const grokKey = document.getElementById('setupGrokKey')?.value || '';
    
    if (!grokKey) {
      this.uiController.showError('Grok APIキーを入力してください');
      return;
    }
    
    // Save temporarily to sessionStorage only
    if (grokKey && grokKey.startsWith('xai-')) {
      sessionStorage.setItem('TEMP_GROK_API_KEY', grokKey);
    }
    
    document.getElementById('setupModal').style.display = 'none';
    this.core.checkModelAvailability();
    this.uiController.showSuccess('初期設定が完了しました（一時保存・ページリロード時に消去）');
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
  showError: (msg, details) => window.uiController?.showError(msg, details),
  hideError: () => window.uiController?.hideError(),
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
window.resetPromptSelection = resetPromptSelection;
window.togglePrompt = togglePrompt;
window.clearSelectedPrompts = clearSelectedPrompts;
window.showSelectedPrompts = showSelectedPrompts;
window.sendImprovementRequest = sendImprovementRequest;
window.clearImprovementForm = clearImprovementForm;
window.hideError = () => window.lpApp?.uiController?.hideError();

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
  window.UIUtils.showError('バリエーション生成機能は開発中です');
}

function closeErrorModal() {
  const modal = document.getElementById('errorModal');
  if (modal) modal.style.display = 'none';
}

function copyErrorCode() {
  const codeEl = document.getElementById('errorCode');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      window.UIUtils.showSuccess('エラーコードをコピーしました');
    }).catch(() => {
      window.UIUtils.showError('コピーに失敗しました');
    });
  }
}

function copyFullError() {
  const modal = document.getElementById('errorModal');
  if (!modal) return;
  
  const messageEl = document.getElementById('errorDetailMessage');
  const codeEl = document.getElementById('errorCode');
  const locationEl = document.getElementById('errorLocation');
  const timestampEl = document.getElementById('errorTimestamp');
  const solutionEl = document.getElementById('errorSolution');
  
  const errorText = `
エラー詳細:
メッセージ: ${messageEl?.textContent || 'N/A'}
エラーコード: ${codeEl?.textContent || 'N/A'}
発生場所: ${locationEl?.textContent || 'N/A'}
時刻: ${timestampEl?.textContent || 'N/A'}
推奨対処法: ${solutionEl?.textContent || 'N/A'}
  `.trim();
  
  navigator.clipboard.writeText(errorText).then(() => {
    window.UIUtils.showSuccess('エラー情報全体をコピーしました');
  }).catch(() => {
    window.UIUtils.showError('コピーに失敗しました');
  });
}

// Test function for error modal
function testErrorModal() {
  const testDetails = {
    message: 'これはテスト用のエラーメッセージです',
    code: 'TEST_ERROR_001',
    location: 'testErrorModal function',
    timestamp: new Date().toLocaleString(),
    solution: '1. これはテスト用なので実際の問題ではありません\n2. モーダルが正しく表示されることを確認\n3. コンソールログをチェック'
  };
  
  if (window.lpApp && window.lpApp.uiController) {
    window.lpApp.uiController.showError('テスト用エラー（クリックしてください）', testDetails);
  } else {
    console.error('UI Controller not available');
  }
}

function improveLP() {
  window.UIUtils.showError('改善提案機能は開発中です');
}

function generateABTests() {
  window.UIUtils.showError('A/Bテスト生成機能は開発中です');
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
    alert('まだプロンプトが選択されていません。');
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
  
  if (!request && window.selectedPrompts.length === 0) {
    window.lpApp?.uiController?.showError('再生成する内容を入力するか、プロンプトを選択してください');
    return;
  }
  
  // Combine selected prompts with manual input
  const allRequests = [];
  if (window.selectedPrompts && window.selectedPrompts.length > 0) {
    allRequests.push(...window.selectedPrompts);
  }
  if (request) {
    allRequests.push(request);
  }
  const finalRequest = allRequests.join('\n\n');
  
  // Check both possible locations for generatedLP
  const currentLP = window.lpApp?.core?.generatedLP || window.lpApp?.generatedLP;
  if (!currentLP) {
    window.lpApp?.uiController?.showError('再生成するLPが見つかりません。先にLPを生成してください。');
    return;
  }
  
  try {
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
    
    // Send to AI
    const result = await window.lpApp.core.aiService.generateLP(improvementPrompt);
    
    // Parse and update LP
    if (result.parsedContent) {
      window.lpApp.core.generatedLP = {
        ...currentLP,
        code: result.parsedContent.code,
        analysis: result.parsedContent.analysis,
        performance: result.parsedContent.performance
      };
      
      // Update display
      window.lpApp.uiController.displayGenerationResults();
      
      // Add AI response to chat
      addChatMessage('ai', '✅ LPを再生成しました！新しいバージョンがプレビューに反映されています。');
      
      // Clear form
      clearImprovementForm();
    } else {
      addChatMessage('ai', '❌ LP再生成中にエラーが発生しました。もう一度お試しください。');
    }
    
  } catch (error) {
    console.error('Improvement request error:', error);
    addChatMessage('ai', `❌ エラー: ${error.message}`);
    window.lpApp?.uiController?.showError(`LP再生成エラー: ${error.message}`);
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

必ず以下のJSON形式で応答してください：

{
  "code": {
    "html": "改善されたHTML全体",
    "css": "改善されたCSS全体", 
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

// Test API connection
async function testApiConnection(model) {
  const resultDiv = document.getElementById(`${model}TestResult`);
  const apiKeyInput = document.getElementById(`${model}ApiKey`);
  
  if (!resultDiv) return;
  
  resultDiv.style.display = 'block';
  resultDiv.className = 'test-result testing';
  resultDiv.innerHTML = '🔄 接続テスト中...';
  
  const apiKey = apiKeyInput?.value?.trim();
  
  if (!apiKey) {
    resultDiv.className = 'test-result error';
    resultDiv.innerHTML = '❌ APIキーを入力してください';
    return;
  }
  
  try {
    const keyName = `${model.toUpperCase()}_API_KEY`;
    const originalKey = localStorage.getItem(keyName);
    localStorage.setItem(keyName, apiKey);
    
    const result = await window.lpApp.core.aiService.testConnection(model);
    
    if (result.success !== false) {
      resultDiv.className = 'test-result success';
      resultDiv.innerHTML = `✅ 接続成功！<br>
        <small>モデル: ${model}<br>
        応答: "${result.content.substring(0, 50)}..."</small>`;
      
      window.lpApp.core.checkModelAvailability();
    } else {
      resultDiv.className = 'test-result error';
      resultDiv.innerHTML = `❌ 接続失敗<br>
        <small>エラー: ${result.error}</small>`;
      
      if (originalKey) {
        localStorage.setItem(keyName, originalKey);
      } else {
        localStorage.removeItem(keyName);
      }
    }
    
  } catch (error) {
    console.error('Test connection error:', error);
    resultDiv.className = 'test-result error';
    resultDiv.innerHTML = `❌ テストエラー<br>
      <small>${error.message}</small>`;
  }
  
  setTimeout(() => {
    if (resultDiv.style.display !== 'none') {
      resultDiv.style.display = 'none';
    }
  }, 10000);
}

// Back to top (reset app) function
function backToTop() {
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
    
    window.lpApp.uiController.showSuccess('アプリを初期状態にリセットしました');
  }
}

// Go to home - return to top page
// goToHome function removed - use backToTop instead

// Initialize back to top functionality
function initBackToTop() {
  const backBtn = document.getElementById('backToTopBtn');
  if (!backBtn) return;

  function toggleBackButton() {
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
  // Initialize error display system first
  window.errorDisplay.init();
  
  // Setup error toast click handler
  const errorToast = document.getElementById('errorToast');
  if (errorToast) {
    errorToast.addEventListener('click', (e) => {
      console.log('Error toast clicked:', e.target);
      
      // Don't trigger if clicking the close button
      if (e.target.classList.contains('error-close')) {
        console.log('Close button clicked, not showing details');
        return;
      }
      
      const errorDetails = errorToast.dataset.errorDetails;
      console.log('Error details data:', errorDetails);
      
      if (errorDetails) {
        try {
          const details = JSON.parse(errorDetails);
          console.log('Parsed error details:', details);
          
          // Direct access to showErrorDetails function
          if (window.lpApp && window.lpApp.uiController && window.lpApp.uiController.showErrorDetails) {
            window.lpApp.uiController.showErrorDetails(details);
          } else {
            console.error('UI Controller not available, showing alert instead');
            alert(`エラー詳細:\n${details.message}\nコード: ${details.code}\n解決方法: ${details.solution}`);
          }
        } catch (error) {
          console.error('Failed to parse error details:', error);
          alert('エラー詳細の解析に失敗しました');
        }
      } else {
        console.log('No error details available, showing basic modal');
        // Show basic error modal even if no details
        const basicDetails = {
          message: errorToast.querySelector('#errorMessage')?.textContent || 'エラーが発生しました',
          code: 'GENERAL_ERROR',
          location: 'Unknown',
          timestamp: new Date().toLocaleString(),
          solution: 'ページをリロードして再試行してください'
        };
        
        if (window.lpApp && window.lpApp.uiController && window.lpApp.uiController.showErrorDetails) {
          window.lpApp.uiController.showErrorDetails(basicDetails);
        } else {
          console.error('UI Controller not available, showing alert instead');
          alert(`エラー詳細:\n${basicDetails.message}\nコード: ${basicDetails.code}\n解決方法: ${basicDetails.solution}`);
        }
      }
    });
  } else {
    console.error('Error toast element not found');
  }
  
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
  
  // Setup debug helpers after app initialization
  setTimeout(() => {
    window.debugLP = {
      showLastResponse() {
        if (window.lpApp.core.lastRawResponse) {
          console.log('=== 最新のAI応答 ===');
          console.log('モデル:', window.lpApp.core.lastRawResponse.model);
          console.log('時刻:', window.lpApp.core.lastRawResponse.timestamp);
          console.log('使用量:', window.lpApp.core.lastRawResponse.usage);
          console.log('応答内容:');
          console.log(window.lpApp.core.lastRawResponse.content);
          console.log('===================');
          
          const debugInfo = `モデル: ${window.lpApp.core.lastRawResponse.model}\n時刻: ${window.lpApp.core.lastRawResponse.timestamp}\n使用量: ${JSON.stringify(window.lpApp.core.lastRawResponse.usage, null, 2)}\n\n応答内容:\n${window.lpApp.core.lastRawResponse.content}`;
          
          navigator.clipboard.writeText(debugInfo).then(() => {
            console.log('✅ デバッグ情報がクリップボードにコピーされました');
          }).catch(() => {
            console.log('❌ クリップボードへのコピーに失敗しました');
          });
          
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
window.selectedCopywriterStyles = ['dan-kennedy']; // 複数選択対応に変更
window.selectedCopywriterStyle = 'dan-kennedy'; // 後方互換性のため残す

// Copywriter style definitions
const copywriterStyles = {
  'dan-kennedy': {
    name: 'ダン・ケネディ',
    instructions: `あなたはダン・ケネディの直接反応マーケティングスタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ダン・ケネディスタイルの特徴】
- 強烈な問題意識と恐怖訴求
- 今すぐ行動しないと損をするという緊急性
- 具体的な数字と証拠を多用
- 読者の感情を強く揺さぶる
- 権威性と信頼性の確立
- リスクリバーサル（返金保証など）
- 限定性と希少性の強調
- P.S.での最後の一押し`
  },
  'gary-halbert': {
    name: 'ゲイリー・ハルバート',
    instructions: `あなたはゲイリー・ハルバートのストーリーテリングスタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ゲイリー・ハルバートスタイルの特徴】
- 魅力的なストーリーで読者を引き込む
- 感情的なつながりを重視
- 具体的な結果と体験談
- 読みやすい会話調の文体
- 読者との共感を築く
- 実際の体験に基づいた信憑性
- シンプルで力強いメッセージ`
  },
  'john-carlton': {
    name: 'ジョン・カールトン',
    instructions: `あなたはジョン・カールトンのアグレッシブなスタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ジョン・カールトンスタイルの特徴】
- 挑発的で注意を引くヘッドライン
- 競合を意識した差別化訴求
- 直接的で遠慮のない表現
- 読者の現状に対する不満を刺激
- 強烈なインパクトと記憶に残るフレーズ
- 業界の常識を覆す視点
- アクション志向の強いCTA`
  },
  'eugene-schwartz': {
    name: 'ユージーン・シュワルツ',
    instructions: `あなたはユージーン・シュワルツの心理学的アプローチをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ユージーン・シュワルツスタイルの特徴】
- 読者の心理状態を深く理解した訴求
- 段階的な説得プロセス
- 論理的で体系的な構成
- 潜在的な欲求を顕在化させる
- 科学的根拠と理論的説明
- 読者の成熟度に合わせたメッセージ
- 長期的な信頼関係の構築`
  },
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
  },
  'claude-hopkins': {
    name: 'クロード・ホプキンス',
    instructions: `あなたはクロード・ホプキンスの科学的広告スタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【クロード・ホプキンススタイルの特徴】
- データと実績に基づいた訴求
- 測定可能な結果を重視
- A/Bテストを前提とした構成
- 無駄を省いた効率的なコピー
- ROIを重視したメッセージ
- 科学的根拠による説得
- 実証済みの手法の活用`
  },
  'robert-collier': {
    name: 'ロバート・コリアー',
    instructions: `あなたはロバート・コリアーの共感重視スタイルをマスターしたコピーライターです。以下の原則を必ず守ってください：

【ロバート・コリアースタイルの特徴】
- 読者の心の中の対話に入り込む
- 日常的で親しみやすい言葉遣い
- 読者の現在の気持ちから始める
- 段階的に希望へと導く構成
- 個人的な手紙のような温かさ
- 読者一人一人に語りかける文体
- 共感から行動へ自然な流れ`
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
  'haruki-murakami': {
    name: '村上春樹風',
    instructions: `あなたは村上春樹の文学的スタイルをマーケティングに応用するコピーライターです。以下の原則を必ず守ってください：

【村上春樹風スタイルの特徴】
- 静かで内省的な語り口
- 日常の中の特別な瞬間を描写
- 読者の想像力に委ねる余白
- 淡々とした中に深い共感
- 音楽や文学の引用を効果的に使用
- 都会的で洗練された感性
- 押し付けがましくない提案`
  }
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
    // 何も選択されていない場合はデフォルトに戻す
    window.selectedCopywriterStyles = ['dan-kennedy'];
    window.selectedCopywriterStyle = 'dan-kennedy';
    document.querySelector('.copywriter-card[data-style="dan-kennedy"]').classList.add('selected');
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

// Select all copywriters
function selectAllCopywriters() {
  window.selectedCopywriterStyles = [];
  document.querySelectorAll('.copywriter-card').forEach(card => {
    card.classList.add('selected');
    const style = card.dataset.style;
    if (style && !window.selectedCopywriterStyles.includes(style)) {
      window.selectedCopywriterStyles.push(style);
    }
  });
  
  window.selectedCopywriterStyle = window.selectedCopywriterStyles[0] || 'dan-kennedy';
  console.log('All copywriters selected:', window.selectedCopywriterStyles);
  updateSelectionCount();
}


// Reset all selections
function resetPromptSelection() {
  // Reset copywriter style to default
  document.querySelectorAll('.copywriter-card').forEach(card => {
    card.classList.remove('selected');
  });
  document.querySelector('.copywriter-card[data-style="dan-kennedy"]').classList.add('selected');
  window.selectedCopywriterStyles = ['dan-kennedy'];
  window.selectedCopywriterStyle = 'dan-kennedy';
  updateSelectionCount();
  window.selectedCopywriterStyle = 'dan-kennedy';
  
  console.log('Selection reset - Style:', window.selectedCopywriterStyle);
}

// Generate LP with selected prompts
async function generateWithSelectedPrompts() {
  try {
    if (!window.lpApp) {
      console.error('LP App not initialized');
      alert('アプリケーションが初期化されていません');
      return;
    }
    
    // Check if API key is set
    const apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY') || 
                   window.envLoader?.get('GROK_API_KEY') || 
                   localStorage.getItem('GROK_API_KEY');
    if (!apiKey) {
      const errorDetails = {
        message: '先にGrok APIキーを設定してください',
        code: 'MISSING_API_KEY',
        location: 'generateWithSelectedPrompts function',
        timestamp: new Date().toLocaleString(),
        solution: '1. 画面上部の「API設定」でGrok APIキーを入力してください\n2. APIキーが正しい形式（xai-で始まる）であることを確認してください\n3. APIキーに十分な残高があることを確認してください'
      };
      window.lpApp.uiController.showError('先にGrok APIキーを設定してください', errorDetails);
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
      window.lpApp.uiController.showError('コピーライタースタイルが選択されていません', errorDetails);
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
      window.lpApp.uiController.showError(`無効なコピーライタースタイルが選択されました: ${window.selectedCopywriterStyle}`, errorDetails);
      return;
    }
  
  // Check for uploaded files and use them if available
  let combinedContent = '';
  if (window.lpApp.core.uploadedFiles.length === 0) {
    window.lpApp.uiController.showError('ファイルがアップロードされていません。クライアント資料をアップロードしてからLP生成を実行してください。');
    return;
  } else {
    combinedContent = window.lpApp.core.uploadedFiles
      .map(file => `ファイル名: ${file.fileName}\n内容:\n${file.content}`)
      .join('\n\n---\n\n');
    console.log(`Using ${window.lpApp.core.uploadedFiles.length} uploaded files for ${selectedStyle.name} style generation`);
  }
  
    // Show generation section
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, `${selectedStyle.name}スタイルでLP生成を開始しています...`);

    const startTime = Date.now();
    
    // Progress step 1: Analyzing files
    window.lpApp.uiController.updateProgress(10, 'アップロードされた資料を分析中...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Progress step 2: Preparing copywriter style
    window.lpApp.uiController.updateProgress(25, `${selectedStyle.name}のスタイル特性を適用中...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    window.lpApp.uiController.updateAIUsageDisplay('grok', 'starting', 0, 0);

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
    
    // Call AI service directly with custom prompt
    const result = await window.lpApp.core.aiService.generateWithSelectedModel(customPrompt, { maxTokens: 16384 });
    
    // Progress step 4: Processing AI response
    window.lpApp.uiController.updateProgress(65, 'AI応答を処理中...');
    
    const generationTime = Date.now() - startTime;
    
    window.lpApp.uiController.updateAIUsageDisplay('grok', 'completed', result.usage, generationTime, result.content?.length);
    
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
      
      window.lpApp.uiController.showError(`JSON解析エラー: ${parseError.message}. フォールバックコンテンツで継続します。`, errorDetails);
      
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
    window.lpApp.core.generatedLP = {
      ...parsedContent,
      service: 'grok',
      model: result.model || 'grok-3-latest',
      usage: result.usage,
      generationTime: generationTime,
      responseSize: result.content?.length || 0,
      timestamp: new Date().toISOString(),
      copywriterStyle: selectedStyle.name
    };
    
    window.lpApp.uiController.updateProgress(95, '最終チェックと最適化中...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    window.lpApp.uiController.updateProgress(100, 'LP生成完了！');
    
    // Wait a moment then show results
    setTimeout(() => {
      window.lpApp.uiController.showSection('resultSection');
      window.lpApp.uiController.displayGenerationResults();
      window.lpApp.uiController.displayUsageSummary(window.lpApp.core.generatedLP);
    }, 1000);
    
  } catch (error) {
    console.error('Error in generateWithSelectedPrompts:', error);
    console.error('Error stack:', error.stack);
    
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
    
    window.lpApp.uiController.showError(errorMessage, errorDetails);
    window.lpApp.uiController.showSection('promptSelectionSection');
    
    // Reset progress bar
    window.lpApp.uiController.updateProgress(0, 'エラーが発生しました');
  }
}

// Update prompt button states based on API key
function updatePromptButtonStates() {
  const apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY') || 
                 window.envLoader?.get('GROK_API_KEY') || 
                 localStorage.getItem('GROK_API_KEY');
  const isValidKey = apiKey && apiKey.startsWith('xai-');
  
  const promptButton = document.getElementById('generateWithPromptsButton');
  if (promptButton) {
    promptButton.disabled = !isValidKey;
    if (!isValidKey) {
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
    window.lpApp.uiController.showError('ファイルがアップロードされていません。クライアント資料をアップロードしてから実行してください。');
    return;
  }
  
  // Auto-select Grok model if needed
  let selectedModel = window.lpApp.core.aiService.getSelectedModel();
  console.log('🤖 Selected model for selected intros comparison:', selectedModel);
  
  const selectedStyles = window.selectedCopywriterStyles || [];
  if (selectedStyles.length === 0) {
    window.lpApp.uiController.showError('コピーライタースタイルが選択されていません。');
    return;
  }
  
  try {
    // Show loading state
    window.lpApp.uiController.showSection('generatingSection');
    window.lpApp.uiController.updateProgress(0, `${selectedStyles.length}人の冒頭を生成中...`);
    
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
    window.lpApp.uiController.showError('比較生成中にエラーが発生しました: ' + error.message);
  }
}

// Compare all copywriter intros
async function compareAllIntros() {
  console.log('Starting comparison of all copywriter intros');
  
  // Check if files are uploaded
  if (!window.lpApp || !window.lpApp.core.uploadedFiles || window.lpApp.core.uploadedFiles.length === 0) {
    window.lpApp.uiController.showError('ファイルがアップロードされていません。クライアント資料をアップロードしてから実行してください。');
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
    window.lpApp.uiController.showError('比較生成中にエラーが発生しました: ' + error.message);
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
    window.lpApp.uiController.showError('選択されたスタイルが見つかりません');
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
    
    // Call AI service
    const result = await window.lpApp.core.aiService.generateWithSelectedModel(customPrompt, { maxTokens: 16384 });
    
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
    window.lpApp.uiController.updateAIUsageDisplay('grok', 'completed', result.usage, generationTime, result.content?.length);
    
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
    
    // Update result display
    window.lpApp.uiController.displayGenerationResults();
    
  } catch (error) {
    console.error('Error generating full LP:', error);
    window.lpApp.uiController.showError('LP生成中にエラーが発生しました: ' + error.message);
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

// Export classes for debugging and extensibility
window.LPGeneratorApp = LPGeneratorApp;
window.AppCore = AppCore;
window.UIController = UIController;
window.FileUploadHandler = FileUploadHandler;
window.ClientFileProcessor = ClientFileProcessor;
window.AIService = AIService;