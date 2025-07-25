// AI API 代理服务器 - Express.js版本
// 安装依赖：npm install express cors dotenv node-fetch
// 使用方法：node proxy-server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'https://claude.ai', '*'], // 允许的域名
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// AI服务配置
const AI_CONFIGS = {
  claude: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    })
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  xai: {
    endpoint: 'https://api.x.ai/v1/chat/completions',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    })
  }
};

// 通用AI API代理端点
app.post('/api/ai/:provider', async (req, res) => {
  const { provider } = req.params;
  const { apiKey, model, messages, customEndpoint } = req.body;

  console.log(`[${new Date().toISOString()}] AI请求: ${provider} - ${model}`);

  try {
    // 验证参数
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // 获取配置
    const config = AI_CONFIGS[provider];
    if (!config && !customEndpoint) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const endpoint = customEndpoint || config.endpoint;
    const headers = config ? config.headers(apiKey) : {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    // 构造请求体
    let requestBody;
    if (provider === 'claude') {
      requestBody = {
        model: model,
        max_tokens: 4000,
        messages: messages
      };
    } else {
      // OpenAI兼容格式
      requestBody = {
        model: model,
        messages: messages,
        max_tokens: 4000,
        temperature: 0.1
      };
    }

    // 发送请求到AI服务
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`AI API Error:`, data);
      return res.status(response.status).json({
        error: data.error?.message || `AI API Error: ${response.statusText}`,
        details: data
      });
    }

    // 返回结果
    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      error: 'Internal proxy error',
      message: error.message
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supportedProviders: Object.keys(AI_CONFIGS)
  });
});

// 获取支持的AI服务列表
app.get('/api/providers', (req, res) => {
  res.json({
    providers: Object.keys(AI_CONFIGS),
    configs: Object.entries(AI_CONFIGS).reduce((acc, [key, config]) => {
      acc[key] = { endpoint: config.endpoint };
      return acc;
    }, {})
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI API 代理服务器启动成功!`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`🤖 支持的AI服务: ${Object.keys(AI_CONFIGS).join(', ')}`);
  console.log(`\n使用方法:`);
  console.log(`POST http://localhost:${PORT}/api/ai/claude`);
  console.log(`POST http://localhost:${PORT}/api/ai/openai`);
  console.log(`POST http://localhost:${PORT}/api/ai/xai`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到终止信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在关闭服务器...');
  process.exit(0);
});