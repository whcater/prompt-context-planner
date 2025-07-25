#!/bin/bash

# 开发者的上下文提示词规划器启动脚本

echo "🚀 启动开发者的上下文提示词规划器..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "🔧 检查端口占用..."

# 检查3001端口是否被占用
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3001已被占用，尝试终止现有进程..."
    pkill -f "proxy_server.js"
    sleep 2
fi

# 检查3000端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3000已被占用，尝试终止现有进程..."
    pkill -f "vite"
    sleep 2
fi

echo "🌐 启动代理服务器..."
# 后台启动代理服务器
npm run server &
PROXY_PID=$!

# 等待代理服务器启动
sleep 3

# 检查代理服务器是否启动成功
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 代理服务器启动成功 (PID: $PROXY_PID)"
else
    echo "❌ 代理服务器启动失败"
    exit 1
fi

echo "🎨 启动前端应用..."
# 启动前端应用
npm run dev

# 清理函数
cleanup() {
    echo "🛑 正在关闭服务..."
    kill $PROXY_PID 2>/dev/null
    pkill -f "vite" 2>/dev/null
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

wait