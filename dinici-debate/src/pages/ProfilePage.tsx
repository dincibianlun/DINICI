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
  tags?: string[];
};

type UserStats = {
  totalDebates: number;
  publicDebates: number;
  totalViews: number;
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
      const totalViews = debatesData?.reduce((sum, d) => sum + (d.views || 0), 0) || 0;
      
      setStats({
        totalDebates: debatesData?.length || 0,
        publicDebates: publicDebates.length,
        totalViews,
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
      width: 200,
      cell: ({ row }: { row: UserDebate }) => (
        <Link 
          to={`/library/${row.id}`}
          style={{ color: '#007bff', textDecoration: 'none' }}
        >
          {row.topic}
        </Link>
      )
    },
    {
      colKey: 'models',
      title: '模型配置',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ fontSize: '0.75rem', color: '#666666' }}>
          <div>正方: {row.positive_model.split('/').pop()}</div>
          <div>反方: {row.negative_model.split('/').pop()}</div>
          <div>裁判: {row.judge_model.split('/').pop()}</div>
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
        >
          {row.is_public ? '公开' : '私有'}
        </Tag>
      )
    },
    {
      colKey: 'views',
      title: '浏览量',
      cell: ({ row }: { row: UserDebate }) => (
        <span>{row.views || 0}</span>
      )
    },
    {
      colKey: 'created_at',
      title: '创建时间',
      cell: ({ row }: { row: UserDebate }) => (
        <span>{new Date(row.created_at).toLocaleDateString()}</span>
      )
    },
    {
      colKey: 'actions',
      title: '操作',
      cell: ({ row }: { row: UserDebate }) => (
        <Space>
          <Button 
            theme="primary"
            variant="text"
            size="small"
            onClick={() => handleTogglePublic(row.id, row.is_public)}
            style={{ color: '#007bff' }}
          >
            {row.is_public ? '取消公开' : '设为公开'}
          </Button>
          <Button 
            theme="danger"
            variant="text"
            size="small"
            onClick={() => handleDeleteDebate(row.id)}
            style={{ color: '#dc3545' }}
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
        <Loading size="large" />
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a1a' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 用户统计信息 */}
        <Card 
          style={{
            background: '#ffffff',
            border: '1px solid #e9ecef',
            marginBottom: '2rem'
          }}
        >
          <div style={{ padding: '1rem' }}>
            <h2 style={{ 
              color: '#1a1a1a', 
              marginBottom: '1.5rem',
              fontSize: '1.5rem'
            }}>
              用户中心
            </h2>
            
            <Row gutter={16}>
              <Col span={3}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a' }}>
                    {stats?.totalDebates || 0}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                    总辩论数
                  </div>
                </div>
              </Col>
              <Col span={3}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                    {stats?.publicDebates || 0}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                    公开辩论
                  </div>
                </div>
              </Col>
              <Col span={3}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                    {stats?.totalViews || 0}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                    总浏览量
                  </div>
                </div>
              </Col>
              <Col span={3}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>
                    {new Date(stats?.joinDate || '').toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666666' }}>
                    注册时间
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 辩论历史记录 */}
        <Card 
          style={{
            background: '#ffffff',
            border: '1px solid #e9ecef'
          }}
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ 
                color: '#1a1a1a', 
                fontSize: '1.25rem',
                margin: 0
              }}>
                我的辩论历史
              </h3>
              <Link to="/debate">
                <Button
                    id="profile-start-debate-btn-1"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e9ecef',
                      color: '#000000'
                    }}
                  >
                    开始新辩论
                  </Button>
              </Link>
            </div>
            
            {debates.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '4rem',
                color: '#666666' 
              }}>
                <p>还没有辩论记录，去开始你的第一场AI辩论吧！</p>
              </div>
            ) : (
              <Table 
                data={debates}
                columns={columns}
                rowKey="id"
                size="small"
                style={{
                  background: 'transparent'
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};