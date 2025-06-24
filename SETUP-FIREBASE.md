# 🚀 Firebase セットアップガイド

## 📋 必要なファイル

1. **元のファイル**
   ```
   C:\Users\atara\Desktop\landingpage-5e6f5-firebase-adminsdk-fbsvc-7e1bdaee1b.json
   ```

2. **新しいファイル名と場所**
   ```
   C:\Users\atara\Desktop\LP\firebase-key.json
   ```

## 🔧 セットアップ手順

### 1. サービスアカウントファイルをコピー＆リネーム

**Windows コマンドプロンプト:**
```cmd
cd C:\Users\atara\Desktop
copy landingpage-5e6f5-firebase-adminsdk-fbsvc-7e1bdaee1b.json LP\firebase-key.json
```

**または手動で:**
1. 元のファイルをコピー
2. LPフォルダに貼り付け
3. `firebase-key.json` にリネーム

### 2. Firebase CLIをインストール
```bash
npm install -g firebase-tools
```

### 3. デプロイを実行
```bash
cd C:\Users\atara\Desktop\LP
npm run deploy
```

## ✅ チェックリスト

- [ ] サービスアカウントファイルを `firebase-key.json` にリネーム
- [ ] ファイルを `LP` フォルダ内に配置
- [ ] Firebase CLIをインストール
- [ ] インターネット接続を確認
- [ ] デプロイスクリプトを実行

## 🔒 セキュリティ注意

- `firebase-key.json` は `.gitignore` に追加済み
- このファイルを誤ってGitにコミットしないよう注意
- 他人と共有しない

## 📝 ファイル構成確認

```
LP/
├── index.html
├── firebase-key.json    ← ここに配置（Git管理外）
├── firebase.json
├── .firebaserc
├── deploy.js
├── deploy.bat
├── deploy.sh
└── その他のファイル...
```

これで準備完了です！