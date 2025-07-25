# 开发者的上下文提示词规划器

这是一个支持多AI服务的智能项目规划工具，可以分析项目需求并生成详细的开发步骤提示词。

## 功能特性

- 🤖 支持多种AI服务：Claude、OpenAI、xAI、DeepSeek
- 📊 智能项目分析：自动评估复杂度、预估开发时间
- 🎯 分步骤提示词生成：为不同开发阶段生成专业提示词
- 🔄 实时API调用：通过代理服务器解决CORS限制
- 💻 响应式界面：支持桌面和移动端使用
- 🛡️ 完善的错误处理和诊断

## 快速开始

### 一键启动（推荐）
```bash
# Windows用户
start.bat

# Mac/Linux用户  
bash start.sh
```

### 手动启动
```bash
# 1. 安装依赖
npm install

# 2. 启动代理服务器 (终端1)
npm run server

# 3. 启动前端应用 (终端2)
npm run dev
```

## CORS问题解决方案

如果遇到CORS跨域错误，已通过以下方式解决：

### 1. 代理服务器CORS配置
- 支持多端口：3000, 3002, 5173
- 完整的预检请求处理
- 详细的CORS头部配置

### 2. Vite代理配置
- 内置API代理到3001端口
- 智能端点选择机制
- 自动fallback到直接调用

### 3. 前端错误处理
- 详细的错误诊断信息
- 网络连接状态检查
- CORS问题自动检测

## 支持的AI服务

| 服务商 | 模型示例 | API Key格式 | 获取地址 |
|--------|----------|-------------|----------|
| Claude (Anthropic) | claude-3-sonnet-20240229 | sk-ant-... | [Anthropic Console](https://console.anthropic.com/) |
| OpenAI | gpt-4-turbo-preview | sk-... | [OpenAI Platform](https://platform.openai.com/) |
| xAI (Grok) | grok-beta | xai-... | [xAI Console](https://console.x.ai/) |
| DeepSeek | deepseek-chat | 自定义格式 | [DeepSeek Platform](https://platform.deepseek.com/) |

## 项目结构

```
├── src/
│   ├── main.jsx                 # 应用入口
│   ├── claude_integrated_planner.jsx  # 主组件
│   └── index.css               # 样式文件
├── proxy_server.js             # API代理服务器
├── vite.config.js              # Vite配置
├── package.json                # 项目配置
├── index.html                  # HTML模板
├── start.bat                   # Windows启动脚本
└── start.sh                    # Unix启动脚本
```

## 使用说明

1. **启动应用**：运行 `start.bat` (Windows) 或 `bash start.sh` (Mac/Linux)
2. **配置API**：在界面中选择AI服务并输入API Key
3. **输入需求**：在文本框中详细描述项目需求
4. **开始分析**：点击"开始智能分析"获取分析结果
5. **复制提示词**：查看生成的开发步骤，复制提示词到AI工具中使用

## 故障排除

### CORS错误
```
Access to fetch at 'http://localhost:3001/api/ai/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决方案**：
1. 确保代理服务器正在运行：`npm run server`
2. 检查端口3001是否被占用
3. 重启代理服务器和前端应用
4. 清除浏览器缓存

### 网络连接错误
```
Failed to fetch
```

**解决方案**：
1. 检查代理服务器状态：访问 http://localhost:3001/health
2. 确认防火墙设置
3. 检查网络连接
4. 验证API Key是否正确

### 端口占用
```
EADDRINUSE: address already in use
```

**解决方案**：
1. Windows: `taskkill /F /IM node.exe`
2. Mac/Linux: `pkill -f "proxy_server.js"`
3. 更改端口配置

## 技术细节

### CORS配置
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3002',
    'http://localhost:5173',
    'https://claude.ai'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 智能端点选择
```javascript
const getProxyEndpoint = () => {
  // 优先使用Vite代理
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return `/api/ai/${aiProvider}`;
  }
  // 直接访问代理服务器
  return `http://localhost:3001/api/ai/${aiProvider}`;
};
```

## 开发命令

```bash
npm run dev      # 启动开发服务器 (端口3000)
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
npm run server   # 启动代理服务器 (端口3001)
```

## 环境要求

- Node.js 16+
- npm 或 yarn
- 现代浏览器（支持ES6+）

## 注意事项

- API Key仅在当前会话中使用，不会被存储
- 确保网络连接正常以访问AI服务
- 代理服务器必须先启动才能正常使用AI功能
- 建议使用Chrome或Edge浏览器以获得最佳体验