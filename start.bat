@echo off
chcp 65001 >nul
echo 🚀 启动开发者的上下文提示词规划器...

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装，请先安装Node.js
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装，请先安装npm
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 安装依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo 🔧 检查端口占用...

REM 终止可能存在的进程
taskkill /F /IM node.exe >nul 2>&1

echo 🌐 启动代理服务器...
REM 启动代理服务器
start "Proxy Server" cmd /c "npm run server"

REM 等待代理服务器启动
timeout /t 3 /nobreak >nul

REM 检查代理服务器是否启动成功
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 代理服务器启动失败，请检查端口3001是否被占用
    pause
    exit /b 1
) else (
    echo ✅ 代理服务器启动成功
)

echo 🎨 启动前端应用...
echo 📱 前端应用将在 http://localhost:3000 启动
echo 🔧 代理服务器运行在 http://localhost:3001
echo.
echo 💡 使用提示：
echo 1. 在界面中配置你的AI API Key
echo 2. 选择AI服务提供商
echo 3. 输入项目需求进行分析
echo.

REM 启动前端应用
npm run dev

pause