# Firebase Hosting デプロイガイド

## 🚀 クイックスタート

### 前提条件
1. Node.js (v14以上) がインストールされていること
2. Firebase CLIがインストールされていること
3. サービスアカウントファイルが配置されていること

### セットアップ

#### 1. Firebase CLIのインストール
```bash
npm install -g firebase-tools
```

#### 2. サービスアカウントファイルの配置
以下の手順でサービスアカウントファイルを配置してください：

1. 元のファイル名を変更：
   - 元: `landingpage-5e6f5-firebase-adminsdk-fbsvc-7e1bdaee1b.json`
   - 新: `firebase-key.json`

2. ファイルをLPフォルダ内にコピー：
   ```
   C:\Users\atara\Desktop\LP\firebase-key.json
   ```

⚠️ **重要**: このファイルは秘密情報を含むため、絶対にGitにコミットしないでください。

### デプロイ方法

#### 方法1: Node.js スクリプト（推奨）
```bash
npm run deploy
```

#### 方法2: Windowsバッチファイル
```bash
deploy.bat
```

#### 方法3: Unix/Linuxシェルスクリプト
```bash
bash deploy.sh
```

## 📋 プロジェクト情報

- **プロジェクト名**: LandingPage
- **プロジェクトID**: landingpage-5e6f5
- **ホスティングURL**: 
  - https://landingpage-5e6f5.web.app
  - https://landingpage-5e6f5.firebaseapp.com

## 📁 ファイル構成

```
LP/
├── index.html              # メインファイル
├── setup.html              # セットアップページ
├── styles.css              # スタイルシート
├── scripts/                # JavaScriptファイル
├── data/                   # データファイル
├── firebase.json           # Firebase設定
├── .firebaserc            # Firebaseプロジェクト設定
├── deploy.js              # Node.jsデプロイスクリプト
├── deploy.bat             # Windowsデプロイスクリプト
├── deploy.sh              # Unix/Linuxデプロイスクリプト
└── package.json           # npmパッケージ設定
```

## 🔧 Firebase設定

### firebase.json
- ルートディレクトリ（`.`）を公開ディレクトリとして設定
- 不要なファイルを除外（サービスアカウント、スクリプトなど）
- SPAのためのリライトルール設定
- キャッシュヘッダーの最適化

### デプロイ除外ファイル
- `firebase.json`
- `.*`（隠しファイル）
- `node_modules/`
- デプロイスクリプト類
- サービスアカウントファイル

## 🔒 セキュリティ

### サービスアカウントの管理
1. サービスアカウントファイルは絶対にGitにコミットしない
2. `.gitignore`にパターンを追加済み
3. 本番環境では環境変数を使用することを推奨

### GitHub Actionsでの使用
1. GitHubのリポジトリ設定でSecretを追加：
   - 名前: `FIREBASE_SERVICE_ACCOUNT_LANDINGPAGE_5E6F5`
   - 値: サービスアカウントJSONの内容をコピー

2. プッシュ時に自動デプロイが実行されます

## 📊 デプロイ後の確認

1. **ホスティングURL**でサイトを確認
2. **Firebase Console**で詳細を確認：
   https://console.firebase.google.com/project/landingpage-5e6f5/hosting

## ❓ トラブルシューティング

### デプロイが失敗する場合
1. インターネット接続を確認
2. Firebase CLIが最新版か確認：
   ```bash
   firebase --version
   npm update -g firebase-tools
   ```
3. サービスアカウントの権限を確認
4. プロジェクトIDが正しいか確認

### 認証エラーの場合
1. サービスアカウントファイルのパスを確認
2. ファイルの内容が正しいか確認
3. Firebase Consoleでサービスアカウントの権限を確認

## 📞 サポート

問題が解決しない場合は、以下を確認してください：
- [Firebase Hosting ドキュメント](https://firebase.google.com/docs/hosting)
- [Firebase CLI リファレンス](https://firebase.google.com/docs/cli)