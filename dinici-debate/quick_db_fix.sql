-- 快速修复数据库字段问题
-- 在 Supabase SQL 编辑器中执行

-- 1. 修复 conversation 列问题
DO $$
BEGIN
    -- 如果 conversation 列存在且为 NOT NULL，修复它
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' 
        AND column_name = 'conversation'
        AND is_nullable = 'NO'
    ) THEN
        -- 移除 NOT NULL 约束
        ALTER TABLE debates ALTER COLUMN conversation DROP NOT NULL;
        
        -- 为现有的 NULL 值设置默认值
        UPDATE debates 
        SET conversation = '[]'::jsonb 
        WHERE conversation IS NULL;
        
        RAISE NOTICE 'conversation列的NOT NULL约束已移除';
    END IF;
    
    -- 如果 conversation 列不存在，创建它（可空）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'conversation'
    ) THEN
        ALTER TABLE debates ADD COLUMN conversation JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'conversation列已创建';
    END IF;
END $$;

-- 2. 确保 model_config 列也是可空的
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' 
        AND column_name = 'model_config'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE debates ALTER COLUMN model_config DROP NOT NULL;
        UPDATE debates SET model_config = '{}'::jsonb WHERE model_config IS NULL;
        RAISE NOTICE 'model_config列的NOT NULL约束已移除';
    END IF;
END $$;

-- 3. 验证修复
SELECT 'Database columns fixed!' as result;

-- 4. 显示当前表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debates' 
AND column_name IN ('conversation', 'model_config', 'content', 'topic')
ORDER BY column_name;