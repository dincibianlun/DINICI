-- 修复数据库 debates 表的 model_config 列问题
-- 解决 "null value in column "model_config" violates not-null constraint" 错误

-- 检查并处理 model_config 列
DO $$
BEGIN
    -- 如果 model_config 列存在，将其设置为可空或提供默认值
    IF EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'model_config'
    ) THEN
        -- 移除 NOT NULL 约束
        ALTER TABLE debates ALTER COLUMN model_config DROP NOT NULL;
        
        -- 为现有的 NULL 值设置默认值
        UPDATE debates 
        SET model_config = '{}'::jsonb 
        WHERE model_config IS NULL;
        
        RAISE NOTICE 'model_config列的NOT NULL约束已移除，NULL值已设置为默认值';
    ELSE
        -- 如果列不存在，创建一个可空的 model_config 列
        ALTER TABLE debates ADD COLUMN model_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'model_config列已创建为可空列';
    END IF;
END $$;

-- 确保 debates 表的核心列都存在且配置正确
DO $$
BEGIN
    -- 确保 topic 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'topic'
    ) THEN
        ALTER TABLE debates ADD COLUMN topic TEXT;
    END IF;
    
    -- 确保 positive_model 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'positive_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN positive_model TEXT;
    END IF;
    
    -- 确保 negative_model 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'negative_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN negative_model TEXT;
    END IF;
    
    -- 确保 judge_model 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'judge_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN judge_model TEXT;
    END IF;
    
    -- 确保 content 列存在且类型正确
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'content'
    ) THEN
        ALTER TABLE debates ADD COLUMN content JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- 确保 user_id 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE debates ADD COLUMN user_id UUID;
    END IF;
    
    -- 确保 is_public 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE debates ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- 确保 created_at 列存在
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE debates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
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