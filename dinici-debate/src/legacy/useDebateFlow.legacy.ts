import { useState, useEffect } from 'react';
import { callOpenRouter } from '../services/openRouterService';
import { synthesizeSpeech, VOICE_TYPES } from '../services/ttsService';
import { supabase } from '../lib/supabaseClient';

// 辩论角色类型定义
export type DebateRole = 'host' | 'positive' | 'negative' | 'judge' | 'user';

// 辩论消息类型定义
export type DebateMessage = {
  role: DebateRole;
  content: string;
  audio?: string; // base64音频数据
};

// 辩论阶段类型定义
export type DebatePhase = 
  | 'preparing'
  | 'host_intro'
  | 'positive_statement'
  | 'negative_rebuttal'
  | 'free_debate'
  | 'judge_summary'
  | 'completed';

// TTS配置类型定义
export type TTSConfig = {
  appid: string;
  accessToken: string;
};

// 辩论配置类型定义
export type DebateConfig = {
  topic: string;
  positiveModel: string;
  negativeModel: string;
  judgeModel: string;
  apiKey: string;
  ttsConfig: TTSConfig;
};

// 辩论流程Hook
export const useDebateFlow = () => {
  const [phase, setPhase] = useState<DebatePhase>('preparing');
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDebateConfig, setCurrentDebateConfig] = useState<DebateConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 清理错误消息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * 生成辩论消息并添加到消息列表
   */
  const addDebateMessage = async (
    role: DebateRole,
    content: string,
    voiceType: string,
    ttsConfig: TTSConfig
  ): Promise<DebateMessage> => {
    try {
      // 先生成文本消息，避免用户等待
      const message: DebateMessage = { role, content };
      setMessages(prev => [...prev, message]);
      
      // 异步生成语音，不阻塞主线程
      const audio = await synthesizeSpeech(content, {
        ...ttsConfig,
        voiceType
      });
      
      // 更新消息，添加音频
      setMessages(prev => 
        prev.map(msg => msg === message ? { ...msg, audio } : msg)
      );
      
      return message;
    } catch (speechError) {
      console.error('语音合成失败:', speechError);
      // 即使语音合成失败，也返回文本消息
      return { role, content };
    }
  };

  /**
   * 启动新的辩论流程
   */
  const startNewDebate = async (
    topic: string,
    positiveModel: string,
    negativeModel: string,
    judgeModel: string,
    apiKey: string,
    ttsConfig: TTSConfig
  ) => {
    // 参数验证
    if (!topic || !apiKey || !ttsConfig?.appid || !ttsConfig?.accessToken) {
      setError('缺少必要参数，请检查配置');
      return;
    }

    setIsLoading(true);
    setPhase('host_intro');
    setMessages([]);
    setError(null);
    
    // 保存当前辩论配置
    const config: DebateConfig = {
      topic,
      positiveModel,
      negativeModel,
      judgeModel,
      apiKey,
      ttsConfig
    };
    setCurrentDebateConfig(config);
    
    try {
      // 主持人开场
      const hostMessage = await callOpenRouter(judgeModel, [
        { role: 'user', content: `作为辩论主持人，请为辩题"${topic}"做开场白` }
      ], apiKey);
      await addDebateMessage('host', hostMessage, VOICE_TYPES.HOST, ttsConfig);

      // 正方立论
      setPhase('positive_statement');
      const positiveMessage = await callOpenRouter(positiveModel, [
        { role: 'user', content: `你作为正方辩手，请为辩题"${topic}"做立论陈述` }
      ], apiKey);
      await addDebateMessage('positive', positiveMessage, VOICE_TYPES.POSITIVE, ttsConfig);

      // 反方反驳
      setPhase('negative_rebuttal');
      const negativeMessage = await callOpenRouter(negativeModel, [
        { role: 'user', content: `你作为反方辩手，请针对以下正方观点进行反驳:\n${positiveMessage}` }
      ], apiKey);
      await addDebateMessage('negative', negativeMessage, VOICE_TYPES.NEGATIVE, ttsConfig);

      // 自由辩论 (3轮)
      setPhase('free_debate');
      let currentMessages = [...messages]; // 创建本地副本来跟踪最新消息
      
      for (let i = 0; i < 3; i++) {
        // 获取最新的辩论历史
        const debateHistory = currentMessages
          .filter(msg => msg.role === 'positive' || msg.role === 'negative')
          .map(msg => ({
            role: msg.role === 'positive' ? 'user' : 'assistant',
            content: msg.content
          })) as Array<{role: 'system' | 'user' | 'assistant', content: string}>;
        
        // 正方回应
        const positiveContext = [
          { role: 'system' as const, content: `你是正方辩手，正在参与关于"${topic}"的辩论` },
          ...debateHistory,
          { role: 'user' as const, content: '请继续你的辩论观点' }
        ];
        const positiveReply = await callOpenRouter(positiveModel, positiveContext, apiKey);
        const positiveMessage = await addDebateMessage('positive', positiveReply, VOICE_TYPES.POSITIVE, ttsConfig);
        currentMessages.push(positiveMessage);

        // 反方回应
        const negativeContext = [
          { role: 'system' as const, content: `你是反方辩手，正在参与关于"${topic}"的辩论` },
          ...debateHistory,
          { role: 'user' as const, content: positiveReply }
        ];
        const negativeReply = await callOpenRouter(negativeModel, negativeContext, apiKey);
        const negativeMessage = await addDebateMessage('negative', negativeReply, VOICE_TYPES.NEGATIVE, ttsConfig);
        currentMessages.push(negativeMessage);
      }

      // 裁判总结
      setPhase('judge_summary');
      
      // 准备裁判所需的完整辩论记录 - 使用当前最新的消息
      const fullDebateHistory = currentMessages.map(msg => 
        `${msg.role === 'host' ? '主持人' : 
          msg.role === 'positive' ? '正方' : 
          msg.role === 'negative' ? '反方' : '用户'}: ${msg.content}`
      ).join('\n\n');
      
      const judgeSummary = await callOpenRouter(judgeModel, [
        { role: 'system', content: '你是辩论裁判，需要客观公正地总结辩论并给出评价' },
        { role: 'user', content: `请总结这场关于"${topic}"的辩论，分析双方表现并给出胜负评价。\n\n辩论记录：\n${fullDebateHistory}` }
      ], apiKey);
      
      await addDebateMessage('judge', judgeSummary, VOICE_TYPES.HOST, ttsConfig);

      setPhase('completed');
      
      // 保存辩论记录到数据库
      await saveDebateToDatabase(config);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      console.error('辩论流程错误:', errorMsg);
      setError(`辩论过程中发生错误: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存辩论记录到数据库
   */
  const saveDebateToDatabase = async (config: DebateConfig) => {
    try {
      // 确保获取用户信息
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn('无法获取用户信息，可能以匿名方式保存:', authError);
        return;
      }
      
      // 保存辩论记录
      const { error: dbError } = await supabase.from('debates').insert({
        topic: config.topic,
        positive_model: config.positiveModel,
        negative_model: config.negativeModel,
        judge_model: config.judgeModel,
        content: messages, // 现在保存的是完整的messages数组
        user_id: user?.id,
        is_public: false // 默认不公开
      });
      
      if (dbError) {
        console.error('保存辩论记录失败:', dbError);
      }
    } catch (error) {
      console.error('保存辩论记录时发生异常:', error);
    }
  };

  /**
   * 重置辩论状态
   */
  const resetDebate = () => {
    setPhase('preparing');
    setMessages([]);
    setIsLoading(false);
    setError(null);
    setCurrentDebateConfig(null);
  };

  /**
   * 公开分享辩论记录
   */
  const shareDebate = async (): Promise<boolean> => {
    if (!currentDebateConfig) {
      setError('没有可分享的辩论记录');
      return false;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('请先登录');
        return false;
      }
      
      const { error } = await supabase
        .from('debates')
        .update({ is_public: true })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '分享失败';
      setError(errorMsg);
      return false;
    }
  };

  return {
    phase,
    messages,
    isLoading,
    error,
    currentDebateConfig,
    startNewDebate,
    resetDebate,
    shareDebate
  };
};
