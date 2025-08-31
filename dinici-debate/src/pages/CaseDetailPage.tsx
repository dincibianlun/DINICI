import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Tag, Typography, MessagePlugin } from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeftIcon } from 'tdesign-icons-react';
import { viewCase } from '../services/caseService';
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
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchDebateRecord();
    
    // 记录案例浏览统计
    if (id) {
      viewCase(id, user?.id).catch(console.error);
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
      }
    } catch (err) {
      console.error('Error fetching debate record:', err);
      MessagePlugin.error('获取辩论记录失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
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
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
        <Header />
        <Breadcrumb />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
          <Typography.Title level="h3" style={{ color: '#ffffff' }}>辩论记录不存在或已被删除</Typography.Title>
          <Button 
            onClick={() => navigate('/library')} 
            style={{ marginTop: '1rem', background: '#00ffff', border: 'none', color: '#000000' }}
          >
            <ArrowLeftIcon style={{ marginRight: '0.5rem' }} /> 返回案例库
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem' }}>
        <Button
          onClick={() => navigate('/library')}
          style={{ 
            marginBottom: '2rem', 
            background: 'transparent', 
            border: '1px solid #00ffff', 
            color: '#00ffff'
          }}
        >
          <ArrowLeftIcon style={{ marginRight: '0.5rem' }} /> 返回案例库
        </Button>

        <Card style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(0, 255, 255, 0.1)',
          borderRadius: '8px'
        }}>
          {/* 辩论信息头部 */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>
            <Typography.Title level="h2" style={{ color: '#00ffff', marginBottom: '1rem' }}>
              {debateRecord.topic}
            </Typography.Title>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <Tag style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', color: '#00ff88' }}>
                正方：{debateRecord.positive_model.split('/').pop()}
              </Tag>
              <Tag style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b' }}>
                反方：{debateRecord.negative_model.split('/').pop()}
              </Tag>
              <Tag style={{ background: 'rgba(0, 255, 255, 0.1)', border: '1px solid #00ffff', color: '#00ffff' }}>
                裁判：{debateRecord.judge_model.split('/').pop()}
              </Tag>
            </div>

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#888888' }}>
              <span>创建时间：{new Date(debateRecord.created_at).toLocaleString()}</span>
              <span>发言数：{messages.length}</span>
              {debateRecord.views && <span>浏览：{debateRecord.views}</span>}
            </div>
          </div>

          {/* 辩论内容 */}
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
            <Typography.Title level="h3" style={{ color: '#00ffff', marginBottom: '1.5rem' }}>
              辩论记录
            </Typography.Title>
            
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#888888' }}>
                暂无辩论内容
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((message, index) => {
                  const roleKey = message.speaker.replace(/（.*?）/, ''); // 移除括号内容
                  const color = roleColors[roleKey as keyof typeof roleColors] || '#cccccc';
                  
                  return (
                    <div 
                      key={index}
                      style={{
                        padding: '1.5rem',
                        background: `rgba(${color === '#00ff88' ? '0, 255, 136' : color === '#ff6b6b' ? '255, 107, 107' : color === '#ffd93d' ? '255, 217, 61' : '0, 255, 255'}, 0.05)`,
                        border: `1px solid rgba(${color === '#00ff88' ? '0, 255, 136' : color === '#ff6b6b' ? '255, 107, 107' : color === '#ffd93d' ? '255, 217, 61' : '0, 255, 255'}, 0.2)`,
                        borderRadius: '8px',
                        borderLeft: `4px solid ${color}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ color, fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {message.speaker}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#888888' }}>
                          <span>{message.phase}</span>
                          <span>{message.wordCount}字</span>
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div style={{ color: '#ffffff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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