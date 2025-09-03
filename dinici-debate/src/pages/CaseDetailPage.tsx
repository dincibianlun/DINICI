import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Tag, Typography, MessagePlugin } from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { LeftOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { viewCase, likeCase } from '../services/caseService';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';

// 辩论消息类型
type DebateMessage = {
  speaker: string;
  content: string;
  phase: string;
  timestamp: string;
  wordCount: number;
};

// 辩论记录类型
type DebateRecord = {
  id: string;
  topic: string;
  positive_model: string;
  negative_model: string;
  judge_model: string;
  content: DebateMessage[];
  conversation?: DebateMessage[];
  created_at: string;
  views?: number;
  likes?: number;
  user_id: string;
  is_public: boolean;
};

export const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [debateRecord, setDebateRecord] = useState<DebateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchDebateRecord();
    
    // 记录案例浏览统计
    if (id) {
      viewCase(id, user?.id).catch(console.error);
    }

    // 检查用户点赞状态
    if (user && id) {
      checkLikeStatus();
    }
  }, [id, user?.id]);

  const fetchDebateRecord = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (data) {
        setDebateRecord(data as DebateRecord);
        setLikeCount(data.likes || 0);
      }
    } catch (err) {
      console.error('Error fetching debate record:', err);
      MessagePlugin.error('获取辩论记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 检查用户点赞状态
  const checkLikeStatus = async () => {
    if (!user || !id) return;
    
    try {
      // 先尝试查询user_likes表
      try {
        const { data, error } = await supabase
          .from('user_likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('case_id', id)
          .single();
        
        if (!error && data) {
          setLiked(true);
          return;
        }
      } catch (error) {
        console.warn('查询user_likes表失败，表可能不存在:', error);
      }
      
      // 如果user_likes表不存在或查询失败，尝试查询user_activity_stats表
      try {
        const { data, error } = await supabase
          .from('user_activity_stats')
          .select('*')
          .eq('user_id', user.id)
          .eq('activity_type', 'like')
          .gt('count', 0)
          .single();
        
        if (!error && data) {
          setLiked(true);
          return;
        }
      } catch (error) {
        console.warn('查询user_activity_stats表失败:', error);
      }
      
      // 如果两个表都查询失败，默认为未点赞状态
      setLiked(false);
    } catch (err) {
      console.error('检查点赞状态失败:', err);
      setLiked(false);
    }
  };

  // 处理点赞/取消点赞
  const handleLike = async () => {
    if (!user) {
      MessagePlugin.warning('请先登录后再点赞');
      return;
    }

    if (!id) return;

    try {
      if (liked) {
        // 取消点赞
        // 1. 从user_likes表中删除记录
        try {
          const { error } = await supabase
            .from('user_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('case_id', id);

          if (error && error.code !== '42P01') { // 42P01是表不存在的错误
            console.error('删除点赞记录失败:', error);
          }
        } catch (error) {
          console.error('删除点赞记录操作异常:', error);
        }

        // 2. 更新案例点赞数
        await supabase
          .from('debates')
          .update({ likes: Math.max(0, likeCount - 1) })
          .eq('id', id);

        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        MessagePlugin.success('已取消点赞');
      } else {
        // 添加点赞
        // 1. 尝试向user_likes表添加记录
        try {
          const { error: insertError } = await supabase
            .from('user_likes')
            .insert({
              user_id: user.id,
              case_id: id,
              created_at: new Date().toISOString()
            });

          if (insertError && insertError.code !== '42P01') { // 42P01是表不存在的错误
            console.error('添加点赞记录失败:', insertError);
          }
        } catch (error) {
          console.error('添加点赞记录操作异常:', error);
        }

        // 2. 更新案例点赞数
        await supabase
          .from('debates')
          .update({ likes: likeCount + 1 })
          .eq('id', id);

        // 3. 记录用户活动（无论user_likes表是否存在）
        try {
          await likeCase(id, user.id);
        } catch (err) {
          console.warn('记录点赞活动失败（不影响主要功能）:', err);
        }

        setLiked(true);
        setLikeCount(prev => prev + 1);
        MessagePlugin.success('点赞成功');
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
      // 显示更用户友好的错误信息
      MessagePlugin.error('点赞操作失败，请稍后再试');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a1a' }}>
        <Header />
        <Breadcrumb />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Loading size="large" text="加载辩论记录..." />
        </div>
      </div>
    );
  }

  if (!debateRecord) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a1a' }}>
        <Header />
        <Breadcrumb />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
          <Typography.Title level="h3" style={{ color: '#1a1a1a' }}>辩论记录不存在或已被删除</Typography.Title>
          <Button 
            onClick={() => navigate('/library')} 
            style={{ marginTop: '1rem', background: '#007bff', border: 'none', color: '#ffffff' }}
          >
            <LeftOutlined style={{ marginRight: '0.5rem', fontSize: 14 }} /> 返回案例库
          </Button>
        </div>
      </div>
    );
  }

  // 获取辩论消息数组
  const messages = debateRecord.content || debateRecord.conversation || [];
  
  // 按角色分组消息
  const roleColors = {
    '主持人': '#ffd93d',
    '正方': '#00ff88', 
    '反方': '#ff6b6b',
    '裁判': '#00ffff'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a1a' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem' }}>
        <Button
          onClick={() => navigate('/library')}
          style={{ 
            marginBottom: '2rem', 
            background: 'transparent', 
            border: '1px solid #007bff', 
            color: '#007bff'
          }}
        >
          <LeftOutlined style={{ marginRight: '0.5rem', fontSize: 14 }} /> 返回案例库
        </Button>

        <Card style={{
          background: '#ffffff',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          {/* 辩论信息头部 */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', borderBottom: '1px solid #e9ecef' }}>
            <Typography.Title level="h2" style={{ color: '#1a1a1a', marginBottom: '1rem' }}>
              {debateRecord.topic}
            </Typography.Title>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <Tag style={{ 
                background: '#e8f5e8', 
                border: '1px solid #28a745', 
                color: '#28a745',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                正方：{debateRecord.positive_model.split('/').pop()}
              </Tag>
              <Tag style={{ 
                background: '#ffeaea', 
                border: '1px solid #dc3545', 
                color: '#dc3545',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                反方：{debateRecord.negative_model.split('/').pop()}
              </Tag>
              <Tag style={{ 
                background: '#e7f3ff', 
                border: '1px solid #007bff', 
                color: '#007bff',
                fontSize: '0.95rem',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                裁判：{debateRecord.judge_model.split('/').pop()}
              </Tag>
            </div>

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#666666' }}>
              <span>创建时间：{new Date(debateRecord.created_at).toLocaleString()}</span>
              <span>发言数：{messages.length}</span>
              {debateRecord.views && <span>浏览：{debateRecord.views}</span>}
              
              {/* 点赞按钮 */}
              <span 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  color: liked ? '#ff4d4f' : '#666666',
                  transition: 'all 0.3s ease',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${liked ? '#ff4d4f' : '#d9d9d9'}`,
                  backgroundColor: liked ? '#fff2f0' : 'transparent',
                  fontSize: '0.875rem'
                }}
                onClick={handleLike}
                onMouseEnter={(e) => { 
                  if (!liked) {
                    e.currentTarget.style.color = '#ff4d4f';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!liked) {
                    e.currentTarget.style.color = '#666666';
                    e.currentTarget.style.borderColor = '#d9d9d9';
                  }
                }}
              >
                {liked ? <HeartFilled style={{ fontSize: '16px' }} /> : <HeartOutlined style={{ fontSize: '16px' }} />}
                <span>点赞{likeCount > 0 ? `(${likeCount})` : ''}</span>
              </span>
            </div>
          </div>

          {/* 辩论内容 */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <Typography.Title level="h3" style={{ color: '#1a1a1a', marginBottom: '1.5rem' }}>
              辩论记录
            </Typography.Title>
            
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666666' }}>
                暂无辩论内容
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((message, index) => {
                  const roleKey = message.speaker.replace(/（.*?）/, ''); // 移除括号内容
                  
                  // 更新角色颜色配置
                  const roleStyles = {
                    '主持人': { bg: '#fff3cd', border: '#ffc107', color: '#856404' },
                    '正方': { bg: '#d4edda', border: '#28a745', color: '#155724' },
                    '反方': { bg: '#f8d7da', border: '#dc3545', color: '#721c24' },
                    '裁判': { bg: '#cce7ff', border: '#007bff', color: '#004085' }
                  };
                  
                  const style = roleStyles[roleKey as keyof typeof roleStyles] || { bg: '#f8f9fa', border: '#6c757d', color: '#495057' };
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        padding: '1.5rem',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: '8px',
                        borderLeft: `4px solid ${style.border}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ color: style.color, fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {message.speaker}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666666' }}>
                          <span>{message.phase}</span>
                          <span>{message.wordCount}字</span>
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div style={{ color: '#1a1a1a', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};