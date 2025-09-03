-- 更新文章表的全文搜索实现，解决内容过长问题
-- 适用于已存在articles表的情况

-- 首先删除现有的tsvector列和索引（如果存在）
DROP INDEX IF EXISTS articles_fts_idx;
ALTER TABLE articles DROP COLUMN IF EXISTS fts;

-- 方案1: 只为标题创建tsvector索引，忽略内容
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_fts tsvector 
GENERATED ALWAYS AS (to_tsvector('simple', COALESCE(title, ''))) STORED;

CREATE INDEX IF NOT EXISTS articles_title_fts_idx ON articles USING GIN (title_fts);

-- 方案2（可选）: 为内容创建一个限制长度的tsvector索引
-- 使用substring限制内容长度为500字符
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_fts tsvector 
GENERATED ALWAYS AS (to_tsvector('simple', COALESCE(substring(content, 1, 500), ''))) STORED;

CREATE INDEX IF NOT EXISTS articles_content_fts_idx ON articles USING GIN (content_fts);

-- 方案3（高级）: 创建一个搜索函数，使用标题和限制长度的内容进行综合搜索
CREATE OR REPLACE FUNCTION search_articles(search_term TEXT) 
RETURNS TABLE (id UUID, title TEXT, content TEXT, category TEXT, tags TEXT[], 
               created_at TIMESTAMPTZ, is_published BOOLEAN, author_id UUID, updated_at TIMESTAMPTZ) 
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title, a.content, a.category, a.tags, a.created_at, a.is_published, a.author_id, a.updated_at
  FROM articles a
  WHERE a.title_fts @@ to_tsquery('simple', search_term)
     OR a.content_fts @@ to_tsquery('simple', search_term)
  ORDER BY 
    ts_rank(a.title_fts, to_tsquery('simple', search_term)) + 
    ts_rank(a.content_fts, to_tsquery('simple', search_term)) DESC;
END;
$$ LANGUAGE plpgsql;