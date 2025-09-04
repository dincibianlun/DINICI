-- 修复debates表结构，确保与EnhancedDebatePage.tsx中的保存逻辑兼容
-- 使用IF NOT EXISTS确保不会影响现有数据

-- 1. 首先检查并创建可能缺失的列
DO $$
BEGIN
    -- 检查并添加topic列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'topic'
    ) THEN
        ALTER TABLE debates ADD COLUMN topic TEXT;
        RAISE NOTICE 'Added topic column to debates table';
    END IF;
    
    -- 检查并添加positive_model列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'positive_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN positive_model TEXT;
        RAISE NOTICE 'Added positive_model column to debates table';
    END IF;
    
    -- 检查并添加negative_model列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'negative_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN negative_model TEXT;
        RAISE NOTICE 'Added negative_model column to debates table';
    END IF;
    
    -- 检查并添加judge_model列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'judge_model'
    ) THEN
        ALTER TABLE debates ADD COLUMN judge_model TEXT;
        RAISE NOTICE 'Added judge_model column to debates table';
    END IF;
    
    -- 检查并添加user_id列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE debates ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to debates table';
    END IF;
    
    -- 检查并添加is_public列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE debates ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_public column to debates table';
    END IF;
    
    -- 检查并添加created_at列
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE debates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to debates table';
    END IF;
    
    -- 检查并添加content列（主要存储字段）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'content'
    ) THEN
        ALTER TABLE debates ADD COLUMN content JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added content column to debates table';
    END IF;
    
    -- 检查并添加messages列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'messages'
    ) THEN
        ALTER TABLE debates ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added messages column to debates table';
    END IF;
    
    -- 检查并添加conversation列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'conversation'
    ) THEN
        ALTER TABLE debates ADD COLUMN conversation JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added conversation column to debates table';
    END IF;
    
    -- 检查并添加positive_arguments列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'positive_arguments'
    ) THEN
        ALTER TABLE debates ADD COLUMN positive_arguments TEXT DEFAULT '';
        RAISE NOTICE 'Added positive_arguments column to debates table';
    END IF;
    
    -- 检查并添加negative_arguments列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'negative_arguments'
    ) THEN
        ALTER TABLE debates ADD COLUMN negative_arguments TEXT DEFAULT '';
        RAISE NOTICE 'Added negative_arguments column to debates table';
    END IF;
    
    -- 检查并添加summary列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'summary'
    ) THEN
        ALTER TABLE debates ADD COLUMN summary TEXT DEFAULT '';
        RAISE NOTICE 'Added summary column to debates table';
    END IF;
    
    -- 检查并添加model_config列（向后兼容）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'model_config'
    ) THEN
        ALTER TABLE debates ADD COLUMN model_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added model_config column to debates table';
    END IF;
    
    -- 检查并添加views列（统计字段）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'views'
    ) THEN
        ALTER TABLE debates ADD COLUMN views INTEGER DEFAULT 0;
        RAISE NOTICE 'Added views column to debates table';
    END IF;
    
    -- 检查并添加likes列（统计字段）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'likes'
    ) THEN
        ALTER TABLE debates ADD COLUMN likes INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes column to debates table';
    END IF;
    
    -- 检查并添加shares列（统计字段）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'shares'
    ) THEN
        ALTER TABLE debates ADD COLUMN shares INTEGER DEFAULT 0;
        RAISE NOTICE 'Added shares column to debates table';
    END IF;
    
    -- 检查并添加updated_at列（统计字段）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE debates ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to debates table';
    END IF;
END $$;

-- 2. 确保必要的索引存在
CREATE INDEX IF NOT EXISTS idx_debates_user_id ON debates(user_id);
CREATE INDEX IF NOT EXISTS idx_debates_created_at ON debates(created_at);
CREATE INDEX IF NOT EXISTS idx_debates_is_public ON debates(is_public);
CREATE INDEX IF NOT EXISTS idx_debates_views ON debates(views);
CREATE INDEX IF NOT EXISTS idx_debates_likes ON debates(likes);

-- 3. 更新现有的记录，确保关键字段有默认值
UPDATE debates 
SET 
    topic = COALESCE(topic, '未指定主题'),
    positive_model = COALESCE(positive_model, 'unknown'),
    negative_model = COALESCE(negative_model, 'unknown'),
    judge_model = COALESCE(judge_model, 'unknown'),
    is_public = COALESCE(is_public, FALSE),
    created_at = COALESCE(created_at, NOW()),
    content = COALESCE(content, '[]'::jsonb),
    messages = COALESCE(messages, '[]'::jsonb),
    conversation = COALESCE(conversation, '[]'::jsonb),
    positive_arguments = COALESCE(positive_arguments, ''),
    negative_arguments = COALESCE(negative_arguments, ''),
    summary = COALESCE(summary, ''),
    model_config = COALESCE(model_config, '{}'::jsonb),
    views = COALESCE(views, 0),
    likes = COALESCE(likes, 0),
    shares = COALESCE(shares, 0),
    updated_at = COALESCE(updated_at, NOW())
WHERE 
    topic IS NULL OR 
    positive_model IS NULL OR 
    negative_model IS NULL OR 
    judge_model IS NULL OR 
    is_public IS NULL OR 
    created_at IS NULL OR 
    content IS NULL OR
    messages IS NULL OR 
    conversation IS NULL OR 
    positive_arguments IS NULL OR 
    negative_arguments IS NULL OR 
    summary IS NULL OR 
    model_config IS NULL OR
    views IS NULL OR
    likes IS NULL OR
    shares IS NULL OR
    updated_at IS NULL;

-- 4. 验证表结构
SELECT 'Fixed debates table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debates' 
ORDER BY ordinal_position;

-- 5. 测试插入一条记录（然后删除）
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- 插入测试记录
    INSERT INTO debates (
        user_id,
        topic, 
        positive_model, 
        negative_model, 
        judge_model, 
        content,
        messages,
        conversation,
        is_public,
        positive_arguments,
        negative_arguments,
        summary,
        model_config,
        views,
        likes,
        shares,
        created_at,
        updated_at
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',  -- 使用测试UUID
        'Test Topic',
        'test-positive-model',
        'test-negative-model', 
        'test-judge-model',
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        false,
        '',
        '',
        '',
        '{}'::jsonb,
        0,
        0,
        0,
        NOW(),
        NOW()
    ) RETURNING id INTO test_id;
    
    -- 验证插入的记录
    IF test_id IS NOT NULL THEN
        RAISE NOTICE 'Test insert successful with id: %', test_id;
        
        -- 立即删除测试记录
        DELETE FROM debates WHERE id = test_id;
        RAISE NOTICE 'Test record deleted successfully';
    ELSE
        RAISE NOTICE 'Test insert failed - no id returned';
    END IF;
    
    RAISE NOTICE 'Database structure fix successful! Can insert and delete records normally.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

SELECT 'Database migration for debates table completed successfully!' as result;