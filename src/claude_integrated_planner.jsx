import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Lightbulb, Code, Settings, TestTube, Wrench, Brain, AlertTriangle, Clock, Zap } from 'lucide-react';

const ClaudeIntegratedPlanner = () => {
  const [userInput, setUserInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('claude');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [modelName, setModelName] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [copiedPrompts, setCopiedPrompts] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [error, setError] = useState('');

  // AI 服务提供商配置
  const aiProviders = {
    claude: {
      name: 'Claude (Anthropic)',
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: [
        'claude-3-sonnet-20240229',
        'claude-3-opus-20240229',
        'claude-3-haiku-20240307'
      ],
      defaultModel: 'claude-3-sonnet-20240229'
    },
    openai: {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      models: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-4o'
      ],
      defaultModel: 'gpt-4-turbo-preview'
    },
    xai: {
      name: 'xAI (Grok)',
      endpoint: 'https://api.x.ai/v1/chat/completions',
      models: [
        'grok-4-0709',
        'grok-3',
        'grok-3-latest'
      ],
      defaultModel: 'grok-1'
    },
    deepseek: {
      name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: [
        'deepseek-chat',
        'deepseek-coder'
      ],
      defaultModel: 'deepseek-chat'
    },
    custom: {
      name: '自定义 API',
      endpoint: '',
      models: [],
      defaultModel: ''
    }
  };

  // 通用 AI API 调用（通过代理服务器）
  const analyzeWithAI = async (userInput) => {
    if (!apiKey) {
      throw new Error('请先配置 API Key');
    }

    const provider = aiProviders[aiProvider];
    const model = modelName || provider.defaultModel;

    if (!model) {
      throw new Error('请选择模型');
    }

    const analysisPrompt = `作为一个专业的软件项目规划师和技术专家，请分析以下用户需求并返回JSON格式的分析结果：

用户需求：${userInput}

请返回以下JSON结构（只返回JSON，不要其他文字）：
{
  "projectType": "web应用|游戏|工具应用",
  "projectName": "提取的项目名称",
  "complexity": "低|中|高",
  "estimatedHours": "预估开发小时数（数字）",
  "mainFeatures": ["主要功能1", "主要功能2", "..."],
  "technicalChallenges": ["技术挑战1", "技术挑战2", "..."],
  "recommendedTech": ["推荐技术栈1", "推荐技术栈2", "..."],
  "developmentPhases": [
    {
      "phase": "阶段名称",
      "description": "阶段描述",
      "tasks": ["任务1", "任务2", "..."],
      "estimatedHours": "该阶段预估小时数"
    }
  ],
  "riskFactors": ["风险因素1", "风险因素2", "..."],
  "recommendations": ["建议1", "建议2", "..."],
  "successCriteria": ["成功标准1", "成功标准2", "..."]
}`;

    try {
      // 始终使用相对路径，让Vite代理处理转发
      const getProxyEndpoint = () => {
        return `/api/ai/${aiProvider}`;
      };

      const proxyEndpoint = getProxyEndpoint();
      console.log(`尝试调用: ${proxyEndpoint}`);
      console.log(`完整URL: ${window.location.origin}${proxyEndpoint}`);
      console.log(`当前页面: ${window.location.href}`);
      
      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          apiKey: apiKey,
          model: model,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }],
          customEndpoint: aiProvider === 'custom' ? apiEndpoint : undefined
        })
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = `API 调用失败 (${response.status}): ${errorData.error || response.statusText}`;
        } catch (e) {
          errorMessage = `API 调用失败 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // 根据不同AI服务解析响应
      let analysisText;
      if (aiProvider === 'claude') {
        analysisText = data.content?.[0]?.text || '';
      } else {
        analysisText = data.choices?.[0]?.message?.content || '';
      }
      
      if (!analysisText) {
        throw new Error('AI返回的响应格式异常');
      }
      
      // 提取JSON部分
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI返回的分析结果，请检查API配置');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI API 调用错误:', error);
      
      // 提供详细的错误诊断
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error(`
网络连接失败，请检查：
1. 代理服务器是否已启动 (npm run server)
2. 代理服务器是否运行在 http://localhost:3000
3. 网络连接是否正常
4. 浏览器是否阻止了跨域请求

原始错误: ${error.message}
        `);
      }
      
      if (error.message.includes('CORS')) {
        throw new Error(`
CORS跨域错误，请检查：
1. 代理服务器的CORS配置
2. 前端应用端口是否正确
3. 重启代理服务器

原始错误: ${error.message}
        `);
      }
      
      throw error;
    }
  };

  // 基于Claude分析生成详细的提示词
  const generateDetailedPrompts = (analysis) => {
    const basePrompts = {
      'web应用': [
        {
          id: 'setup',
          title: '项目基础架构',
          type: 'foundation',
          prompt: `请创建一个"${analysis.projectName}"项目，要求如下：

项目类型：${analysis.projectType}
主要功能：${analysis.mainFeatures.join('、')}
推荐技术栈：${analysis.recommendedTech.join('、')}

具体任务：
1. 创建完整的项目文件结构
2. 实现响应式的基础布局
3. 设置必要的样式框架
4. 配置基础的JavaScript架构
5. 确保代码结构清晰且易于扩展

请注意以下技术挑战：${analysis.technicalChallenges.join('、')}

输出完整可运行的代码。`
        },
        {
          id: 'core',
          title: '核心功能实现',
          type: 'feature',
          prompt: `现在请实现"${analysis.projectName}"的核心功能：

主要功能模块：
${analysis.mainFeatures.map(f => `- ${f}`).join('\n')}

开发要求：
1. 实现所有核心业务逻辑
2. 添加必要的用户交互
3. 确保功能的稳定性和可靠性
4. 包含适当的错误处理
5. 代码要有良好的注释

技术注意点：
${analysis.technicalChallenges.map(c => `- ${c}`).join('\n')}

请逐步实现并测试每个功能模块。`
        },
        {
          id: 'enhance',
          title: '用户体验优化',
          type: 'enhancement',
          prompt: `请优化"${analysis.projectName}"的用户体验：

优化目标：
1. 添加流畅的动画效果
2. 实现响应式设计适配
3. 优化性能和加载速度
4. 添加用户反馈和提示
5. 实现无障碍访问支持

具体改进：
- 优化界面交互流程
- 添加加载状态和进度提示
- 实现数据持久化（如需要）
- 添加键盘快捷键支持
- 优化移动端体验

请确保改进不会影响现有功能的稳定性。`
        },
        {
          id: 'finalize',
          title: '项目完善与部署',
          type: 'testing',
          prompt: `请完善"${analysis.projectName}"项目：

最终检查清单：
1. 全面测试所有功能
2. 修复发现的任何bug
3. 优化代码性能
4. 添加完整的文档注释
5. 确保浏览器兼容性
6. 准备部署配置

验收标准：
${analysis.successCriteria.map(c => `- ${c}`).join('\n')}

请提供项目的最终版本和部署指南。`
        }
      ],
      '游戏': [
        {
          id: 'game_foundation',
          title: '游戏引擎架构',
          type: 'foundation',
          prompt: `创建"${analysis.projectName}"游戏项目：

游戏类型：${analysis.projectType}
核心玩法：${analysis.mainFeatures.join('、')}
技术栈：${analysis.recommendedTech.join('、')}

架构要求：
1. 设置游戏循环和渲染系统
2. 实现场景管理
3. 创建基础的游戏对象类
4. 设置输入处理系统
5. 配置资源管理器

技术挑战：${analysis.technicalChallenges.join('、')}

请创建可扩展的游戏架构。`
        },
        {
          id: 'game_mechanics',
          title: '游戏机制实现',
          type: 'feature',
          prompt: `实现"${analysis.projectName}"的核心游戏机制：

核心玩法：
${analysis.mainFeatures.map(f => `- ${f}`).join('\n')}

实现要求：
1. 游戏规则和逻辑
2. 玩家控制系统
3. 物理碰撞检测
4. 游戏状态管理
5. 计分和进度系统

注意事项：
${analysis.technicalChallenges.map(c => `- ${c}`).join('\n')}

确保游戏机制平衡且有趣。`
        },
        {
          id: 'game_content',
          title: '内容与体验',
          type: 'enhancement',
          prompt: `丰富"${analysis.projectName}"的游戏内容：

内容添加：
1. 音效和背景音乐
2. 视觉特效和动画
3. 关卡或内容设计
4. UI界面优化
5. 游戏平衡调整

体验优化：
- 添加教程和帮助
- 实现设置和配置
- 优化性能表现
- 添加成就系统
- 支持不同设备

让游戏更加吸引人和有趣。`
        },
        {
          id: 'game_polish',
          title: '游戏打磨',
          type: 'testing',
          prompt: `完善"${analysis.projectName}"游戏：

打磨项目：
1. 全面测试游戏功能
2. 修复bug和优化性能
3. 平衡游戏难度
4. 添加存档功能
5. 优化用户界面

验收标准：
${analysis.successCriteria.map(c => `- ${c}`).join('\n')}

确保游戏稳定且用户体验良好。`
        }
      ],
      '工具应用': [
        {
          id: 'tool_architecture',
          title: '工具架构设计',
          type: 'foundation',
          prompt: `创建"${analysis.projectName}"工具应用：

工具功能：${analysis.mainFeatures.join('、')}
技术要求：${analysis.recommendedTech.join('、')}

架构设计：
1. 设计清晰的用户界面
2. 实现数据处理流程
3. 创建功能模块结构
4. 设置输入验证系统
5. 配置输出格式处理

技术难点：${analysis.technicalChallenges.join('、')}

构建稳定可靠的工具基础。`
        },
        {
          id: 'tool_functions',
          title: '核心功能开发',
          type: 'feature',
          prompt: `开发"${analysis.projectName}"的核心功能：

功能模块：
${analysis.mainFeatures.map(f => `- ${f}`).join('\n')}

开发重点：
1. 实现主要算法逻辑
2. 处理各种输入格式
3. 确保计算准确性
4. 添加错误处理机制
5. 优化处理效率

技术要点：
${analysis.technicalChallenges.map(c => `- ${c}`).join('\n')}

确保工具功能准确可靠。`
        },
        {
          id: 'tool_experience',
          title: '用户体验优化',
          type: 'enhancement',
          prompt: `优化"${analysis.projectName}"的使用体验：

体验改进：
1. 简化操作流程
2. 添加使用指导
3. 实现批量处理
4. 支持多种格式
5. 提供结果预览

界面优化：
- 清晰的状态提示
- 进度显示
- 快捷操作
- 结果导出功能
- 历史记录

让工具更易用更高效。`
        },
        {
          id: 'tool_completion',
          title: '工具完善',
          type: 'testing',
          prompt: `完善"${analysis.projectName}"工具：

完善内容：
1. 全面功能测试
2. 边界情况处理
3. 性能优化
4. 用户文档
5. 部署准备

质量保证：
${analysis.successCriteria.map(c => `- ${c}`).join('\n')}

确保工具稳定、准确、易用。`
        }
      ]
    };

    return basePrompts[analysis.projectType] || basePrompts['web应用'];
  };

  const handleAnalyze = async () => {
    if (!userInput.trim()) {
      setError('请输入项目需求');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const analysis = await analyzeWithAI(userInput);
      const steps = generateDetailedPrompts(analysis);
      
      setCurrentPlan({
        analysis,
        steps,
        type: analysis.projectType
      });
      setExpandedSteps(new Set());
      setCopiedPrompts(new Set());
    } catch (err) {
      setError(err.message);
      console.error('分析失败:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 当切换AI服务商时重置模型
  const handleProviderChange = (provider) => {
    setAiProvider(provider);
    if (provider !== 'custom') {
      setModelName(aiProviders[provider].defaultModel);
      setApiEndpoint(aiProviders[provider].endpoint);
    } else {
      setModelName('');
      setApiEndpoint('');
    }
  };

  const toggleStep = (stepId) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const copyPrompt = async (stepId, prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompts(new Set([...copiedPrompts, stepId]));
      setTimeout(() => {
        setCopiedPrompts(prev => {
          const newSet = new Set(prev);
          newSet.delete(stepId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getStepIcon = (type) => {
    const icons = {
      foundation: <Settings className="w-4 h-4" />,
      feature: <Code className="w-4 h-4" />,
      enhancement: <Lightbulb className="w-4 h-4" />,
      testing: <TestTube className="w-4 h-4" />
    };
    return icons[type] || <Code className="w-4 h-4" />;
  };

  const getStepColor = (type) => {
    const colors = {
      foundation: 'bg-blue-50 border-blue-200 text-blue-800',
      feature: 'bg-green-50 border-green-200 text-green-800',
      enhancement: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      testing: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">开发者的上下文提示词规划器</h1>
        </div>
        <p className="text-gray-600">支持Claude、OpenAI、xAI等多种AI服务的项目分析与提示词生成</p>
      </div>

      {/* API 配置 */}
      <div className="mb-6">
        <button
          onClick={() => setShowApiConfig(!showApiConfig)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {showApiConfig ? '隐藏' : '显示'} AI 服务配置
        </button>
        
        {showApiConfig && (
          <div className="mt-3 p-6 bg-gray-50 rounded-lg border space-y-4">
            {/* AI 服务选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择 AI 服务：
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(aiProviders).map(([key, provider]) => (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      aiProvider === key
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定义端点 */}
            {aiProvider === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API 端点：
                </label>
                <input
                  type="url"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1/chat/completions"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 模型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择模型：
              </label>
              {aiProvider !== 'custom' ? (
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {aiProviders[aiProvider].models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="gpt-4, claude-3-sonnet, 等"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key：
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  aiProvider === 'claude' ? 'sk-ant-...' :
                  aiProvider === 'openai' ? 'sk-...' :
                  aiProvider === 'xai' ? 'xai-...' :
                  'your-api-key'
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 获取链接 */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800 mb-2">获取 API Key：</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Anthropic Console
                </a>
                <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  OpenAI Platform
                </a>
                <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  xAI Console
                </a>
                <a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  DeepSeek Platform
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 代理服务器状态提示 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h3 className="font-medium text-blue-800">代理服务器配置</h3>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>此版本需要运行本地代理服务器来解决CORS限制</p>
          <p>1. 下载代理服务器代码并运行：<code className="bg-blue-100 px-2 py-1 rounded">node proxy-server.js</code></p>
          <p>2. 确保服务器运行在：<code className="bg-blue-100 px-2 py-1 rounded">http://localhost:3001</code></p>
          <p>3. 配置完成后即可正常使用所有AI服务</p>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            详细描述您的项目需求：
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="例如：我想做一个用键盘模拟弹钢琴的网站，用户可以通过按键盘来演奏音符，并且有视觉反馈效果。希望界面美观，支持录制回放功能，能在手机上使用..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !apiKey}
            className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {aiProviders[aiProvider].name} 正在分析...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                开始智能分析
              </>
            )}
          </button>
        </div>
      </div>

      {/* Claude 分析结果 */}
      {currentPlan && currentPlan.analysis && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI 深度分析报告</h2>
              <p className="text-sm text-gray-600">基于 {aiProviders[aiProvider].name} 的专业项目分析</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 项目概览 */}
            <div className="bg-white rounded-lg p-5 border border-indigo-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                项目概览
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">项目名称:</span> {currentPlan.analysis.projectName}</div>
                <div><span className="font-medium">项目类型:</span> {currentPlan.analysis.projectType}</div>
                <div><span className="font-medium">复杂度:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    currentPlan.analysis.complexity === '高' ? 'bg-red-100 text-red-700' :
                    currentPlan.analysis.complexity === '中' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {currentPlan.analysis.complexity}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">预估时间:</span> {currentPlan.analysis.estimatedHours} 小时
                </div>
              </div>
            </div>

            {/* 主要功能 */}
            <div className="bg-white rounded-lg p-5 border border-indigo-100">
              <h3 className="font-bold text-gray-800 mb-3">主要功能</h3>
              <div className="space-y-1">
                {currentPlan.analysis.mainFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 技术栈 */}
            <div className="bg-white rounded-lg p-5 border border-indigo-100">
              <h3 className="font-bold text-gray-800 mb-3">推荐技术栈</h3>
              <div className="flex flex-wrap gap-2">
                {currentPlan.analysis.recommendedTech.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 风险与建议 */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {currentPlan.analysis.riskFactors.length > 0 && (
              <div className="bg-white rounded-lg p-5 border border-red-100">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  潜在风险
                </h3>
                <div className="space-y-1">
                  {currentPlan.analysis.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="text-red-400 mt-1">⚠</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-5 border border-green-100">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                专业建议
              </h3>
              <div className="space-y-1">
                {currentPlan.analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-green-700">
                    <span className="text-green-400 mt-1">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 开发步骤 */}
      {currentPlan && currentPlan.steps && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">智能生成的开发步骤</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {currentPlan.steps.length} 个步骤
            </span>
          </div>

          {currentPlan.steps.map((step, index) => (
            <div key={step.id} className={`border rounded-lg ${getStepColor(step.type)}`}>
              <div
                className="p-4 cursor-pointer flex items-center justify-between hover:bg-opacity-80 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-white rounded-full font-bold text-sm">
                    {index + 1}
                  </span>
                  {getStepIcon(step.type)}
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm opacity-75">基于{aiProviders[aiProvider].name}分析定制的提示词</p>
                  </div>
                </div>
                {expandedSteps.has(step.id) ? <ChevronDown /> : <ChevronRight />}
              </div>
              
              {expandedSteps.has(step.id) && (
                <div className="px-4 pb-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">AI 智能提示词：</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {aiProviders[aiProvider].name}
                        </span>
                        <button
                          onClick={() => copyPrompt(step.id, step.prompt)}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm transition-colors"
                        >
                          {copiedPrompts.has(step.id) ? (
                            <>
                              <Check className="w-4 h-4 text-green-600" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              复制
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                      {step.prompt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaudeIntegratedPlanner;