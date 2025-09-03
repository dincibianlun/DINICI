import { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select, Progress, Card, Tag, Loading } from 'tdesign-react';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';
import { useEnhancedDebateFlow } from '../hooks/useEnhancedDebateFlow';
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
        .insert([{
          user_id: user.id,
          topic: debateTopic || '人工智能的发展对人类社会利大于弊',  // 确保topic不为空
          positive_model: positiveModel || 'openai/gpt-5-chat',  // 确保model不为空
          negative_model: negativeModel || 'anthropic/claude-3-haiku',
          judge_model: judgeModel || 'openai/gpt-5-chat',
          content: simplifiedMessages,  // 内容必须是JSONB类型
          conversation: simplifiedMessages, // 适配新的数据结构要求
          is_public: false,  // 默认不公开
          tags: [],  // 默认空标签数组
          views: 0,  // 初始化统计数据
          likes: 0,
          shares: 0
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
        
        MessagePlugin.error({
          content: errorMessage,
          duration: 6000,
          closeBtn: true,
          style: { 
            color: '#000000', 
            background: '#ffffff',
            border: '1px solid #e34d59',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }
        });
        setIsSaving(false);
        return;
      }
      
      // 显示成功消息
      const saveSuccessElement = document.getElementById('saveSuccessMessage');
      if (saveSuccessElement) {
        saveSuccessElement.innerHTML = '<div style="margin-top: 1rem; padding: 0.75rem; background: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 8px; font-size: 1rem;">辩论记录已保存</div>';
      } else {
        // 使用默认提示
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
      }
      
      // 标记为已保存，防止重复保存
      setIsSaved(true);
      setIsSaving(false);
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
      setIsSaving(false);
    }
  };

  const isActiveSpeaker = (messageIndex: number) => {
    return messageIndex === messages.length - 1 && isLoading;
  };



  return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', color: '#333333', fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif', fontSize: '1.1rem' }}>
        <Header />
        <Breadcrumb />
        
        <div style={{ padding: '1rem' }}>

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
                {currentSpeaker && (
                  <Tag theme="primary" style={{ marginTop: '0.5rem' }}>
                    当前发言: {currentSpeaker === 'positive' ? '正方' : currentSpeaker === 'negative' ? '反方' : currentSpeaker === 'judge' ? '裁判' : '主持人'}
                  </Tag>
                )}
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
              <>                <div style={{ marginBottom: '1.5rem' }}>                  <input                    type="text"                    value={debateTopic}                    onChange={(e) => setDebateTopic(e.target.value)}                    style={{                      width: '100%',                      padding: '1rem',                      background: '#fff',                      border: '1px solid #ced4da',                      borderRadius: '6px',                      color: '#000000 !important',                      fontSize: '1.2rem'                    }}                    placeholder="请输入辩论题目"                    className="tdesign-input-fix"                  />                </div>                
                <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#495057' }}>                  AI模型配置                </h4>                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                  <div>
                      <label style={{ display: 'block', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#28a745' }}>
                        正方模型
                      </label>
                      <Select
                        value={positiveModel}
                        onChange={(val) => setPositiveModel(val as string)}
                        options={MODEL_OPTIONS}
                        style={{ 
                          width: '100%',
                          fontSize: '1.1rem',
                          color: '#333333',
                          background: '#f8f9fa',
                          height: '2.5rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                        className="tdesign-input-fix"
                        popupProps={{                          placement: 'bottom',                          overlayStyle: {                            background: '#fff',                            border: '1px solid #e9ecef',                            borderRadius: '8px',                            fontSize: '1.1rem',                            color: '#333333'                          }                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#dc3545' }}>
                        反方模型
                      </label>
                      <Select
                        value={negativeModel}
                        onChange={(val) => setNegativeModel(val as string)}
                        options={MODEL_OPTIONS}
                        style={{ 
                          width: '100%',
                          fontSize: '1.1rem',
                          color: '#333333',
                          background: '#f8f9fa',
                          height: '2.5rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                        className="tdesign-input-fix"
                        popupProps={{                          placement: 'bottom',                          overlayStyle: {                            background: '#fff',                            border: '1px solid #e9ecef',                            borderRadius: '8px',                            fontSize: '1.1rem',                            color: '#333333'                          }                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '1.3rem', marginBottom: '0.75rem', color: '#ffc107' }}>
                        裁判模型
                      </label>
                      <Select
                        value={judgeModel}
                        onChange={(val) => setJudgeModel(val as string)}
                        options={MODEL_OPTIONS}
                        style={{ 
                          width: '100%',
                          fontSize: '1.1rem',
                          color: '#333333',
                          background: '#f8f9fa',
                          height: '2.5rem',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px'
                        }}
                        className="tdesign-input-fix"
                        popupProps={{                          placement: 'bottom',                          overlayStyle: {                            background: '#fff',                            border: '1px solid #e9ecef',                            borderRadius: '8px',                            fontSize: '1.1rem',                            color: '#333333'                          }                        }}
                      />
                    </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Button 
                    onClick={handleStartDebate}
                    loading={isLoading}
                    disabled={isLoading}
                    theme="default"
                    size="large"
                    shape="round"
                    style={{
                        width: '200px',
                        margin: '0 auto',
                        background: '#f8f9fa',
                        color: '#495057',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                  >
                    {isLoading ? 'AI正在思考...' : '开始辩论'}
                  </Button>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  {/* 左侧卡片：辩论功能 */}
                  <div style={{ flex: 1, padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: 0, marginBottom: '0.5rem', color: '#495057', fontSize: '1.1rem', fontWeight: 'bold' }}>辩论功能</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#495057', fontSize: '1rem' }}>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>7个专业辩论阶段：开场→立论→质询→驳论→自由辩论→总结→评议</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>智能字数控制：每个阶段都有合理的字数要求</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>动态交替发言：质询和自由辩论支持多轮交互</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>高质量语音合成：基于火山引擎TTS技术</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>流式内容生成：支持实时查看AI思考过程</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>自动语音播放：音频生成完成后自动播放，按顺序排队</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>详细辩论记录：完整保存所有发言内容</li>
                    </ul>
                  </div>
                  
                  {/* 右侧卡片：使用须知 */}
                  <div style={{ flex: 1, padding: '1rem', background: '#fff', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: 0, marginBottom: '0.5rem', color: '#495057', fontSize: '1.1rem', fontWeight: 'bold' }}>使用须知</h5>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#495057', fontSize: '1rem' }}>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>内容由AI生成，请仔细甄别信息准确性</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>辩论观点不代表平台立场，仅供参考</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>不同AI模型性能各异，可能产生不同质量的内容</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>生成内容可能存在偏见或不准确之处</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>请勿使用平台生成违反法律法规的内容</li>
                      <li style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>保存功能需登录，请妥善保管个人账号</li>
                    </ul>
                  </div>
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
                      borderRadius: isPositive ? '24px 24px 24px 8px' : 
                                   isNegative ? '24px 24px 8px 24px' : '24px',
                      background: isPositive ? '#f8f9fa' :
                                  isNegative ? '#f8f9fa' :
                                  isHost ? '#f8f9fa' :
                                  '#f8f9fa',
                      border: `1px solid ${isPositive ? '#28a745' :
                                       isNegative ? '#dc3545' :
                                       isHost ? '#ffc107' :
                                       '#6c757d'}`,
                      position: 'relative',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    {/* 发言者标签 */}
                    <div style={{
                      fontSize: '0.875rem',
                      color: isPositive ? '#28a745' :
                             isNegative ? '#dc3545' :
                             isHost ? '#ffc107' :
                             '#6c757d',
                      fontWeight: 600,
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
                      color: '#333333',
                      lineHeight: 1.6,
                      fontSize: '1rem',
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
        </main>
      </div>
    </div>
  );
};