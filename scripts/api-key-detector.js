// APIキー自動判別機能

class APIKeyDetector {
  constructor() {
    // APIキーのパターン定義
    this.keyPatterns = {
      grok: {
        prefix: 'xai-',
        regex: /^xai-[A-Za-z0-9]{48,}$/,
        name: 'xAI Grok',
        icon: '🚀',
        minLength: 52
      },
      openai: {
        prefix: 'sk-proj-',
        regex: /^sk-proj-[A-Za-z0-9_-]{100,}$/,
        name: 'OpenAI GPT',
        icon: '🤖',
        minLength: 108
      },
      anthropic: {
        prefix: 'sk-ant-api',
        regex: /^sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{90,}$/,
        name: 'Anthropic Claude',
        icon: '🧠',
        minLength: 100
      },
      deepseek: {
        prefix: 'sk-',
        regex: /^sk-[a-f0-9]{32}$/,
        name: 'DeepSeek',
        icon: '🔍',
        length: 35,
        // DeepSeekは他のsk-プレフィックスと区別するための追加チェック
        validator: (key) => {
          return key.length === 35 && 
                 !key.startsWith('sk-proj-') && 
                 !key.startsWith('sk-ant-') &&
                 /^sk-[a-f0-9]{32}$/.test(key);
        }
      }
    };
  }

  // APIキーのプロバイダーを検出
  detectProvider(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return null;
    }

    // 空白を削除
    const trimmedKey = apiKey.trim();

    // 各プロバイダーのパターンをチェック
    for (const [provider, pattern] of Object.entries(this.keyPatterns)) {
      // プレフィックスチェック
      if (!trimmedKey.startsWith(pattern.prefix)) {
        continue;
      }

      // カスタムバリデーターがある場合
      if (pattern.validator) {
        if (pattern.validator(trimmedKey)) {
          return {
            provider,
            name: pattern.name,
            icon: pattern.icon,
            key: trimmedKey,
            valid: true
          };
        }
        continue;
      }

      // 長さチェック
      if (pattern.length && trimmedKey.length !== pattern.length) {
        continue;
      }
      if (pattern.minLength && trimmedKey.length < pattern.minLength) {
        continue;
      }

      // 正規表現チェック
      if (pattern.regex && pattern.regex.test(trimmedKey)) {
        return {
          provider,
          name: pattern.name,
          icon: pattern.icon,
          key: trimmedKey,
          valid: true
        };
      }
    }

    // どのパターンにも一致しない場合
    return {
      provider: null,
      name: '不明なプロバイダー',
      icon: '❓',
      key: trimmedKey,
      valid: false,
      suggestion: this.getSuggestion(trimmedKey)
    };
  }

  // 推測されるプロバイダーを提案
  getSuggestion(key) {
    if (key.startsWith('sk-')) {
      if (key.length === 35 && /^sk-[a-f0-9]+$/.test(key)) {
        return 'DeepSeekのAPIキーの可能性があります';
      }
      return 'OpenAI系のAPIキーの可能性があります';
    }
    if (key.includes('xai')) {
      return 'xAI GrokのAPIキーの可能性があります（プレフィックスは "xai-" です）';
    }
    return null;
  }

  // 複数のAPIキーを一括検出
  detectMultipleKeys(text) {
    // テキストから潜在的なAPIキーを抽出
    const potentialKeys = text.match(/[A-Za-z0-9_-]{20,}/g) || [];
    const detectedKeys = [];

    for (const potentialKey of potentialKeys) {
      const result = this.detectProvider(potentialKey);
      if (result && result.valid) {
        detectedKeys.push(result);
      }
    }

    return detectedKeys;
  }

  // APIキーの形式を検証
  validateKeyFormat(provider, apiKey) {
    const pattern = this.keyPatterns[provider];
    if (!pattern) {
      return { valid: false, message: '不明なプロバイダーです' };
    }

    const trimmedKey = apiKey.trim();

    // プレフィックスチェック
    if (!trimmedKey.startsWith(pattern.prefix)) {
      return { 
        valid: false, 
        message: `APIキーは "${pattern.prefix}" で始まる必要があります` 
      };
    }

    // カスタムバリデーター
    if (pattern.validator) {
      if (!pattern.validator(trimmedKey)) {
        return { 
          valid: false, 
          message: 'APIキーの形式が正しくありません' 
        };
      }
      return { valid: true, message: '形式は正しいです' };
    }

    // 長さチェック
    if (pattern.length && trimmedKey.length !== pattern.length) {
      return { 
        valid: false, 
        message: `APIキーは${pattern.length}文字である必要があります（現在: ${trimmedKey.length}文字）` 
      };
    }

    // 正規表現チェック
    if (pattern.regex && !pattern.regex.test(trimmedKey)) {
      return { 
        valid: false, 
        message: 'APIキーの文字パターンが正しくありません' 
      };
    }

    return { valid: true, message: '形式は正しいです' };
  }
}

// グローバルに公開
window.APIKeyDetector = APIKeyDetector;