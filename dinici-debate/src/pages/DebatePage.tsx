import { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select } from 'tdesign-react';
import { SpeakerHighlight } from '../components/SpeakerHighlight';
import { useDebateFlow } from '../hooks/useDebateFlow';
import { supabase } from '../lib/supabaseClient';

// 环境变量类型定义
export interface EnvironmentVariables {
  OPENROUTER_API_KEY: string;
  TTS_APPID: string;
  TTS_ACCESS_TOKEN: string;
}

// 需求文档定义的可选模型列表
const MODEL_OPTIONS = [
  { label: 'OPENAI', value: 'openai/gpt-5-chat' },
  { label: 'Claude', value: 'anthropic/claude-3-haiku' },
  { label: 'DeepSeek', value: 'deepseek/deepseek-chat-v3.1' },
  { label: '百度文心一言', value: 'baidu/ernie-4.5-vl-28b-a3b' },
  { label: '智谱清言', value: 'z-ai/glm-4.5' },
  { label: '月之暗面', value: 'moonshotai/kimi-k2' },
  { label: 'XAI-Grok', value: 'x-ai/grok-4' },
  { label: '通义千问', value: 'qwen/qwen-max' },
  { label: '谷歌gemini', value: 'google/gemini-2.5-pro' },
];

export const DebatePage = () => {
  const { phase, messages, isLoading, startNewDebate } = useDebateFlow();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [positiveModel, setPositiveModel] = useState('openai/gpt-5-chat');
  const [negativeModel, setNegativeModel] = useState('anthropic/claude-3-haiku');
  const [judgeModel, setJudgeModel] = useState('openai/gpt-5-chat');
  const [debateTopic, setDebateTopic] = useState<string>('人工智能的发展对人类社会利大于弊');
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // 检查用户API密钥配置（仅在开始辩论时检查）
  const checkUserApiKeys = async (): Promise<EnvironmentVariables | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('请先登录');
      }

      // 获取用户的OpenRouter密钥
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'openrouter')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!apiKeys || apiKeys.length === 0) {
        throw new Error('未找到OpenRouter API密钥，请先在设置中配置');
      }

      let openRouterKey = '';
      try {
        // 尝试解析JSON格式的密钥
        const openRouterConfig = JSON.parse(apiKeys[0].api_key);
        openRouterKey = openRouterConfig.key?.trim() || openRouterConfig.api_key?.trim() || '';
      } catch {
        // 解析失败则视为纯文本密钥
        openRouterKey = apiKeys[0].api_key.trim();
        openRouterKey = openRouterKey.trim();
        openRouterKey = openRouterKey.replace(/^["']|["']$/g, '');
      }
      if (!openRouterKey) {
        throw new Error('OpenRouter API密钥为空或格式无效，请检查设置');
      }
      if (openRouterKey.length < 20) {
        throw new Error('OpenRouter API密钥长度不足，可能无效，请检查设置');
      }
      console.log('从Supabase获取的原始API密钥数据:', apiKeys);
      console.log('解析后的API密钥配置:', openRouterConfig);
      console.log('处理后的OpenRouter密钥:', openRouterKey);

      // 获取用户的TTS配置
      const { data: ttsConfigs } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'tts')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!ttsConfigs || ttsConfigs.length === 0) {
        throw new Error('未找到TTS配置，请先在设置中配置');
      }

      if (apiKeys && apiKeys.length > 0 && ttsConfigs && ttsConfigs.length > 0) {
        const ttsConfig = JSON.parse(ttsConfigs[0].api_key);
        return {
          OPENROUTER_API_KEY: openRouterKey,
          TTS_APPID: ttsConfig.appid,
          TTS_ACCESS_TOKEN: ttsConfig.access_token
        };
      } else {
        return null;
      }
    } catch (err) {
      console.error('检查API密钥失败:', err);
      return null;
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = async () => {
    // 在开始辩论时才检查API密钥
    const apiKeys = await checkUserApiKeys();
    
    if (!apiKeys) {
      // 显示配置提示，但不阻止用户访问页面
      MessagePlugin.warning('开始辩论需要先配置API密钥和TTS参数');
      setTimeout(() => {
        window.location.href = '/settings';
      }, 2000);
      return;
    }

    try {
      await startNewDebate(
        debateTopic,
        positiveModel,
        negativeModel,
        judgeModel,
        apiKeys.OPENROUTER_API_KEY,
        {
          appid: apiKeys.TTS_APPID,
          accessToken: apiKeys.TTS_ACCESS_TOKEN
        }
      );
    } catch (error) {
      console.error('Failed to start debate:', error);
      MessagePlugin.error('开始辩论失败');
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      const { error } = await supabase
        .from('debates')
        .insert([{
          user_id: user.id,
          topic: debateTopic,
          positive_model: positiveModel,
          negative_model: negativeModel,
          judge_model: judgeModel,
          content: messages,
          created_at: new Date().toISOString(),
          is_public: isPublic
        }]);

      if (error) throw error;
      MessagePlugin.success('辩论记录已保存');
    } catch (err) {
      console.error('Failed to save debate:', err);
      MessagePlugin.error('保存辩论记录失败');
    }
  };

  const handleShare = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      const { data: debate, error: fetchError } = await supabase
        .from('debates')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic', debateTopic)
        .order('created_at', { ascending: false })
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('debates')
        .update({ is_public: true })
        .eq('id', debate.id);

      if (error) throw error;
      MessagePlugin.success('辩论案例已分享到公开库');
    } catch (err) {
      console.error('Failed to share debate:', err);
      MessagePlugin.error('分享辩论案例失败');
    }
  };

  // 计算辩论进度宽度
  const getProgressWidth = (currentPhase: string) => {
    const phases = [
      'preparing',
      'host_intro', 
      'positive_statement',
      'negative_rebuttal',
      'free_debate',
      'judge_summary',
      'completed'
    ];
    const currentIndex = phases.indexOf(currentPhase);
    return `${((currentIndex + 1) / phases.length) * 100}%`;
  };

  // 判断是否为当前活跃发言者
  const isActiveSpeaker = (index: number) => {
    return index === messages.length - 1 && isLoading;
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        padding: '1rem',
        position: 'relative'
      }}
    >
      {/* 简约网格背景 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* 顶部导航 */}
      <header 
        style={{
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, color: '#00ffff' }}>
            DINCI AI辩论
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="text"
              onClick={() => window.location.href = '/library'}
              style={{ color: '#888888', fontSize: '0.875rem' }}
            >
              案例库
            </Button>
            <Button
              variant="text"
              onClick={() => window.location.href = '/settings'}
              style={{ color: '#888888', fontSize: '0.875rem' }}
            >
              设置
            </Button>
          </div>
        </div>
        
        {/* 动态进度指示器 */}
        {messages.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888888', marginBottom: '0.5rem' }}>
              <span>辩论进度</span>
              <span style={{ color: '#00ffff' }}>{phase}</span>
            </div>
            <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '1rem', height: '4px' }}>
              <div 
                style={{
                  background: 'linear-gradient(to right, #00ffff, #8b5cf6)',
                  height: '4px',
                  borderRadius: '1rem',
                  width: getProgressWidth(phase),
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        )}
      </header>

      {/* 模型选择区 */}
      {messages.length === 0 && (
        <div 
          style={{
            marginBottom: '1.5rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            borderRadius: '8px',
            position: 'relative',
            zIndex: 10
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '1rem', color: '#00ffff' }}>
            辩论设置
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cccccc' }}>
              辩论题目
            </label>
            <input
              type="text"
              value={debateTopic}
              onChange={(e) => setDebateTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '0.875rem'
              }}
              placeholder="请输入辩论题目"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#cccccc' }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ accentColor: '#00ffff' }}
              />
              分享到公开案例库
            </label>
          </div>
          
          <h3 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', color: '#00ffff' }}>
            选择辩论模型
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#00ff88' }}>
                正方模型
              </label>
              <Select
                value={positiveModel}
                onChange={(val) => setPositiveModel(val as string)}
                options={MODEL_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ff6b6b' }}>
                反方模型
              </label>
              <Select
                value={negativeModel}
                onChange={(val) => setNegativeModel(val as string)}
                options={MODEL_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#ffd93d' }}>
                裁判模型
              </label>
              <Select
                value={judgeModel}
                onChange={(val) => setJudgeModel(val as string)}
                options={MODEL_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 辩论内容区 */}
      <main style={{ marginBottom: '5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, index) => (
            <SpeakerHighlight key={index} speaker={msg.role as 'host' | 'positive' | 'negative' | 'judge'} isActive={isActiveSpeaker(index)}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#00ffff' }}>
                {msg.role === 'host' && '主持人'}
                {msg.role === 'positive' && '正方'}
                {msg.role === 'negative' && '反方'}
                {msg.role === 'judge' && '裁判'}
                {msg.role === 'user' && '用户'}
              </div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#ffffff' }}>{msg.content}</p>
              {msg.audio && (
                <audio 
                  controls
                  src={msg.audio}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                />
              )}
            </SpeakerHighlight>
          ))}
        </div>
      </main>

      {/* 底部控制区 */}
      <footer 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 255, 255, 0.3)',
          padding: '1rem'
        }}
      >
        {messages.length === 0 ? (
          <Button 
            onClick={handleStart}
            loading={isLoading}
            disabled={isLoading}
            style={{
              width: '100%',
              height: '3rem',
              background: 'transparent',
              border: '1px solid #00ffff',
              color: '#00ffff',
              fontSize: '1rem',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            开始辩论
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button 
              onClick={handleSave}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #00ffff',
                color: '#00ffff'
              }}
            >
              保存记录
            </Button>
            {isPublic && (
              <Button 
                onClick={handleShare}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid #00ff88',
                  color: '#00ff88'
                }}
              >
                分享到公开库
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              loading={isLoading}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #888888',
                color: '#888888'
              }}
            >
              新的辩论
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
};
