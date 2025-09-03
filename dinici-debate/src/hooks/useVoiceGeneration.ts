import { useState, useCallback } from 'react';
import { synthesizeSpeechWithUserConfig } from '../services/ttsService';
import { audioCache } from '../services/audioCacheService';
import { UserDebateConfig } from '../services/userConfigService';
import type { DebateMessage } from './useEnhancedDebateFlow';

export const useVoiceGeneration = (config: UserDebateConfig | null) => {
  const [generatingVoices, setGeneratingVoices] = useState<Set<string>>(new Set());
  const [errorMessages, setErrorMessages] = useState<Set<string>>(new Set());

  /**
   * 生成语音并缓存
   */
  const generateVoice = useCallback(async (message: DebateMessage) => {
    const messageId = message.id;
    
    try {
      // 检查是否已经在生成
      if (generatingVoices.has(messageId)) {
        console.log('语音已在生成中:', messageId);
        return;
      }

      // 检查语音缓存
      if (audioCache.has(messageId, message.role)) {
        console.log('语音已存在于缓存中:', messageId);
        return;
      }

      // 检查配置
      if (!config || !config.ttsCredentials || !config.ttsCredentials.appid || !config.ttsCredentials.accessToken) {
        throw new Error('语音合成配置无效');
      }

      // 开始生成
      setGeneratingVoices(prev => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });

      // 分段处理长文本
      const maxLength = 300; // 豆包推荐的最大长度
      const text = message.content;
      const chunks = [];

      // 按标点符号分段
      let start = 0;
      let currentLength = 0;
      let lastPunctuationIndex = -1;

      for (let i = 0; i < text.length; i++) {
        currentLength++;
        
        // 识别标点符号
        if ('。！？，；'.includes(text[i])) {
          lastPunctuationIndex = i;
        }

        // 需要分段
        if (currentLength >= maxLength && lastPunctuationIndex > start) {
          chunks.push(text.slice(start, lastPunctuationIndex + 1));
          start = lastPunctuationIndex + 1;
          currentLength = i - lastPunctuationIndex;
          lastPunctuationIndex = -1;
        }
      }

      // 添加剩余部分
      if (start < text.length) {
        chunks.push(text.slice(start));
      }

      // 生成每个分段的音频
      const audioChunks: string[] = [];
      
      for (const chunk of chunks) {
        const audioBase64 = await synthesizeSpeechWithUserConfig(
          chunk,
          config.ttsCredentials,
          message.role,
          {
            encoding: 'mp3',
            rate: 24000,
            bitrate: 160,
            speedRatio: 1.0,
            loudnessRatio: 1.0
          }
        );
        audioChunks.push(audioBase64);
      }

      // 合并音频分段
      const concatenatedAudio = audioChunks.join('');
      
      // 缓存合并后的音频
      audioCache.set(messageId, message.role, concatenatedAudio);

      // 更新状态
      setErrorMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });

    } catch (error) {
      console.error('语音生成失败:', error);
      setErrorMessages(prev => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });
    } finally {
      setGeneratingVoices(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  }, [config]);

  /**
   * 生成多条消息的语音
   */
  const generateVoicesForMessages = useCallback(async (messages: DebateMessage[]) => {
    // 过滤出需要生成语音的消息
    const messagesToGenerate = messages.filter(msg => 
      !audioCache.has(msg.id, msg.role) && 
      !generatingVoices.has(msg.id)
    );

    // 并行生成语音，但限制并发数
    const concurrencyLimit = 2;
    const chunks = [];
    
    for (let i = 0; i < messagesToGenerate.length; i += concurrencyLimit) {
      const chunk = messagesToGenerate.slice(i, i + concurrencyLimit);
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(message => generateVoice(message)));
    }
  }, [generateVoice]);

  return {
    generateVoice,
    generateVoicesForMessages,
    isGenerating: (messageId: string) => generatingVoices.has(messageId),
    hasError: (messageId: string) => errorMessages.has(messageId)
  };
};
