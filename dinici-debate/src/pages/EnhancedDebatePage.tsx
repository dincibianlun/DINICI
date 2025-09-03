import { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select, Progress, Card, Tag, Loading } from 'tdesign-react';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';
import { StreamingDebateMessage } from '../components/StreamingDebateMessage';
import { useEnhancedDebateFlow } from '../hooks/useEnhancedDebateFlow';
import { audioPlayer } from '../services/audioPlayerService';
import { userConfigManager, UserDebateConfig, DebatePhase } from '../services/userConfigService';
import { handleError, EnhancedConfigValidator } from '../utils/errorHandler';
import { supabase } from '../lib/supabaseClient';
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

// 导入Message类型
import type { Message } from '../types/debate';

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
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false); // 默认关闭自动播放
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
        // 使用用户保存的默认模型配置
        setPositiveModel(config.positiveModel);
        setNegativeModel(config.negativeModel);
        setJudgeModel(config.judgeModel);
        setVoiceEnabled(config.debateSettings.voiceEnabled);
        setAutoPlayEnabled(config.debateSettings.autoPlayEnabled ?? false); // 使用用户的自动播放设置，默认关闭
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
      // 验证辩论主题
      const topicValidation = EnhancedConfigValidator.validateDebateTopic(debateTopic);
      if (!topicValidation.isValid) {
        handleError(topicValidation.error!);
        return;
      }

      if (!userConfig) {
        MessagePlugin.error('用户配置未加载，请刷新页面或检查登录状态');
        return;
      }

      // 验证API密钥
      const apiKeyValidation = EnhancedConfigValidator.validateOpenRouterApiKey(
        userConfig.apiCredentials.openRouterApiKey
      );
      if (!apiKeyValidation.isValid) {
        handleError(apiKeyValidation.error!);
        return;
      }

      // 验证TTS配置
      const ttsValidation = EnhancedConfigValidator.validateTTSConfig({
        appid: userConfig.ttsCredentials.appid,
        accessToken: userConfig.ttsCredentials.accessToken
      });
      if (!ttsValidation.isValid) {
        handleError(ttsValidation.error!);
        return;
      }

      // 构建完整的辩论配置
      const enhancedConfig: UserDebateConfig = {
        ...userConfig,
        topic: debateTopic,
        positiveModel,
        negativeModel,
        judgeModel,
        debateSettings: {
          ...userConfig.debateSettings,
          voiceEnabled,
          autoPlayEnabled
        },
        sideHints: {
          positive: positiveStance?.trim() || undefined,
          negative: negativeStance?.trim() || undefined
        }
      };

      // 设置音频播放服务的自动播放状态
      // 使用正确的audioPlayerService并检查setAutoPlay方法是否存在
      import('../services/audioPlayerService').then(({ audioPlayer }) => {
        if (audioPlayer && typeof audioPlayer.setAutoPlay === 'function') {
          audioPlayer.setAutoPlay(autoPlayEnabled && voiceEnabled);
        }
      });

      // 启动辩论
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
    setIsSaved(false);  // 重置保存状态
    MessagePlugin.info('已重置辩论状态');
  };

  const handleSaveDebate = async () => {
    // 如果已经保存过或正在保存中，不再执行
    if (isSaved || isSaving) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        setIsSaving(false);
        return;
      }

      if (messages.length === 0) {
        MessagePlugin.error('没有辩论内容可保存');
        setIsSaving(false);
        return;
      }

      console.log('准备保存辩论记录:', {
        user_id: user.id,
        topic: debateTopic,
        positive_model: positiveModel,
        negative_model: negativeModel,
        judge_model: judgeModel,
        messages_count: messages.length,
        debate_type: 'enhanced_7_phases'
      });

      // 简化messages数据，确保可序列化
      const simplifiedMessages = messages.map(msg => ({
        role: msg.role,
        speaker: msg.speaker,
        content: msg.content,
        phase: msg.phase,
        timestamp: msg.timestamp || new Date().toISOString(),
        wordCount: msg.wordCount || 0
      }));

      const { data, error } = await supabase
        .from('debates')
        .insert([
          {
            user_id: user.id,
            topic: debateTopic,
            positive_model: positiveModel,
            negative_model: negativeModel,
            judge_model: judgeModel,
            messages: simplifiedMessages,
            positive_arguments: '', // 保持向后兼容
            negative_arguments: '', // 保持向后兼容
            summary: '', // 保持向后兼容
            conversation: simplifiedMessages, // 新增字段，存储完整对话
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      console.log('辩论记录保存成功:', data);
      setIsSaved(true);
      setIsSaving(false);
      
      // 显示保存成功的消息
      const successMessage = document.getElementById('saveSuccessMessage');
      if (successMessage) {
        successMessage.innerHTML = `
          <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            text-align: center;
            min-width: 300px;
          ">
            <div style="color: #155724; font-size: 1.2rem; margin-bottom: 0.5rem;">✅ 保存成功</div>
            <div style="color: #155724; margin-bottom: 1rem;">辩论记录已保存到案例库</div>
            <button onclick="this.parentElement.style.display='none'" 
              style="
                background: #28a745;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
              ">
              确定
            </button>
          </div>
        `;
      }
      
      MessagePlugin.success('辩论记录保存成功！');
    } catch (error: any) {
      console.error('保存辩论记录失败:', error);
      MessagePlugin.error({
        content: `保存失败: ${error.message || '未知错误'}`,
        closeBtn: true,
        style: { 
          color: '#000000', 
          background: '#ffffff',
          border: '1px solid #e34d59',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }
      });
      setIsSaving(false);
    }
  };

  const isActiveSpeaker = (messageIndex: number) => {
    return messageIndex === messages.length - 1 && isLoading;
  };

  const renderContent = () => {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#f8f9fa', 
        color: '#333333', 
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif', 
        fontSize: '1.1rem' 
      }}>
        {/* 错误显示 */}
        {error && (
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
        )}

        {/* 辩论进度显示 */}
        {messages.length > 0 && (
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
                        const newAutoPlayState = !autoPlayEnabled;
                        setAutoPlayEnabled(newAutoPlayState);
                        // 使用正确的audioPlayerService并检查setAutoPlay方法是否存在
                        import('../services/audioPlayerService').then(({ audioPlayer }) => {
                          if (audioPlayer && typeof audioPlayer.setAutoPlay === 'function') {
                            audioPlayer.setAutoPlay(newAutoPlayState);
                          }
                        });
                        MessagePlugin.info(newAutoPlayState ? '已开启自动播放' : '已关闭自动播放');
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
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>阶段进度: {Math.round(phaseProgress * 100)}%</div>
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

            {/* 操作按钮 */}
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
        )}

        {/* 辩论命题设置 */}
        {currentPhase === DebatePhase.PREPARING && (
          <Card style={{ 
            marginBottom: '1.5rem',
            background: '#fff',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#495057' }}>
              辩论命题
            </h3>
            
            {isConfigLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ color: '#6c757d' }}>正在加载用户配置...</div>
              </div>
            ) : !userConfig ? (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#856404', marginBottom: '1rem' }}>
                  配置不完整
                </div>
                <div style={{ color: '#6c757d', marginBottom: '1rem' }}>
                  需要配置OpenRouter API密钥和TTS参数才能开始辩论
                </div>
                <Button 
                  onClick={() => window.location.href = '/settings'}
                  theme="default"
                  style={{
                    background: '#ffffff !important',
                    border: '1px solid #e9ecef !important',
                    color: '#000000 !important',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    minWidth: '120px',
                    transition: 'all 0.2s ease',
                    boxShadow: 'none',
                    zIndex: 1,
                    backgroundColor: '#ffffff !important',
                    backgroundImage: 'none !important'
                  }}
                >
                  前往设置
                </Button>
                <Button 
                  onClick={() => window.location.href = '/overview'}
                  theme="default"
                  style={{
                    background: '#ffffff !important',
                    border: '1px solid #e9ecef !important',
                    color: '#000000 !important',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    minWidth: '120px',
                    transition: 'all 0.2s ease',
                    marginLeft: '1rem',
                    boxShadow: 'none',
                    zIndex: 1,
                    backgroundColor: '#ffffff !important',
                    backgroundImage: 'none !important'
                  }}
                >
                  如何获取
                </Button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={debateTopic}
                    onChange={(e) => setDebateTopic(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#fff',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '1.1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="请输入辩论主题，例如：人工智能的发展对人类社会利大于弊"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#495057', fontWeight: 'bold' }}>
                      正方模型
                    </label>
                    <Select
                      value={positiveModel}
                      onChange={(value) => setPositiveModel(value as string)}
                      options={MODEL_OPTIONS}
                      style={{ width: '100%' }}
                    />
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={positiveStance}
                        onChange={(e) => setPositiveStance(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#fff',
                          border: '1px solid #ced4da',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="正方立场提示（可选）"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#495057', fontWeight: 'bold' }}>
                      反方模型
                    </label>
                    <Select
                      value={negativeModel}
                      onChange={(value) => setNegativeModel(value as string)}
                      options={MODEL_OPTIONS}
                      style={{ width: '100%' }}
                    />
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={negativeStance}
                        onChange={(e) => setNegativeStance(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: '#fff',
                          border: '1px solid #ced4da',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                        placeholder="反方立场提示（可选）"
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#495057', fontWeight: 'bold' }}>
                    裁判模型
                  </label>
                  <Select
                    value={judgeModel}
                    onChange={(value) => setJudgeModel(value as string)}
                    options={MODEL_OPTIONS}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      style={{ transform: 'scale(1.3)' }}
                    />
                    <span style={{ color: '#495057', fontSize: '1.1rem' }}>启用语音合成</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoPlayEnabled}
                      onChange={(e) => {
                        const newAutoPlayState = e.target.checked;
                        setAutoPlayEnabled(newAutoPlayState);
                        // 使用正确的audioPlayerService并检查setAutoPlay方法是否存在
                        import('../services/audioPlayerService').then(({ audioPlayer }) => {
                          if (audioPlayer && typeof audioPlayer.setAutoPlay === 'function') {
                            audioPlayer.setAutoPlay(newAutoPlayState);
                          }
                        });
                      }}
                      style={{ transform: 'scale(1.3)' }}
                      disabled={!voiceEnabled}
                    />
                    <span style={{ color: voiceEnabled ? '#495057' : '#adb5bd', fontSize: '1.1rem' }}>
                      自动播放语音
                    </span>
                  </label>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    onClick={handleStartDebate}
                    disabled={isLoading}
                    style={{
                      background: '#1a1a1a',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '1rem 2rem',
                      fontSize: '1.2rem',
                      minWidth: '200px',
                      transition: 'all 0.2s ease',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1
                    }}
                  >
                    {isLoading ? '辩论进行中...' : '开始辩论'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* 辩论消息显示区域 */}
        {messages.length > 0 && currentPhase !== DebatePhase.PREPARING && (
          <div style={{ 
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
          }}>
            {messages.map((msg, index) => {
              // 添加缺失的变量定义和正确的属性访问
              const isLastMessage = index === messages.length - 1;
              const isCurrentLoading = isLastMessage && isLoading;
              
              return (
                <div
                  key={msg.id || index}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    position: 'relative'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: msg.role === 'positive' ? '#28a745' : 
                                   msg.role === 'negative' ? '#dc3545' : 
                                   msg.role === 'judge' ? '#007bff' : '#ffc107',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}>
                        {msg.role === 'positive' ? '正' : 
                         msg.role === 'negative' ? '反' : 
                         msg.role === 'judge' ? '裁' : '主'}
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#495057',
                          fontSize: '1.1rem'
                        }}>
                          {msg.speaker}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#6c757d',
                          marginTop: '0.125rem'
                        }}>
                          {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <Tag 
                      theme={msg.role === 'positive' ? "success" : 
                            msg.role === 'negative' ? "danger" : 
                            msg.role === 'judge' ? "primary" : "warning"}
                      style={{ 
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem'
                      }}
                    >
                      {msg.role === 'positive' ? '正方' : 
                       msg.role === 'negative' ? '反方' : 
                       msg.role === 'judge' ? '裁判' : '主持人'}
                    </Tag>
                  </div>
                  
                  <div style={{ 
                    lineHeight: 1.8, 
                    color: '#495057',
                    fontSize: '1.1rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    <StreamingDebateMessage 
                      role={msg.role}
                      messageId={msg.id || `msg-${index}`}
                      content={msg.content}
                      isStreaming={isCurrentLoading && msg.content === messages[messages.length - 1]?.content}
                    />
                    
                    {/* 音频控件 */}
                    {(msg.hasAudio || msg.audioGenerating || msg.audioError) && (
                      <div style={{ marginTop: '0.75rem' }}>
                        {msg.audioGenerating && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#888',
                            fontSize: '0.75rem'
                          }}>
                            <Loading size="small" />
                            语音合成中...
                          </div>
                        )}
                        
                        {msg.hasAudio && (
                          <Button
                            size="small"
                            onClick={() => {
                              try {
                                import('../services/audioPlayerService').then(({ audioPlayer }) => {
                                  audioPlayer.playAudio(msg.content, msg.role);
                                });
                              } catch (error) {
                                console.error('播放音频失败:', error);
                              }
                            }}
                            style={{
                              background: '#f8f9fa',
                              border: '1px solid #6c757d',
                              color: '#6c757d'
                            }}
                          >
                            🔊 播放语音
                          </Button>
                        )}
                        
                        {msg.audioError && (
                          <span style={{
                            color: '#ff6b6b',
                            fontSize: '0.75rem'
                          }}>
                            语音生成失败
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* 阶段和字数信息 */}
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.6875rem',
                      color: '#666',
                      textAlign: 'right'
                    }}>
                      {PHASE_NAMES[msg.phase as DebatePhase] || '未知阶段'} • {msg.wordCount || 0}字
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 辩论完成后的操作区 */}
            {currentPhase === DebatePhase.COMPLETED && (
              <Card style={{ 
                padding: '1.5rem',
                background: '#fff',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
              }}>
                <h3 style={{ color: '#28a745', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>辩论完成！</h3>
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
                <div id="saveSuccessMessage"></div>
              </Card>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
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
        {renderContent()}
      </div>
    </div>
  );
};