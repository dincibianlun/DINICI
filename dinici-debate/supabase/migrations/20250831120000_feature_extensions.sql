-- DINICI AI辩论平台 - 功能扩展迁移
-- 添加统计字段和用户设置表，不影响现有核心功能

-- 1. 扩展 debates 表，添加统计字段
ALTER TABLE debates 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 扩展 users 表，添加用户统计信息
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_debates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_debates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_avatar TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'zh-CN',
    email_notifications BOOLEAN DEFAULT true,
    debate_notifications BOOLEAN DEFAULT true,
    auto_save BOOLEAN DEFAULT true,
    preferred_models JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建用户活动日志表
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL, -- 'debate_created', 'debate_shared', 'profile_updated', etc.
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建系统统计表
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stat_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    total_users INTEGER DEFAULT 0,
    total_debates INTEGER DEFAULT 0,
    public_debates INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    tts_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建辩论收藏表
CREATE TABLE IF NOT EXISTS debate_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    debate_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, debate_id)
);

-- 7. 创建辩论评论表
CREATE TABLE IF NOT EXISTS debate_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debate_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID, -- 支持回复评论
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 创建辩论点赞表
CREATE TABLE IF NOT EXISTS debate_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    debate_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, debate_id)
);

-- 9. 创建功能使用情况统计视图
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
    u.id,
    u.email,
    u.display_name,
    u.created_at as user_since,
    COALESCE(d.total_debates, 0) as total_debates,
    COALESCE(d.public_debates, 0) as public_debates,
    COALESCE(d.total_views, 0) as total_views,
    COALESCE(d.total_likes, 0) as total_likes,
    COALESCE(f.favorites_count, 0) as favorites_count,
    u.last_active_at
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_debates,
        COUNT(*) FILTER (WHERE is_public = true) as public_debates,
        SUM(COALESCE(views, 0)) as total_views,
        SUM(COALESCE(likes, 0)) as total_likes
    FROM debates 
    GROUP BY user_id
) d ON u.id = d.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as favorites_count
    FROM debate_favorites
    GROUP BY user_id
) f ON u.id = f.user_id;

-- 10. 创建辩论详情增强视图
CREATE OR REPLACE VIEW v_debate_details AS
SELECT 
    d.*,
    u.email as author_email,
    u.display_name as author_name,
    COALESCE(l.likes_count, 0) as likes_count,
    COALESCE(c.comments_count, 0) as comments_count,
    COALESCE(f.favorites_count, 0) as favorites_count
FROM debates d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN (
    SELECT debate_id, COUNT(*) as likes_count
    FROM debate_likes
    GROUP BY debate_id
) l ON d.id = l.debate_id
LEFT JOIN (
    SELECT debate_id, COUNT(*) as comments_count
    FROM debate_comments
    WHERE is_approved = true
    GROUP BY debate_id
) c ON d.id = c.debate_id
LEFT JOIN (
    SELECT debate_id, COUNT(*) as favorites_count
    FROM debate_favorites
    GROUP BY debate_id
) f ON d.id = f.debate_id;

-- 11. 创建函数：更新用户最后活动时间
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建函数：自动更新辩论浏览量
CREATE OR REPLACE FUNCTION increment_debate_views(debate_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE debates 
    SET views = COALESCE(views, 0) + 1,
        updated_at = NOW()
    WHERE id = debate_uuid;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建函数：获取用户辩论统计
CREATE OR REPLACE FUNCTION get_user_debate_stats(user_uuid UUID)
RETURNS TABLE(
    total_debates BIGINT,
    public_debates BIGINT,
    total_views BIGINT,
    total_likes BIGINT,
    avg_views_per_debate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_debates,
        COUNT(*) FILTER (WHERE is_public = true) as public_debates,
        SUM(COALESCE(d.views, 0)) as total_views,
        SUM(COALESCE(d.likes, 0)) as total_likes,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(SUM(COALESCE(d.views, 0))::NUMERIC / COUNT(*), 2)
            ELSE 0 
        END as avg_views_per_debate
    FROM debates d
    WHERE d.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 完成
SELECT '数据库扩展完成！添加了统计字段、用户设置和增强功能，不影响现有核心功能。' as result;