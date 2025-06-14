#!/bin/bash

echo "LP自動生成ツール - ローカルサーバー起動"
echo "====================================="
echo ""

# Python がインストールされているか確認
if command -v python3 &> /dev/null; then
    echo "Pythonサーバーを起動中..."
    echo "ブラウザで http://localhost:8000 にアクセスしてください"
    echo ""
    echo "終了するには Ctrl+C を押してください"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Pythonサーバーを起動中..."
    echo "ブラウザで http://localhost:8000 にアクセスしてください"
    echo ""
    echo "終了するには Ctrl+C を押してください"
    python -m http.server 8000
elif command -v node &> /dev/null; then
    echo "Node.jsサーバーを起動中..."
    echo "ブラウザで http://localhost:8000 にアクセスしてください"
    echo ""
    echo "終了するには Ctrl+C を押してください"
    npx http-server -p 8000
else
    echo "エラー: PythonまたはNode.jsをインストールしてください"
    exit 1
fi