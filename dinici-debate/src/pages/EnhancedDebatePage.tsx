import { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select, Progress, Card, Tag, Loading } from 'tdesign-react';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';
import { useEnhancedDebateFlow } from '../hooks/useEnhancedDebateFlow';
import { userConfigManager, UserDebateConfig, DebatePhase } from '../services/userConfigService';
import { handleError, EnhancedConfigValidator } from '../utils/errorHandler';
import { supabase } from '../lib/supabaseClient';

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

export const EnhancedDebatePage = () => {
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
  const [positiveModel, setPositiveModel] = useState('openai/gpt-5-chat');
  const [negativeModel, setNegativeModel] = useState('anthropic/claude-3-haiku');
  const [judgeModel, setJudgeModel] = useState('openai/gpt-5-chat');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

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
        setAutoPlayEnabled(true); // 默认开启自动播放
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
          voiceEnabled
        }
      };

      // 设置音频播放服务的自动播放状态
      const { audioPlayer } = await import('../services/audioPlayerService');
      audioPlayer.setAutoPlay(autoPlayEnabled && voiceEnabled);

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
    MessagePlugin.info('已重置辩论状态');
  };

  const handleSaveDebate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      if (messages.length === 0) {
        MessagePlugin.error('没有辩论内容可保存');
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
        speaker: msg.speaker,
        content: msg.content,
        phase: msg.phase,
        timestamp: msg.timestamp || new Date().toISOString(),
        wordCount: msg.wordCount || 0
      }));

      const { data, error } = await supabase
        .from('debates')
        .insert([{
          user_id: user.id,
          topic: debateTopic,
          positive_model: positiveModel,
          negative_model: negativeModel,
          judge_model: judgeModel,
          content: simplifiedMessages,
          conversation: simplifiedMessages, // 添加 conversation 字段
          is_public: false,
          model_config: {
            positive: positiveModel,
            negative: negativeModel,
            judge: judgeModel,
            voiceEnabled: voiceEnabled
          }
        }])
        .select();

      console.log('保存结果:', { data, error });

      if (error) {
        console.error('保存错误详情:', error);
        
        // 提供更详细的错误信息
        let errorMessage = '保存失败';
        if (error.code === '23502') {
          errorMessage = '数据库字段约束错误，请联系管理员检查数据库配置';
        } else if (error.message) {
          errorMessage = `保存失败: ${error.message}`;
        }
        
        MessagePlugin.error(errorMessage);
        return;
      }
      
      MessagePlugin.success('辩论记录已保存');
    } catch (error) {
      console.error('保存辩论记录失败:', error);
      MessagePlugin.error('保存失败，请稍后重试');
    }
  };

  const isActiveSpeaker = (messageIndex: number) => {
    return messageIndex === messages.length - 1 && isLoading;
  };



  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '1rem', position: 'relative' }}>
        {/* 网格背景 */}
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

        {/* 错误显示 */}
        {error && (
          <Card style={{ 
            marginBottom: '1.5rem',
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            position: 'relative',
            zIndex: 10
          }}>
            <div style={{ color: '#ff6b6b' }}>
              ❌ {error}
            </div>
          </Card>
        )}

        {/* 辩论进度显示 */}
        {messages.length > 0 && (
          <Card style={{ 
            marginBottom: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#00ffff' }}>
                  {PHASE_NAMES[currentPhase]}
                </h3>
                {currentSpeaker && (
                  <Tag theme="primary" style={{ marginTop: '0.5rem' }}>
                    当前发言: {currentSpeaker === 'positive' ? '正方' : currentSpeaker === 'negative' ? '反方' : currentSpeaker === 'judge' ? '裁判' : '主持人'}
                  </Tag>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>
                  总进度: {Math.round(totalProgress * 100)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>阶段进度: {Math.round(phaseProgress * 100)}%</div>
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

        {/* 辩论设置区 */}
        {currentPhase === DebatePhase.PREPARING && (
          <Card style={{
            marginBottom: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 10
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '1rem', color: '#00ffff' }}>
              辩论设置
            </h3>
            
            {isConfigLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ color: '#888' }}>正在加载用户配置...</div>
              </div>
            ) : !userConfig ? (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                background: 'rgba(255, 255, 0, 0.1)',
                border: '1px solid rgba(255, 255, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#ffdd44', marginBottom: '1rem' }}>
                  配置不完整
                </div>
                <div style={{ color: '#cccccc', marginBottom: '1rem' }}>
                  需要配置OpenRouter API密钥和TTS参数才能开始辩论
                </div>
                <Button 
                  onClick={() => window.location.href = '/settings'}
                  theme="primary"
                >
                  前往设置
                </Button>
              </div>
            ) : (
              <>
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
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      style={{ accentColor: '#00ffff' }}
                    />
                    启用语音合成
                  </label>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#cccccc' }}>
                    <input
                      type="checkbox"
                      checked={autoPlayEnabled}
                      onChange={(e) => {
                        setAutoPlayEnabled(e.target.checked);
                        // 同步更新音频播放服务的设置
                        import('../services/audioPlayerService').then(({ audioPlayer }) => {
                          audioPlayer.setAutoPlay(e.target.checked);
                        });
                      }}
                      style={{ accentColor: '#00ffff' }}
                      disabled={!voiceEnabled}
                    />
                    自动播放语音
                  </label>
                  {!voiceEnabled && (
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                      需要先启用语音合成
                    </div>
                  )}
                </div>
                
                <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', color: '#00ffff' }}>
                  AI模型配置
                </h4>
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
                      popupProps={{
                        placement: 'bottom',
                        overlayStyle: {
                          background: 'rgba(10, 10, 10, 0.95)',
                          border: '1px solid rgba(0, 255, 255, 0.3)',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
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
                      popupProps={{
                        placement: 'bottom',
                        overlayStyle: {
                          background: 'rgba(10, 10, 10, 0.95)',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
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
                      popupProps={{
                        placement: 'bottom',
                        overlayStyle: {
                          background: 'rgba(10, 10, 10, 0.95)',
                          border: '1px solid rgba(255, 217, 61, 0.3)',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Button 
                    onClick={handleStartDebate}
                    loading={isLoading}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      height: '3rem',
                      background: 'linear-gradient(45deg, #00ffff, #8b5cf6)',
                      border: 'none',
                      color: 'white',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      fontWeight: '500'
                    }}
                  >
                    {isLoading ? 'AI正在思考...' : '开始辩论'}
                  </Button>
                </div>
                
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <h5 style={{ margin: 0, marginBottom: '0.5rem', color: '#00ffff' }}>辩论功能</h5>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#cccccc', fontSize: '0.875rem' }}>
                    <li>7个专业辩论阶段：开场→立论→质询→驳论→自由辩论→总结→评议</li>
                    <li>智能字数控制：每个阶段都有合理的字数要求</li>
                    <li>动态交替发言：质询和自由辩论支持多轮交互</li>
                    <li>高质量语音合成：基于火山引擎TTS技术</li>
                    <li>流式内容生成：支持实时查看AI思考过程</li>
                    <li>自动语音播放：音频生成完成后自动播放，按顺序排队</li>
                    <li>详细辩论记录：完整保存所有发言内容</li>
                  </ul>
                </div>
              </>
            )}
          </Card>
        )}

        {/* 辩论内容区 */}
        <main style={{ marginBottom: '5rem', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, index) => {
              const isPositive = msg.role === 'positive';
              const isNegative = msg.role === 'negative';
              const isHost = msg.role === 'host';
              
              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isPositive ? 'flex-start' : isNegative ? 'flex-end' : 'center',
                    marginBottom: '1rem'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '1rem 1.5rem',
                      borderRadius: isPositive ? '20px 20px 20px 5px' : 
                                   isNegative ? '20px 20px 5px 20px' : '20px',
                      background: isPositive ? 'rgba(0, 255, 136, 0.1)' :
                                  isNegative ? 'rgba(255, 107, 107, 0.1)' :
                                  isHost ? 'rgba(255, 217, 61, 0.1)' :
                                  'rgba(0, 255, 255, 0.1)',
                      border: `1px solid ${
                        isPositive ? 'rgba(0, 255, 136, 0.3)' :
                        isNegative ? 'rgba(255, 107, 107, 0.3)' :
                        isHost ? 'rgba(255, 217, 61, 0.3)' :
                        'rgba(0, 255, 255, 0.3)'
                      }`,
                      position: 'relative'
                    }}
                  >
                    {/* 发言者标签 */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: isPositive ? '#00ff88' :
                             isNegative ? '#ff6b6b' :
                             isHost ? '#ffd93d' :
                             '#00ffff',
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        {msg.speaker || (
                          msg.role === 'host' ? '主持人' : 
                          msg.role === 'positive' ? '正方' : 
                          msg.role === 'negative' ? '反方' : '裁判'
                        )}
                      </span>
                      <span style={{ color: '#888', fontSize: '0.6875rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* 内容 */}
                    <div style={{
                      color: '#ffffff',
                      lineHeight: 1.6,
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap'
                    }}>
                      <span className={isActiveSpeaker(index) ? 'typing-indicator' : ''}>
                        {msg.content}
                      </span>
                      {isActiveSpeaker(index) && (
                        <span className="typing-cursor"></span>
                      )}
                    </div>
                    
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
                              background: 'rgba(0, 255, 255, 0.1)',
                              border: '1px solid rgba(0, 255, 255, 0.3)',
                              color: '#00ffff'
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
                      {PHASE_NAMES[msg.phase]} • {msg.wordCount}字
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 辩论完成后的操作区 */}
            {currentPhase === DebatePhase.COMPLETED && (
              <Card style={{ 
                padding: '1.5rem',
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>辩论完成！</h3>
                <div style={{ marginBottom: '1rem', color: '#cccccc' }}>
                  本次辩论共进行了 {messages.length} 轮发言，涵盖了完整的7个辩论阶段。
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={handleSaveDebate}
                    style={{
                      background: '#00ffff',
                      border: 'none',
                      color: '#000000'
                    }}
                  >
                    保存记录
                  </Button>
                  <Button 
                    onClick={handleResetDebate}
                    style={{
                      background: '#6c757d',
                      border: 'none',
                      color: '#ffffff'
                    }}
                  >
                    新的辩论
                  </Button>
                </div>
              </Card>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </main>
      </div>
    </div>
  );
};