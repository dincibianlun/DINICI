# DINCI AI辩论平台

一个基于AI的智能辩论平台，支持多种AI模型进行实时辩论互动，集成语音合成功能。

## 🚀 项目特性

- **多AI模型支持**: 集成OpenRouter，支持GPT、Claude、DeepSeek等多种主流AI模型
- **实时辩论流程**: 完整的辩论流程，包括主持人开场、正反方立论、自由辩论、裁判总结
- **语音合成**: 集成火山引擎TTS，为每个角色配置不同音色
- **案例库系统**: 支持辩论记录保存、分享和浏览
- **管理后台**: 完整的管理系统，支持用户管理、内容审核、数据统计
- **赛博朋克UI**: 现代化的深色主题界面设计

## 📁 项目结构

```
DINICI/
├── dinici-debate/          # 主应用 - 辩论平台
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/         # 页面 (包含管理后台)
│   │   ├── services/      # 服务层
│   │   ├── hooks/         # 自定义Hook
│   │   ├── context/       # 上下文
│   │   └── utils/         # 工具函数
│   ├── supabase/         # 数据库迁移
│   └── package.json
└── README.md
```

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **TDesign React** - UI组件库
- **React Router** - 路由管理
- **Vite** - 构建工具

### 后端服务
- **Supabase** - 数据库和认证
- **OpenRouter API** - AI模型调用
- **火山引擎TTS** - 语音合成

### 数据库
- **PostgreSQL** (通过Supabase)
- 完整的表结构设计，支持用户、辩论、文章、审核等功能

## 🚀 快速开始

### 1. 环境准备

确保你的系统已安装：
- Node.js (版本 >= 16)
- npm 或 yarn

### 2. 克隆项目

```bash
git clone https://github.com/crh0626/DINICI.git
cd DINICI
```

### 3. 配置环境变量

#### 主应用配置 (dinici-debate/.env)

```bash
# Supabase 配置 (已配置)
VITE_SUPABASE_URL=https://zwcgiutlkuwfzzukyyrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Y2dpdXRsa3V3Znp6dWt5eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjIzOTQsImV4cCI6MjA3MjAzODM5NH0.ifGus8cNBJpi6VmSHQAVH211zay6svYyFg8a-xwTEmc

# OpenRouter API 配置 - 需要你提供
OPENROUTER_API_KEY=your_openrouter_api_key_here

# TTS 服务配置 (火山引擎语音合成) - 需要你提供
TTS_APPID=your_tts_appid_here
TTS_ACCESS_TOKEN=your_tts_access_token_here

# TTS 高级配置
TTS_CLUSTER_ID=volcano_tts
TTS_DISABLE_MARKDOWN_FILTER=false
TTS_ENABLE_LATEX_TN=true
```

### 4. 获取API密钥

#### OpenRouter API密钥
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册账号并获取API密钥
3. 将密钥填入 `OPENROUTER_API_KEY`

#### 火山引擎TTS配置
1. 访问 [火山引擎](https://www.volcengine.com/)
2. 开通语音合成服务
3. 获取 `APPID` 和 `Access Token`
4. 填入对应的环境变量

### 5. 安装依赖并启动

```bash
cd dinici-debate
npm install
npm run dev
```

应用将在 http://localhost:5173 启动

**管理员功能**: 管理员用户登录后可以通过导航菜单访问管理后台功能

### 6. 数据库设置

数据库已经配置完成，包含以下表：
- `users` - 用户表
- `debates` - 辩论记录表
- `api_keys` - API密钥表
- `tags` - 标签表
- `tutorial_articles` - 教程文章表
- `case_reviews` - 案例审核表

## 📖 使用指南

### 用户功能

1. **注册/登录**: 使用邮箱注册账号
2. **开始辩论**: 
   - 输入辩论题目
   - 选择正方、反方、裁判模型
   - 点击开始辩论
3. **保存记录**: 辩论结束后可保存到个人历史
4. **分享案例**: 将优质辩论分享到公开案例库
5. **浏览案例库**: 查看其他用户分享的辩论案例

### 管理员功能

1. **数据统计**: 查看用户数、辩论数等统计信息
2. **用户管理**: 管理注册用户
3. **文章管理**: 编辑教程文章
4. **案例审核**: 审核用户提交的公开案例

## 🎯 支持的AI模型

| 模型名称 | 模型ID |
|---------|--------|
| OPENAI | `openai/gpt-5-chat` |
| Claude | `anthropic/claude-3-haiku` |
| DeepSeek | `deepseek/deepseek-chat-v3.1` |
| 百度文心一言 | `baidu/ernie-4.5-vl-28b-a3b` |
| 智谱清言 | `z-ai/glm-4.5` |
| 月之暗面 | `moonshotai/kimi-k2` |
| XAI-Grok | `x-ai/grok-4` |
| 通义千问 | `qwen/qwen-max` |
| 谷歌gemini | `google/gemini-2.5-pro` |

## 🔊 语音配置

系统为不同角色配置了专属音色：
- **正方**: `zh_female_sajiaonvyou_moon_bigtts` (撒娇女音)
- **反方**: `zh_female_shuangkuaisisi_moon_bigtts` (爽快女音)  
- **裁判**: `zh_female_meilinvyou_moon_bigtts` (美少女音)

## 🚀 部署

### 构建生产版本

```bash
# 主应用
cd dinici-debate
npm run build

# 管理后台
cd dinici-admin
npm run build
```

### 部署到服务器

构建完成后，将 `dist` 目录部署到你的Web服务器即可。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 支持

如果你在使用过程中遇到问题，请：

1. 检查环境变量配置是否正确
2. 确认API密钥是否有效
3. 查看浏览器控制台错误信息
4. 提交Issue描述问题

---

**注意**: 请确保在使用前正确配置所有必需的API密钥，否则相关功能将无法正常工作。
