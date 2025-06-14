@echo off
echo LP自動生成ツール - ローカルサーバー起動
echo =====================================
echo.

REM Python がインストールされているか確認
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Pythonサーバーを起動中...
    echo ブラウザで http://localhost:8000 にアクセスしてください
    echo.
    echo 終了するには Ctrl+C を押してください
    python -m http.server 8000
) else (
    echo Pythonが見つかりません。Node.jsを確認中...
    
    REM Node.js がインストールされているか確認
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        echo Node.jsサーバーを起動中...
        echo ブラウザで http://localhost:8000 にアクセスしてください
        echo.
        echo 終了するには Ctrl+C を押してください
        npx http-server -p 8000
    ) else (
        echo エラー: PythonまたはNode.jsをインストールしてください
        pause
    )
)