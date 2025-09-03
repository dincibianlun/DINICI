import React, { useState, useEffect, useRef } from 'react';
import { Button, Loading } from 'tdesign-react';
import { audioPlayer, AudioPlayerEvent, AudioPlayerService } from '../services/audioPlayerService.new';
import { PlayCircleIcon, PauseCircleIcon } from 'tdesign-icons-react';

interface StreamingDebateMessageProps {
  role: 'host' | 'positive' | 'negative' | 'judge';
  content: string;
  isStreaming: boolean;
  hasAudio?: boolean;
  audioGenerating?: boolean;
  audioError?: boolean;
  onAudioPlay?: () => void;
  messageId: string; // 添加messageId属性
}

export const StreamingDebateMessage: React.FC<StreamingDebateMessageProps> = ({
  role,
  content,
  isStreaming,
  hasAudio,
  audioGenerating,
  audioError,
  onAudioPlay,
  messageId // 添加 messageId
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // 监听音频状态
  useEffect(() => {
    const handleAudioEvent = (event: any) => {
      if (event.messageId === messageId) {
        switch (event.type) {
          case 'start':
            setIsPlaying(true);
            setIsPaused(false);
            break;
          case 'end':
            setIsPlaying(false);
            setIsPaused(false);
            break;
          case 'pause':
            setIsPlaying(false);
            setIsPaused(true);
            break;
          case 'resume':
            setIsPlaying(true);
            setIsPaused(false);
            break;
          case 'error':
            setIsPlaying(false);
            setIsPaused(false);
            break;
        }
      }
    };

    audioPlayer.addEventListener(handleAudioEvent);
    return () => audioPlayer.removeEventListener(handleAudioEvent);
  }, [messageId]);

  // 当语音生成完成时设置audioReady
  useEffect(() => {
    if (hasAudio && !audioGenerating && !audioError) {
      setAudioReady(true);
    }
  }, [hasAudio, audioGenerating, audioError]);

  const handlePlayClick = () => {
    if (isPaused) {
      audioPlayer.resumeAudio();
    } else if (isPlaying) {
      audioPlayer.pauseAudio();
    } else {
      onAudioPlay?.(); // 通知父组件音频将要开始播放
      audioPlayer.stopCurrentAudio(); // 停止当前正在播放的任何音频
      audioPlayer.clearQueue(); // 清空播放队列
      audioPlayer.playAudio(messageId, role);
    }
  };
  
  // 打字机效果
  useEffect(() => {
    if (isStreaming) {
      // 实时更新显示
      setDisplayedContent(content);
    } else {
      // 流式结束后的打字机效果
      let index = displayedContent.length;
      
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      
      typewriterRef.current = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
          }
        }
      }, 30);
    }
    
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, [content, isStreaming]);
  
  // 音频播放控制
  const handleAudioPlay = async () => {
    if (!hasAudio) return;
    
    try {
      await audioPlayer.playAudio(content, role);
      onAudioPlay?.();
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };
  
  // 角色颜色配置
  const getRoleConfig = (role: string) => {
    const configs = {
      host: { color: '#ffd93d', bg: 'rgba(255, 217, 61, 0.1)', label: '主持人' },
      positive: { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)', label: '正方' },
      negative: { color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', label: '反方' },
      judge: { color: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)', label: '裁判' }
    };
    return configs[role as keyof typeof configs] || configs.host;
  };
  
  const roleConfig = getRoleConfig(role);
  
  return (
    <div style={{
      background: roleConfig.bg,
      border: `1px solid ${roleConfig.color}30`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      position: 'relative'
    }}>
      {/* 角色标签 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <span style={{
          color: roleConfig.color,
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          {roleConfig.label}
        </span>
        
        {/* 状态指示器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* 语音播放控制 */}
          {audioReady && (
            <Button
              variant="text"
              shape="circle"
              onClick={handlePlayClick}
              icon={isPlaying ? <PauseCircleIcon /> : <PlayCircleIcon />}
              style={{ color: roleConfig.color }}
              title={isPlaying ? '暂停' : (isPaused ? '继续' : '播放')}
            />
          )}
          
          {/* 生成中状态 */}
          {audioGenerating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: roleConfig.color,
              fontSize: '0.75rem'
            }}>
              <Loading size="small" />
              <span>生成语音中...</span>
            </div>
          )}

          {/* 流式输出状态 */}
          {isStreaming && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: roleConfig.color,
              fontSize: '0.75rem'
            }}>
              <Loading size="small" />
              正在生成...
            </div>
          )}
          
          {audioGenerating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#888888',
              fontSize: '0.75rem'
            }}>
              <Loading size="small" />
              语音合成中...
            </div>
          )}
          
          {hasAudio && (
            <Button
              variant="text"
              size="small"
              onClick={handleAudioPlay}
              style={{ color: roleConfig.color }}
            >
              🔊 播放语音
            </Button>
          )}
          
          {audioError && (
            <span style={{
              color: '#ff6b6b',
              fontSize: '0.75rem'
            }}>
              语音生成失败
            </span>
          )}
        </div>
      </div>
      
      {/* 内容显示 */}
      <div style={{
        color: '#ffffff',
        lineHeight: 1.6,
        fontSize: '0.875rem'
      }}>
        {displayedContent}
        {isStreaming && (
          <span style={{
            color: roleConfig.color,
            animation: 'pulse 1s infinite'
          }}>|</span>
        )}
      </div>
    </div>
  );
};