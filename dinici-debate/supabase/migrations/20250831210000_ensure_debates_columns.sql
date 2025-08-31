-- 确保debates表包含所有必要的列
-- 解决"Could not find the 'judge_model' column"错误

-- 检查并添加缺失的列
DO $$
BEGIN
    -- 确保judge_model列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'judge_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN judge_model TEXT;
        RAISE NOTICE '已添加judge_model列';
    ELSE
        RAISE NOTICE 'judge_model列已存在';
    END IF;
    
    -- 确保positive_model列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'positive_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN positive_model TEXT;
        RAISE NOTICE '已添加positive_model列';
    ELSE
        RAISE NOTICE 'positive_model列已存在';
    END IF;
    
    -- 确保negative_model列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'negative_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN negative_model TEXT;
        RAISE NOTICE '已添加negative_model列';
    ELSE
        RAISE NOTICE 'negative_model列已存在';
    END IF;
    
    -- 确保content列存在且类型正确
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'content'
    ) THEN
        ALTER TABLE debates ADD COLUMN content JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '已添加content列';
    ELSE
        RAISE NOTICE 'content列已存在';
    END IF;
    
    -- 确保user_id列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE debates ADD COLUMN user_id UUID;
        RAISE NOTICE '已添加user_id列';
    ELSE
        RAISE NOTICE 'user_id列已存在';
    END IF;
    
    -- 确保topic列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'topic'
    ) THEN
        ALTER TABLE debates ADD COLUMN topic TEXT;
        RAISE NOTICE '已添加topic列';
    ELSE
        RAISE NOTICE 'topic列已存在';
    END IF;
    
    -- 确保is_public列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE debates ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '已添加is_public列';
    ELSE
        RAISE NOTICE 'is_public列已存在';
    END IF;
    
    -- 确保created_at列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE debates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '已添加created_at列';
    ELSE
        RAISE NOTICE 'created_at列已存在';
    END IF;
END $$;

-- 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debates' 
ORDER BY ordinal_position;