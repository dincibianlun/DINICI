-- 修复辩论记录表，确保content列存在
-- 这个迁移确保debates表具有正确的结构

-- 首先检查并创建表（如果不存在）
CREATE TABLE IF NOT EXISTS debates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    topic TEXT NOT NULL,
    positive_model TEXT NOT NULL,
    negative_model TEXT NOT NULL,
    judge_model TEXT NOT NULL,
    content JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}'
);

-- 如果表已存在但缺少content列，则添加该列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'content'
    ) THEN
        ALTER TABLE debates ADD COLUMN content JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 确保其他必要的列也存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'views'
    ) THEN
        ALTER TABLE debates ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'likes'
    ) THEN
        ALTER TABLE debates ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'shares'
    ) THEN
        ALTER TABLE debates ADD COLUMN shares INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE debates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 完成提示
SELECT 'debates表结构修复完成，content列现在可用' as result;