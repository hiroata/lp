#!/bin/bash

# Firebase Hosting Deploy Script with Service Account
# 使用方法: ./deploy.sh

echo "🚀 Firebase Hosting デプロイスクリプト"
echo "====================================="

# デプロイ前の確認
echo "📋 デプロイ情報:"
echo "- プロジェクト: landingpage-5e6f5"
echo "- サイトURL: https://landingpage-5e6f5.web.app"
echo ""

# Firebase CLIのインストール確認
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLIがインストールされていません"
    echo "📦 インストール方法:"
    echo "  npm install -g firebase-tools"
    exit 1
fi

# サービスアカウントファイルの確認
SERVICE_ACCOUNT="./firebase-key.json"
if [ ! -f "$SERVICE_ACCOUNT" ]; then
    echo "❌ サービスアカウントファイルが見つかりません: $SERVICE_ACCOUNT"
    echo "📝 ファイルを以下の場所に配置してください:"
    echo "  C:\Users\atara\Desktop\LP\firebase-key.json"
    echo ""
    echo "📌 元のファイル名を変更してコピー:"
    echo "  元: landingpage-5e6f5-firebase-adminsdk-fbsvc-7e1bdaee1b.json"
    echo "  新: firebase-key.json"
    exit 1
fi

echo "✅ サービスアカウントファイルを確認しました"
echo ""

# 環境変数の設定
export GOOGLE_APPLICATION_CREDENTIALS="$SERVICE_ACCOUNT"

# デプロイの実行
echo "🔄 Firebaseにデプロイ中..."
firebase deploy --only hosting --project landingpage-5e6f5

# デプロイ結果の確認
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ デプロイが完了しました！"
    echo "🌐 サイトURL:"
    echo "   https://landingpage-5e6f5.web.app"
    echo "   https://landingpage-5e6f5.firebaseapp.com"
    echo ""
    echo "📊 Firebase Console:"
    echo "   https://console.firebase.google.com/project/landingpage-5e6f5/hosting"
else
    echo ""
    echo "❌ デプロイに失敗しました"
    echo "📝 以下を確認してください:"
    echo "   1. インターネット接続"
    echo "   2. サービスアカウントの権限"
    echo "   3. firebase.jsonの設定"
fi