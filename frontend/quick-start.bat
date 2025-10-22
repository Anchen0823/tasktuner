@echo off
chcp 65001 >nul
echo 🚀 快速启动 TaskTuner...
echo.

:: 检查 node_modules 是否存在
if not exist "node_modules" (
    echo 📦 安装依赖中...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 安装失败
        pause
        exit /b 1
    )
)

echo ✅ 启动开发服务器...
echo 📍 http://localhost:3000
echo.
npm run dev 