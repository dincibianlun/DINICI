import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Loading
} from 'tdesign-react'
import { 
  TimeIcon
} from 'tdesign-icons-react'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { Breadcrumb } from '../components/Breadcrumb'

type Article = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  is_published: boolean
  author_id: string
}

export const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchArticle(id)
    }
  }, [id])

  const fetchArticle = async (articleId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tutorial_articles')
        .select('*')
        .eq('id', articleId)
        .eq('is_published', true)
        .single()
      
      if (error) {
        setError('文章未找到或已被删除')
      } else {
        setArticle(data)
      }
    } catch (err) {
      console.error('加载文章失败:', err)
      setError('加载文章时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'tutorial': '#1890ff',
      'announcement': '#52c41a', 
      'help': '#faad14',
      'faq': '#722ed1'
    }
    return colors[category as keyof typeof colors] || '#d9d9d9'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      'tutorial': '教程指南',
      'announcement': '公告通知',
      'help': '帮助文档',
      'faq': '常见问题'
    }
    return labels[category as keyof typeof labels] || category
  }

  const formatContent = (content: string) => {
    // 简单的 markdown 格式处理
    return content
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 2rem; font-weight: bold; color: #00ffff; margin: 2rem 0 1rem 0; border-bottom: 2px solid #00ffff; padding-bottom: 0.5rem;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5rem; font-weight: 600; color: #00ffff; margin: 1.5rem 0 1rem 0;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.25rem; font-weight: 600; color: #00ffff; margin: 1.25rem 0 0.75rem 0;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00ffff; font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #666666; font-style: italic;">$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: #f1f3f4; color: #00ffff; padding: 0.125rem 0.25rem; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333' }}>
        <Header />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
          <Loading size="large" content="加载中..." />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333' }}>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ color: '#666666', marginBottom: '1rem' }}>页面不存在</h1>
          <p style={{ color: '#999999', marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={() => navigate('/overview')}
            style={{
              background: '#1a1a1a',
              border: 'none',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            返回帮助中心
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333' }}>
      <Header />
      <Breadcrumb 
        items={[
          { path: '/', label: '首页' },
          { path: '/overview', label: '帮助中心' },
          { path: `/article/${article.id}`, label: article.title }
        ]}
      />
      
      <div style={{ padding: '2rem' }}>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* 返回按钮 */}
          <button 
            onClick={() => navigate('/overview')}
            style={{
              color: '#999999',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← 返回
          </button>
          
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '3rem'
            }}
          >
            {/* 文章头部 */}
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span 
                  style={{
                    background: '#f0f0f0',
                    color: '#666666',
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}
                >
                  {getCategoryLabel(article.category)}
                </span>
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: '#999999'
                }}>
                  {new Date(article.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 600, 
                color: '#1a1a1a', 
                lineHeight: 1.2,
                marginBottom: '1rem',
                letterSpacing: '-0.02em'
              }}>
                {article.title}
              </h1>
              
              {article.tags && article.tags.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index}
                      style={{
                        fontSize: '0.75rem',
                        color: '#999999',
                        background: '#f0f0f0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>
            
            {/* 文章内容 */}
            <div 
              style={{ 
                fontSize: '1rem', 
                lineHeight: 1.8, 
                color: '#333333',
                textAlign: 'left'
              }}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(article.content) 
              }}
            />
          </div>
        </div>
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: '#1a1a1a',
        color: '#ffffff',
        border: 'none',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
      }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑
      </div>
    </div>
  )
}