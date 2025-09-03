# DINICI AI 辩论平台

## 项目概述

DINICI AI 辩论平台是一个基于 React 和 Supabase 的在线辩论平台，用户可以创建、参与和观看 AI 驱动的辩论。

## 技术栈

- React 18 + TypeScript
- Supabase (认证、数据库、存储)
- TDesign React UI 组件库
- Toast UI Editor (富文本编辑器)

## 快速开始

### 1. 环境要求

- Node.js 16+
- npm 或 yarn
- Docker (用于本地 Supabase 开发)

### 2. 安装依赖

```bash
npm install
```

### 3. 环境变量配置

创建 `.env` 文件并添加以下变量：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 数据库设置

#### 4.1. 创建数据库表

在 Supabase SQL 编辑器中执行以下 SQL 语句：

```sql
-- 创建 tutorial_articles 表
CREATE TABLE IF NOT EXISTS tutorial_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'tutorial',
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_category ON tutorial_articles(category);
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_published ON tutorial_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_created_at ON tutorial_articles(created_at);
```

#### 4.2. 创建存储桶

在 Supabase Storage 中创建名为 `article-images` 的存储桶，并设置以下策略：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 设置存储桶策略
-- 允许任何人读取文章图片
CREATE POLICY "Anyone can read article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- 允许认证用户上传文章图片
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- 允许管理员删除文章图片
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

### 5. 启动开发服务器

```bash
npm run dev
```

## 功能模块

### 用户认证
- 邮箱注册/登录
- OAuth 登录 (GitHub, Google)
- 密码重置

### 辩论功能
- 创建辩论主题
- AI 模型选择
- 实时辩论观看
- 辩论结果分析

### 管理后台
- 用户管理
- 辩论管理
- 文章管理
- 内容审核

### 帮助中心
- 教程文章
- 常见问题
- 使用指南

## 管理员权限

默认管理员账户:
- 邮箱: zyh531592@163.com
- 角色: admin

## 开发指南

### 项目结构

```
src/
├── components/     # 公共组件
├── context/        # React Context
├── lib/            # 工具库
├── pages/          # 页面组件
│   ├── admin/      # 管理后台页面
│   └── ...         # 其他页面
└── App.tsx         # 路由配置
```

### 添加新功能

1. 在 `src/pages/` 中创建新页面组件
2. 在 `src/App.tsx` 中添加路由
3. 如需要管理员权限，在 `src/components/AdminRoute.tsx` 中添加菜单项

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量
3. 部署应用

### Supabase 部署

1. 在 Supabase 创建新项目
2. 运行数据库迁移脚本
3. 配置认证提供商
4. 设置存储桶策略

## 故障排除

### 权限问题

如果遇到权限问题，请检查:
1. 用户角色是否正确设置
2. 数据库行级安全策略
3. 存储桶访问策略

### 数据库连接

如果数据库连接失败:
1. 检查环境变量是否正确
2. 确认 Supabase 项目 URL 和密钥
3. 检查网络连接

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 许可证

MIT License