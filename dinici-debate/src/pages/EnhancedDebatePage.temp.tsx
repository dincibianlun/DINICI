import React, { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select, Progress, Card, Tag, Loading } from 'tdesign-react';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';
import { StreamingDebateMessage } from '../components/StreamingDebateMessage';
import { useEnhancedDebateFlow } from '../hooks/useEnhancedDebateFlow';
import { audioPlayer } from '../services/audioPlayerService.new';
import { userConfigManager, UserDebateConfig, DebatePhase } from '../services/userConfigService';
import { handleError, EnhancedConfigValidator } from '../utils/errorHandler';
import { supabase } from '../lib/supabaseClient';
import type { Message } from '../types/debate';
import '../styles/input-fix.css';

// 可选模型列表
const MODEL_OPTIONS = [
  { label: 'OPENAI GPT-5', value: 'openai/gpt-5-chat' },
  { label: 'Claude 3 Haiku', value: 'anthropic/claude-3-haiku' },
  { label: 'DeepSeek V3.1', value: 'deepseek/deepseek-chat-v3.1' },
  { label: '百度文心一言', value: 'baidu/ernie-4.5-vl-28b-a3b' },
  { label: '智谱清言', value: 'z-ai/glm-4.5' },
  { label: '月之暗面 Kimi', value: 'moonshotai/kimi-k2' },
  { label: 'XAI Grok', value: 'x-ai/grok-4' },
  { label: '通义千问', value: 'qwen/qwen-max' }
];

// 阶段名称映射
const PHASE_NAMES: Record<DebatePhase, string> = {
  [DebatePhase.PREPARING]: '准备中',
  [DebatePhase.HOST_INTRO]: '主持人开场',
  [DebatePhase.STATEMENT]: '立论阶段',
  [DebatePhase.INQUIRY]: '质询阶段',
  [DebatePhase.REBUTTAL]: '驳论阶段',
  [DebatePhase.FREE_DEBATE]: '自由辩论',
  [DebatePhase.FINAL_SUMMARY]: '总结陈词',
  [DebatePhase.JUDGE_VERDICT]: '裁判评议',
  [DebatePhase.COMPLETED]: '辩论完成'
};

export const EnhancedDebatePage: React.FC = () => {
  const {
    currentPhase,
    currentSpeaker,
    messages,
    phaseProgress,
    totalProgress,
    isLoading,
    error,
    canAbort,
    startEnhancedDebate,
    abortDebate,
    resetDebate
  } = useEnhancedDebateFlow();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userConfig, setUserConfig] = useState<UserDebateConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [debateTopic, setDebateTopic] = useState<string>('人工智能的发展对人类社会利大于弊');
  const [positiveStance, setPositiveStance] = useState<string>('');
  const [negativeStance, setNegativeStance] = useState<string>('');
  const [positiveModel, setPositiveModel] = useState('openai/gpt-5-chat');
  const [negativeModel, setNegativeModel] = useState('anthropic/claude-3-haiku');
  const [judgeModel, setJudgeModel] = useState('openai/gpt-5-chat');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载用户配置
  useEffect(() => {
    loadUserConfig();
  }, []);

  const loadUserConfig = async () => {
    try {
      setIsConfigLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        MessagePlugin.warning('请先登录以获取完整功能');
        setIsConfigLoading(false);
        return;
      }

      const config = await userConfigManager.getUserDebateConfig(user.id);
      if (config) {
        setUserConfig(config);
        setPositiveModel(config.positiveModel);
        setNegativeModel(config.negativeModel);
        setJudgeModel(config.judgeModel);
        setVoiceEnabled(config.debateSettings.voiceEnabled);
      } else {
        MessagePlugin.warning('未找到完整的用户配置，请先在设置中配置API密钥和TTS参数');
      }
    } catch (error) {
      handleError(error, 'config_loading');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleStartDebate = async () => {
    try {
      const topicValidation = EnhancedConfigValidator.validateDebateTopic(debateTopic);
      if (!topicValidation.isValid) {
        handleError(topicValidation.error!);
        return;
      }

      if (!userConfig) {
        MessagePlugin.error('用户配置未加载，请刷新页面或检查登录状态');
        return;
      }

      const enhancedConfig = {
        ...userConfig,
        topic: debateTopic,
        positiveModel,
        negativeModel,
        judgeModel,
        debateSettings: {
          ...userConfig.debateSettings,
          voiceEnabled
        },
        sideHints: {
          positive: positiveStance?.trim() || undefined,
          negative: negativeStance?.trim() || undefined
        }
      };

      audioPlayer.setAutoPlay(autoPlayEnabled && voiceEnabled);

      const success = await startEnhancedDebate(enhancedConfig);
      if (success) {
        MessagePlugin.success('辩论启动成功！AI们正在准备发言...');
      }
    } catch (error) {
      handleError(error, 'debate_start');
    }
  };

  const handleAbortDebate = () => {
    abortDebate();
    MessagePlugin.info('辩论已停止');
  };

  const handleResetDebate = () => {
    resetDebate();
    setIsSaved(false);
    MessagePlugin.info('已重置辩论状态');
  };

  const handleSaveDebate = async () => {
    if (isSaved || isSaving) return;
    
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      if (!messages.length) {
        MessagePlugin.error('没有辩论内容可保存');
        return;
      }

      const simplifiedMessages = messages.map(msg => ({
        role: msg.role,
        speaker: msg.speaker,
        content: msg.content,
        phase: msg.phase,
        timestamp: msg.timestamp || new Date().toISOString(),
        wordCount: msg.wordCount || 0
      }));

      const { error } = await supabase
        .from('debates')
        .insert([{
          user_id: user.id,
          topic: debateTopic,
          positive_model: positiveModel,
          negative_model: negativeModel,
          judge_model: judgeModel,
          content: simplifiedMessages,
          conversation: simplifiedMessages,
          is_public: false,
          tags: [],
          views: 0,
          likes: 0,
          shares: 0
        }]);

      if (error) throw error;

      MessagePlugin.success({
        content: '辩论记录已保存',
        duration: 3000,
        style: { 
          color: '#000000', 
          background: '#ffffff',
          border: '1px solid #00a870',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }
      });
      
      setIsSaved(true);
    } catch (error) {
      console.error('保存辩论记录失败:', error);
      MessagePlugin.error({
        content: '保存失败，请稍后重试',
        duration: 5000,
        closeBtn: true,
        style: { 
          color: '#000000', 
          background: '#ffffff',
          border: '1px solid #e34d59',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderErrorMessage = () => {
    if (!error) return null;
    return (
      <Card style={{ 
        marginBottom: '1.5rem',
        background: '#fff',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ color: '#dc3545' }}>
          ❌ {error}
        </div>
      </Card>
    );
  };

  const renderProgressBar = () => {
    if (!messages.length) return null;
    return (
      <Card style={{ 
        marginBottom: '1.5rem',
        background: '#fff',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#495057' }}>
              {PHASE_NAMES[currentPhase]}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
              {currentSpeaker && (
                <Tag theme="primary">
                  当前发言: {currentSpeaker === 'positive' ? '正方' : currentSpeaker === 'negative' ? '反方' : currentSpeaker === 'judge' ? '裁判' : '主持人'}
                </Tag>
              )}
              {voiceEnabled && (
                <Tag
                  theme={autoPlayEnabled ? "success" : "default"}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setAutoPlayEnabled(!autoPlayEnabled);
                    audioPlayer.setAutoPlay(!autoPlayEnabled);
                    MessagePlugin.info(autoPlayEnabled ? '已关闭自动播放' : '已开启自动播放');
                  }}
                >
                  {autoPlayEnabled ? '🔊 自动播放已开启' : '🔇 自动播放已关闭'}
                </Tag>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              总进度: {Math.round(totalProgress * 100)}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              阶段进度: {Math.round(phaseProgress * 100)}%
            </div>
          </div>
        </div>
        
        <Progress 
          percentage={totalProgress * 100} 
          theme="line"
          style={{ marginBottom: '0.5rem' }}
        />
        
        <Progress 
          percentage={phaseProgress * 100} 
          theme="line"
          size="small"
        />

        {isLoading && canAbort && (
          <div style={{ marginTop: '1rem' }}>
            <Button 
              onClick={handleAbortDebate}
              theme="danger"
              size="small"
            >
              停止辩论
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderMessageList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {messages.map((message, index) => (
        <div 
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: message.role === 'positive' ? 'flex-start' : 
                          message.role === 'negative' ? 'flex-end' : 'center'
          }}
        >
          <div style={{ maxWidth: '80%' }}>
            <StreamingDebateMessage
              messageId={message.id}
              role={message.role}
              content={message.content}
              isStreaming={index === messages.length - 1 && isLoading}
              hasAudio={message.hasAudio}
              audioGenerating={message.audioGenerating}
              audioError={message.audioError}
              onAudioPlay={() => {
                audioPlayer.stopCurrentAudio();
                audioPlayer.clearQueue();
              }}
            />
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderCompletionActions = () => {
    if (currentPhase !== DebatePhase.COMPLETED) return null;
    return (
      <Card style={{ 
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
      }}>
        <h3 style={{ color: '#28a745', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          辩论完成！
        </h3>
        <div style={{ marginBottom: '1rem', color: '#495057' }}>
          本次辩论共进行了 {messages.length} 轮发言，涵盖了完整的7个辩论阶段。
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            onClick={handleSaveDebate}
            loading={isSaving}
            disabled={isSaved || isSaving}
            style={{
              background: isSaved ? '#e9ecef' : '#f8f9fa',
              border: '1px solid #dee2e6',
              color: isSaved ? '#adb5bd' : '#495057',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              fontSize: '1.1rem',
              height: '2.5rem',
              cursor: isSaved ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? '正在保存...' : isSaved ? '已保存' : '保存记录'}
          </Button>
          <Button 
            onClick={handleResetDebate}
            style={{
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              color: '#495057',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              fontSize: '1.1rem',
              height: '2.5rem'
            }}
          >
            新的辩论
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa', 
      color: '#333333', 
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif', 
      fontSize: '1.1rem' 
    }}>
      <Header />
      <Breadcrumb />
      <div style={{ padding: '1rem' }}>
        {renderErrorMessage()}
        {renderProgressBar()}
        {renderMessageList()}
        {renderCompletionActions()}
      </div>
    </div>
  );
};
