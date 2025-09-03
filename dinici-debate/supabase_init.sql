-- DINICI AI 辩论平台数据库初始化脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 确保 users 表有 role 字段
DO $$ 
BEGIN
    -- 检查role字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 2. 设置管理员用户
INSERT INTO users (email, role, created_at, last_active_at) 
VALUES ('zyh531592@163.com', 'admin', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  role = 'admin',
  last_active_at = NOW();

-- 3. 创建 tutorial_articles 表
CREATE TABLE IF NOT EXISTS tutorial_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'tutorial',
    tags TEXT[],  -- 添加 tags 列
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 tutorial_articles 表索引
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_category ON tutorial_articles(category);
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_published ON tutorial_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_tutorial_articles_created_at ON tutorial_articles(created_at);

-- 5. 设置 tutorial_articles 表行级安全策略
ALTER TABLE tutorial_articles ENABLE ROW LEVEL SECURITY;

-- 创建策略：管理员可以查看所有文章
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can view all articles' 
        AND tablename = 'tutorial_articles'
    ) THEN
        CREATE POLICY "Admins can view all articles" 
        ON tutorial_articles FOR SELECT 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = author_id 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- 创建策略：管理员可以插入文章
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can insert articles' 
        AND tablename = 'tutorial_articles'
    ) THEN
        CREATE POLICY "Admins can insert articles" 
        ON tutorial_articles FOR INSERT 
        TO authenticated 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = author_id 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- 创建策略：管理员可以更新文章
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can update articles' 
        AND tablename = 'tutorial_articles'
    ) THEN
        CREATE POLICY "Admins can update articles" 
        ON tutorial_articles FOR UPDATE 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = author_id 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- 创建策略：管理员可以删除文章
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can delete articles' 
        AND tablename = 'tutorial_articles'
    ) THEN
        CREATE POLICY "Admins can delete articles" 
        ON tutorial_articles FOR DELETE 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = author_id 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- 6. 授权访问 tutorial_articles 表
GRANT ALL ON tutorial_articles TO authenticated;

-- 7. 插入示例数据（修复tags列问题）
INSERT INTO tutorial_articles (title, content, category, tags, is_published, author_id, created_at) 
VALUES 
    ('如何使用AI辩论平台', '# 如何使用AI辩论平台

这是一个示例教程文章，介绍了如何使用我们的AI辩论平台。

## 主要功能

1. 创建辩论
2. 参与辩论
3. 观看辩论结果', 'tutorial', ARRAY['教程', '入门'], true, NULL, NOW()),
    ('平台使用常见问题', '# 平台使用常见问题

## 问题1：如何注册账号？

答：点击右上角的登录按钮，选择注册选项。

## 问题2：如何创建辩论？

答：在首页点击"开始辩论"按钮。', 'faq', ARRAY['FAQ', '帮助'], true, NULL, NOW())
ON CONFLICT DO NOTHING;

-- 8. 创建文章图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 9. 设置存储桶策略
-- 允许任何人读取文章图片
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anyone can read article images' 
        AND schemaname = 'storage' 
        AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Anyone can read article images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'article-images');
    END IF;
END $$;

-- 允许认证用户上传文章图片
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Authenticated users can upload article images' 
        AND schemaname = 'storage' 
        AND tablename = 'objects'
    ) THEN
        CREATE POLICY "Authenticated users can upload article images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'article-images');
    END IF;
END $$;

-- 允许管理员删除文章图片
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admins can delete article images' 
        AND schemaname = 'storage' 
        AND tablename = 'objects'
    ) THEN
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
    END IF;
END $$;

-- 10. 授权访问存储桶
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 11. 验证表结构
SELECT 
    'users表' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role'
UNION ALL
SELECT 
    'tutorial_articles表' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tutorial_articles' 
ORDER BY table_name, ordinal_position;

-- 12. 验证示例数据
SELECT '示例文章数量:' as info, COUNT(*) as count FROM tutorial_articles;

-- 13. 验证管理员用户
SELECT '管理员用户:' as info, email, role FROM users WHERE email = 'zyh531592@163.com';

-- 14. 完成提示
SELECT '数据库初始化完成！' as result;