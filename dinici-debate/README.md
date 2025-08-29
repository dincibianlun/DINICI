# DINICI AI辩论平台

## 项目简介
基于Supabase和OpenRouter的AI辩论系统，支持：
- 多角色AI辩论（正方/反方/裁判）
- 语音合成(TTS)输出
- 赛博朋克风格UI

## 技术栈
- 前端：React + TypeScript + TDesign
- 后端：Supabase (Auth/Database)
- AI服务：OpenRouter API + 豆包语音TTS

## 快速开始
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 零基础部署指南
### 1. 环境准备
- 注册Supabase账号并创建项目
- 获取OpenRouter API Key
- 安装Node.js 18+

### 2. 配置步骤
1. 复制`.env.example`为`.env`
2. 填写以下配置：
```ini
# Supabase配置
VITE_SUPABASE_URL=您的项目URL
VITE_SUPABASE_ANON_KEY=您的匿名密钥

# OpenRouter配置
VITE_OPENROUTER_KEY=您的API密钥
```

### 3. 部署命令
```bash
# 生产环境构建
npm run build

# 本地预览
npm run preview

# 部署到Vercel
vercel --prod
```

## 常见问题
Q: 如何重置管理员密码？
A: 访问 `/reset-password` 页面

Q: 音频无法播放？
A: 检查豆包语音TTS配置是否正确