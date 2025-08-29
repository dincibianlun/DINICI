# 全流程部署教程

## 第一章：Supabase配置
1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目 → 记下项目URL和匿名密钥
3. 在SQL编辑器执行以下初始化脚本：
```sql
-- 创建辩论记录表
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 第二章：前端部署
### 本地运行
1. 下载项目代码
2. 安装依赖：
```bash
npm install
```
3. 启动开发服务器：
```bash
npm run dev
```

### 生产环境部署
1. 构建生产包：
```bash
npm run build
```
2. 部署到Vercel：
```bash
npm install -g vercel
vercel --prod
```

## 第三章：服务配置
### OpenRouter设置
1. 访问 [openrouter.ai](https://openrouter.ai) 获取API Key
2. 在`.env`文件中配置：
```ini
VITE_OPENROUTER_KEY=sk-or-v1-xxxxxx
```

### 豆包语音TTS配置
1. 登录豆包语音合成平台
2. 创建语音合成应用
3. 配置以下环境变量：
```ini
TTS_APP_ID=1250000000
TTS_ACCESS_TOKEN=your-access-token
```

## 第四章：日常维护
### 数据备份
```bash
# 导出Supabase数据
pg_dump -h db.supabase.com -U postgres -d postgres > backup.sql
```

### 版本升级
```bash
# 更新所有依赖
npm update --force