/**
 * AI広告作成支援ツール - メインアプリケーション
 * 既存のLP生成ツールの成功要素を活用した広告特化ツール
 */

// =====================================
// グローバル変数とアプリケーション状態
// =====================================

// アプリケーションの状態管理
window.adCreatorApp = {
  currentStep: 'setup',
  projectData: {},
  uploadedFiles: [],
  generatedAds: [],
  settings: {
    apiKey: '',
    creativityLevel: 'moderate',
    generationCount: 3
  },
  isGenerating: false
};

// 広告タイプの設定情報
const AD_TYPE_CONFIGS = {
  'sns-facebook': {
    name: 'Facebook広告',
    icon: '📘',
    specs: {
      imageSize: '1200x628',
      textLimit: 125,
      headlineLimit: 40,
      description: 'Facebookフィードに表示される広告'
    },
    formats: ['画像', 'カルーセル', '動画']
  },
  'youtube-ads': {
    name: 'YouTube広告',
    icon: '📺',
    specs: {
      imageSize: '1920x1080',
      textLimit: 100,
      headlineLimit: 30,
      description: 'YouTube動画広告'
    },
    formats: ['スキップ可能', 'スキップ不可', 'バンパー', 'ショート']
  },
  'banner': {
    name: 'バナー広告',
    icon: '🖼️',
    specs: {
      imageSize: '728x90',
      textLimit: 50,
      headlineLimit: 25,
      description: 'Webサイト・アプリ内バナー広告'
    },
    formats: ['レクタングル', 'リーダーボード', 'スカイスクレイパー']
  },
  'sns-twitter': {
    name: 'X広告',
    icon: '🐦',
    specs: {
      imageSize: '1200x675',
      textLimit: 280,
      headlineLimit: 50,
      description: 'Xタイムラインに表示される広告'
    },
    formats: ['プロモーション投稿', 'トレンド', 'フォロワー獲得']
  },    formats: ['レクタングル', 'スカイスクレイパー', 'リーダーボード']
  },
  'youtube-ads': {
    name: 'YouTube広告',
    icon: '📺',
    specs: {
      imageSize: '1920x1080',
      textLimit: 200,
      headlineLimit: 40,
      description: 'YouTube専用動画広告・最も効果的な動画プラットフォーム'
    },
    formats: [
      'スキップ可能なインストリーム広告',
      'スキップ不可のインストリーム広告', 
      'インフィード動画広告',
      'バンパー広告（6秒）',
      'YouTubeショート広告',
      'マストヘッド広告'
    ],
    bestPractices: {
      hookTiming: '最初の5秒で注意を引く',
      structure: '問題提起→解決策→行動喚起',
      duration: {
        'スキップ可能なインストリーム広告': '15-30秒推奨（最大制限なし）',
        'スキップ不可のインストリーム広告': '15秒または20秒（地域により30秒）',
        'バンパー広告（6秒）': '6秒以内',
        'YouTubeショート広告': '60秒未満推奨'
      },
      targeting: [
        'ユーザー属性（年齢・性別・子供の有無・世帯収入）',
        '興味・関心カテゴリ',
        '購買意向の強いセグメント',
        'カスタムアフィニティセグメント',
        'ライフイベント',
        'リマーケティング'
      ],
      goals: [
        'ブランド認知度と比較検討',
        '販売促進',
        '見込み顧客の獲得',
        'ウェブサイトのトラフィック'
      ]
    }
  },
  'sns-twitter': {
    name: 'X広告',
    icon: '🐦',
    specs: {
      imageSize: '1200x675',
      textLimit: 280,
      headlineLimit: 50,
      description: 'Xタイムラインに表示される広告'
    },
    formats: ['プロモーション投稿', 'トレンド', 'フォロワー獲得']
  }
};

// 生成中の豆知識
const GENERATION_TIPS = [
  '効果的な広告は、明確な価値提案と感情的な訴求のバランスが重要です。',
  'CTAボタンは動詞で始まり、緊急性を含む表現が効果的です。',
  'ターゲットオーディエンスの言葉を使うことで、親近感と信頼性が向上します。',
  '視覚的階層を意識したデザインは、メッセージの伝達効率を高めます。',
  'ソーシャルプルーフ（お客様の声など）は購買決定を後押しする強力な要素です。',
  'カラーパレットは、ブランドイメージと感情的な反応の両方を考慮して選択しましょう。',
  'A/Bテストを前提とした複数パターンの作成が、最適化の鍵となります。',
  'モバイルファーストを意識した読みやすいテキストサイズと配置が重要です。'
];

// YouTube広告専用の豆知識とベストプラクティス
const YOUTUBE_TIPS = [
  '【YouTube広告の黄金ルール】最初の5秒で視聴者の注意を引くフックが勝負の分かれ目です。',
  '【スキップ可能広告】5秒後にスキップされるため、冒頭で価値を明確に提示しましょう。',
  '【バンパー広告】6秒以内の短時間で記憶に残るメッセージを作成。シンプルかつインパクト重視。',
  '【YouTubeショート】縦型動画（9:16）でモバイル最適化。60秒未満が推奨です。',
  '【インフィード広告】YouTube検索・関連動画で表示。サムネイルとタイトルが重要。',
  '【視聴維持率】動画の構成：問題提起（0-5秒）→解決策（5-20秒）→行動喚起（最後5秒）',
  '【ターゲティング】購買意向の強いセグメントを活用し、検索履歴に基づく精度の高い配信。',
  '【課金方式】CPV（広告視聴単価）：30秒視聴またはアクションで課金。CPM（インプレッション単価）も選択可能。',
  '【モバイル対応】YouTube視聴の70%以上がモバイル。縦型・スクエア動画の活用を検討。',
  '【連続広告】長尺動画では2件の広告が連続表示される場合があり、視聴体験を配慮。'
];

// ================================
// 各広告プラットフォームのベストプラクティス知識ベース
// ================================

const AD_PLATFORM_EXPERTISE = {
  'sns-facebook': {
    platform: 'Facebook/Meta広告',
    bestPractices: [
      '【2025年最新】動画は15秒未満、最初の3秒で注意を引く（モバイル視聴重視）',
      '【フォーマット優先順位】縦型（9:16）＞正方形（1:1）＞横型（16:9）',
      '【ターゲティング強化】詳細ターゲティング＋Advantage+で配信最適化',
      '【広告構造理解】キャンペーン→広告セット→広告の3層構造',
      '【予算配分】7日間以上の学習期間でアルゴリズム最適化',
      '【配置戦略】Advantage+配置で全面配信（Instagram含む）',
      '【クリエイティブ多様化】画像・動画・カルーセル・コレクションを活用',
      '【モバイル最優先】視聴の90%以上がモバイル環境'
    ],
    copyTips: [
      '【心理トリガー】FOMO（見逃し恐怖）と社会的証明を活用',
      '【構成公式】問題認識→解決策提示→ベネフィット→CTA',
      '【感情訴求】ストーリーテリングで感情移入促進',
      '【ソーシャルプルーフ】レビュー・評価・利用者数を明記',
      '【緊急性創出】限定性・期間限定要素の組み込み'
    ],
    technicalSpecs: {
      videoLength: '15秒未満推奨（最大240分）',
      imageRatio: '1:1, 9:16, 16:9対応',
      textLimit: '125文字（プライマリテキスト）',
      headlineLimit: '40文字',
      campaignGoals: ['販売促進', 'リード獲得', 'トラフィック', 'ブランド認知度']
    }
  },

  'youtube-ads': {
    platform: 'YouTube広告',
    bestPractices: [
      '【5秒ルール厳守】スキップ前に価値を明確提示（スキップ可能広告）',
      '【黄金構成】問題提起（0-5秒）→解決策（5-20秒）→CTA（最後5秒）',
      '【フォーマット選択】目的別：認知度（バンパー6秒）、検討（インフィード）、行動（スキップ可能）',
      '【ショート広告】縦型9:16、60秒未満、スワイプでスキップ可能',
      '【ターゲティング強化】購買意向セグメント＋興味関心の組み合わせ',
      '【連続広告対応】長尺動画で2件連続表示時の視聴体験配慮',
      '【モバイル最適化】視聴の70%以上がモバイル、縦型・スクエア推奨',
      '【マストヘッド活用】大規模認知度向上キャンペーンで営業担当経由利用'
    ],    copyTips: [
      '【ストーリーアーク】hero\'s journeyストーリー構造',
      '【視覚的フック】最初の1秒で目を引く要素配置',
      '【問題解決型】視聴者の具体的課題→明確な解決策',
      '【数値説得】具体的データ・実績で信頼性構築',
      '【コミュニティ感】「あなたも〇〇の一員に」帰属意識訴求'
    ],
    technicalSpecs: {
      skippableAds: '15-30秒推奨（上限なし）',
      nonSkippableAds: '15秒or20秒（地域により30秒）',
      bumperAds: '6秒以内',
      shortsAds: '60秒未満推奨',
      infeedAds: '制限なし',
      targetingOptions: ['デモグラフィック', '興味関心', '購買意向', 'リマーケティング']
    }
  },

  'banner': {
    platform: 'バナー広告・ディスプレイ広告',
    bestPractices: [
      '【レスポンシブ対応】全デバイスサイズ対応必須',
      '【視線誘導】Z型・F型レイアウトで情報配置',
      '【コントラスト強化】背景との明確な差別化',
      '【ロード速度最適化】150KB以下、Progressive JPEG使用',
      '【アニメーション活用】3秒以内、3回以内のループ',
      '【ブランド統一性】一貫したカラーパレットとフォント',
      '【フォーカルポイント】1つの明確な視覚的中心',
      '【CTA最適化】ボタンサイズ・配置・色の最適化'
    ],
    copyTips: [
      '【簡潔性重視】3秒で理解できるメッセージ',
      '【数値説得】割引率・節約額・時間短縮を数値化',
      '【行動喚起】「今すぐ」「無料で」「限定」等の強いCTA',
      '【ベネフィット明確化】機能ではなく得られる価値',
      '【視認性確保】14pt以上のフォントサイズ'
    ],
    technicalSpecs: {
      standardSizes: ['728x90（リーダーボード）', '300x250（レクタングル）', '320x50（モバイルバナー）', '160x600（スカイスクレイパー）'],
      responsiveSizes: ['320x50-970x250（レスポンシブ）'],
      textLimit: '50文字',
      headlineLimit: '25文字',
      fileSize: '150KB以下推奨',
      formats: ['HTML5', 'GIF', 'JPEG', 'PNG']
    }
  },

  'sns-twitter': {
    platform: 'X（旧Twitter）広告',
    bestPractices: [
      '【会話型トーン】自然なツイート風の親しみやすい表現',
      '【リアルタイム活用】トレンド・時事ネタとの関連付け',
      '【エンゲージメント促進】リプライ・リツイート・いいねを誘発',
      '【ハッシュタグ戦略】2-3個の効果的なタグ選択',
      '【視覚的インパクト】画像・動画でタイムライン差別化',
      '【コミュニティ重視】フォロワーとの双方向コミュニケーション',
      '【簡潔性】280文字制限内での完結性',
      '【話題性創出】シェアしたくなる内容・ミーム活用'
    ],
    copyTips: [
      '【会話スターター】疑問形・意見募集で参加促進',
      '【感情訴求】共感・驚き・笑いの要素組み込み',
      '【ユーザー参加型】アンケート・クイズ・チャレンジ',
      '【タイムリー性】今話題のキーワード活用',
      '【パーソナライズ】ターゲット層の言葉・文化反映'
    ],
    technicalSpecs: {
      textLimit: '280文字',
      imageRatio: '16:9（推奨）、1:1対応',
      videoLength: '140秒以内（2分20秒）',
      hashtagLimit: '無制限（推奨2-3個）',
      campaignTypes: ['プロモツイート', 'フォロワー獲得', 'ウェブサイトクリック', 'アプリインストール']
    }
  }
};

// ================================
// AI プロンプト生成エンジン
// ================================

class AdPromptGenerator {
  constructor() {
    this.aiService = new AIService();
  }
  /**
   * 広告タイプに特化したプロンプトを生成（2025年最新ベストプラクティス適用）
   */
  generateOptimizedPrompt(adType, projectData) {
    const expertise = AD_PLATFORM_EXPERTISE[adType];
    if (!expertise) {
      throw new Error(`Unknown ad type: ${adType}`);
    }

    const basePrompt = `
# ${expertise.platform} 広告作成の専門指令 - 2025年最新版

あなたは${expertise.platform}の広告作成において日本でトップクラスの専門家です。
以下の2025年最新ベストプラクティスと技術仕様を厳密に守り、高いコンバージョン率を実現する広告を作成してください。

## 【2025年最新】プラットフォーム専門知識
${expertise.bestPractices.map(tip => `🎯 ${tip}`).join('\n')}

## コピーライティング戦略（心理学・行動経済学ベース）
${expertise.copyTips.map(tip => `✍️ ${tip}`).join('\n')}

## 技術仕様（必須遵守）
${Object.entries(expertise.technicalSpecs).map(([key, value]) => 
  `📋 ${key}: ${Array.isArray(value) ? value.join(', ') : value}`
).join('\n')}

## クライアント情報
- 商品/サービス: ${projectData.productName || '未指定'}
- 業界: ${projectData.industry || '未指定'}
- ターゲット: ${projectData.ageTarget || '未指定'} / ${projectData.genderTarget || '未指定'}
- 価格帯: ${projectData.priceRange || '未指定'}
- 主要特徴: ${projectData.keyFeatures || '未指定'}
- キャンペーン目標: ${projectData.campaignGoal || '未指定'}
- 顧客の課題・ニーズ: ${projectData.customerPain || '未指定'}
- 予算: ${projectData.budget || '未指定'}
- 興味・関心: ${projectData.interests || '未指定'}

## ${expertise.platform}専用出力フォーマット
以下の構造で${expertise.platform}に最適化された高品質な広告を3パターン作成してください：

### パターン1: [感情訴求アプローチ]
**メインコピー**: [技術仕様内文字数、感情に響く表現]
**サブコピー**: [補足説明、ベネフィット強調]
**CTA**: [行動喚起、緊急性含む]
**ターゲット心理**: [想定される心理状態と訴求ポイント]
**視覚的要素**: [推奨画像/動画の説明]
**配信戦略**: [最適な配信タイミング・ターゲティング]
**成功要因**: [なぜこのアプローチが効果的なのか]

### パターン2: [論理的訴求アプローチ]
**メインコピー**: [データ・根拠に基づく表現]
**サブコピー**: [論理的説明、証拠提示]
**CTA**: [明確で具体的な行動指示]
**ターゲット心理**: [理性的判断を促すポイント]
**視覚的要素**: [信頼性を示すデザイン要素]
**配信戦略**: [意思決定プロセスに最適なタイミング]
**成功要因**: [論理的アプローチの強み]

### パターン3: [ソーシャルプルーフアプローチ]
**メインコピー**: [社会的証明を活用した表現]
**サブコピー**: [口コミ・実績・評価の活用]
**CTA**: [コミュニティ参加を促す表現]
**ターゲット心理**: [同調心理・帰属意識]
**視覚的要素**: [ユーザー生成コンテンツ活用]
**配信戦略**: [コミュニティ効果を最大化する配信]
**成功要因**: [社会的証明が持つ説得力]

## A/Bテスト最適化計画
- **テスト変数**: [どの要素をテストするか]
- **成功指標**: [CTR、CVR、エンゲージメント等]
- **改善提案**: [パフォーマンス向上のための具体的施策]

## 2025年トレンド対応
- **最新技術活用**: [AI・AR・VR等の新技術対応]
- **プライバシー対応**: [Cookie規制等への配慮]
- **サステナビリティ**: [環境・社会配慮の訴求]

必ず${expertise.platform}の最新アルゴリズムと配信特性を考慮し、実際の運用で高いパフォーマンスを発揮できる広告を作成してください。
`;

    return basePrompt;
  }
  /**
   * Grok3 に広告作成を指令（最新ノウハウ適用版）
   */
  async generateAdsWithGrok(adType, projectData) {
    try {
      const prompt = this.generateOptimizedPrompt(adType, projectData);
      console.log('🤖 Grok3に ' + AD_PLATFORM_EXPERTISE[adType].platform + ' 専用プロンプト送信中...');
      
      // プロンプトの詳細をコンソールでデバッグ
      console.log('📝 生成されたプロンプト（最初の500文字）:', prompt.substring(0, 500) + '...');
      
      const response = await this.aiService.callGrok(prompt, {
        maxTokens: 4000,
        temperature: 0.8,
        model: 'grok-3-latest'
      });

      console.log('✅ Grok3レスポンス受信:', response?.substring(0, 200) + '...');

      return {
        success: true,
        adType: adType,
        platform: AD_PLATFORM_EXPERTISE[adType].platform,
        content: response,
        generatedAt: new Date().toISOString(),
        prompt: prompt.substring(0, 200) + '...', // デバッグ用
        rawResponse: response
      };

    } catch (error) {
      console.error('❌ Grok3広告生成エラー:', error);
      return {
        success: false,
        error: error.message,
        adType: adType,
        errorDetails: error.details || null
      };
    }
  }

  /**
   * 複数パターンの広告を同時生成
   */
  async generateMultipleAds(adType, projectData, count = 3) {
    const promises = [];
    
    for (let i = 0; i < count; i++) {
      const enhancedData = {
        ...projectData,
        variationFocus: i === 0 ? 'ベネフィット重視' : 
                       i === 1 ? '感情訴求重視' : 
                       '行動喚起重視'
      };
      
      promises.push(this.generateAdsWithGrok(adType, enhancedData));
    }

    return await Promise.all(promises);
  }
}

// グローバルに登録
window.AdPromptGenerator = AdPromptGenerator;

// =====================================
// 初期化とイベントリスナー
// =====================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🎨 AI広告作成支援ツールを初期化中...');
    // グローバル関数をwindowオブジェクトに明示的に登録
  window.showGallery = showGallery;
  window.closeGallery = closeGallery;
  window.toggleSettings = toggleSettings;
  window.closeSettings = closeSettings;
  window.saveSettings = saveSettings;
  window.toggleApiKeyVisibility = toggleApiKeyVisibility;
  window.selectAdType = selectAdType;
  window.updateYouTubeFormatInfo = updateYouTubeFormatInfo;
  window.proceedToContentInput = proceedToContentInput;
  window.proceedToGeneration = proceedToGeneration;
  window.goBackToSetup = goBackToSetup;
  
  // イベントリスナーの設定
  setupEventListeners();
  
  // 設定を読み込み
  loadSettings();
  
  // ファイルドロップ機能の初期化
  initFileDropZone();
  
  console.log('✅ 初期化完了 - グローバル関数も登録完了');
  console.log('📋 利用可能な関数:', ['showGallery', 'toggleSettings', 'selectAdType']);
});

function setupEventListeners() {
  // ファイル入力の変更
  const fileInput = document.getElementById('adFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }
  
  // ウィンドウクリックで設定パネルを閉じる
  window.addEventListener('click', function(event) {
    const settingsPanel = document.getElementById('adSettingsPanel');
    if (event.target === settingsPanel) {
      toggleSettings();
    }
  });
  
  // ウィンドウクリックでギャラリーを閉じる
  window.addEventListener('click', function(event) {
    const galleryModal = document.getElementById('galleryModal');
    if (event.target === galleryModal) {
      closeGallery();
    }
  });
}

// =====================================
// ファイル操作とアップロード
// =====================================

function initFileDropZone() {
  const dropZone = document.getElementById('adDropZone');
  if (!dropZone) return;
  
  // ドラッグオーバー
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  
  // ドラッグリーブ
  dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });
  
  // ドロップ
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  handleFiles(files);
}

function handleFiles(files) {
  console.log('📁 ファイルを処理中:', files.length, '個のファイル');
  
  files.forEach(file => {
    if (isValidFile(file)) {
      processFile(file);
    } else {
      showNotification(`❌ サポートされていないファイル形式: ${file.name}`, 'error');
    }
  });
}

function isValidFile(file) {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'text/plain'
  ];
  
  return validTypes.includes(file.type) || validTypes.some(type => 
    file.name.toLowerCase().endsWith(type.split('/')[1])
  );
}

function processFile(file) {
  const fileData = {
    id: Date.now() + Math.random(),
    name: file.name,
    size: file.size,
    type: file.type,
    file: file,
    status: 'uploaded',
    uploadTime: new Date()
  };
  
  window.adCreatorApp.uploadedFiles.push(fileData);
  updateFileList();
  
  showNotification(`✅ ${file.name} をアップロードしました`, 'success');
}

function updateFileList() {
  const fileList = document.getElementById('adFileList');
  if (!fileList) return;
  
  fileList.innerHTML = '';
  
  window.adCreatorApp.uploadedFiles.forEach(fileData => {
    const fileItem = createFileItem(fileData);
    fileList.appendChild(fileItem);
  });
}

function createFileItem(fileData) {
  const item = document.createElement('div');
  item.className = 'file-item';
  
  const fileIcon = getFileIcon(fileData.type);
  const fileSize = formatFileSize(fileData.size);
  
  item.innerHTML = `
    <div class="file-info">
      <div class="file-icon">${fileIcon}</div>
      <div class="file-details">
        <h5>${fileData.name}</h5>
        <p>${fileSize}</p>
      </div>
    </div>
    <div class="file-actions">
      <button class="btn-icon" onclick="previewFile('${fileData.id}')" title="プレビュー">
        👁️
      </button>
      <button class="btn-icon" onclick="removeFile('${fileData.id}')" title="削除">
        🗑️
      </button>
    </div>
  `;
  
  return item;
}

function getFileIcon(type) {
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎬';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
  return '📁';
}

function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function removeFile(fileId) {
  window.adCreatorApp.uploadedFiles = window.adCreatorApp.uploadedFiles.filter(
    file => file.id !== fileId
  );
  updateFileList();
  showNotification('🗑️ ファイルを削除しました', 'info');
}

function previewFile(fileId) {
  const fileData = window.adCreatorApp.uploadedFiles.find(f => f.id === fileId);
  if (!fileData) return;
  
  showNotification(`👁️ ${fileData.name} のプレビュー機能は準備中です`, 'info');
}

// =====================================
// プロジェクト設定とナビゲーション
// =====================================

function selectAdType(button) {
  // 既存の選択をクリア
  document.querySelectorAll('.ad-type-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // 新しい選択をマーク
  button.classList.add('selected');
  
  const adType = button.getAttribute('data-type');
  window.adCreatorApp.projectData.adType = adType;
  
  // YouTube広告専用設定の表示/非表示
  const youtubeSettings = document.getElementById('youtubeAdSettings');
  if (adType === 'youtube-ads') {
    youtubeSettings.style.display = 'block';
    // 初期フォーマット情報を設定
    updateYouTubeFormatInfo('スキップ可能なインストリーム広告');
  } else {
    youtubeSettings.style.display = 'none';
  }
  
  // 選択されたタイプの詳細を表示
  showAdTypeDetails(adType);
  
  console.log('📱 広告タイプを選択:', AD_TYPE_CONFIGS[adType].name);
}

function showAdTypeDetails(adType) {
  const config = AD_TYPE_CONFIGS[adType];
  if (!config) return;
  
  // 選択フィードバックを表示
  showNotification(`${config.icon} ${config.name} を選択しました`, 'success');
}

function proceedToContentInput() {
  // 必須項目のチェック
  if (!validateSetupForm()) {
    return;
  }
  
  // プロジェクトデータを収集
  collectProjectData();
  
  // 次のステップに進む
  showSection('contentInputSection');
  window.adCreatorApp.currentStep = 'content';
  
  console.log('📝 コンテンツ入力段階に進行');
}

function validateSetupForm() {
  const requiredFields = [
    { id: 'productName', name: '商品・サービス名' },
    { id: 'industry', name: '業界・カテゴリ' },
    { id: 'ageTarget', name: '年齢層' },
    { id: 'campaignGoal', name: 'キャンペーン目標' }
  ];
  
  const missingFields = [];
  
  requiredFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (!element || !element.value.trim()) {
      missingFields.push(field.name);
    }
  });
  
  if (!window.adCreatorApp.projectData.adType) {
    missingFields.push('広告タイプ');
  }
  
  if (missingFields.length > 0) {
    showNotification(`❌ 以下の項目を入力してください: ${missingFields.join(', ')}`, 'error');
    return false;
  }
  
  return true;
}

function collectProjectData() {
  const data = window.adCreatorApp.projectData;
  
  // 基本情報
  data.productName = document.getElementById('productName').value.trim();
  data.industry = document.getElementById('industry').value;
  data.keyFeatures = document.getElementById('keyFeatures').value.trim();
  data.priceRange = document.getElementById('priceRange').value.trim();
  
  // ターゲット情報
  data.ageTarget = document.getElementById('ageTarget').value;
  data.genderTarget = document.getElementById('genderTarget').value;
  data.interests = document.getElementById('interests').value.trim();
  data.customerPain = document.getElementById('customerPain').value.trim();
  
  // キャンペーン情報
  data.campaignGoal = document.getElementById('campaignGoal').value;
  data.budget = document.getElementById('budget').value;
  data.competitors = document.getElementById('competitors').value.trim();
  
  // YouTube広告固有のデータ
  if (data.adType === 'youtube-ads') {
    const youtubeFormatElement = document.getElementById('youtubeAdFormat');
    const videoOrientationElement = document.getElementById('videoOrientation');
    const youtubeCampaignGoalElement = document.getElementById('youtubeCampaignGoal');
    const keyAppealPointsElement = document.getElementById('keyAppealPoints');
    
    if (youtubeFormatElement) data.adFormat = youtubeFormatElement.value;
    if (videoOrientationElement) data.videoOrientation = videoOrientationElement.value;
    if (youtubeCampaignGoalElement) data.youtubeCampaignGoal = youtubeCampaignGoalElement.value;
    if (keyAppealPointsElement) data.keyAppealPoints = keyAppealPointsElement.value.trim();
  }
  
  console.log('📊 プロジェクトデータを収集:', data);
}

function goBackToSetup() {
  showSection('projectSetupSection');
  window.adCreatorApp.currentStep = 'setup';
}

function proceedToGeneration() {
  // 追加コンテンツを収集
  collectAdditionalContent();
  
  // 生成を開始
  startAdGeneration();
}

function collectAdditionalContent() {
  const data = window.adCreatorApp.projectData;
  
  data.brandMessage = document.getElementById('brandMessage').value.trim();
  data.keywords = document.getElementById('keywords').value.trim();
  data.ngWords = document.getElementById('ngWords').value.trim();
  data.references = document.getElementById('references').value.trim();
  data.additionalRequests = document.getElementById('additionalRequests').value.trim();
  
  console.log('✍️ 追加コンテンツを収集完了');
}

// ================================
// AI広告生成プロセス
// ================================

async function startAdGeneration() {
  console.log('🚀 AI広告生成を開始');
  
  // APIキーチェック
  if (!window.adCreatorApp.settings.apiKey) {
    showNotification('❌ APIキーが設定されていません。設定パネルから設定してください。', 'error');
    toggleSettings();
    return;
  }
  
  // 生成中状態に設定
  window.adCreatorApp.isGenerating = true;
  showSection('generationSection');
  window.adCreatorApp.currentStep = 'generating';
  
  try {
    // 生成ステップを実行
    await executeGenerationSteps();
    
    // 結果を表示
    showGenerationResults();
    
  } catch (error) {
    console.error('❌ 広告生成エラー:', error);
    showNotification('❌ 広告生成中にエラーが発生しました。もう一度お試しください。', 'error');
    goBackToSetup();
  } finally {
    window.adCreatorApp.isGenerating = false;
  }
}

async function executeGenerationSteps() {
  const steps = [
    { id: 'step1', name: 'データ分析', duration: 2000 },
    { id: 'step2', name: 'コピー生成', duration: 5000 },
    { id: 'step3', name: 'デザイン設計', duration: 3000 },
    { id: 'step4', name: 'バリエーション生成', duration: 4000 }
  ];
  
  let progress = 0;
  const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // ステップをアクティブに
    updateStepStatus(step.id, 'active');
    updateProgress(progress, step.name);
    
    // 豆知識を表示
    showRandomTip();
    
    // ステップ処理を実行
    await new Promise(resolve => {
      setTimeout(() => {
        progress += (step.duration / totalDuration) * 100;
        updateProgress(progress, step.name + ' 完了');
        updateStepStatus(step.id, 'completed');
        resolve();
      }, step.duration);
    });
  }
  
  // 実際のAI生成を実行
  await generateAdsWithAI();
}

function updateStepStatus(stepId, status) {
  const step = document.getElementById(stepId);
  if (!step) return;
  
  step.classList.remove('active', 'completed');
  step.classList.add(status);
}

function updateProgress(percentage, text) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (progressFill) {
    progressFill.style.width = `${Math.min(percentage, 100)}%`;
  }
  
  if (progressText) {
    progressText.textContent = text;
  }
}

function showRandomTip() {
  const tipElement = document.getElementById('generationTip');
  if (!tipElement) return;
  
  // YouTube広告が選択されている場合は専用TIPSを使用
  const isYouTubeAd = window.adCreatorApp.projectData.adType === 'youtube-ads';
  const tipsArray = isYouTubeAd ? YOUTUBE_TIPS : GENERATION_TIPS;
  
  const randomTip = tipsArray[Math.floor(Math.random() * tipsArray.length)];
  tipElement.textContent = randomTip;
}

async function generateAdsWithAI() {
  console.log('🧠 Grok3による広告生成を実行');
  
  try {
    const generator = new AdPromptGenerator();
    const currentAdType = window.adCreatorApp.projectData.adType;
    const projectData = window.adCreatorApp.projectData;
    
    console.log('📊 生成パラメータ:', {
      adType: currentAdType,
      platform: AD_PLATFORM_EXPERTISE[currentAdType]?.platform,
      productName: projectData.productName
    });
    
    // Grok3で実際に広告を生成
    const results = await generator.generateMultipleAds(currentAdType, projectData, 3);
    
    // 結果をフィルタリング
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    if (failedResults.length > 0) {
      console.warn('⚠️ 一部の広告生成が失敗:', failedResults.map(r => r.error));
    }
    
    if (successfulResults.length === 0) {
      throw new Error('すべての広告生成が失敗しました。APIキーまたはネットワーク接続を確認してください。');
    }
    
    // 生成された広告を保存
    window.adCreatorApp.generatedAds = successfulResults;
    
    console.log('✅ Grok3による広告生成完了:', successfulResults.length, '個の広告');
    console.log('📝 生成された広告プレビュー:', 
      successfulResults.map(r => ({
        platform: r.platform,
        contentLength: r.content?.length || 0,
        success: r.success
      }))
    );
    
  } catch (error) {
    console.error('❌ Grok3広告生成エラー:', error);
    
    // フォールバック: デモ用ダミーデータ
    console.log('🔄 フォールバック: デモ用ダミーデータを使用');
    const isYouTubeAd = window.adCreatorApp.projectData.adType === 'youtube-ads';
    
    if (isYouTubeAd) {
      window.adCreatorApp.generatedAds = generateDummyYouTubeAds();
    } else {
      window.adCreatorApp.generatedAds = generateDummyStandardAds();
    }
    
    // デモモードの通知
    showNotification(
      '⚠️ Grok3との接続でエラーが発生しました。デモ用サンプルを表示しています。実際の使用にはAPIキーの設定が必要です。', 
      'warning'
    );
    
    throw error; // エラーを再スロー（上位でキャッチされる）
  }
}

// テスト用ダミーYouTube広告データ生成
function generateDummyYouTubeAds() {
  const productName = window.adCreatorApp.projectData.productName || 'あなたの商品';
  const adFormat = window.adCreatorApp.projectData.adFormat || 'スキップ可能なインストリーム広告';
  
  return [
    {
      id: 'yt_ad_1',
      title: '感情訴求パターン - ' + productName,
      format: adFormat,
      duration: '30秒',
      script: {
        hook: `【衝撃】99%の人が知らない${productName}の真実...`,
        problem: `毎日の${window.adCreatorApp.projectData.customerPain || '悩み'}、もう我慢しなくていいんです`,
        solution: `${productName}があなたの生活を劇的に変える3つの理由をお見せします`,
        proof: '実際のユーザー様からの驚きの声をご覧ください',
        cta: `今すぐ${productName}で新しい生活を始めよう！`
      },
      visualElements: {
        openingShot: '日常の困った状況から始まる印象的なオープニング',
        keyVisuals: ['商品の魅力的な映像', 'ユーザーの笑顔', 'ビフォーアフター比較'],
        textOverlays: ['限定特価', '今だけ無料お試し'],
        transitions: 'スムーズなカットとズーム効果',
        closingShot: 'CTA付きの商品クローズアップ'
      },
      audioElements: {
        narration: '親しみやすく信頼感のあるナレーション',
        musicStyle: 'アップビートで前向きなBGM',
        soundEffects: ['効果的な通知音', 'ページめくり音'],
        pacing: 'テンポ良く、最後に間を作ってCTAを強調'
      },
      targeting: {
        demographics: `${window.adCreatorApp.projectData.ageTarget || '全年齢'}・${window.adCreatorApp.projectData.genderTarget || '全性別'}`,
        interests: ['健康・ウェルネス', 'ライフスタイル改善', '便利グッズ'],
        behaviors: ['オンラインショッピング', '健康関連検索', 'レビュー重視'],
        placements: ['YouTube動画', 'YouTube検索', '関連動画'],
        devices: ['スマートフォン', 'PC', 'タブレット']
      },
      performance: {
        viewRateEstimate: '78%',
        completionRateEstimate: '45%',
        ctrEstimate: '3.2%',
        conversionEstimate: '2.1%',
        optimizationTips: ['最初の3秒をより印象的に', 'CTAのタイミング調整']
      }
    },
    {
      id: 'yt_ad_2',
      title: '論理訴求パターン - ' + productName,
      format: adFormat,
      duration: '30秒',
      script: {
        hook: `なぜ${productName}が選ばれ続けるのか？データで証明します`,
        problem: `従来の方法では解決できない${window.adCreatorApp.projectData.customerPain || '課題'}`,
        solution: `科学的根拠に基づいた${productName}の革新的アプローチ`,
        proof: '第三者機関による効果検証データと満足度97%の実績',
        cta: `まずは無料で${productName}の効果を体験してください`
      },
      visualElements: {
        openingShot: 'データとグラフを使った科学的なオープニング',
        keyVisuals: ['統計データ', '比較チャート', '専門家の証言'],
        textOverlays: ['満足度97%', '科学的証明済み'],
        transitions: 'データ重視のスライド効果',
        closingShot: '信頼性を示すロゴと認証マーク付きCTA'
      },
      audioElements: {
        narration: '専門的で信頼性の高いトーン',
        musicStyle: '落ち着いた知的なBGM',
        soundEffects: ['データ表示音', '成功音'],
        pacing: '情報をしっかり伝える安定したペース'
      },
      targeting: {
        demographics: `${window.adCreatorApp.projectData.ageTarget || '全年齢'}・研究志向`,
        interests: ['科学・技術', 'データ分析', '品質重視'],
        behaviors: ['詳細調査', '比較検討', '専門サイト閲覧'],
        placements: ['YouTube動画', 'YouTube検索', '関連動画'],
        devices: ['PC', 'タブレット', 'スマートフォン']
      },
      performance: {
        viewRateEstimate: '72%',
        completionRateEstimate: '52%',
        ctrEstimate: '2.8%',
        conversionEstimate: '3.1%',
        optimizationTips: ['データの見せ方をより分かりやすく', 'エビデンス強化']
      }
    },
    {
      id: 'yt_ad_3',
      title: 'ソーシャルプルーフパターン - ' + productName,
      format: adFormat,
      duration: '30秒',
      script: {
        hook: `「${productName}で人生変わりました」実際のユーザーの声`,
        problem: `あなたと同じ悩みを抱えていた○○さん（30代女性）の体験談`,
        solution: `${productName}を始めてからの劇的な変化をご覧ください`,
        proof: '同じような体験をされた方々の声を複数紹介',
        cta: `あなたも今すぐ${productName}で変化を実感してください`
      },
      visualElements: {
        openingShot: 'リアルなユーザーの証言から始まる',
        keyVisuals: ['実際のユーザー映像', 'ビフォーアフター', '喜びの表情'],
        textOverlays: ['実際のお客様の声', '満足度99%'],
        transitions: 'ユーザーストーリーに沿った自然な流れ',
        closingShot: 'コミュニティ感のあるグループ映像とCTA'
      },
      audioElements: {
        narration: 'ユーザーの生の声とナレーションの組み合わせ',
        musicStyle: '温かみのある感動的なBGM',
        soundEffects: ['拍手音', '歓声'],
        pacing: '感情に寄り添うゆったりとしたペース'
      },
      targeting: {
        demographics: `${window.adCreatorApp.projectData.ageTarget || '全年齢'}・共感重視`,
        interests: ['コミュニティ', '口コミ重視', '体験談'],
        behaviors: ['レビュー閲覧', 'SNS活用', '口コミ検索'],
        placements: ['YouTube動画', 'YouTube検索', '関連動画'],
        devices: ['スマートフォン', 'タブレット', 'PC']
      },
      performance: {
        viewRateEstimate: '81%',
        completionRateEstimate: '48%',
        ctrEstimate: '3.5%',
        conversionEstimate: '2.8%',
        optimizationTips: ['より多様なユーザー層の声を追加', '証言の信頼性向上']
      }
    }
  ];
}

// テスト用ダミー標準広告データ生成
function generateDummyStandardAds() {
  const productName = window.adCreatorApp.projectData.productName || 'あなたの商品';
  
  return [
    {
      id: 'ad_1',
      title: '広告パターン1 - 感情訴求',
      headline: `${productName}で新しい毎日を`,
      body: `${window.adCreatorApp.projectData.customerPain || 'あなたの悩み'}を解決する革新的なソリューション。今すぐ体験してください。`,
      cta: '今すぐ始める',
      design: {
        layout: 'シンプルで読みやすいレイアウト',
        colors: ['#007bff', '#ffffff'],
        typography: 'モダンで親しみやすいフォント',
        elements: ['商品画像', 'ベネフィット文言', 'CTAボタン']
      },
      targeting: {
        demographics: `${window.adCreatorApp.projectData.ageTarget || '全年齢層'}`,
        interests: ['ライフスタイル', '便利グッズ'],
        behaviors: ['オンラインショッピング', '情報収集']
      },
      performance: {
        ctrEstimate: '2.8%',
        conversionEstimate: '3.2%',
        notes: '感情に訴えかけることで高いエンゲージメントが期待できます'
      }
    },
    {
      id: 'ad_2',
      title: '広告パターン2 - 論理訴求',
      headline: `データで証明：${productName}の効果`,
      body: `科学的根拠に基づいた${productName}。満足度97%の実績があなたの判断をサポートします。`,
      cta: '詳細を確認',
      design: {
        layout: 'データと統計を重視したレイアウト',
        colors: ['#28a745', '#ffffff'],
        typography: '信頼感のある堅実なフォント',
        elements: ['統計データ', 'グラフ', '証明書']
      },
      targeting: {
        demographics: `${window.adCreatorApp.projectData.ageTarget || '全年齢層'}・データ重視層`,
        interests: ['研究', 'データ分析', '品質'],
        behaviors: ['比較検討', '詳細調査']
      },
      performance: {
        ctrEstimate: '2.3%',
        conversionEstimate: '4.1%',
        notes: '論理的アプローチにより高いコンバージョン率が期待できます'
      }
    }
  ];
}

function createAdGenerationPrompt() {
  const data = window.adCreatorApp.projectData;
  const adConfig = AD_TYPE_CONFIGS[data.adType];
  const fileContent = getFileContentSummary();
  
  // YouTube広告専用プロンプト
  if (data.adType === 'youtube-ads') {
    return createYouTubeAdPrompt(data, adConfig, fileContent);
  }
  
  return `あなたは世界トップクラスの広告クリエイティブディレクターです。以下の情報に基づいて、${adConfig.name}用の効果的な広告を複数パターン作成してください。

【商品・サービス情報】
- 商品名: ${data.productName}
- 業界: ${data.industry}
- 主要特徴: ${data.keyFeatures || 'なし'}
- 価格帯: ${data.priceRange || 'なし'}

【ターゲット情報】
- 年齢層: ${data.ageTarget}
- 性別: ${data.genderTarget}
- 興味・関心: ${data.interests || 'なし'}
- 課題・ニーズ: ${data.customerPain || 'なし'}

【キャンペーン情報】
- 目標: ${data.campaignGoal}
- 予算: ${data.budget || 'なし'}
- 競合: ${data.competitors || 'なし'}

【ブランド情報】
- メッセージ: ${data.brandMessage || 'なし'}
- キーワード: ${data.keywords || 'なし'}
- NGワード: ${data.ngWords || 'なし'}
- 参考: ${data.references || 'なし'}

【技術仕様】
- 広告タイプ: ${adConfig.name}
- 画像サイズ: ${adConfig.specs.imageSize}
- テキスト制限: ${adConfig.specs.textLimit}文字
- ヘッドライン制限: ${adConfig.specs.headlineLimit}文字

【追加要望】
${data.additionalRequests || 'なし'}

${fileContent ? `【アップロード資料概要】\n${fileContent}` : ''}

以下の形式でJSON応答してください：

{
  "ads": [
    {
      "id": "ad_1",
      "title": "広告パターン1",
      "headline": "魅力的なヘッドライン",
      "body": "広告本文テキスト",
      "cta": "行動を促すCTA",
      "design": {
        "layout": "レイアウト説明",
        "colors": ["#色コード1", "#色コード2"],
        "typography": "フォント推奨",
        "elements": ["要素1", "要素2"]
      },
      "targeting": {
        "demographics": "ターゲット詳細",
        "interests": ["興味1", "興味2"],
        "behaviors": ["行動1", "行動2"]
      },
      "performance": {
        "ctrEstimate": "予想CTR",
        "conversionEstimate": "予想CVR",
        "notes": "パフォーマンス予測"
      }
    }
  ],
  "strategy": {
    "overview": "戦略概要",
    "keyMessages": ["メッセージ1", "メッセージ2"],
    "differentiators": ["差別化ポイント1", "ポイント2"],
    "testRecommendations": ["テスト推奨1", "推奨2"]
  }
}

${window.adCreatorApp.settings.generationCount}パターンの広告を生成してください。各パターンは異なるアプローチ（感情訴求、論理訴求、信頼性重視など）で作成し、A/Bテストに適した多様性を持たせてください。`;
}

// YouTube広告専用プロンプト生成関数
function createYouTubeAdPrompt(data, adConfig, fileContent) {
  const selectedFormat = data.adFormat || 'スキップ可能なインストリーム広告';
  const formatSpecs = adConfig.bestPractices.duration[selectedFormat] || '30秒推奨';
  
  return `あなたは世界最高峰のYouTube広告専門クリエイティブディレクターです。Googleの公式ガイドラインとYouTube広告のベストプラクティスに基づいて、${selectedFormat}の効果的な動画広告を作成してください。

【重要：YouTube広告の成功法則】
★ 最初の5秒が勝負：スキップされる前に価値を明確に提示
★ 構成の黄金律：問題提起（0-5秒）→解決策（5-20秒）→行動喚起（最後5秒）
★ 視聴維持率向上：ストーリーテリングと感情的フック活用
★ モバイル最適化：70%以上がモバイル視聴、字幕・視覚的要素重視

【商品・サービス情報】
- 商品名: ${data.productName}
- 業界: ${data.industry}
- 主要特徴: ${data.keyFeatures || 'なし'}
- 価格帯: ${data.priceRange || 'なし'}
- 独自価値提案(USP): ${data.usp || '商品の強みから抽出'}

【YouTube広告仕様】
- 広告フォーマット: ${selectedFormat}
- 推奨時間: ${formatSpecs}
- 動画アスペクト比: 16:9（横型）または 9:16（ショート・縦型）
- 音声: 有り/無しの両対応設計

【ターゲティング戦略】
- 年齢層: ${data.ageTarget}
- 性別: ${data.genderTarget}
- 興味・関心: ${data.interests || 'なし'}
- 購買意向: ${data.purchaseIntent || '高・中・低から判定'}
- 視聴行動: ${data.viewingBehavior || 'YouTube利用パターン分析'}

【キャンペーン目標】
- 主目標: ${data.campaignGoal}
- 二次目標: ${data.secondaryGoal || 'ブランド認知・コンバージョン・エンゲージメント'}
- 予算: ${data.budget || 'なし'}
- 課金方式: CPV（広告視聴単価）またはCPM（インプレッション単価）

【競合分析】
- 主要競合: ${data.competitors || 'なし'}
- 差別化戦略: ${data.differentiation || '独自の強みを活かした差別化'}

【ブランド・メッセージ】
- 核となるメッセージ: ${data.brandMessage || 'なし'}
- キーワード: ${data.keywords || 'なし'}
- 避けるべき表現: ${data.ngWords || 'なし'}
- トーン&マナー: ${data.toneManner || 'ブランドに適したトーン設定'}

【技術・制作要件】
${fileContent ? `【参考資料】\n${fileContent}` : ''}

以下のYouTube広告専用JSON形式で応答してください：

{
  "youtubeAds": [
    {
      "id": "yt_ad_1",
      "title": "YouTube広告パターン1",
      "format": "${selectedFormat}",
      "duration": "${formatSpecs}",
      "script": {
        "hook": "【0-5秒】視聴者の注意を引くフック",
        "problem": "【5-10秒】ターゲットの課題・問題提起",
        "solution": "【10-20秒】商品・サービスによる解決策",
        "proof": "【20-25秒】信頼性・証拠・ソーシャルプルーフ",
        "cta": "【最後5秒】明確な行動喚起"
      },
      "visualElements": {
        "openingShot": "冒頭の映像アイデア",
        "keyVisuals": ["重要な視覚要素1", "要素2", "要素3"],
        "textOverlays": ["画面テキスト1", "テキスト2"],
        "transitions": "場面転換の手法",
        "closingShot": "エンディング映像"
      },
      "audioElements": {
        "narration": "ナレーション原稿",
        "musicStyle": "BGM・音楽スタイル",
        "soundEffects": ["効果音1", "効果音2"],
        "pacing": "テンポ・リズム設計"
      },
      "targeting": {
        "demographics": "詳細なユーザー属性",
        "interests": ["詳細な興味カテゴリ1", "カテゴリ2"],
        "behaviors": ["購買行動パターン1", "パターン2"],
        "placements": ["YouTube動画", "YouTube検索", "関連動画"],
        "devices": ["スマートフォン", "PC", "TV画面"]
      },
      "performance": {
        "viewRateEstimate": "視聴率予測(%)",
        "completionRateEstimate": "完視聴率予測(%)",
        "ctrEstimate": "クリック率予測(%)",
        "conversionEstimate": "コンバージョン率予測(%)",
        "optimizationTips": ["最適化のコツ1", "コツ2"]
      }
    }
  ],
  "youtubeStrategy": {
    "overview": "YouTube広告戦略の全体概要",
    "contentPillars": ["コンテンツの柱1", "柱2", "柱3"],
    "sequencing": "広告配信の順序・タイミング戦略",
    "budgetAllocation": "予算配分の推奨",
    "measurementPlan": "効果測定・分析計画",
    "abTestPlan": {
      "variables": ["テスト変数1", "変数2"],
      "success_metrics": ["成功指標1", "指標2"],
      "timeline": "テスト期間の推奨"
    },
    "optimization": {
      "shortTerm": ["短期最適化施策1", "施策2"],
      "longTerm": ["長期戦略1", "戦略2"]
    }
  },
  "youtubeInsights": {
    "platformBenefits": "YouTubeならではの利点",
    "audienceBehavior": "ターゲットオーディエンスのYouTube利用特性",
    "bestTimes": "最適な配信時間帯",
    "seasonality": "季節性・タイミング要因",
    "competitorAnalysis": "競合のYouTube広告分析結果"
  }
}

${window.adCreatorApp.settings.generationCount}パターンの多様なYouTube広告を生成してください。各パターンは異なるアプローチ（感情訴求・論理訴求・社会的証明・緊急性・ストーリーテリング等）で最初の5秒のフックを変化させ、A/Bテスト最適化を前提とした戦略的な多様性を持たせてください。`;
}

// YouTube広告フォーマット詳細情報を更新
function updateYouTubeFormatInfo(selectedFormat) {
  const formatDetails = document.getElementById('youtubeFormatDetails');
  if (!formatDetails) return;
  
  const formatInfoMap = {
    'スキップ可能なインストリーム広告': {
      title: '📊 スキップ可能なインストリーム広告',
      features: [
        '<strong>特徴:</strong> 5秒後にスキップ可能、最も一般的で効果的',
        '<strong>時間:</strong> 制限なし（15-30秒推奨、3分未満が理想）',
        '<strong>課金:</strong> 30秒視聴またはアクションで課金（CPV制）',
        '<strong>適用:</strong> ブランド認知、販売促進、リード獲得、トラフィック',
        '<strong>成功のコツ:</strong> 最初の5秒でフックを作り、価値を明確に提示'
      ]
    },
    'スキップ不可のインストリーム広告': {
      title: '⏱️ スキップ不可のインストリーム広告',
      features: [
        '<strong>特徴:</strong> 最後まで視聴必須、確実にメッセージ全体を伝達',
        '<strong>時間:</strong> 15秒または20秒（地域により30秒）',
        '<strong>課金:</strong> インプレッション単価制（CPM）',
        '<strong>適用:</strong> ブランド認知度と比較検討に特化',
        '<strong>成功のコツ:</strong> 短時間で記憶に残る強いメッセージ'
      ]
    },
    'インフィード動画広告': {
      title: '🔍 インフィード動画広告',
      features: [
        '<strong>特徴:</strong> YouTube検索・関連動画・ホームフィードに表示',
        '<strong>時間:</strong> 制限なし（サムネイルとタイトルが重要）',
        '<strong>課金:</strong> クリック時または10秒以上の自動再生で課金',
        '<strong>適用:</strong> ブランド認知度と比較検討',
        '<strong>成功のコツ:</strong> 魅力的なサムネイルとタイトルでクリックを誘導'
      ]
    },
    'バンパー広告（6秒）': {
      title: '⚡ バンパー広告（6秒）',
      features: [
        '<strong>特徴:</strong> 6秒以内のスキップ不可、短くて覚えやすい',
        '<strong>時間:</strong> 6秒以内（厳格な制限）',
        '<strong>課金:</strong> インプレッション単価制（CPM）',
        '<strong>適用:</strong> ブランド認知度と比較検討',
        '<strong>成功のコツ:</strong> シンプルで印象的なメッセージ、他広告との組み合わせ効果'
      ]
    },
    'YouTubeショート広告': {
      title: '📱 YouTubeショート広告',
      features: [
        '<strong>特徴:</strong> 縦型動画、ショートフィードに表示、スワイプでスキップ可',
        '<strong>時間:</strong> 60秒未満推奨（最大時間制限なし）',
        '<strong>課金:</strong> インプレッション・視聴・エンゲージメント単位',
        '<strong>適用:</strong> 若年層、モバイルユーザー、バイラル効果狙い',
        '<strong>成功のコツ:</strong> モバイル最適、縦型構成、エンゲージメント重視'
      ]
    },
    'マストヘッド広告': {
      title: '🌟 マストヘッド広告',
      features: [
        '<strong>特徴:</strong> YouTubeホーム最上部、最大リーチ、予約制のみ',
        '<strong>時間:</strong> PC最大30秒、モバイル制限なし（音声なし自動再生）',
        '<strong>課金:</strong> インプレッション単価制（CPM）、予約ベース',
        '<strong>適用:</strong> 大規模認知、新商品発売、短期間での大量リーチ',
        '<strong>成功のコツ:</strong> Google営業担当を通じた予約、大予算での展開'
      ]
    }
  };
  
  const info = formatInfoMap[selectedFormat];
  if (info) {
    formatDetails.innerHTML = `
      <div class="format-info">
        <h4>${info.title}</h4>
        <ul>
          ${info.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // プロジェクトデータにフォーマットを保存
  window.adCreatorApp.projectData.adFormat = selectedFormat;
}

// 生成結果の表示
function showGenerationResults() {
  console.log('📊 生成結果を表示中...');
  
  // 結果セクションに移動
  showSection('resultsSection');
  window.adCreatorApp.currentStep = 'results';
  
  // YouTube広告か通常広告かで表示方法を分岐
  const isYouTubeAd = window.adCreatorApp.projectData.adType === 'youtube-ads';
  
  if (isYouTubeAd) {
    displayYouTubeAdResults();
  } else {
    displayStandardAdResults();
  }
  
  showNotification('✅ 広告生成が完了しました！', 'success');
}

// YouTube広告専用の結果表示
function displayYouTubeAdResults() {
  const resultsContainer = document.getElementById('resultsContainer');
  if (!resultsContainer) return;
  
  const ads = window.adCreatorApp.generatedAds;
  if (!ads || ads.length === 0) {
    resultsContainer.innerHTML = '<p>生成された広告がありません。</p>';
    return;
  }
  
  const adFormat = window.adCreatorApp.projectData.adFormat || 'スキップ可能なインストリーム広告';
  
  resultsContainer.innerHTML = `
    <div class="youtube-results-header">
      <h2>📺 YouTube広告生成結果</h2>
      <div class="format-badge">${adFormat}</div>
    </div>
    
    <div class="youtube-ads-grid">
      ${ads.map((ad, index) => createYouTubeAdCard(ad, index)).join('')}
    </div>
    
    <div class="youtube-strategy-section">
      <h3>🎯 YouTube広告戦略</h3>
      <div class="strategy-content">
        <p>YouTube広告の効果を最大化するための戦略的アプローチです。</p>
        <ul>
          <li><strong>最初の5秒:</strong> 視聴者の注意を引くフックが最重要</li>
          <li><strong>モバイル最適化:</strong> 70%以上がモバイル視聴のため縦型対応も検討</li>
          <li><strong>A/Bテスト:</strong> 複数パターンをテストして最適化</li>
          <li><strong>ターゲティング:</strong> 購買意向の強いセグメントを活用</li>
        </ul>
      </div>
    </div>
  `;
}

// 通常広告の結果表示
function displayStandardAdResults() {
  const resultsContainer = document.getElementById('resultsContainer');
  if (!resultsContainer) return;
  
  const ads = window.adCreatorApp.generatedAds;
  if (!ads || ads.length === 0) {
    resultsContainer.innerHTML = '<p>生成された広告がありません。</p>';
    return;
  }
  
  const adConfig = AD_TYPE_CONFIGS[window.adCreatorApp.projectData.adType];
  
  resultsContainer.innerHTML = `
    <div class="results-header">
      <h2>${adConfig.icon} ${adConfig.name}生成結果</h2>
    </div>
    
    <div class="ads-grid">
      ${ads.map((ad, index) => createAdCard(ad, index)).join('')}
    </div>
  `;
}

// YouTube広告カードの作成
function createYouTubeAdCard(ad, index) {
  return `
    <div class="youtube-ad-card" data-ad-id="${ad.id || 'ad_' + index}">
      <div class="ad-header">
        <h4>${ad.title || 'YouTube広告パターン ' + (index + 1)}</h4>
        <div class="ad-actions">
          <button class="btn-icon" onclick="editYouTubeAd('${ad.id || 'ad_' + index}')" title="編集">✏️</button>
          <button class="btn-icon" onclick="previewYouTubeAd('${ad.id || 'ad_' + index}')" title="プレビュー">👁️</button>
          <button class="btn-icon" onclick="exportYouTubeAd('${ad.id || 'ad_' + index}')" title="エクスポート">📥</button>
        </div>
      </div>
      
      <div class="youtube-script-section">
        <h5>🎬 動画構成・脚本</h5>
        <div class="script-timeline">
          <div class="script-segment hook">
            <span class="time-label">0-5秒</span>
            <div class="script-content">${ad.script?.hook || 'フック部分'}</div>
          </div>
          <div class="script-segment problem">
            <span class="time-label">5-10秒</span>
            <div class="script-content">${ad.script?.problem || '問題提起'}</div>
          </div>
          <div class="script-segment solution">
            <span class="time-label">10-20秒</span>
            <div class="script-content">${ad.script?.solution || '解決策'}</div>
          </div>
          <div class="script-segment cta">
            <span class="time-label">最後5秒</span>
            <div class="script-content">${ad.script?.cta || 'CTA'}</div>
          </div>
        </div>
      </div>
      
      <div class="youtube-details">
        <div class="visual-elements">
          <h5>🎨 ビジュアル要素</h5>
          <p><strong>オープニング:</strong> ${ad.visualElements?.openingShot || '魅力的な冒頭映像'}</p>
          <p><strong>キービジュアル:</strong> ${ad.visualElements?.keyVisuals?.join(', ') || '重要な視覚要素'}</p>
        </div>
        
        <div class="performance-metrics">
          <h5>📊 予想パフォーマンス</h5>
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">視聴率</span>
              <span class="metric-value">${ad.performance?.viewRateEstimate || 'N/A'}</span>
            </div>
            <div class="metric">
              <span class="metric-label">完視聴率</span>
              <span class="metric-value">${ad.performance?.completionRateEstimate || 'N/A'}</span>
            </div>
            <div class="metric">
              <span class="metric-label">CTR</span>
              <span class="metric-value">${ad.performance?.ctrEstimate || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 通常広告カードの作成
function createAdCard(ad, index) {
  const content = parseGrokResponse(ad.content);
  
  return `
    <div class="ad-card" data-ad-id="${ad.id || 'ad_' + index}">
      <div class="ad-header">
        <h4>${ad.title || '広告パターン ' + (index + 1)}</h4>
        <div class="ad-actions">
          <button class="btn-icon" onclick="editAd('${ad.id || 'ad_' + index}')" title="編集">✏️</button>
          <button class="btn-icon" onclick="previewAd('${ad.id || 'ad_' + index}')" title="プレビュー">👁️</button>
          <button class="btn-icon" onclick="exportAd('${ad.id || 'ad_' + index}')" title="エクスポート">📥</button>
        </div>
      </div>
      
      <div class="ad-content">
        <div class="ad-text">
          <h5>📝 広告テキスト</h5>
          <p><strong>ヘッドライン:</strong> ${ad.headline || 'ヘッドライン'}</p>
          <p><strong>本文:</strong> ${ad.body || '広告本文'}</p>
          <p><strong>CTA:</strong> ${ad.cta || 'CTA'}</p>
        </div>
        
        <div class="ad-performance">
          <h5>📊 予想パフォーマンス</h5>
          <p><strong>CTR:</strong> ${ad.performance?.ctrEstimate || 'N/A'}</p>
          <p><strong>CVR:</strong> ${ad.performance?.conversionEstimate || 'N/A'}</p>
        </div>
      </div>
    </div>
  `;
}

// YouTube広告のアクション関数（プレースホルダー）
function editYouTubeAd(adId) {
  showNotification('📝 YouTube広告の編集機能は準備中です', 'info');
}

function previewYouTubeAd(adId) {
  showNotification('👁️ YouTube広告のプレビュー機能は準備中です', 'info');
}

function exportYouTubeAd(adId) {
  showNotification('📥 YouTube広告のエクスポート機能は準備中です', 'info');
}

// 通常広告のアクション関数（プレースホルダー）
function editAd(adId) {
  showNotification('📝 広告の編集機能は準備中です', 'info');
}

function previewAd(adId) {
  showNotification('👁️ 広告のプレビュー機能は準備中です', 'info');
}

function exportAd(adId) {
  showNotification('📥 広告のエクスポート機能は準備中です', 'info');
}

// ギャラリーとモーダル関連の関数
function showGallery() {
  const galleryModal = document.getElementById('galleryModal');
  if (galleryModal) {
    galleryModal.style.display = 'flex';
    console.log('📁 作品ギャラリーを開きました');
    
    // ギャラリーコンテンツを更新
    updateGalleryContent();
  } else {
    console.error('❌ ギャラリーモーダルが見つかりません');
  }
}

function closeGallery() {
  const galleryModal = document.getElementById('galleryModal');
  if (galleryModal) {
    galleryModal.style.display = 'none';
    console.log('📁 作品ギャラリーを閉じました');
  }
}

function updateGalleryContent() {
  const galleryContent = document.getElementById('galleryContent');
  if (!galleryContent) return;
  
  // 現在保存されている広告があるかチェック
  const savedAds = window.adCreatorApp?.generatedAds || [];
  
  if (savedAds.length === 0) {
    galleryContent.innerHTML = `
      <div class="gallery-empty">
        <div class="empty-icon">📁</div>
        <h4>まだ作品がありません</h4>
        <p>広告を生成すると、こちらに表示されます</p>
        <button class="btn-primary" onclick="closeGallery()">広告を作成する</button>
      </div>
    `;
  } else {
    galleryContent.innerHTML = `
      <div class="gallery-grid">
        ${savedAds.map((ad, index) => `
          <div class="gallery-item">
            <h5>${ad.title || '広告 ' + (index + 1)}</h5>
            <p>${ad.headline || ad.script?.hook || '内容プレビュー'}</p>
            <div class="gallery-actions">
              <button class="btn-sm" onclick="loadAdFromGallery('${ad.id || index}')">読み込み</button>
              <button class="btn-sm btn-danger" onclick="deleteAdFromGallery('${ad.id || index}')">削除</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function loadAdFromGallery(adId) {
  showNotification('📁 ギャラリーからの読み込み機能は準備中です', 'info');
}

function deleteAdFromGallery(adId) {
  if (confirm('この作品を削除しますか？')) {
    showNotification('🗑️ ギャラリーからの削除機能は準備中です', 'info');
  }
}

// 設定パネル関連の関数
function toggleSettings() {
  const settingsPanel = document.getElementById('adSettingsPanel');  if (settingsPanel) {
    const isVisible = settingsPanel.style.display === 'flex';
    settingsPanel.style.display = isVisible ? 'none' : 'flex';
    console.log('⚙️ 設定パネルを' + (isVisible ? '閉じました' : '開きました'));
  } else {
    console.error('設定パネルが見つかりません');
  }
}

// =======================================
// 広告操作・ユーティリティ関数（Grok3対応版）
// =======================================

/**
 * 広告プレビューを生成
 */
function generateAdPreview(content, adType) {
  switch (adType) {
    case 'sns-facebook':
      return `
        <div class="facebook-preview">
          <div class="fb-header">📘 Facebook</div>
          <div class="fb-content">
            <h4>${content.mainCopy || 'メインコピー'}</h4>
            <p>${content.subCopy || 'サブコピー'}</p>
            <button class="fb-cta">${content.cta || 'CTA'}</button>
          </div>
        </div>
      `;
    case 'youtube-ads':
      return `
        <div class="youtube-preview">
          <div class="yt-header">📺 YouTube</div>
          <div class="yt-video-area">[動画プレビューエリア]</div>
          <div class="yt-overlay">
            <h4>${content.mainCopy || 'メインコピー'}</h4>
            <button class="yt-cta">${content.cta || 'CTA'}</button>
          </div>
        </div>
      `;
    case 'banner':
      return `
        <div class="banner-preview">
          <div class="banner-content">
            <h4>${content.mainCopy || 'メインコピー'}</h4>
            <p>${content.subCopy || 'サブコピー'}</p>
            <button class="banner-cta">${content.cta || 'CTA'}</button>
          </div>
        </div>
      `;
    case 'sns-twitter':
      return `
        <div class="twitter-preview">
          <div class="tw-header">🐦 X (Twitter)</div>
          <div class="tw-content">
            <p>${content.mainCopy || 'メインコピー'}</p>
            <button class="tw-cta">${content.cta || 'CTA'}</button>
          </div>
        </div>
      `;
    default:
      return `<div class="generic-preview">${content.mainCopy || 'プレビュー'}</div>`;
  }
}

/**
 * 広告コンテンツをクリップボードにコピー
 */
function copyAdContent(index) {
  const result = window.adCreatorApp.generatedAds[index];
  if (!result) return;
  
  const content = parseGrokResponse(result.content);
  const formattedContent = `
【${result.platform} 広告案】

メインコピー: ${content.mainCopy}
サブコピー: ${content.subCopy}
CTA: ${content.cta}
視覚的要素: ${content.visual}
戦略: ${content.strategy}

生成日時: ${new Date(result.generatedAt).toLocaleString()}
  `.trim();
  
  navigator.clipboard.writeText(formattedContent).then(() => {
    showNotification('📋 広告内容をクリップボードにコピーしました', 'success');
  }).catch(err => {
    console.error('コピーエラー:', err);
    showNotification('❌ コピーに失敗しました', 'error');
  });
}

/**
 * 広告の編集
 */
function editAd(index) {
  const result = window.adCreatorApp.generatedAds[index];
  if (!result) return;
  
  showNotification('✏️ 編集機能は準備中です。現在はコピー機能をご利用ください。', 'info');
}

/**
 * 広告のプレビュー表示
 */
function previewAd(index) {
  const result = window.adCreatorApp.generatedAds[index];
  if (!result) return;
  
  const content = parseGrokResponse(result.content);
  
  const modal = document.createElement('div');
  modal.className = 'preview-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎯 ${result.platform} 広告プレビュー</h3>
        <button class="close-btn" onclick="this.closest('.preview-modal').remove()">✕</button>
      </div>
      <div class="modal-body">
        ${generateAdPreview(content, result.adType)}
        <div class="preview-details">
          <h4>📝 詳細情報</h4>
          ${formatAdContent(content)}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.preview-modal').remove()">
          閉じる
        </button>
        <button class="btn btn-primary" onclick="copyAdContent(${index})">
          📋 コピー
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * 広告の最適化
 */
function optimizeAd(index) {
  const result = window.adCreatorApp.generatedAds[index];
  if (!result) return;
  
  showNotification('⚡ 自動最適化機能は準備中です。A/Bテスト用バリエーション生成をお試しください。', 'info');
}

/**
 * 異なるバリエーションを生成
 */
async function generateDifferentVariations() {
  if (!window.adCreatorApp.projectData.adType) {
    showNotification('❌ 広告タイプが設定されていません', 'error');
    return;
  }
  
  // 確認ダイアログ
  if (!confirm('現在とは異なるアプローチで新しい広告バリエーションを生成しますか？')) {
    return;
  }
  
  try {
    showNotification('🎭 異なるアプローチで広告を生成中...', 'info');
    
    // プロジェクトデータを少し変更して異なるバリエーションを生成
    const modifiedData = {
      ...window.adCreatorApp.projectData,
      variationFocus: 'alternative_approach',
      creativityBoost: true
    };
    
    const generator = new AdPromptGenerator();
    const results = await generator.generateMultipleAds(
      window.adCreatorApp.projectData.adType, 
      modifiedData, 
      2
    );
    
    if (results.some(r => r.success)) {
      const successfulResults = results.filter(r => r.success);
      // 既存の結果に追加
      window.adCreatorApp.generatedAds.push(...successfulResults);
      
      // 再表示
      showGenerationResults();
      showNotification(`✅ ${successfulResults.length}個の新しいバリエーションを追加しました`, 'success');
    } else {
      throw new Error('バリエーション生成に失敗しました');
    }
    
  } catch (error) {
    console.error('バリエーション生成エラー:', error);
    showNotification('❌ バリエーション生成に失敗しました: ' + error.message, 'error');
  }
}

/**
 * 結果のエクスポート
 */
function exportResults() {
  if (!window.adCreatorApp.generatedAds || window.adCreatorApp.generatedAds.length === 0) {
    showNotification('❌ エクスポートする広告がありません', 'error');
    return;
  }
  
  const exportData = {
    projectInfo: window.adCreatorApp.projectData,
    generatedAds: window.adCreatorApp.generatedAds.map(result => ({
      platform: result.platform,
      content: parseGrokResponse(result.content),
      generatedAt: result.generatedAt
    })),
    exportedAt: new Date().toISOString(),
    platform: window.adCreatorApp.generatedAds[0].platform
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exportData.platform}_広告案_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('📄 広告案をエクスポートしました', 'success');
}

// =======================================
// セクション表示管理
// =======================================

/**
 * 生成セクションを表示
 */
function showGenerationSection() {
  showSection('generationSection');
  updateProgress(0, '広告生成を開始...');
}

/**
 * 結果セクションを表示  
 */
function showResultsSection() {
  showSection('resultsSection');
  updateProgress(100, '生成完了！');
}

/**
 * エラー表示
 */
function showError(message) {
  showNotification(message, 'error');
  goBackToSetup();
}

// グローバル関数として登録
window.copyAdContent = copyAdContent;
window.editAd = editAd;
window.previewAd = previewAd;
window.optimizeAd = optimizeAd;
window.generateDifferentVariations = generateDifferentVariations;
window.exportResults = exportResults;
window.regenerateAds = regenerateAds;

// =====================================
// ユーティリティ関数
// =====================================

function showSection(sectionId) {
  // すべてのセクションを非表示
  const sections = [
    'projectSetupSection',
    'contentInputSection',
    'generationSection',
    'resultsSection',
    'improvementSection'
  ];
  
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      section.style.display = 'none';
    }
  });
  
  // 指定されたセクションを表示
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeSettings() {
  const settingsPanel = document.getElementById('adSettingsPanel');
  if (settingsPanel) {
    settingsPanel.style.display = 'none';
  }
}

function saveSettings() {
  const apiKey = document.getElementById('adApiKey').value.trim();
  const creativityLevel = document.getElementById('creativityLevel').value;
  const generationCount = document.getElementById('generationCount').value;
  
  window.adCreatorApp.settings = {
    apiKey: apiKey,
    creativityLevel: creativityLevel,
    generationCount: parseInt(generationCount)
  };
  
  // セッションストレージに保存
  if (apiKey) {
    sessionStorage.setItem('TEMP_GROK_API_KEY', apiKey);
  }
  
  showNotification('✅ 設定を保存しました', 'success');
  closeSettings();
}

function toggleApiKeyVisibility(inputId) {
  const input = document.getElementById(inputId);
  const button = event.target.closest('button');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = '<span>🙈</span>';
  } else {
    input.type = 'password';
    button.innerHTML = '<span>👁️</span>';
  }
}

function showNotification(message, type = 'info') {
  // 既存の通知を削除
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 新しい通知を作成
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  
  // 通知を追加
  document.body.appendChild(notification);
  
  // 5秒後に自動的に削除
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function getFileContentSummary() {
  if (window.adCreatorApp.uploadedFiles.length === 0) {
    return '';
  }
  
  return window.adCreatorApp.uploadedFiles
    .map(file => `${file.name} (${file.type})`)
    .join(', ');
}

function parseGrokResponse(content) {
  if (!content) {
    return {
      mainCopy: 'メインコピー生成中...',
      subCopy: 'サブコピー生成中...',
      cta: 'CTA生成中...',
      visual: '視覚的要素',
      strategy: '戦略'
    };
  }
  
  // Grokのレスポンスを解析
  try {
    // JSONレスポンスの場合
    if (content.includes('{') && content.includes('}')) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.ads && parsed.ads[0]) {
          const ad = parsed.ads[0];
          return {
            mainCopy: ad.headline || ad.mainCopy || 'メインコピー',
            subCopy: ad.body || ad.subCopy || 'サブコピー',
            cta: ad.cta || 'CTA',
            visual: ad.design?.elements?.join(', ') || '視覚的要素',
            strategy: ad.performance?.notes || '戦略'
          };
        }
      }
    }
    
    // テキストレスポンスの場合
    const sections = content.split('\n\n');
    return {
      mainCopy: sections[0] || 'メインコピー',
      subCopy: sections[1] || 'サブコピー',
      cta: sections[2] || 'CTA',
      visual: sections[3] || '視覚的要素',
      strategy: sections[4] || '戦略'
    };
    
  } catch (error) {
    console.error('レスポンス解析エラー:', error);
    return {
      mainCopy: content.substring(0, 100) + '...',
      subCopy: '解析中...',
      cta: 'CTA',
      visual: '視覚的要素',
      strategy: '戦略'
    };
  }
}

function formatAdContent(content) {
  return `
    <div class="ad-content-details">
      <div class="content-item">
        <strong>メインコピー:</strong>
        <p>${content.mainCopy}</p>
      </div>
      <div class="content-item">
        <strong>サブコピー:</strong>
        <p>${content.subCopy}</p>
      </div>
      <div class="content-item">
        <strong>CTA:</strong>
        <p>${content.cta}</p>
      </div>
      <div class="content-item">
        <strong>視覚的要素:</strong>
        <p>${content.visual}</p>
      </div>
      <div class="content-item">
        <strong>戦略:</strong>
        <p>${content.strategy}</p>
      </div>
    </div>
  `;
}

async function regenerateAds() {
  if (confirm('現在の設定で広告を再生成しますか？')) {
    await startAdGeneration();
  }
}

function downloadAssets() {
  showNotification('📥 素材ダウンロード機能は準備中です', 'info');
}

function saveToGallery() {
  showNotification('💾 ギャラリー保存機能は準備中です', 'info');
}

function resetAdCreator() {
  if (confirm('すべての入力内容をリセットしますか？')) {
    window.location.reload();
  }
}

function quickImprovement(type) {
  const improvements = {
    urgent: '緊急性を強調: 期間限定、残りわずか、今すぐなどの表現を追加',
    emotion: '感情訴求を強化: 感動的、心温まる、共感できる表現を追加',
    trust: '信頼性を向上: 実績、保証、お客様の声などを追加',
    price: '価格訴求を強調: 割引、特別価格、コスパなどを強調',
    young: '若者向けに: トレンド、SNS映え、最新などの表現を使用',
    professional: 'プロフェッショナルに: 専門的、高品質、実績重視の表現'
  };
  
  const currentRequest = document.getElementById('improvementRequest').value;
  document.getElementById('improvementRequest').value = 
    currentRequest + '\n' + improvements[type];
    
  showNotification(`✅ ${improvements[type]}`, 'success');
}

function applyImprovements() {
  showNotification('✨ 改善機能は準備中です', 'info');
}

function saveAdSettings() {
  saveSettings();
}

function clearAdSettings() {
  if (confirm('設定をクリアしますか？')) {
    document.getElementById('adApiKey').value = '';
    document.getElementById('creativityLevel').value = 'moderate';
    document.getElementById('generationCount').value = '3';
    
    sessionStorage.removeItem('TEMP_GROK_API_KEY');
    
    window.adCreatorApp.settings = {
      apiKey: '',
      creativityLevel: 'moderate',
      generationCount: 3
    };
    
    showNotification('🗑️ 設定をクリアしました', 'info');
  }
}

function loadSettings() {
  // セッションストレージからAPIキーを読み込み
  const savedApiKey = sessionStorage.getItem('TEMP_GROK_API_KEY');
  if (savedApiKey) {
    document.getElementById('adApiKey').value = savedApiKey;
    window.adCreatorApp.settings.apiKey = savedApiKey;
  }
  
  console.log('⚙️ 設定を読み込みました');
}

function showResultTab(tabName) {
  // すべてのタブボタンとコンテンツを非アクティブに
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // 選択されたタブをアクティブに
  event.target.classList.add('active');
  const tabContent = document.getElementById(tabName + 'Tab');
  if (tabContent) {
    tabContent.classList.add('active');
  }
}

// グローバル関数として登録
window.showSection = showSection;
window.closeSettings = closeSettings;
window.saveSettings = saveSettings;
window.toggleApiKeyVisibility = toggleApiKeyVisibility;
window.showNotification = showNotification;
window.getFileContentSummary = getFileContentSummary;
window.parseGrokResponse = parseGrokResponse;
window.formatAdContent = formatAdContent;
window.regenerateAds = regenerateAds;
window.downloadAssets = downloadAssets;
window.saveToGallery = saveToGallery;
window.resetAdCreator = resetAdCreator;
window.quickImprovement = quickImprovement;
window.applyImprovements = applyImprovements;
window.saveAdSettings = saveAdSettings;
window.clearAdSettings = clearAdSettings;
window.loadSettings = loadSettings;
window.showResultTab = showResultTab;
