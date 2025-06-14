// AI Service integration for Grok

class AIService {
  constructor() {
    this.apiEndpoints = {
      grok: 'https://api.x.ai/v1/chat/completions'
    };
    
    this.defaultModels = {
      grok: 'grok-3-latest'
    };
    
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Get Grok API Key from various sources (prioritize session storage)
  getGrokApiKey() {
    // Try various sources in order of priority
    let apiKey = null;
    
    // 1. From session-only storage (cleared on page reload) - highest priority
    apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY');
    if (apiKey && apiKey !== 'xai-your-default-api-key-here' && apiKey.trim()) {
      return apiKey.trim();
    }
    
    // 2. From environment loader (core.js setting)
    apiKey = window.envLoader?.get('GROK_API_KEY');
    if (apiKey && apiKey !== 'xai-your-default-api-key-here' && apiKey.trim()) {
      return apiKey.trim();
    }
    
    // 3. From global window variable (if set externally)
    if (window.GROK_API_KEY && window.GROK_API_KEY !== 'xai-your-default-api-key-here') {
      return window.GROK_API_KEY.trim();
    }
    
    return null;
  }

  // Check for available API keys without prompting
  async promptForApiKey() {
    // Check only Grok provider for API keys
    const apiKey = sessionStorage.getItem('TEMP_GROK_API_KEY');
    if (apiKey) {
      console.log('✅ Found Grok API key, using it instead of prompting');
      return apiKey;
    }
    
    // No API keys found - throw error instead of prompting
    throw new Error('APIキーが設定されていません。自動検出でAPIキーを設定してください。');
  }

  // Get API key for any provider
  getApiKey(provider) {
    // Only support Grok
    if (provider === 'grok') {
      return this.getGrokApiKey();
    }
    
    return null;
  }

  // Get available API keys
  getAvailableServices() {
    const services = [];
    
    // Check only Grok provider
    const key = this.getApiKey('grok');
    if (key && key.trim()) {
      services.push('grok');
    }
    
    console.log('📋 Available services with API keys:', services);
    return services;
  }





  // Grok API call with streaming support
  async callGrok(prompt, options = {}) {
    let apiKey = this.getGrokApiKey();
    
    // デバッグ用ログ
    console.log('🔑 API Key Status:', {
      fromEnvLoader: window.envLoader?.get('GROK_API_KEY')?.substring(0, 10) + '...',
      fromLocalStorage: localStorage.getItem('GROK_API_KEY')?.substring(0, 10) + '...',
      finalKey: apiKey?.substring(0, 10) + '...',
      hasKey: !!apiKey
    });
    
    if (!apiKey) {
      // プロンプトでAPIキーを要求
      apiKey = await this.promptForApiKey();
      if (!apiKey) {
        throw new ErrorWithDetails(
          'Grok API Keyが設定されていません',
          'MISSING_API_KEY_GROK',
          {
            solution: 'デフォルトAPIキーを設定するか、設定画面からGrok API Keyを入力してください。',
            location: 'callGrok'
          }
        );
      }
    }

    const requestBody = {
      model: options.model || this.defaultModels.grok,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 8192,
      temperature: options.temperature || 0.7,
      stream: options.stream || false
    };

    try {
      console.log('Grok API Request:', {
        url: this.apiEndpoints.grok,
        model: requestBody.model,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        fullPayload: requestBody
      });
      
      const response = await fetch(this.apiEndpoints.grok, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = `Grok API Error: ${response.status}`;
        let solution = 'Grok APIキーと設定を確認してください。';
        
        console.error('Grok API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData: errorData,
          url: this.apiEndpoints.grok,
          model: requestBody.model
        });
        
        if (response.status === 401 || response.status === 403) {
          solution = 'Grok APIキーが無効または期限切れです。設定画面で正しいAPIキーを入力してください。';
        } else if (response.status === 429) {
          solution = 'APIレート制限に達しました。しばらく待ってから再試行してください。';
        } else if (response.status >= 500) {
          solution = 'Grokサーバーエラーです。しばらく待ってから再試行してください。';
        }
        
        throw new ErrorWithDetails(
          `${errorMessage} - ${errorData.error?.message || response.statusText}`,
          'GROK_API_ERROR',
          {
            solution: solution,
            location: 'callGrok',
            status: response.status,
            errorData: errorData
          }
        );
      }

      // Handle streaming vs non-streaming response
      if (requestBody.stream) {
        return await this.handleStreamingResponse(response, prompt, requestBody.model, options);
      } else {
        const data = await response.json();
        
        // Create debug info for developer console
        const debugInfo = {
          timestamp: new Date().toISOString(),
          model: requestBody.model,
          apiEndpoint: this.apiEndpoints.grok,
          requestPromptLength: prompt.length,
          response: {
            hasData: !!data,
            hasChoices: !!(data && data.choices),
            choicesCount: data?.choices?.length || 0,
            firstChoice: data?.choices?.[0],
            responseStructure: Object.keys(data || {})
          }
        };
        
        console.group('🔍 Grok API Response Debug');
        console.log('Debug Info:', debugInfo);
        console.log('Full Response:', data);
        console.groupEnd();
        
        // Save to window for debugging
        window.lastGrokResponse = {
          debugInfo,
          fullResponse: data,
          prompt: prompt.substring(0, 200) + '...'
        };
        
        return this.processNonStreamingResponse(data, requestBody.model);
      }
    } catch (error) {
      console.error('Grok API Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        apiEndpoint: this.apiEndpoints.grok
      });
      
      // Add error to display system
      if (window.errorDisplay) {
        window.errorDisplay.addError(error);
      }
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new ErrorWithDetails(
          'ネットワークエラー: Grok APIに接続できません',
          'NETWORK_ERROR_GROK',
          {
            solution: 'インターネット接続を確認し、ファイアウォールやプロキシ設定を確認してください。',
            location: 'callGrok',
            originalError: error
          }
        );
        if (window.errorDisplay) {
          window.errorDisplay.addError(networkError);
        }
        throw networkError;
      }
      
      throw error;
    }
  }

  // Generate content with selected model (no automatic fallback)
  async generateWithSelectedModel(prompt, options = {}) {
    const selectedModel = options.model || this.getSelectedModel();
    
    if (!selectedModel) {
      throw new ErrorWithDetails(
        'APIキーが設定されていません。上部のAPI設定からAPIキーを入力してください。',
        'NO_API_KEY_CONFIGURED',
        { 
          location: 'generateWithSelectedModel',
          solution: 'API設定セクションで少なくとも1つのAPIキーを設定してください。'
        }
      );
    }

    console.log(`Using selected model: ${selectedModel}`);
    
    try {
      let result;
      
      switch (selectedModel) {
        case 'grok':
          result = await this.callGrok(prompt, options);
          break;
        default:
          throw new ErrorWithDetails(
            `Grok以外のモデルは現在対応していません: ${selectedModel}`,
            'UNSUPPORTED_MODEL',
            { model: selectedModel }
          );
      }
      
      console.log(`Successfully generated content using ${selectedModel}`);
      return {
        ...result,
        service: selectedModel,
        model: result.model || this.defaultModels[selectedModel]
      };
      
    } catch (error) {
      // Enhance error with more details
      if (error instanceof ErrorWithDetails) {
        throw error;
      }
      
      const errorCode = this.getErrorCode(error, selectedModel);
      const solution = this.getErrorSolution(errorCode, selectedModel);
      
      throw new ErrorWithDetails(
        error.message,
        errorCode,
        {
          model: selectedModel,
          originalError: error,
          location: 'generateWithSelectedModel',
          solution: solution
        }
      );
    }
  }

  // Get currently selected model
  getSelectedModel() {
    let selectedModel = localStorage.getItem('SELECTED_AI_MODEL');
    
    // If no model is selected, auto-select first available service
    if (!selectedModel) {
      const availableServices = this.getAvailableServices();
      if (availableServices.length > 0) {
        selectedModel = availableServices[0];
        console.log(`🤖 Auto-selecting ${selectedModel} as default model`);
        this.setSelectedModel(selectedModel);
        return selectedModel;
      }
      // No services available
      return null;
    }
    
    // Verify selected model has API key
    const apiKey = this.getApiKey(selectedModel);
    if (!apiKey) {
      // Selected model no longer has API key, find another
      const availableServices = this.getAvailableServices();
      if (availableServices.length > 0) {
        selectedModel = availableServices[0];
        console.log(`🔄 Switching to ${selectedModel} (previous model key removed)`);
        this.setSelectedModel(selectedModel);
        return selectedModel;
      }
      return null;
    }
    
    return selectedModel;
  }

  // Set selected model
  setSelectedModel(model) {
    localStorage.setItem('SELECTED_AI_MODEL', model);
  }

  // Get error code based on error type
  getErrorCode(error, model) {
    const message = error.message.toLowerCase();
    
    if (message.includes('api key') || message.includes('401') || message.includes('403')) {
      return `AUTH_ERROR_${model.toUpperCase()}`;
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return `RATE_LIMIT_${model.toUpperCase()}`;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return `NETWORK_ERROR_${model.toUpperCase()}`;
    }
    if (message.includes('timeout')) {
      return `TIMEOUT_ERROR_${model.toUpperCase()}`;
    }
    if (message.includes('invalid') || message.includes('parse')) {
      return `PARSE_ERROR_${model.toUpperCase()}`;
    }
    
    return `UNKNOWN_ERROR_${model.toUpperCase()}`;
  }

  // Get solution based on error code
  getErrorSolution(errorCode, model) {
    const solutions = {
      [`AUTH_ERROR_${model.toUpperCase()}`]: `${model}のAPIキーを確認してください。設定画面から正しいAPIキーを入力してください。`,
      [`RATE_LIMIT_${model.toUpperCase()}`]: `APIのレート制限に達しました。しばらく待ってから再試行するか、別のモデルを選択してください。`,
      [`NETWORK_ERROR_${model.toUpperCase()}`]: `ネットワーク接続を確認してください。インターネット接続が必要です。`,
      [`TIMEOUT_ERROR_${model.toUpperCase()}`]: `リクエストがタイムアウトしました。ネットワーク接続を確認し、再試行してください。`,
      [`PARSE_ERROR_${model.toUpperCase()}`]: `AIからの応答が不正な形式です。再試行するか、別のモデルを選択してください。`,
      [`UNKNOWN_ERROR_${model.toUpperCase()}`]: `予期しないエラーが発生しました。エラーコードをコピーしてサポートに連絡してください。`
    };
    
    return solutions[errorCode] || solutions[`UNKNOWN_ERROR_${model.toUpperCase()}`];
  }

  // Debug method to test API connectivity
  async testModelConnectivity(model) {
    console.log(`🧪 Testing ${model} connectivity...`);
    
    try {
      const testPrompt = "Test: Respond with 'OK' only.";
      const result = await this.generateWithSelectedModel(testPrompt, { model });
      
      console.log(`✅ ${model} connectivity test passed:`, {
        responseLength: result.content?.length || 0,
        usage: result.usage
      });
      
      return {
        success: true,
        model: model,
        response: result.content?.substring(0, 100) + '...',
        usage: result.usage
      };
      
    } catch (error) {
      console.error(`❌ ${model} connectivity test failed:`, error);
      
      return {
        success: false,
        model: model,
        error: error.message,
        code: error.code || 'UNKNOWN',
        solution: error.details?.solution || 'APIキーと設定を確認してください。'
      };
    }
  }

  // Get detailed API status
  getAPIStatus() {
    const status = {};
    
    ['grok'].forEach(provider => {
      const key = this.getApiKey(provider);
      const prefixes = {
        grok: 'xai-'
      };
      
      status[provider] = {
        hasApiKey: !!key,
        keyLength: key ? key.length : 0,
        keyPrefix: key ? key.substring(0, 8) + '...' : 'None',
        endpoint: this.apiEndpoints[provider],
        isValid: key ? key.startsWith(prefixes[provider]) : false,
        source: this.getApiKeySource()
      };
    });
    
    console.log('🔍 API Status Debug:', status);
    return status;
  }

  // Get source of API key for debugging
  getApiKeySource() {
    if (sessionStorage.getItem('TEMP_GROK_API_KEY')) {
      return 'sessionStorage (temporary)';
    }
    if (window.envLoader?.get('GROK_API_KEY')) {
      return 'envLoader (core.js)';
    }
    if (window.GROK_API_KEY) {
      return 'window.GROK_API_KEY';
    }
    return 'none - will prompt on next use';
  }

  // Backwards compatibility - redirect to new method
  async generateWithFallback(prompt, options = {}) {
    return this.generateWithSelectedModel(prompt, options);
  }

  // Specialized methods for different LP generation tasks

  // Generate complete LP from content
  async generateLP(content, template = null, options = {}) {
    let templateInstructions = '';
    
    if (template) {
      templateInstructions = `
選択されたLP要素テンプレート: ${template.title}
カテゴリ: ${template.category}
説明: ${template.description}

【必ず実装すべき要素】
${template.elements.map((elem, i) => `${i + 1}. ${elem}`).join('\n')}

最適な業界: ${template.bestFor.join('、')}
期待CVR: ${template.expectedCVR}

上記のテンプレート要素を必ず含めて、`;
    }
    
    const prompt = `あなたはダン・ケネディのスタイルをマスターした世界トップクラスのダイレクトレスポンスコピーライターです。以下の内容に基づいて、読者を引き込み、行動させる超長文のランディングページを生成してください。

内容: ${content}

${templateInstructions}

【ダン・ケネディスタイルの重要な指示】:

1. コピーライティングの原則:
   - 読者の恐怖、欲望、痛みに深く共感する
   - 具体的な数字、事例、証拠を多用する
   - 緊急性と希少性を強調する
   - 読者に「今すぐ行動しないと損をする」と感じさせる
   - ストーリーテリングで感情を揺さぶる

2. 必須セクション（各セクション超充実した内容で）:
   - ヘッドライン（読者の注意を一瞬で掴む強烈なキャッチコピー）
   - リード（問題提起と共感で読者を引き込む導入文500文字以上）
   - 痛みの増幅（現状維持の危険性を10個以上具体的に描写）
   - 敵の特定（読者の問題の真の原因を暴露）
   - 解決策の提示（なぜこれが唯一の解決策なのか）
   - ブレット（得られる利益を20個以上、魅力的に箇条書き）
   - 社会的証明（詳細な成功事例を5件以上）
   - 権威性の証明（実績、資格、メディア掲載など）
   - オファーの詳細（価値を積み上げて価格を正当化）
   - 限定性・緊急性（なぜ今すぐ行動すべきか）
   - リスクリバーサル（強力な保証）
   - FAQ（購入を妨げる疑問を15個以上解消）
   - 追伸（P.S.で最後の一押し、3つ以上）

3. ブレット（箇条書き）の書き方:
   - 各ブレットは具体的な利益を約束する
   - 好奇心を刺激する表現を使う
   - 「〜する方法」「なぜ〜なのか」「〜の秘密」などのフレーズを活用
   - 数字を含める（3つの方法、7つの理由など）
   - 各ブレットは2-3行の説明文を含む

4. 文章スタイル:
   - 短い段落（3-4行程度）で読みやすく
   - 会話調で親しみやすく
   - 太字、下線、色を効果的に使用
   - 矢印、チェックマーク等の視覚要素を多用

5. 全体の長さ:
   - HTML全体で15000文字以上
   - 読了まで10-15分かかる充実した内容

6. デザイン要素:
   - 黄色のハイライト効果
   - 赤文字での重要ポイント強調
   - 証言ボックスの視覚的な差別化
   - 価格表の魅力的なデザイン
   - カウントダウンタイマー
   - 矢印やチェックマークの多用

7. CSS設計の重要な指示:
   - CTAボタンには必ず十分なmargin（上下最低40px以上）を設定
   - P.S.セクションは独立したコンテナに配置し、margin-top: 60px以上を確保
   - 全てのセクション間には適切な余白（margin: 40px 0以上）を設定
   - CTAボタンは固定位置（position: fixed）を避け、通常のフローで配置
   - z-indexの過度な使用を避け、要素の重なりを防ぐ
   - フレックスボックスやグリッドを使用して堅牢なレイアウトを構築
   - モバイルレスポンシブ対応（@media queries必須）
   - ボタンやリンクには十分なクリック領域（min-height: 48px）を確保
   - line-heightは1.6以上で読みやすさを確保
   - フォントサイズは本文16px以上、見出しは階層的に設定

必ず以下のJSON形式で応答してください：

{
  "code": {
    "html": "<!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>タイトル</title></head><body><!-- 8000文字以上の充実したHTML --></body></html>",
    "css": "/* 以下の点に配慮した充実したCSS:\n - 要素の重なりを防ぐ適切なmarginとpadding\n - CTAボタンとテキスト要素の明確な分離\n - レスポンシブデザイン対応\n - 読みやすい行間とフォントサイズ\n - セクション間の十分な余白\n */",
    "js": "// スムーズスクロール、アニメーション制御等のJavaScript"
  },
  "analysis": {
    "targetAudience": "ターゲット層の詳細分析",
    "keyMessages": ["キーメッセージ1", "キーメッセージ2", "キーメッセージ3"],
    "designConcept": "デザインコンセプトの詳細説明"
  },
  "performance": {
    "expectedCvr": "12.5%",
    "seoScore": "85",
    "speedScore": "90"
  }
}`;

    const result = await this.generateWithSelectedModel(prompt, { 
      maxTokens: 16384,
      ...options // ストリーミングオプションを含むその他のオプションをマージ
    });
    
    // JSONの解析を試みる
    try {
      let jsonContent = result.content;
      
      // マークダウンのコードブロックを除去
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // 最初の{から最後の}までを抽出
      const startIdx = jsonContent.indexOf('{');
      const endIdx = jsonContent.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        jsonContent = jsonContent.substring(startIdx, endIdx + 1);
      }
      
      const parsed = JSON.parse(jsonContent);
      
      // 必須フィールドの検証
      if (!parsed.code || !parsed.code.html) {
        throw new Error('必須フィールドが不足しています');
      }
      
      return {
        ...result,
        parsedContent: parsed
      };
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', result.content);
      
      // フォールバックとして基本的なレスポンスを返す
      return {
        ...result,
        parsedContent: {
          code: {
            html: `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生成されたランディングページ</title>
</head>
<body>
    <h1>AIが生成したランディングページ</h1>
    <div>${result.content.substring(0, 500)}...</div>
</body>
</html>`,
            css: 'body { font-family: sans-serif; padding: 20px; }',
            js: ''
          },
          analysis: {
            targetAudience: '解析エラー',
            keyMessages: ['解析エラー'],
            designConcept: '解析エラー'
          },
          performance: {
            expectedCvr: 'N/A',
            seoScore: 'N/A',
            speedScore: 'N/A'
          }
        }
      };
    }
  }

  // Analyze client materials
  async analyzeClientMaterials(extractedContent) {
    const prompt = `あなたは経験豊富なウェブデザイナーのアシスタントです。
クライアントから受け取った資料を分析し、LP制作に必要な情報を抽出してください。

資料内容:
${extractedContent}

以下の項目を詳細に抽出し、JSON形式で返してください：

{
  "businessInfo": {
    "companyName": "会社名",
    "serviceName": "サービス・商品名", 
    "industry": "業界（SaaS/EC/医療/不動産/教育等）",
    "businessModel": "BtoB/BtoC/BtoB2C",
    "establishedYear": "設立年（信頼性訴求用）",
    "companySize": "従業員数規模"
  },
  "targetAudience": {
    "primary": "メインターゲット（年齢、職業、課題）",
    "painPoints": ["解決したい課題1", "課題2", "課題3"],
    "demographics": "詳細な属性情報"
  },
  "valueProposition": {
    "mainMessage": "メインメッセージ",
    "uniqueSellingPoints": ["USP1", "USP2", "USP3"],
    "benefits": ["ベネフィット1", "ベネフィット2"],
    "competitiveAdvantage": "競合優位性"
  },
  "offering": {
    "productType": "商品・サービスタイプ",
    "features": ["機能1", "機能2", "機能3"],
    "pricingModel": "料金体系",
    "freeTrialAvailable": true/false
  },
  "credibility": {
    "clientLogos": ["取引先企業名"],
    "achievements": ["実績・受賞歴"],
    "testimonials": ["お客様の声"],
    "certifications": ["認証・資格"]
  },
  "designHints": {
    "preferredColors": ["ブランドカラー"],
    "logoDescription": "ロゴの特徴",
    "brandTone": "ブランドトーン（プロフェッショナル/フレンドリー等）",
    "avoidColors": ["避けるべき色"]
  },
  "lpGoal": {
    "primaryAction": "メインCTA（問い合わせ/資料DL/購入等）",
    "secondaryActions": ["サブCTA"],
    "conversionPoint": "コンバージョンポイント"
  }
}

特に以下を重視してください：
- 実際の文言をそのまま活用できる部分は原文を抽出
- 数値・実績データは正確に抽出
- 競合他社の言及があれば差別化ポイントとして活用
- 専門用語は業界コンテキストで解釈

JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 6000 });
  }

  // Generate LP structure
  async generateLPStructure(analyzedData, selectedReference) {
    const prompt = `優秀なウェブデザイナーとして、以下の情報を基に最適なLP構成を提案してください。

クライアント情報: ${JSON.stringify(analyzedData)}
参考LP: ${JSON.stringify(selectedReference)}

以下の構成で提案し、JSON形式で返してください：

{
  "sections": [
    {
      "name": "ヒーローセクション",
      "purpose": "第一印象とメインメッセージ",
      "elements": ["キャッチコピー", "サブヘッダー", "メインCTA", "ヒーロー画像"],
      "estimatedHeight": "100vh",
      "priority": "最高"
    },
    {
      "name": "課題提示",
      "purpose": "ターゲットの痛みポイントを明確化",
      "elements": ["課題の列挙", "共感フレーズ", "統計データ"],
      "estimatedHeight": "50vh",
      "priority": "高"
    }
  ],
  "ctaStrategy": {
    "primary": "メインCTAの配置戦略",
    "secondary": "サブCTAの配置",
    "timing": "CTA表示のタイミング"
  },
  "designPrinciples": [
    "デザイン原則1",
    "デザイン原則2"
  ],
  "reasoning": "この構成にした理由と期待効果"
}

デザイナーがクライアントに提案しやすい形で、理由付きで回答してください。
JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 4000 });
  }

  // Generate copy content
  async generateCopyContent(structure, analyzedData) {
    const prompt = `あなたはコンバージョン率の高いコピーを書くプロのコピーライターです。

構成: ${JSON.stringify(structure)}
クライアント情報: ${JSON.stringify(analyzedData)}

以下を重視してコピーを作成し、JSON形式で返してください：

{
  "heroSection": {
    "headline": "強力なキャッチコピー",
    "subheadline": "補足説明",
    "ctaText": "CTAボタンテキスト"
  },
  "problemSection": {
    "headline": "課題セクションのヘッドライン",
    "problems": ["課題1の詳細", "課題2の詳細"],
    "empathyStatement": "共感フレーズ"
  },
  "solutionSection": {
    "headline": "ソリューションヘッドライン",
    "description": "解決策の説明",
    "benefits": ["ベネフィット1", "ベネフィット2"]
  },
  "featuresSection": {
    "headline": "機能・特徴のヘッドライン",
    "features": [
      {
        "title": "機能1",
        "description": "機能1の説明"
      }
    ]
  },
  "credibilitySection": {
    "headline": "信頼性セクションのヘッドライン",
    "testimonials": ["お客様の声1", "お客様の声2"],
    "achievements": ["実績1", "実績2"]
  },
  "ctaSection": {
    "headline": "最終CTAのヘッドライン",
    "description": "行動を促す説明",
    "ctaText": "CTAボタンテキスト",
    "urgency": "緊急性を演出するテキスト"
  }
}

コピーライティングのポイント：
- AIDCA構造の実装
- 心理的トリガー活用（緊急性、社会的証明、権威性等）
- 定量的な数値・実績の効果的な配置
- ターゲットに響く言葉選び
- 業界特有の言い回し・専門用語の適切な使用

JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 5000 });
  }

  // Generate HTML/CSS code
  async generateLPCode(structure, copy, designReference, analyzedData) {
    const prompt = `あなたは最高レベルのフロントエンド開発者です。
以下の情報を基に、プロ品質のランディングページを生成してください。

構成: ${JSON.stringify(structure)}
コピー: ${JSON.stringify(copy)}
デザイン参考: ${JSON.stringify(designReference)}
クライアント情報: ${JSON.stringify(analyzedData)}

技術要件:
- モダンCSS（CSS Grid, Flexbox, CSS Variables）
- レスポンシブデザイン（モバイルファースト）
- アクセシビリティ対応
- SEO最適化（構造化データ含む）
- Core Web Vitals最適化
- CSS Animations（適度に）

出力形式（JSON）:
{
  "html": "<!DOCTYPE html>...",
  "css": "/* モダンで美しいCSS */",
  "js": "// 必要最小限のJS",
  "seo": {
    "title": "最適化されたタイトル",
    "description": "メタディスクリプション",
    "keywords": ["キーワード1", "キーワード2"],
    "structuredData": "JSON-LD構造化データ"
  }
}

デザイナーがクライアントに自信を持って提出できるレベルで作成してください。
各セクションは視覚的に魅力的で、ユーザビリティも考慮してください。

JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 8000 });
  }

  // Generate client proposal
  async generateClientProposal(analyzedData, lpStructure, performancePrediction) {
    const prompt = `デザイナーがクライアントに提案する際の資料を作成してください。

クライアント情報: ${JSON.stringify(analyzedData)}
LP構成: ${JSON.stringify(lpStructure)}
パフォーマンス予測: ${JSON.stringify(performancePrediction)}

以下の形式で提案資料を作成し、JSON形式で返してください：

{
  "proposalTitle": "ランディングページ制作提案書",
  "executiveSummary": "エグゼクティブサマリー",
  "sections": [
    {
      "title": "現状課題の整理",
      "content": "クライアントの課題と解決すべきポイント"
    },
    {
      "title": "提案LP構成",
      "content": "なぜこの構成にしたかの説明"
    },
    {
      "title": "期待効果",
      "content": "数値的な改善予測"
    },
    {
      "title": "競合比較",
      "content": "競合サイトとの差別化ポイント"
    },
    {
      "title": "実装スケジュール",
      "content": "制作スケジュールと工程"
    }
  ],
  "investment": {
    "traditionalApproach": "従来の制作方法での工数・コスト",
    "aiApproach": "AI活用での工数・コスト削減効果",
    "savings": "削減できる工数・コスト"
  },
  "nextSteps": ["次のステップ1", "次のステップ2"]
}

デザイナーがプレゼンで使いやすい形で作成してください。
JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 4000 });
  }

  // Generate A/B test variations
  async generateABTestVariations(originalLP) {
    const prompt = `既存のLPを基に、A/Bテストのバリエーションを提案してください。

オリジナルLP: ${JSON.stringify(originalLP)}

以下の形式でA/Bテスト案を作成し、JSON形式で返してください：

{
  "variations": [
    {
      "name": "ヘッドライン変更案A",
      "category": "headline",
      "changes": {
        "element": "変更する要素",
        "original": "元のテキスト",
        "variation": "変更後のテキスト",
        "reason": "変更理由"
      },
      "expectedImprovement": "+15% CVR",
      "testDuration": "2週間",
      "confidence": "高"
    }
  ],
  "testStrategy": {
    "primaryMetric": "メイン測定指標",
    "secondaryMetrics": ["サブ指標1", "サブ指標2"],
    "trafficSplit": "50/50",
    "minimumSampleSize": "必要なサンプル数"
  },
  "recommendations": [
    "テスト実施の推奨事項1",
    "テスト実施の推奨事項2"
  ]
}

コンバージョン向上に効果的なテスト案を提案してください。
JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 3000 });
  }

  // Predict performance metrics
  async predictPerformance(analyzedData, lpStructure) {
    const prompt = `業界データと最新のコンバージョン最適化知識を基に、
このLPのパフォーマンスを予測してください。

クライアント情報: ${JSON.stringify(analyzedData)}
LP構成: ${JSON.stringify(lpStructure)}

以下の形式で予測を返してください（JSON形式）：

{
  "conversionRate": {
    "predicted": "予想CVR（%）",
    "industryAverage": "業界平均CVR",
    "confidenceLevel": "予測精度",
    "factors": ["CVRに影響する要因1", "要因2"]
  },
  "performance": {
    "pageSpeedScore": "表示速度スコア（1-100）",
    "mobileUsability": "モバイル対応スコア",
    "seoScore": "SEOスコア",
    "accessibilityScore": "アクセシビリティスコア"
  },
  "userExperience": {
    "bounceRate": "予想直帰率",
    "timeOnPage": "予想滞在時間",
    "scrollDepth": "予想スクロール深度"
  },
  "improvementAreas": [
    {
      "area": "改善エリア",
      "suggestion": "改善提案",
      "expectedImpact": "期待される効果"
    }
  ]
}

業界ベンチマークと比較した予測を提供してください。
JSONのみを返し、他の説明は不要です。`;

    return await this.generateWithFallback(prompt, { maxTokens: 3000 });
  }

  // Test API connection
  async testConnection(service) {
    const testPrompt = "Hello, please respond with 'API connection successful'";
    
    try {
      let result;
      switch (service) {
        case 'grok':
          result = await this.callGrok(testPrompt, { maxTokens: 100 });
          break;
        default:
          throw new Error('Only Grok service is supported');
      }
      
      return {
        success: true,
        content: result.content,
        model: result.model || this.defaultModels[service] || 'grok-3-latest',
        usage: result.usage
      };
    } catch (error) {
      console.error(`${service} connection test failed:`, error);
      throw error; // Re-throw to show detailed error
    }
  }

  // === ストリーミング対応メソッド ===
  
  // Handle streaming response from Grok API
  async handleStreamingResponse(response, prompt, model, options = {}) {
    console.log('🌊 Starting streaming response handling...');
    
    if (!response.body) {
      throw new Error('Response body is not available for streaming');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let usage = {};
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('🏁 Streaming completed');
          break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('✅ Stream finished with [DONE]');
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.choices?.[0]?.delta?.content) {
                const chunk = parsed.choices[0].delta.content;
                fullContent += chunk;
                
                // Call streaming callback if provided
                if (options.onChunk) {
                  options.onChunk(chunk, fullContent);
                }
                
                // Update real-time display
                if (window.lpApp?.uiController?.updateStreamingDisplay) {
                  console.log('📡 Calling updateStreamingDisplay with chunk:', chunk.substring(0, 50) + '...');
                  window.lpApp.uiController.updateStreamingDisplay(chunk, fullContent);
                } else {
                  console.warn('⚠️ updateStreamingDisplay not available');
                }
              }
              
              // Capture usage information
              if (parsed.usage) {
                usage = parsed.usage;
              }
              
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', data);
            }
          }
        }
      }
      
      console.log('📊 Final streaming result:', {
        contentLength: fullContent.length,
        usage: usage
      });
      
      return {
        content: fullContent,
        usage: usage,
        model: model || this.defaultModels.grok
      };
      
    } finally {
      reader.releaseLock();
    }
  }
  
  // Process non-streaming response (existing logic)
  processNonStreamingResponse(data, model) {
    // Enhanced response validation
    if (!data.choices || data.choices.length === 0) {
      console.error('Grok API: No choices in response:', data);
      throw new ErrorWithDetails(
        'Grok APIから有効な応答が返されませんでした',
        'GROK_NO_CHOICES',
        {
          solution: 'プロンプトを変更するか、しばらく待ってから再試行してください。',
          location: 'callGrok',
          responseData: data
        }
      );
    }

    const choice = data.choices[0];
    if (!choice || !choice.message) {
      console.error('Grok API: No message in choice:', choice);
      throw new ErrorWithDetails(
        'Grok APIの応答にメッセージがありません',
        'GROK_NO_MESSAGE',
        {
          solution: 'プロンプトを変更するか、別のモデルを試してください。',
          location: 'callGrok',
          choice: choice
        }
      );
    }

    if (!choice.message.content) {
      console.error('Grok API: No content in message:', choice.message);
      throw new ErrorWithDetails(
        'Grok APIからコンテンツが取得できませんでした',
        'GROK_NO_CONTENT',
        {
          solution: 'プロンプトを変更するか、しばらく待ってから再試行してください。',
          location: 'callGrok',
          message: choice.message
        }
      );
    }

    const content = choice.message.content;
    console.log('Grok API Response:', {
      model: data.model,
      requestedModel: model,
      defaultModel: this.defaultModels.grok,
      contentLength: content?.length || 0,
      usage: data.usage
    });
    
    return {
      content: content,
      usage: data.usage || {},
      model: data.model || model || this.defaultModels.grok
    };
  }
}

// Export the AI service
window.AIService = AIService;

// Debug functions for console
window.debugAPI = {
  checkApiKey: () => {
    const aiService = window.lpApp?.core?.aiService || new AIService();
    const key = aiService.getGrokApiKey();
    console.log('🔑 Current API Key:', key ? key.substring(0, 8) + '...' : 'None');
    console.log('📋 Available Services:', aiService.getAvailableServices());
    console.log('🤖 Selected Model:', aiService.getSelectedModel());
    console.log('📊 Full Status:', aiService.getAPIStatus());
    
    // Check all possible storage locations
    console.log('🔍 Storage Check:');
    console.log('  - envLoader:', window.envLoader?.get('GROK_API_KEY')?.substring(0, 8) + '...' || 'None');
    console.log('  - sessionStorage:', sessionStorage.getItem('TEMP_GROK_API_KEY')?.substring(0, 8) + '...' || 'None');
    console.log('  - window.GROK_API_KEY:', window.GROK_API_KEY?.substring(0, 8) + '...' || 'None');
    
    return {
      hasKey: !!key,
      keySource: aiService.getApiKeySource(),
      selectedModel: aiService.getSelectedModel()
    };
  },
  setTempApiKey: (key) => {
    if (key && key.startsWith('xai-')) {
      sessionStorage.setItem('TEMP_GROK_API_KEY', key);
      console.log('✅ API Key saved temporarily (until page reload)');
    } else {
      console.error('❌ Invalid API key. Must start with "xai-"');
    }
  },
  clearTempApiKey: () => {
    sessionStorage.removeItem('TEMP_GROK_API_KEY');
    console.log('🗑️ Temporary API Key cleared');
  },
  clearAllKeys: () => {
    sessionStorage.removeItem('TEMP_GROK_API_KEY');
    localStorage.removeItem('SELECTED_AI_MODEL');
    console.log('🗑️ Grok API Key cleared');
  },
  forceCleanup: () => {
    // Force cleanup of all possible API key storage locations
    if (window.envLoader) {
      window.envLoader.clear();
    }
    
    // Clear all possible localStorage keys
    const keysToRemove = [
      'SELECTED_AI_MODEL'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🧹 Removing: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage
    sessionStorage.removeItem('TEMP_GROK_API_KEY');
    
    console.log('🧹 Complete cleanup finished - please reload the page');
    
    // Reload the page to ensure clean state
    // クリーンアップ完了（確認ダイアログを削除）
    console.log('クリーンアップ完了');
  }
};