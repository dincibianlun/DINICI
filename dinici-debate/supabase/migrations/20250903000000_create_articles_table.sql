-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT true,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON articles(is_published);

-- 设置RLS策略
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略（只允许访问已发布的文章）
CREATE POLICY articles_public_select_policy ON articles
    FOR SELECT
    USING (is_published = true);

-- 创建作者访问策略（允许作者访问和编辑自己的文章）
CREATE POLICY articles_author_all_policy ON articles
    FOR ALL
    USING (auth.uid() = author_id);

-- 创建管理员访问策略（允许管理员访问和编辑所有文章）
CREATE POLICY articles_admin_all_policy ON articles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- 创建示例文章数据
INSERT INTO articles (title, content, category, tags, is_published, author_id)
SELECT 
    '如何使用AI辩论平台',
    '# 如何使用AI辩论平台

这是一个示例教程文章，介绍了如何使用我们的AI辩论平台。

## 主要功能

1. 创建辩论
2. 参与辩论
3. 观看辩论结果',
    'tutorial',
    ARRAY['教程', '入门'],
    true,
    id
FROM users 
WHERE role = 'admin' 
LIMIT 1;

INSERT INTO articles (title, content, category, tags, is_published, author_id)
SELECT 
    '平台使用常见问题',
    '# 平台使用常见问题

## 问题1：如何注册账号？

答：点击右上角的登录按钮，选择注册选项。

## 问题2：如何创建辩论？

答：在首页点击"开始辩论"按钮。',
    'faq',
    ARRAY['FAQ', '帮助'],
    true,
    id
FROM users 
WHERE role = 'admin' 
LIMIT 1;

-- 添加文章关联视图（可选）
CREATE OR REPLACE VIEW article_details AS
SELECT 
    a.*,
    u.email as author_email,
    u.role as author_role
FROM 
    articles a
LEFT JOIN 
    users u ON a.author_id = u.id;

-- 为文章表添加全文搜索功能
ALTER TABLE articles ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (to_tsvector('chinese', title || ' ' || content)) STORED;

CREATE INDEX IF NOT EXISTS articles_fts_idx ON articles USING GIN (fts);