import { useState, useCallback, useRef } from 'react';
import { UserDebateConfig, DebatePhase } from '../services/userConfigService';
import { callOpenRouterOptimized } from '../services/openRouterService';
import { synthesizeSpeechWithUserConfig } from '../services/ttsService';
import { audioCache } from '../services/audioCacheService';
import { audioPlayer } from '../services/audioPlayerService';
import { supabase } from '../lib/supabaseClient';

// 辩论角色类型
export type DebateRole = 'host' | 'positive' | 'negative' | 'judge';

// 辩论消息类型
export interface DebateMessage {
  id: string;
  role: DebateRole;
  content: string;
  phase: DebatePhase;
  wordCount: number;
  timestamp: number;
  speaker: string;
  // 音频不再保存到数据库，只在内存中缓存
  hasAudio?: boolean;
  audioGenerating?: boolean;
  audioError?: boolean;
}

// 阶段配置类型
interface PhaseConfig {
  name: string;
  description: string;
  speakerOrder: DebateRole[];
  maxRounds: number;
  wordLimit: number;
  maxWordLimit: number;
  promptTemplate: string;
}

// 辩论状态类型
interface DebateState {
  currentPhase: DebatePhase;
  currentSpeaker: DebateRole | null;
  messages: DebateMessage[];
  phaseProgress: number;
  totalProgress: number;
  isLoading: boolean;
  error: string | null;
  config: UserDebateConfig | null;
  roundCounts: Record<DebatePhase, number>;
}

// 7阶段辩论配置
const DEBATE_PHASES: Record<DebatePhase, PhaseConfig> = {
  [DebatePhase.PREPARING]: {
    name: '准备中',
    description: '辩论准备阶段',
    speakerOrder: [],
    maxRounds: 0,
    wordLimit: 0,
    maxWordLimit: 0,
    promptTemplate: ''
  },
  [DebatePhase.HOST_INTRO]: {
    name: '主持人开场',
    description: '主持人介绍辩论背景和规则',
    speakerOrder: ['host'],
    maxRounds: 1,
    wordLimit: 150,
    maxWordLimit: 200,
    promptTemplate: `你是辩论主持人，请为关于"{topic}"的辩论做开场介绍。
介绍内容应包括：
1. 辩论主题阐述
2. 辩论规则说明
3. 双方立场介绍
4. 营造公正严肃的辩论氛围

要求：语言正式专业，控制在{wordLimit}字以内，开场词应具有权威性和引导性。`
  },
  [DebatePhase.STATEMENT]: {
    name: '立论阶段',
    description: '正反双方阐述核心观点',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 1,
    wordLimit: 300,
    maxWordLimit: 350,
    promptTemplate: `你是{side}，请针对"{topic}"进行立论陈述。
立论要求：
1. 明确表明{side}立场
2. 提出3-4个核心论点
3. 每个论点要有逻辑支撑
4. 语言有说服力和感染力

控制在{wordLimit}字以内，论述要有条理性和逻辑性。`
  },
  [DebatePhase.INQUIRY]: {
    name: '质询阶段',
    description: '双方互相质询和回答',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 2,
    wordLimit: 120,
    maxWordLimit: 150,
    promptTemplate: `你是{side}，请向对方提出一个尖锐的质询问题。
质询要求：
1. 针对对方立论中的薄弱环节
2. 问题要具体明确，不能泛泛而谈
3. 力求揭示对方逻辑漏洞
4. 问题要有一定攻击性但保持理性

控制在{wordLimit}字以内，问题要简洁有力。`
  },
  [DebatePhase.REBUTTAL]: {
    name: '驳论阶段',
    description: '双方反驳对方观点',
    speakerOrder: ['negative', 'positive'],
    maxRounds: 1,
    wordLimit: 250,
    maxWordLimit: 300,
    promptTemplate: `你是{side}，请对对方的立论进行系统性驳论。
驳论要求：
1. 指出对方论证的逻辑缺陷
2. 提供反驳的事实和证据
3. 削弱对方论点的说服力
4. 同时强化自己的立场

控制在{wordLimit}字以内，驳论要有理有据。`
  },
  [DebatePhase.FREE_DEBATE]: {
    name: '自由辩论',
    description: '双方自由交锋',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 3,
    wordLimit: 180,
    maxWordLimit: 220,
    promptTemplate: `你是{side}，这是自由辩论环节，请进行激烈但理性的辩论。
自由辩论要求：
1. 可以攻击对方新的论点
2. 可以补强自己的观点
3. 语言要更加灵活生动
4. 保持逻辑严密性

控制在{wordLimit}字以内，要有辩论的激情和张力。`
  },
  [DebatePhase.FINAL_SUMMARY]: {
    name: '总结陈词',
    description: '双方最终总结',
    speakerOrder: ['negative', 'positive'],
    maxRounds: 1,
    wordLimit: 280,
    maxWordLimit: 320,
    promptTemplate: `你是{side}，请进行最终的总结陈词。
总结陈词要求：
1. 回顾并强化己方核心论点
2. 总结对方论证的不足之处
3. 呼应开篇立论，形成完整闭环
4. 语言要有感召力和说服力

控制在{wordLimit}字以内，要体现{side}的胜利信心。`
  },
  [DebatePhase.JUDGE_VERDICT]: {
    name: '裁判评议',
    description: '裁判评议和宣布结果',
    speakerOrder: ['judge'],
    maxRounds: 1,
    wordLimit: 350,
    maxWordLimit: 400,
    promptTemplate: `你是辩论裁判，请对刚才关于"{topic}"的辩论进行专业评议。
评议要求：
1. 客观分析双方论证的优缺点
2. 评价论证逻辑、证据充分性、表达能力
3. 指出各阶段的亮点和不足
4. 最终给出合理的胜负判决

控制在{wordLimit}字以内，评议要体现专业性和公正性。`
  },
  [DebatePhase.COMPLETED]: {
    name: '辩论完成',
    description: '辩论结束',
    speakerOrder: [],
    maxRounds: 0,
    wordLimit: 0,
    maxWordLimit: 0,
    promptTemplate: ''
  }
};

export const useEnhancedDebateFlow = () => {
  const [state, setState] = useState<DebateState>({
    currentPhase: DebatePhase.PREPARING,
    currentSpeaker: null,
    messages: [],
    phaseProgress: 0,
    totalProgress: 0,
    isLoading: false,
    error: null,
    config: null,
    roundCounts: {
      [DebatePhase.PREPARING]: 0,
      [DebatePhase.HOST_INTRO]: 0,
      [DebatePhase.STATEMENT]: 0,
      [DebatePhase.INQUIRY]: 0,
      [DebatePhase.REBUTTAL]: 0,
      [DebatePhase.FREE_DEBATE]: 0,
      [DebatePhase.FINAL_SUMMARY]: 0,
      [DebatePhase.JUDGE_VERDICT]: 0,
      [DebatePhase.COMPLETED]: 0
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((update: Partial<DebateState> | ((prev: DebateState) => Partial<DebateState>)) => {
    setState(prev => ({
      ...prev,
      ...(typeof update === 'function' ? update(prev) : update)
    }));
  }, []);

  /**
   * 启动辩论
   */
  const startEnhancedDebate = useCallback(async (config: UserDebateConfig): Promise<boolean> => {
    // 重置状态
    setState({
      currentPhase: DebatePhase.PREPARING,
      currentSpeaker: null,
      messages: [],
      phaseProgress: 0,
      totalProgress: 0,
      isLoading: true,
      error: null,
      config,
      roundCounts: {
        [DebatePhase.PREPARING]: 0,
        [DebatePhase.HOST_INTRO]: 0,
        [DebatePhase.STATEMENT]: 0,
        [DebatePhase.INQUIRY]: 0,
        [DebatePhase.REBUTTAL]: 0,
        [DebatePhase.FREE_DEBATE]: 0,
        [DebatePhase.FINAL_SUMMARY]: 0,
        [DebatePhase.JUDGE_VERDICT]: 0,
        [DebatePhase.COMPLETED]: 0
      }
    });

    try {
      // 创建中断控制器
      abortControllerRef.current = new AbortController();

      // 执行完整的辩论流程
      await executeDebateFlow(config);
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateState({ error: '辩论已被用户中断' });
      } else {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        updateState({ error: `辩论过程中发生错误: ${errorMsg}` });
      }
      return false;
    } finally {
      updateState({ isLoading: false });
      abortControllerRef.current = null;
    }
  }, [updateState]);

  /**
   * 执行完整的辩论流程
   */
  const executeDebateFlow = async (config: UserDebateConfig) => {
    const enabledPhases = config.debateSettings.enabledPhases;
    const totalPhases = enabledPhases.length;
    
    for (let i = 0; i < enabledPhases.length; i++) {
      const phase = enabledPhases[i];
      
      // 检查是否被中断
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Debate aborted');
      }
      
      // 更新当前阶段
      updateState({ 
        currentPhase: phase,
        totalProgress: i / totalPhases
      });
      
      // 执行阶段
      await executePhase(phase, config);
      
      // 更新进度
      updateState({ 
        totalProgress: (i + 1) / totalPhases
      });
    }
    
    // 辩论完成
    updateState({ 
      currentPhase: DebatePhase.COMPLETED,
      totalProgress: 1,
      currentSpeaker: null
    });
    
    // 保存辩论记录
    await saveDebateRecord(config);
  };

  /**
   * 执行单个辩论阶段
   */
  const executePhase = async (phase: DebatePhase, config: UserDebateConfig) => {
    const phaseConfig = DEBATE_PHASES[phase];
    const speakers = phaseConfig.speakerOrder;
    const maxRounds = phaseConfig.maxRounds || 1;
    
    for (let round = 0; round < maxRounds; round++) {
      for (let speakerIndex = 0; speakerIndex < speakers.length; speakerIndex++) {
        const speaker = speakers[speakerIndex];
        
        // 检查是否被中断
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Debate aborted');
        }
        
        // 更新当前发言者
        updateState({ 
          currentSpeaker: speaker,
          phaseProgress: ((round * speakers.length) + speakerIndex) / (maxRounds * speakers.length)
        });
        
        // 生成发言内容
        await generateSpeech(speaker, phase, config);
        
        // 如果是质询阶段，需要处理问答逻辑
        if (phase === DebatePhase.INQUIRY && speakerIndex % 2 === 0) {
          // 生成回答
          const responder = speakers[(speakerIndex + 1) % speakers.length];
          await generateInquiryResponse(responder, phase, config);
        }
      }
    }
    
    // 更新轮次统计
    updateState(prev => ({
      roundCounts: {
        ...prev.roundCounts,
        [phase]: prev.roundCounts[phase] + 1
      },
      phaseProgress: 1
    }));
  };

  /**
   * 生成发言内容 - 支持流式输出
   */
  const generateSpeech = async (speaker: DebateRole, phase: DebatePhase, config: UserDebateConfig) => {
    const phaseConfig = DEBATE_PHASES[phase];
    const wordLimit = config.debateSettings.wordLimits[phase] || phaseConfig.wordLimit;
    
    // 构建提示词
    const prompt = buildPrompt(speaker, phase, config, wordLimit);
    
    // 选择模型
    const model = getModelForSpeaker(speaker, config);
    
    // 构建消息历史
    const messages = buildMessageHistory(speaker, phase, config, prompt);
    
    // 创建临时消息对象（用于流式显示）
    const tempMessage: DebateMessage = {
      id: generateMessageId(),
      role: speaker,
      content: '',
      phase,
      wordCount: 0,
      timestamp: Date.now(),
      speaker: getSpeakerName(speaker)
    };
    
    // 先添加临时消息到列表
    updateState(prev => ({
      messages: [...prev.messages, tempMessage]
    }));
    
    try {
      // 调用AI模型 - 启用流式输出
      const content = await callOpenRouterOptimized({
        model,
        messages,
        apiKey: config.apiCredentials.openRouterApiKey,
        targetWordCount: wordLimit,
        maxWordCount: phaseConfig.maxWordLimit,
        timeout: 30000,
        streaming: {
          enableStreaming: true,
          onChunk: (chunk: string) => {
            // 每次收到新内容时，更新消息
            console.log(`[${model}] 收到chunk:`, chunk.substring(0, 50));
            updateState(prev => {
              const updatedMessages = prev.messages.map(msg => {
                if (msg.id === tempMessage.id) {
                  const newContent = msg.content + chunk;
                  console.log(`[${model}] 更新内容长度: ${msg.content.length} -> ${newContent.length}`);
                  return { 
                    ...msg, 
                    content: newContent, 
                    wordCount: newContent.length 
                  };
                }
                return msg;
              });
              return { messages: updatedMessages };
            });
          },
          onComplete: (fullText: string) => {
            console.log(`[${model}] 发言完成:`, { 
              speaker, 
              model,
              contentLength: fullText.length,
              wordCount: fullText.length,
              preview: fullText.substring(0, 100)
            });
          },
          onError: (error: Error) => {
            console.error(`${speaker}流式输出错误:`, error);
          }
        }
      });
      
      // 流式输出完成后，确保最终内容的一致性
      updateState(prev => ({
        messages: prev.messages.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, content, wordCount: content.length }
            : msg
        )
      }));
      
      // 异步生成语音
      if (config.debateSettings.voiceEnabled) {
        const finalMessage = { ...tempMessage, content, wordCount: content.length };
        generateVoiceAsync(finalMessage, config);
      }
      
    } catch (error) {
      console.error(`${speaker}发言生成失败:`, error);
      
      // 错误时移除临时消息
      updateState(prev => ({
        messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
      }));
      
      throw error;
    }
  };

  /**
   * 生成质询回答
   */
  const generateInquiryResponse = async (responder: DebateRole, phase: DebatePhase, config: UserDebateConfig) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage) return;
    
    const answerPrompt = `请回答以下质询问题："${lastMessage.content}"。要求简洁明确，控制在120字以内。`;
    
    const model = getModelForSpeaker(responder, config);
    const messages = [
      { role: 'system' as const, content: `你是${responder === 'positive' ? '正方' : '反方'}辩手，正在参与关于"${config.topic}"的辩论` },
      { role: 'user' as const, content: answerPrompt }
    ];
    
    try {
      const content = await callOpenRouterOptimized({
        model,
        messages,
        apiKey: config.apiCredentials.openRouterApiKey,
        targetWordCount: 120,
        maxWordCount: 150
      });
      
      const message: DebateMessage = {
        id: generateMessageId(),
        role: responder,
        content,
        phase,
        wordCount: content.length,
        timestamp: Date.now(),
        speaker: getSpeakerName(responder) + '（回答）'
      };
      
      updateState(prev => ({
        messages: [...prev.messages, message]
      }));
      
      if (config.debateSettings.voiceEnabled) {
        generateVoiceAsync(message, config);
      }
      
    } catch (error) {
      console.error(`${responder}回答生成失败:`, error);
    }
  };

  /**
   * 异步生成语音（优化版）
   * 支持缓存、状态更新和错误处理
   */
  const generateVoiceAsync = async (message: DebateMessage, config: UserDebateConfig) => {
    // 不生成太短的文本音频
    if (message.content.length < 20) {
      console.log('文本太短，跳过语音生成:', message.content);
      return;
    }

    // 更新状态：开始生成音频
    updateState(prev => ({
      messages: prev.messages.map(msg => 
        msg.id === message.id 
          ? { ...msg, audioGenerating: true, audioError: false }
          : msg
      )
    }));

    try {
      // 检查缓存
      let audioData = audioCache.get(message.content, message.role);

      if (audioData) {
        console.log('使用缓存音频:', message.id);
        // 使用缓存的音频
        updateState(prev => ({
          messages: prev.messages.map(msg => 
            msg.id === message.id 
              ? { 
                  ...msg, 
                  hasAudio: true, 
                  audioGenerating: false,
                  audioError: false
                }
              : msg
          )
        }));
        
        // 自动播放缓存的音频
        audioPlayer.autoPlayAudio(message.content, message.role);
      } else {
        console.log('生成新音频:', message.id, message.role, message.content.substring(0, 50));
        
        // 生成新音频
        audioData = await synthesizeSpeechWithUserConfig(
          message.content,
          config.ttsCredentials,
          message.role
        );
        
        // 保存到缓存
        audioCache.set(message.content, message.role, audioData);
        
        // 更新状态：音频生成成功
        updateState(prev => ({
          messages: prev.messages.map(msg => 
            msg.id === message.id 
              ? { 
                  ...msg, 
                  hasAudio: true, 
                  audioGenerating: false,
                  audioError: false
                }
              : msg
          )
        }));
        
        console.log('音频生成成功:', message.id);
        
        // 自动播放音频
        audioPlayer.autoPlayAudio(message.content, message.role);
      }
      
    } catch (error) {
      console.error('语音生成失败:', error);
      
      // 更新状态：音频生成失败
      updateState(prev => ({
        messages: prev.messages.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                hasAudio: false, 
                audioGenerating: false,
                audioError: true
              }
            : msg
        )
      }));
      
      // 语音生成失败不影响辩论流程继续
    }
  };

  /**
   * 保存辩论记录
   */
  const saveDebateRecord = async (config: UserDebateConfig) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.from('debates').insert({
          topic: config.topic,
          positive_model: config.positiveModel,
          negative_model: config.negativeModel,
          judge_model: config.judgeModel,
          content: state.messages,
          user_id: user.id,
          is_public: false
        });
        
        if (error) {
          console.error('保存辩论记录失败:', error);
        } else {
          console.log('辩论记录保存成功');
        }
      }
    } catch (error) {
      console.error('保存辩论记录时发生异常:', error);
    }
  };

  /**
   * 中断辩论
   */
  const abortDebate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    updateState({ 
      isLoading: false,
      error: '辩论已被用户中断' 
    });
  }, [updateState]);

  /**
   * 重置辩论状态
   */
  const resetDebate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      currentPhase: DebatePhase.PREPARING,
      currentSpeaker: null,
      messages: [],
      phaseProgress: 0,
      totalProgress: 0,
      isLoading: false,
      error: null,
      config: null,
      roundCounts: {
        [DebatePhase.PREPARING]: 0,
        [DebatePhase.HOST_INTRO]: 0,
        [DebatePhase.STATEMENT]: 0,
        [DebatePhase.INQUIRY]: 0,
        [DebatePhase.REBUTTAL]: 0,
        [DebatePhase.FREE_DEBATE]: 0,
        [DebatePhase.FINAL_SUMMARY]: 0,
        [DebatePhase.JUDGE_VERDICT]: 0,
        [DebatePhase.COMPLETED]: 0
      }
    });
  }, []);

  return {
    ...state,
    startEnhancedDebate,
    abortDebate,
    resetDebate,
    // 额外的状态信息
    phaseConfig: DEBATE_PHASES[state.currentPhase],
    totalPhases: Object.keys(DEBATE_PHASES).length - 2, // 排除PREPARING和COMPLETED
    canAbort: state.isLoading
  };
};

// 辅助函数

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getSpeakerName(speaker: DebateRole): string {
  const names = {
    host: '主持人',
    positive: '正方',
    negative: '反方',
    judge: '裁判'
  };
  return names[speaker] || speaker;
}

function getModelForSpeaker(speaker: DebateRole, config: UserDebateConfig): string {
  switch (speaker) {
    case 'positive':
      return config.positiveModel;
    case 'negative':
      return config.negativeModel;
    case 'host':
    case 'judge':
      return config.judgeModel;
    default:
      return config.judgeModel;
  }
}

function buildPrompt(speaker: DebateRole, phase: DebatePhase, config: UserDebateConfig, wordLimit: number): string {
  const phaseConfig = DEBATE_PHASES[phase];
  let template = phaseConfig.promptTemplate;
  
  // 替换模板变量
  template = template.replace('{topic}', config.topic);
  template = template.replace('{wordLimit}', wordLimit.toString());
  template = template.replace('{side}', speaker === 'positive' ? '正方' : '反方');
  
  return template;
}

function buildMessageHistory(speaker: DebateRole, phase: DebatePhase, config: UserDebateConfig, prompt: string) {
  const systemPrompt = `你是${getSpeakerName(speaker)}，正在参与关于"${config.topic}"的专业辩论。当前阶段：${DEBATE_PHASES[phase].name}。请严格按照要求进行发言。`;
  
  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: prompt }
  ];
}