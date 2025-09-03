-- 为 tutorial_articles 表添加 tags 列
-- 创建时间: 2025-09-01

-- 添加 tags 列到 tutorial_articles 表
DO $$ 
BEGIN
    -- 检查 tags 字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutorial_articles' AND column_name = 'tags'
    ) THEN
        ALTER TABLE tutorial_articles ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- 更新存储桶策略，避免重复创建
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

-- 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tutorial_articles' 
ORDER BY ordinal_position;

-- 完成提示
SELECT 'tags列添加完成！' as result;