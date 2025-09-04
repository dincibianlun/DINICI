import { useState, useCallback, useRef } from 'react';
import { UserDebateConfig, DebatePhase } from '../services/userConfigService';
import { callOpenRouterOptimized } from '../services/openRouterService';
import { synthesizeSpeechWithUserConfig } from '../services/ttsService';
import { audioCache } from '../services/audioCacheService';
// supabase not used in this hook

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
  // 标记消息是否已最终确定（流式结束后为 true），用于保存/播放就绪判断
  finalized?: boolean;
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
    maxWordLimit: 280,
    promptTemplate: `你是辩论主持人，请为关于"{topic}"的辩论做开场介绍。
介绍内容应包括：
1. 辩论主题阐述
2. 辩论规则说明
3. 双方立场介绍
4. 营造公正严肃的辩论氛围

要求：语言正式专业，控制在{wordLimit}字以内，开场词应具有权威性和引导性。不要超过280字。`
  },
  [DebatePhase.STATEMENT]: {
    name: '立论阶段',
    description: '正反双方阐述核心观点',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 1,
    wordLimit: 250,
    maxWordLimit: 280,
  promptTemplate: `作为{side}方辩手，请就"{topic}"这个议题展开你的立论。

立论建议：
1. 准确把握议题本质
   - 思考这个问题为什么值得讨论
   - 明确{side}方的基本立场
   - 揭示问题的复杂性和多面性

2. 根据议题性质选择恰当的论证方式：
   - 伦理道德类：注重价值判断，讲述有感染力的案例
   - 社会现象类：结合普遍经验，分析现实影响
   - 政策制度类：考虑可行性，权衡利弊得失
   - 科技发展类：关注发展趋势，评估多维影响

3. 论证策略：
   - 提出2-3个核心论点，确保逻辑连贯
   - 结合具体事例或场景来支持论点
   - 恰当使用数据，但不过度依赖
   - 预判对方可能的质疑并提前回应

4. 表达技巧：
   - 用生动的比喻和事例增强说服力
   - 语言要流畅自然，避免过于生硬
   - 适当引用大众熟知的现象或案例
   - 展现思维的开放性和包容性

请记住：好的立论不是单纯的说教，而是要引发思考和共鸣。控制在{wordLimit}字以内。`
  },
  [DebatePhase.INQUIRY]: {
    name: '质询阶段',
    description: '双方互相质询和回答',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 2,
    wordLimit: 120,
    maxWordLimit: 280,
    promptTemplate: `作为{side}方辩手，请根据对方的论述提出你的质询。

质询建议：
1. 问题设计：
   - 如果发现对方论述中的模糊之处，请提出澄清性的问题
   - 如果看到逻辑上的不足，可以提出挑战性的问题
   - 如果涉及具体观点，可以请求举例说明
   - 如果涉及价值判断，可以探讨其判断标准

2. 提问策略：
   - 善用"如果...那么..."的假设性问题
   - 结合具体场景或案例来构建问题
   - 探索对方论述中可能被忽视的角度
   - 引导对方深入思考问题的复杂性

3. 提问艺术：
   - 语气要诚恳，展现求知欲而非攻击性
   - 问题要清晰具体，避免笼统或模棱两可
   - 适当运用比喻或类比来阐明问题
   - 给对方合理的思考和回应空间

记住：好的质询不是为了难住对方，而是为了推进讨论深度。控制在{wordLimit}字以内。`
  },
  [DebatePhase.REBUTTAL]: {
    name: '驳论阶段',
    description: '双方反驳对方观点',
    speakerOrder: ['negative', 'positive'],
    maxRounds: 1,
    wordLimit: 230,
    maxWordLimit: 280,
  promptTemplate: `你是{side}，请对对方的立论进行严谨且具有穿透力的驳论。
驳论要求（强调证据与方法论审视）：
1. 指出对方论证中的关键逻辑漏洞、隐含假设或证据空白
2. 用事实、数据或方法论上的批判来削弱对方论点（提供来源类型或研究维度）
3. 提出可检验的反例或反事实以展示对方论点的局限
4. 兼顾反驳与自我强固：在反驳同时强化己方最稳固的论据
5. 如能，指出对方证据中可能的解释替代或混淆因素
6. 可适当引用一句名言或研究结论作辅助

控制在{wordLimit}字以内（上限280字），驳论应兼具逻辑性、证据性与策略性。`
  },
  [DebatePhase.FREE_DEBATE]: {
    name: '自由辩论',
    description: '双方自由交锋',
    speakerOrder: ['positive', 'negative'],
    maxRounds: 3,
    wordLimit: 180,
    maxWordLimit: 280,
  promptTemplate: `作为{side}方辩手，这是自由辩论环节。请展现你的智慧与洞察力，使辩论更加生动深入。

要点提示：
1. 对方如果提出了问题，请先认真回应他们的疑问，再展开你的论述
2. 根据议题性质灵活选择论证方式：
   - 涉及伦理道德时，可以讲述真实故事或案例，引发情感共鸣
   - 讨论社会现象时，结合大众的切身体验和观察
   - 探讨政策制度时，注重实践中的可行性
   - 辩论科技发展时，关注对人类社会的实际影响

3. 论证技巧：
   - 可以用生动的比喻或类比来阐释复杂观点
   - 适时引用生活中常见的例子
   - 在需要时才使用数据，不要为了数据而数据
   - 可以提出假设性的场景来说明问题

4. 互动策略：
   - 积极回应对方的关切
   - 寻找潜在的共识点
   - 用设身处地的思考展示同理心
   - 保持开放和包容的态度

语言要自然流畅，像是在进行一场富有智慧的对话。控制在{wordLimit}字以内。`
  },
  [DebatePhase.FINAL_SUMMARY]: {
    name: '总结陈词',
    description: '双方最终总结',
    speakerOrder: ['negative', 'positive'],
    maxRounds: 1,
    wordLimit: 250,
    maxWordLimit: 280,
  promptTemplate: `你是{side}，请进行具有总结性与洞察力的最终陈词。
总结要求：
1. 简洁回顾并强化己方最关键的1-2条论点与证据链
2. 指出对方在论证上的主要不足，并说明为何己方解释更具说服力或适用范围更广
3. 提供1条可供观众检索或验证的证据线索（数据/研究名/期刊）
4. 呼应开篇，形成完整的论证闭环并提出未来思考方向（可选短句）
5. 语言要有感召力并保持逻辑收束
6. 可用一句名言作为结语以增强记忆点

控制在{wordLimit}字以内（上限280字），兼具感染力与理性说服。`
  },
  [DebatePhase.JUDGE_VERDICT]: {
    name: '裁判评议',
    description: '裁判评议和宣布结果',
    speakerOrder: ['judge'],
    maxRounds: 1,
    wordLimit: 250,
    maxWordLimit: 280,
  promptTemplate: `你是辩论裁判，请对刚才关于"{topic}"的辩论做一份专业、结构化且可执行的评议。
评议要求：
1. 梳理双方主要论点与证据链，评估逻辑一致性与证据质量
2. 对论证方法、证据来源与论据覆盖范围进行短评
3. 指出每一阶段的亮点与关键改进点
4. 给出清晰的胜负判断并说明核心理由（例如证据更可靠或逻辑更严密）
5. 推荐1-2条可以改进论证的方法或补充的证据方向
6. 可用一句富有哲理的名言作结

控制在{wordLimit}字以内（上限280字），评议应兼具专业性与可操作性。`
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
        
        // 质询阶段的特殊处理
        if (phase === DebatePhase.INQUIRY) {
          if (round === 0 && speakerIndex === 0) {
            // 第一轮第一个发言者（正方提问），正常生成
            await generateSpeech(speaker, phase, config);
          } else if (round === 0 && speakerIndex === 1) {
            // 第一轮第二个发言者（反方回答并提问）
            await generateInquiryResponse(speaker, phase, config);
          } else if (round === 1 && speakerIndex === 0) {
            // 第二轮第一个发言者（正方回答并提问）
            await generateInquiryResponse(speaker, phase, config);
          } else if (round === 1 && speakerIndex === 1) {
            // 第二轮第二个发言者（反方回答，结束质询）
            await generateInquiryResponse(speaker, phase, config);
          }
        } else {
          // 非质询阶段，正常生成发言
          await generateSpeech(speaker, phase, config);
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
      
      // 流式输出完成后，优先使用 state 中聚合的内容（onChunk 已持续写入），fallback 为返回的 content
      const aggregated = state.messages.find(m => m.id === tempMessage.id);
      const finalContent = aggregated && aggregated.content && aggregated.content.length > 0 ? aggregated.content : content;

      // 流式输出完成后，确保最终内容的一致性，并标记为已最终化
      updateState(prev => ({
        messages: prev.messages.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, content: finalContent, wordCount: finalContent.length, finalized: true }
            : msg
        )
      }));

      // 异步生成语音（使用最终内容）
      if (config.debateSettings.voiceEnabled) {
        const finalMessage = { ...tempMessage, content: finalContent, wordCount: finalContent.length, finalized: true };
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
    
    const answerPrompt = `请先回答以下质询问题："${lastMessage.content}"，然后再向对方提出一个针对性的质询。
    
回答要求：
1. 先清晰回应对方的问题，不回避核心问题
2. 然后提出你的反质询，针对对方立论的薄弱环节
3. 回答和质询需明确区分，可以用"回应："和"质询："标明
4. 引用1个相关的专业数据或统计结果来支持你的论点
5. 适当引用文学金句或名人名言增强表达力和说服力
6. 整体风格专业、严谨但不失锐利

控制在280字以内，言简意赅。不要超过280字。`;
    
    const model = getModelForSpeaker(responder, config);
    const messages = [
      { role: 'system' as const, content: `你是${responder === 'positive' ? '正方' : '反方'}辩手，正在参与关于"${config.topic}"的辩论。你需要回应对方的质询并提出自己的问题。` },
      { role: 'user' as const, content: answerPrompt }
    ];
    
    try {
      const content = await callOpenRouterOptimized({
        model,
        messages,
        apiKey: config.apiCredentials.openRouterApiKey,
        targetWordCount: 200,
        maxWordCount: 280
      });
      
      const message: DebateMessage = {
        id: generateMessageId(),
        role: responder,
        content,
        phase,
        wordCount: content.length,
        timestamp: Date.now(),
        speaker: getSpeakerName(responder) + '（回应与质询）'
  };
      
      updateState(prev => ({
        messages: [...prev.messages, message]
      }));
      
      if (config.debateSettings.voiceEnabled) {
        // 该消息是一次性生成的内容，已为最终化内容
        const finalMsg = { ...message, finalized: true };
        generateVoiceAsync(finalMsg, config);
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
    // 规范化文本并检查长度
    const text = message.content ? message.content.trim().replace(/\s+/g, ' ') : '';
    if (!text || text.length < 20) {
      console.log('文本为空或太短，跳过语音生成:', message.id);
      updateState(prev => ({
        messages: prev.messages.map(msg => msg.id === message.id ? { ...msg, audioGenerating: false, audioError: true } : msg)
      }));
      return;
    }

    // 标记为正在生成
    updateState(prev => ({
      messages: prev.messages.map(msg => msg.id === message.id ? { ...msg, audioGenerating: true, audioError: false } : msg)
    }));

    try {
      // 检查缓存（audioCache内部会使用规范化key）
      let audioData = audioCache.get(text, message.role);

      if (audioData) {
        console.log('使用缓存音频:', message.id);
        updateState(prev => ({
          messages: prev.messages.map(msg => msg.id === message.id ? { ...msg, hasAudio: true, audioGenerating: false, audioError: false } : msg)
        }));
        return; // 不自动播放
      }

      console.log('生成新音频:', message.id, message.role, text.substring(0, 50));
      audioData = await synthesizeSpeechWithUserConfig(text, config.ttsCredentials, message.role);

      // 保存到缓存
      audioCache.set(text, message.role, audioData);

      // 更新状态
      updateState(prev => ({
        messages: prev.messages.map(msg => msg.id === message.id ? { ...msg, hasAudio: true, audioGenerating: false, audioError: false } : msg)
      }));

      console.log('音频生成并缓存成功:', message.id);
    } catch (error) {
      console.error('语音生成失败:', error);
      updateState(prev => ({
        messages: prev.messages.map(msg => msg.id === message.id ? { ...msg, hasAudio: false, audioGenerating: false, audioError: true } : msg)
      }));
    }
  };

  /**
   * 保存辩论记录
   */
  const saveDebateRecord = async (_config: UserDebateConfig) => {
    // 注释掉自动保存功能，完全依靠用户手动点击保存按钮
    /* 
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
    */
    
    // 只记录日志，不执行实际保存操作
    console.log('辩论完成，等待用户手动保存');
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
  
  // 如果用户传入了正/反方的简短观点提示，将其注入到提示词开头，帮助模型捕捉用户意图（不覆盖模板要求）
  const sideHints = (config as any).sideHints as { positive?: string; negative?: string } | undefined;
  const sideHintText = sideHints ? (speaker === 'positive' ? sideHints.positive : sideHints.negative) : undefined;

  if (sideHintText && sideHintText.trim()) {
    return `（用户提示：${sideHintText.trim()}）\n` + template;
  }

  return template;
}

function buildMessageHistory(speaker: DebateRole, phase: DebatePhase, config: UserDebateConfig, prompt: string) {
  const systemPrompt = `你是${getSpeakerName(speaker)}，正在参与关于"${config.topic}"的专业辩论。当前阶段：${DEBATE_PHASES[phase].name}。

作为一个辩手，你应该：
1. 展现真实且具有创造性的思维，不要机械性地堆砌论据
2. 根据辩题的性质灵活选择论证方式：
   - 对于伦理道德类议题，注重情感共鸣和价值观分析
   - 对于社会现象类议题，结合具体案例和生活经验
   - 对于政策制度类议题，权衡利弊并考虑可行性
   - 对于科技发展类议题，关注趋势和影响

3. 保持开放性思维：
   - 承认问题的复杂性，避免非黑即白
   - 主动思考对方可能的顾虑和疑问
   - 适时调整论证策略和重点

4. 展现辩论的艺术性：
   - 适当运用修辞和比喻增强表现力
   - 在严谨论证之外也要有感染力
   - 根据场景选择恰当的语气和表达方式

请记住：好的辩论不是简单的对抗，而是通过理性的交锋达到真理的探索。`;
  
  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: prompt }
  ];
}