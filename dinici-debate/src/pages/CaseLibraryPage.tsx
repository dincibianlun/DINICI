import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Card, 
  Input, 
  Select, 
  Tag,
  Button,
  Space,
  MessagePlugin,
  Loading
} from 'tdesign-react'
import { 
  SearchIcon, 
  TimeIcon,
  ThumbUpIcon
} from 'tdesign-icons-react'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { Breadcrumb } from '../components/Breadcrumb'
import '../styles/case-library.css'

type DebateCase = {
  id: string
  topic: string
  positive_model: string
  negative_model: string
  created_at: string
  tags?: string[]
  is_public: boolean
  views?: number
  likes?: number
  comments?: number
  summary?: string
}

export const CaseLibraryPage = () => {
  const [cases, setCases] = useState<DebateCase[]>([])
  const [filteredCases, setFilteredCases] = useState<DebateCase[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    filterCases()
  }, [searchText, cases])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setCases(data)
      }
    } catch (err) {
      console.error('Error fetching cases:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterCases = () => {
    let result = [...cases]
    
    // 按搜索文本过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      result = result.filter(item => 
        item.topic.toLowerCase().includes(lowerSearch) || 
        (item.summary && item.summary.toLowerCase().includes(lowerSearch))
      )
    }
    
    // 按创建时间排序（最新在前）
    result.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    setFilteredCases(result)
  }

  const handleShare = async (caseId: string) => {
    const { error } = await supabase
      .from('debates')
      .update({ is_public: true })
      .eq('id', caseId)
    
    if (!error) {
      MessagePlugin.success('案例已分享到公开库')
      fetchCases()
    }
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#333333'
      }}
    >
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
            辩论案例库
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#666666', 
            lineHeight: 1.6,
            marginBottom: '1.5rem',
            maxWidth: '480px',
            margin: '0 auto 1.5rem'
          }}>
            探索用户分享的精彩辩论案例，发现不同的观点和论证方式
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: '2rem', 
            fontSize: '0.875rem', 
            color: '#999999' 
          }}>
            <span>共 {cases.length} 个案例</span>
            <span>{filteredCases.length} 个符合条件</span>
          </div>
        </div>
      </header>

      {/* 搜索区 */}
      <div 
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}
      >
        <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
          <SearchIcon style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#999999' }} />
          <Input
            placeholder="搜索辩题或摘要..."
            value={searchText}
            onChange={(value) => setSearchText(value)}
            style={{ paddingLeft: '2.5rem', background: '#ffffff', border: '1px solid #e9ecef' }}
            clearable
          />
        </div>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" content="加载案例中..." />
        </div>
      ) : filteredCases.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #e9ecef'
        }}>
          <p style={{ color: '#666666', marginBottom: '1rem' }}>没有找到匹配的案例</p>
          <Button 
            variant="text" 
            onClick={fetchCases}
            style={{ color: '#007bff' }}
          >
            重新加载
          </Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCases.map(item => (
            <Link 
              key={item.id} 
              to={`/case/${item.id}`} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Card
                bordered
                style={{
                  height: '100%',
                  background: '#ffffff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#1a1a1a',
                      marginBottom: '0.75rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.topic}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <Tag 
                        theme="primary" 
                        variant="light"
                        style={{ fontSize: '0.75rem' }}
                      >
                        正方: {item.positive_model.split('/')[1] || item.positive_model}
                      </Tag>
                      <Tag 
                        theme="warning" 
                        variant="light"
                        style={{ fontSize: '0.75rem' }}
                      >
                        反方: {item.negative_model.split('/')[1] || item.negative_model}
                      </Tag>
                    </div>
                    <p style={{
                      color: '#666666',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.summary || '该案例暂无摘要信息'}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '1rem' }}>
                        {item.tags.map(tag => (
                          <Tag 
                            key={tag} 
                            variant="outline" 
                            size="small"
                            style={{ fontSize: '0.75rem', color: '#666666', borderColor: '#e9ecef' }}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    marginTop: 'auto', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f1f3f4'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#999999' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <Button 
                      variant="outline" 
                      size="small"
                      className="view-button"
                      style={{
                        borderColor: '#007bff',
                        color: '#007bff',
                        background: 'transparent'
                      }}
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}