import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Card, 
  Input, 
  Button,
  MessagePlugin,
  Loading,
  Tag,
  Select
} from 'tdesign-react'
import { SearchOutlined, HeartOutlined } from '@ant-design/icons';
import { searchCases } from '../services/caseService'
import { supabase } from '../lib/supabaseClient'
import { Header } from '../components/Header'
import { Breadcrumb } from '../components/Breadcrumb'
import '../styles/case-library.css'
import '../styles/input-fix.css'

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
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new')
  // 添加用户点赞状态的状态
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCases()
  }, [sortBy])

  useEffect(() => {
    filterCases()
  }, [searchText, cases])

  const fetchCases = async () => {
    try {
      setLoading(true)
      console.log('开始获取公开案例数据...')
      
      // 只获取公开的案例
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('is_public', true)  // 确保只获取公开的案例
        .order('created_at', { ascending: false });
      
      console.log('公开案例数据:', { data, error });
      
      if (!error && data) {
        console.log('成功获取公开案例数据，数量:', data.length);
        // 打印第一条数据的字段结构来查看点赞字段名
        if (data.length > 0) {
          console.log('第一条案例数据字段:', Object.keys(data[0]));
          console.log('第一条案例数据:', data[0]);
        }
        
        setCases(data)
        // 初始化用户点赞状态
        checkUserLikes(data);
      } else if (error) {
        console.error('获取案例数据错误:', error)
        MessagePlugin.error('获取案例数据失败: ' + error.message);
      }
    } catch (err) {
      console.error('Error fetching cases:', err)
      MessagePlugin.error('获取案例数据时发生错误');
    } finally {
      setLoading(false)
    }
  }

  // 检查用户对案例的点赞状态
  const checkUserLikes = async (casesData: DebateCase[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 获取用户点赞的案例ID列表
      const { data: likesData, error } = await supabase
        .from('user_likes')
        .select('case_id')
        .eq('user_id', user.id)
        .in('case_id', casesData.map(c => c.id));

      if (!error && likesData) {
        const likesMap: Record<string, boolean> = {};
        likesData.forEach(like => {
          likesMap[like.case_id] = true;
        });
        setUserLikes(likesMap);
      }
    } catch (err) {
      console.error('检查用户点赞状态时出错:', err);
    }
  };

  const filterCases = () => {
    // 如果还在加载中，不进行过滤
    if (loading) {
      return
    }

    let result = [...cases]
    
    // 按搜索文本过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      result = result.filter(item => 
        (item.topic && item.topic.toLowerCase().includes(lowerSearch)) || 
        (item.summary && item.summary.toLowerCase().includes(lowerSearch))
      )
    }
    
    setFilteredCases(result)
  }

  // 辅助函数：获取点赞数
  const getLikeCount = (item: DebateCase): number => {
    // 首先检查 likes 字段（与案例详情页保持一致）
    if (item.hasOwnProperty('likes')) {
      const value = item.likes;
      // 确保值是数字类型
      if (typeof value === 'number' && !isNaN(value)) {
        return value;
      }
      // 如果是字符串类型，尝试转换为数字
      if (typeof value === 'string') {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          return numValue;
        }
      }
      // 如果是 null 或 undefined，返回 0
      if (value === null || value === undefined) {
        return 0;
      }
    }
    
    // 如果 likes 字段不存在或无效，尝试其他可能的字段名
    const likeFields = ['like_count', 'vote_count', 'upvotes', 'favorites'];
    for (const field of likeFields) {
      if (item.hasOwnProperty(field)) {
        const value = item[field as keyof DebateCase];
        // 确保值是数字类型
        if (typeof value === 'number' && !isNaN(value)) {
          return value;
        }
        // 如果是字符串类型，尝试转换为数字
        if (typeof value === 'string') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            return numValue;
          }
        }
      }
    }
    
    // 如果找不到有效的点赞数字段，返回默认值0
    return 0;
  };

  // 处理点赞/取消点赞
  const handleLike = async (caseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.warning('请先登录后再点赞');
        return;
      }

      const isLiked = userLikes[caseId];
      
      if (isLiked) {
        // 取消点赞
        const { error } = await supabase
          .from('user_likes')
          .delete()
          .match({ user_id: user.id, case_id: caseId });
          
        if (!error) {
          // 更新本地状态
          setUserLikes(prev => {
            const newLikes = { ...prev };
            delete newLikes[caseId];
            return newLikes;
          });
          
          // 更新案例点赞数
          setCases(prev => prev.map(c => 
            c.id === caseId ? { ...c, likes: Math.max(0, (c.likes || 0) - 1) } : c
          ));
        }
      } else {
        // 添加点赞
        const { error } = await supabase
          .from('user_likes')
          .insert({ user_id: user.id, case_id: caseId });
          
        if (!error) {
          // 更新本地状态
          setUserLikes(prev => ({ ...prev, [caseId]: true }));
          
          // 更新案例点赞数
          setCases(prev => prev.map(c => 
            c.id === caseId ? { ...c, likes: (c.likes || 0) + 1 } : c
          ));
        }
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
      MessagePlugin.error('操作失败，请重试');
    }
  };

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
            <span>{filteredCases.length > 0 || searchText ? filteredCases.length : cases.length} 个符合条件</span>
          </div>
        </div>
      </header>

      {/* 搜索和排序区 */}
      <div 
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Input
              placeholder="搜索辩题或摘要..."
              value={searchText}
              onChange={(value) => setSearchText(value)}
              prefixIcon={<SearchOutlined />}
              style={{ 
                background: '#ffffff', 
                border: '1px solid #e9ecef',
                color: '#333333'
              }}
              clearable
              className="tdesign-input-fix"
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#666666', fontSize: '0.875rem' }}>排序:</span>
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value as 'new' | 'hot')}
              style={{ width: '120px' }}
            >
              <Select.Option key="new" value="new">最新</Select.Option>
              <Select.Option key="hot" value="hot">最热</Select.Option>
            </Select>
          </div>
        </div>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" content="加载案例中..." />
        </div>
      ) : (filteredCases.length > 0 ? filteredCases : cases).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #e9ecef'
        }}>
          <p style={{ color: '#666666', marginBottom: '1rem' }}>没有找到匹配的案例</p>
          <Button 
            theme="default" 
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
          {(filteredCases.length > 0 ? filteredCases : cases).map(item => (
            <Link 
              key={item.id} 
              to={`/library/${item.id}`} 
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
                      {item.topic || '无标题'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <Tag 
                        theme="primary" 
                        variant="light"
                        style={{ fontSize: '0.75rem' }}
                      >
                        正方: {item.positive_model ? item.positive_model.split('/')[1] || item.positive_model : '未知'}
                      </Tag>
                      <Tag 
                        theme="warning" 
                        variant="light"
                        style={{ fontSize: '0.75rem' }}
                      >
                        反方: {item.negative_model ? item.negative_model.split('/')[1] || item.negative_model : '未知'}
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
                    paddingTop: '1rem',
                    borderTop: '1px solid #f1f3f4',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#999999' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '未知日期'}
                    </div>
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        color: '#666666',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => handleLike(item.id, e)}
                    >
                      <HeartOutlined 
                        style={{ 
                          fontSize: '0.875rem',
                          color: userLikes[item.id] ? '#ff4d4f' : '#666666'
                        }} 
                      />
                      <span>{getLikeCount(item)}</span>
                    </div>
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