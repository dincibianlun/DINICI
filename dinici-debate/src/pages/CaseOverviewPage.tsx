import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

type ArticleCategory = {
  label: string
  value: string
  count: number
}

export const CaseOverviewPage = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  useEffect(() => {
    filterArticles()
    updateCategories()
  }, [articles, selectedCategory])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tutorial_articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setArticles(data)
      }
    } catch (err) {
      console.error('加载文章失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    if (selectedCategory === 'all') {
      setFilteredArticles(articles)
    } else {
      setFilteredArticles(articles.filter(article => article.category === selectedCategory))
    }
  }

  const updateCategories = () => {
    const categoryMap = new Map<string, { label: string; count: number }>()
    
    // 定义分类显示信息
    const categoryInfo = {
      'tutorial': { label: '教程指南' },
      'announcement': { label: '公告通知' },
      'help': { label: '帮助文档' },
      'faq': { label: '常见问题' }
    }
    
    // 统计每个分类的文章数量
    articles.forEach(article => {
      const current = categoryMap.get(article.category) || { 
        label: categoryInfo[article.category as keyof typeof categoryInfo]?.label || article.category,
        count: 0 
      }
      categoryMap.set(article.category, { ...current, count: current.count + 1 })
    })
    
    const categoriesArray = Array.from(categoryMap.entries()).map(([value, info]) => ({
      label: info.label,
      value,
      count: info.count
    }))
    
    setCategories([
      { label: '全部文章', value: 'all', count: articles.length },
      ...categoriesArray
    ])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem' }}>
        <header 
          style={{
            borderBottom: '1px solid #e5e5e5',
            paddingBottom: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 600, 
              color: '#1a1a1a', 
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              帮助中心
            </h1>
            <p style={{ 
              fontSize: '1rem', 
              color: '#666666', 
              lineHeight: 1.6,
              marginBottom: '1.5rem',
              maxWidth: '480px',
              margin: '0 auto 1.5rem'
            }}>
              专业的AI辩论平台使用指南，为您提供完整的操作说明和解决方案
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: '2rem', 
              fontSize: '0.875rem', 
              color: '#999999' 
            }}>
              <span>{articles.length} 篇文章</span>
              <span>{categories.length - 1} 个分类</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
          {/* 分类导航 */}
          <div style={{
            background: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e5e5e5',
            padding: '1.5rem'
          }}>
            <h2 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: '#1a1a1a', 
              marginBottom: '1rem'
            }}>
              分类
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {categories.map(category => (
                <button
                  key={category.value}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    background: selectedCategory === category.value 
                      ? '#1a1a1a' 
                      : 'transparent',
                    border: 'none',
                    color: selectedCategory === category.value ? '#ffffff' : '#666666',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: selectedCategory === category.value ? 500 : 400,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedCategory(category.value)}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.value) {
                      e.currentTarget.style.background = '#f0f0f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.value) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <span>{category.label}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: selectedCategory === category.value ? '#cccccc' : '#999999',
                      background: selectedCategory === category.value ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '12px'
                    }}>
                      {category.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 文章列表 */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
                <Loading size="large" content="加载中..." />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '4rem 2rem',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e5e5e5'
              }}>
                <p style={{ color: '#999999', fontSize: '1rem' }}>暂无内容</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredArticles.map(article => (
                <div
                  key={article.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cccccc'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 600, 
                        color: '#1a1a1a', 
                        marginBottom: '0.5rem',
                        lineHeight: 1.4
                      }}>
                        {article.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <span style={{
                          background: '#f0f0f0',
                          color: '#666666',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}>
                          {categories.find(c => c.value === article.category)?.label || article.category}
                        </span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#999999'
                        }}>
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ 
                      color: '#666666', 
                      fontSize: '0.875rem', 
                      lineHeight: 1.6, 
                      marginBottom: '1rem'
                    }}>
                      {article.content.replace(/[#*`]/g, '').substring(0, 150)}...
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {article.tags?.slice(0, 3).map((tag, index) => (
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
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <Link to={`/article/${article.id}`} style={{ textDecoration: 'none' }}>
                        <button
                          style={{
                            background: '#1a1a1a',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          查看详情
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}