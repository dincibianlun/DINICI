import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  MessagePlugin,
  Loading,
  Statistic,
  Row,
  Col
} from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';

type UserDebate = {
  id: string;
  topic: string;
  positive_model: string;
  negative_model: string;
  judge_model: string;
  created_at: string;
  is_public: boolean;
  views?: number;
  likes?: number;
  tags?: string[];
};

type UserStats = {
  totalDebates: number;
  publicDebates: number;
  totalLikes: number;
  joinDate: string;
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [debates, setDebates] = useState<UserDebate[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // 获取用户辩论记录
      const { data: debatesData, error: debatesError } = await supabase
        .from('debates')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (debatesError) throw debatesError;
      
      setDebates(debatesData || []);
      
      // 计算统计数据
      const publicDebates = debatesData?.filter(d => d.is_public) || [];
      const totalLikes = debatesData?.reduce((sum, d) => sum + (d.likes || 0), 0) || 0;
      
      setStats({
        totalDebates: debatesData?.length || 0,
        publicDebates: publicDebates.length,
        totalLikes,
        joinDate: user!.created_at || new Date().toISOString()
      });
      
    } catch (error) {
      console.error('获取用户数据失败:', error);
      MessagePlugin.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDebate = async (debateId: string) => {
    try {
      const { error } = await supabase
        .from('debates')
        .delete()
        .eq('id', debateId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      MessagePlugin.success('删除成功');
      fetchUserData(); // 重新加载数据
    } catch (error) {
      console.error('删除失败:', error);
      MessagePlugin.error('删除失败');
    }
  };
  
  const handleTogglePublic = async (debateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('debates')
        .update({ is_public: !currentStatus })
        .eq('id', debateId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      MessagePlugin.success(currentStatus ? '取消公开' : '设为公开');
      fetchUserData();
    } catch (error) {
      console.error('更新失败:', error);
      MessagePlugin.error('操作失败');
    }
  };
  
  const columns = [
    {
      colKey: 'topic',
      title: '辩论题目',
      width: 300,
      cell: ({ row }: { row: UserDebate }) => (
        <Link 
          to={`/library/${row.id}`}
          style={{ color: '#00ffff', textDecoration: 'none', fontWeight: 'bold' }}
        >
          {row.topic}
        </Link>
      )
    },
    {
      colKey: 'models',
      title: '模型配置',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#28a745', marginRight: '0.5rem' }}>• 正方:</span>
            {row.positive_model ? row.positive_model.split('/').pop() : '未知'}
          </div>
          <div style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#dc3545', marginRight: '0.5rem' }}>• 反方:</span>
            {row.negative_model ? row.negative_model.split('/').pop() : '未知'}
          </div>
          <div>
            <span style={{ color: '#007bff', marginRight: '0.5rem' }}>• 裁判:</span>
            {row.judge_model ? row.judge_model.split('/').pop() : '未知'}
          </div>
        </div>
      )
    },
    {
      colKey: 'status',
      title: '状态',
      cell: ({ row }: { row: UserDebate }) => (
        <Tag 
          theme={row.is_public ? 'success' : 'default'}
          variant="light"
          style={{
            background: row.is_public ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: row.is_public ? '#28a745' : 'rgba(255, 255, 255, 0.7)',
            border: row.is_public ? '1px solid rgba(40, 167, 69, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.85rem'
          }}
        >
          {row.is_public ? '公开' : '私有'}
        </Tag>
      )
    },
    {
      colKey: 'views',
      title: '点赞数',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem', opacity: 0.7 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#ff4d4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {row.likes || 0}
        </div>
      )
    },
    {
      colKey: 'created_at',
      title: '创建时间',
      cell: ({ row }: { row: UserDebate }) => {
        if (!row.created_at) return '未知时间';
        
        const date = new Date(row.created_at);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return (
          <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <div>{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        );
      }
    },
    {
      colKey: 'actions',
      title: '操作',
      width: 200,
      cell: ({ row }: { row: UserDebate }) => (
        <Space>
          <Button
            size="small"
            variant="outline"
            theme={row.is_public ? 'default' : 'primary'}
            style={{
              borderColor: row.is_public ? 'rgba(255, 255, 255, 0.3)' : '#00ffff',
              color: row.is_public ? 'rgba(255, 255, 255, 0.7)' : '#00ffff',
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem'
            }}
            onClick={() => handleTogglePublic(row.id, row.is_public)}
          >
            {row.is_public ? '取消公开' : '设为公开'}
          </Button>
          <Button
            size="small"
            theme="danger"
            variant="outline"
            style={{
              borderColor: '#ff4d4f',
              color: '#ff4d4f',
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem'
            }}
            onClick={() => handleDeleteDebate(row.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loading size="large" loading style={{ color: '#333333' }} />
          <div style={{ marginTop: '1rem', color: '#6c757d' }}>加载中...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 用户信息顶部区域 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '2rem',
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: '#f8f9fa', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333333',
            marginRight: '1.5rem',
            border: '1px solid #e9ecef'
          }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 style={{ 
              color: '#333333', 
              marginBottom: '0.5rem',
              fontSize: '1.5rem'
            }}>
              {user?.email?.split('@')[0] || '用户'}
            </h2>
            <p style={{ color: '#6c757d', margin: 0 }}>
              {user?.email || ''} · 注册于 {new Date(stats?.joinDate || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* 用户统计卡片组 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* 总辩论数 */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '0.75rem', 
            padding: '1.5rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333333', marginBottom: '0.5rem' }}>
              {stats?.totalDebates || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              总辩论数
            </div>
          </div>

          {/* 公开辩论 */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '0.75rem', 
            padding: '1.5rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
              {stats?.publicDebates || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              公开辩论
            </div>
          </div>

          {/* 总点赞数 */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '0.75rem', 
            padding: '1.5rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '0.5rem' }}>
              {stats?.totalLikes || 0}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              总点赞数
            </div>
          </div>

          {/* 注册时间 */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '0.75rem', 
            padding: '1.5rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6c757d', marginBottom: '0.5rem' }}>
              {new Date(stats?.joinDate || '').toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              注册时间
            </div>
          </div>
        </div>

        {/* 辩论历史标题 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            color: '#333333', 
            fontSize: '1.25rem',
            margin: 0,
            fontWeight: '600'
          }}>
            我的辩论历史
          </h3>
          <Link to="/debate">
            <Button
              style={{
                background: '#ffffff',
                border: '1px solid #e9ecef',
                color: '#333333',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              开始新辩论
            </Button>
          </Link>
        </div>

        {/* 辩论记录卡片列表 */}
        {debates.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem',
            color: '#6c757d',
            background: '#ffffff',
            borderRadius: '0.75rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>还没有辩论记录</p>
            <p style={{ opacity: 0.7 }}>去开始你的第一场AI辩论吧！</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {debates.map(debate => (
              <div 
                key={debate.id} 
                style={{
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e9ecef',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Link 
                  to={`/library/${debate.id}`}
                  style={{ 
                    color: '#333333', 
                    textDecoration: 'none', 
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    display: 'block'
                  }}
                >
                  {debate.topic}
                </Link>
                
                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: '#28a745', marginRight: '0.5rem' }}>正方:</span>
                    {debate.positive_model.split('/').pop()}
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <span style={{ color: '#dc3545', marginRight: '0.5rem' }}>反方:</span>
                    {debate.negative_model.split('/').pop()}
                  </div>
                  <div>
                    <span style={{ color: '#007bff', marginRight: '0.5rem' }}>裁判:</span>
                    {debate.judge_model.split('/').pop()}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginTop: 'auto',
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '1rem'
                }}>
                  <div>
                    <Tag 
                      theme={debate.is_public ? 'success' : 'default'}
                      variant="light"
                      style={{
                        background: debate.is_public ? 'rgba(40, 167, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)',
                        color: debate.is_public ? '#28a745' : '#6c757d',
                        border: debate.is_public ? '1px solid rgba(40, 167, 69, 0.3)' : '1px solid rgba(108, 117, 125, 0.3)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem'
                      }}
                    >
                      {debate.is_public ? '公开' : '私有'}
                    </Tag>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      theme="primary"
                      variant="text"
                      size="small"
                      onClick={() => handleTogglePublic(debate.id, debate.is_public)}
                      style={{ 
                        color: '#007bff', 
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        minWidth: 'auto'
                      }}
                    >
                      {debate.is_public ? '取消公开' : '设为公开'}
                    </Button>
                    <Button 
                      theme="danger"
                      variant="text"
                      size="small"
                      onClick={() => handleDeleteDebate(debate.id)}
                      style={{ 
                        color: '#dc3545', 
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        minWidth: 'auto'
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 辅助函数：获取点赞数
const getLikeCount = (debate: UserDebate): number => {
  if (debate.hasOwnProperty('likes')) {
    const value = debate.likes;
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
  return 0; // 默认返回0
};
