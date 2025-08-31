-- DINICI 数据库修复脚本
-- 请在 Supabase SQL 编辑器中执行此脚本

-- 1. 检查当前 debates 表结构
SELECT 'Current debates table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debates' 
ORDER BY ordinal_position;

-- 2. 修复 model_config 列问题
DO $$
BEGIN
    -- 如果 model_config 列存在且为 NOT NULL，修复它
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' 
        AND column_name = 'model_config'
        AND is_nullable = 'NO'
    ) THEN
        -- 移除 NOT NULL 约束
        ALTER TABLE debates ALTER COLUMN model_config DROP NOT NULL;
        
        -- 为现有的 NULL 值设置默认值
        UPDATE debates 
        SET model_config = '{}'::jsonb 
        WHERE model_config IS NULL;
        
        RAISE NOTICE 'model_config列的NOT NULL约束已移除';
    END IF;
    
    -- 如果 model_config 列不存在，创建它（可空）
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'debates' AND column_name = 'model_config'
    ) THEN
        ALTER TABLE debates ADD COLUMN model_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'model_config列已创建';
    END IF;
END $$;

-- 3. 确保所有必要的列都存在
DO $$
BEGIN
    -- topic 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'topic') THEN
        ALTER TABLE debates ADD COLUMN topic TEXT;
        RAISE NOTICE 'topic列已添加';
    END IF;
    
    -- positive_model 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'positive_model') THEN
        ALTER TABLE debates ADD COLUMN positive_model TEXT;
        RAISE NOTICE 'positive_model列已添加';
    END IF;
    
    -- negative_model 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'negative_model') THEN
        ALTER TABLE debates ADD COLUMN negative_model TEXT;
        RAISE NOTICE 'negative_model列已添加';
    END IF;
    
    -- judge_model 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'judge_model') THEN
        ALTER TABLE debates ADD COLUMN judge_model TEXT;
        RAISE NOTICE 'judge_model列已添加';
    END IF;
    
    -- content 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'content') THEN
        ALTER TABLE debates ADD COLUMN content JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'content列已添加';
    END IF;
    
    -- user_id 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'user_id') THEN
        ALTER TABLE debates ADD COLUMN user_id UUID;
        RAISE NOTICE 'user_id列已添加';
    END IF;
    
    -- is_public 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'is_public') THEN
        ALTER TABLE debates ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'is_public列已添加';
    END IF;
    
    -- created_at 列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debates' AND column_name = 'created_at') THEN
        ALTER TABLE debates ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'created_at列已添加';
    END IF;
END $$;

-- 4. 验证修复后的表结构
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
        topic, 
        positive_model, 
        negative_model, 
        judge_model, 
        content, 
        is_public,
        model_config
    ) VALUES (
        'Test Topic',
        'test-positive-model',
        'test-negative-model', 
        'test-judge-model',
        '[]'::jsonb,
        false,
        '{}'::jsonb
    ) RETURNING id INTO test_id;
    
    -- 立即删除测试记录
    DELETE FROM debates WHERE id = test_id;
    
    RAISE NOTICE '数据库修复成功！可以正常插入和删除记录。';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '测试插入失败: %', SQLERRM;
END $$;

SELECT '数据库修复完成！' as result;