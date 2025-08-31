/**
 * 异步语音生成演示示例
 * 展示如何在AI生成文本的同时开始TTS合成
 */

import { useState } from 'react';
import { Button, Input, MessagePlugin } from 'tdesign-react';
import { audioCache } from '../services/audioCacheService';
import { audioPlayer } from '../services/audioPlayerService';
import { synthesizeSpeechWithUserConfig } from '../services/ttsService';

export const AsyncTTSDemo = () => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // 模拟AI文本生成
  const simulateAIGeneration = async (inputText: string): Promise<string> => {
    // 模拟AI流式生成文本
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`AI对"${inputText}"的回答：这是一个很有趣的话题，我认为这涉及到多个层面的考虑...`);
      }, 2000);
    });
  };

  // 异步语音生成
  const generateAudioAsync = async (content: string, role: string) => {
    try {
      setIsGenerating(true);
      setAudioError(false);

      // 检查缓存
      if (audioCache.has(content, role)) {
        console.log('使用缓存音频');
        setHasAudio(true);
        setIsGenerating(false);
        return;
      }

      // 模拟TTS配置（实际使用时从用户配置获取）
      const mockTTSConfig = {
        appid: 'your_app_id',
        accessToken: 'your_access_token'
      };

      // 生成语音
      const audioData = await synthesizeSpeechWithUserConfig(
        content,
        mockTTSConfig,
        role as any
      );

      // 缓存音频
      audioCache.set(content, role, audioData);
      
      setHasAudio(true);
      setIsGenerating(false);
      
      MessagePlugin.success('语音生成成功！');
      
    } catch (error) {
      console.error('语音生成失败:', error);
      setAudioError(true);
      setIsGenerating(false);
      MessagePlugin.error('语音生成失败');
    }
  };

  // 演示异步处理
  const handleDemoAsync = async () => {
    if (!text.trim()) {
      MessagePlugin.warning('请输入文本');
      return;
    }

    try {
      setHasAudio(false);
      setAudioError(false);

      console.log('🚀 开始异步处理...');
      
      // 1. 开始AI文本生成
      const aiPromise = simulateAIGeneration(text);
      
      // 2. 同时开始语音生成（基于用户输入的文本）
      const audioPromise = generateAudioAsync(text, 'positive');
      
      // 3. 等待AI文本生成完成
      const aiResponse = await aiPromise;
      console.log('✅ AI文本生成完成');
      
      // 4. 等待第一个音频生成完成
      await audioPromise;
      console.log('✅ 第一个音频生成完成');
      
      // 5. AI生成的新文本也异步生成语音
      generateAudioAsync(aiResponse, 'judge');
      
      setText(aiResponse);
      
    } catch (error) {
      console.error('异步处理失败:', error);
      MessagePlugin.error('处理失败');
    }
  };

  // 播放音频
  const handlePlayAudio = async () => {
    try {
      await audioPlayer.playAudio(text, 'positive');
    } catch (error) {
      MessagePlugin.error('播放失败');
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 255, 255, 0.1)'
    }}>
      <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>
        异步语音生成演示
      </h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <Input
          value={text}
          onChange={(value) => setText(value)}
          placeholder="输入文本进行异步TTS演示"
          style={{ marginBottom: '1rem' }}
        />
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button 
            onClick={handleDemoAsync}
            theme="primary"
            disabled={isGenerating}
          >
            开始异步处理
          </Button>
          
          {isGenerating && (
            <span style={{ color: '#888', fontSize: '0.875rem' }}>
              语音生成中...
            </span>
          )}
          
          {hasAudio && (
            <Button 
              onClick={handlePlayAudio}
              size="small"
              style={{
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: '#00ffff'
              }}
            >
              🔊 播放语音
            </Button>
          )}
          
          {audioError && (
            <span style={{ color: '#ff6b6b', fontSize: '0.875rem' }}>
              语音生成失败
            </span>
          )}
        </div>
      </div>
      
      <div style={{
        background: 'rgba(0, 255, 255, 0.05)',
        padding: '1rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#cccccc'
      }}>
        <h4 style={{ color: '#00ffff', margin: '0 0 0.5rem 0' }}>异步处理流程：</h4>
        <ol style={{ paddingLeft: '1rem', margin: 0 }}>
          <li>开始AI文本生成（2秒模拟）</li>
          <li>同时开始TTS语音合成</li>
          <li>两个过程并行执行，不相互阻塞</li>
          <li>AI文本完成后，对新文本也异步生成语音</li>
          <li>用户可以随时播放已生成的音频</li>
        </ol>
      </div>
      
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(255, 165, 0, 0.1)',
        borderRadius: '4px',
        fontSize: '0.75rem',
        color: '#ffaa00'
      }}>
        💡 优势：音频不保存到数据库，零存储成本，按需生成，智能缓存避免重复生成
      </div>
    </div>
  );
};