-- DINICI AI辩论平台 - 无索引数据库设置
-- 只创建表结构，完全避免索引相关错误

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 辩论记录表
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

-- 3. API密钥表
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    service_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 标签表
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 教程文章表
CREATE TABLE IF NOT EXISTS tutorial_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 案例审核表
CREATE TABLE IF NOT EXISTS case_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debate_id UUID,
    reviewer_id UUID,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 7. 默认标签 - 安全插入
INSERT INTO tags (name) VALUES ('科技') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('教育') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('健康') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('经济') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('环境') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('政治') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('文化') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('体育') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('娱乐') ON CONFLICT (name) DO NOTHING;
INSERT INTO tags (name) VALUES ('生活') ON CONFLICT (name) DO NOTHING;

-- 完成
SELECT '数据库表结构创建完成！索引可以在后续单独添加。' as result;
