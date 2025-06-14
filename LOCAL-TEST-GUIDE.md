# ローカルホストでの接続テストガイド

## 🚀 クイックスタート

### Windows
```bash
# ダブルクリックで起動
start-local-server.bat
```

### Mac/Linux
```bash
# ターミナルで実行
./start-local-server.sh
```

起動後、ブラウザで `http://localhost:8000` にアクセス

## ✅ 接続テストの手順

1. **ローカルサーバーを起動**
2. **ブラウザでアクセス**: http://localhost:8000
3. **APIキーを入力**
4. **「🧪 接続テスト」をクリック**

## 📊 各APIの接続状況

| API | CORS対応 | ローカルテスト |
|-----|---------|--------------|
| Google Gemini | ✅ | 問題なし |
| xAI Grok | ✅ | 問題なし |
| OpenAI GPT | ✅ | 問題なし |
| Anthropic Claude | ⚠️ | CORSエラーの可能性 |
| DeepSeek | ✅ | 問題なし |

## 🔧 トラブルシューティング

### CORSエラーが発生した場合

#### 方法1: ブラウザ拡張機能
- Chrome: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock)
- Firefox: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

#### 方法2: Chrome起動オプション（開発用）
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:\temp\chrome_dev"

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev" --disable-web-security

# Linux
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

⚠️ **注意**: このオプションはセキュリティを無効化するため、開発時のみ使用してください

#### 方法3: プロキシサーバー使用（上級者向け）
```bash
# package.jsonがない場合は作成
npm init -y

# 必要なパッケージをインストール
npm install express cors axios

# プロキシサーバーを起動
node cors-proxy-server.js
```

## 🌐 オンライン版の利用

CORSエラーを避けたい場合は、Firebase Hostingにデプロイして使用することを推奨します：

```bash
# デプロイ
npm run deploy
# または
./deploy.sh
```

## 💡 開発のヒント

1. **APIキーの保存**
   - セッションストレージに一時保存（ブラウザを閉じると消去）
   - セキュリティのため、ローカルストレージには保存しません

2. **デバッグ方法**
   - ブラウザの開発者ツール（F12）でコンソールを確認
   - ネットワークタブでAPIリクエストを監視

3. **パフォーマンス**
   - ローカルホストでは高速に動作
   - APIレスポンス時間のみがボトルネック

## 🔒 セキュリティ注意事項

- APIキーは絶対にGitにコミットしない
- 本番環境では環境変数やサーバーサイドプロキシを使用
- ローカルテスト後はAPIキーをリセット

## 📞 サポート

問題が解決しない場合は、以下の情報と共に報告してください：
- ブラウザの種類とバージョン
- エラーメッセージ（コンソールログ）
- 使用しているOS