import React from 'react';
import { Message } from '../types/debate';
import { Tag, Button, Loading } from 'tdesign-react';
import { audioPlayer } from '../services/audioPlayerService.new';

interface DebateMessageProps {
  message: Message;
  isStreaming?: boolean;
  onAudioPlay?: () => void;
}

export const DebateMessage: React.FC<DebateMessageProps> = ({
  message,
  isStreaming,
  onAudioPlay
}) => {
  return (
    <div style={{
      padding: '1rem',
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <Tag theme={message.role === 'positive' ? 'success' : message.role === 'negative' ? 'danger' : 'warning'}>
          {message.role === 'positive' ? '正方' : message.role === 'negative' ? '反方' : '裁判'}
        </Tag>
        <span style={{ color: '#888', fontSize: '0.75rem' }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{
        color: '#333333',
        lineHeight: 1.6,
        fontSize: '1rem',
        whiteSpace: 'pre-wrap',
        marginBottom: '0.75rem'
      }}>
        {message.content}
        {isStreaming && <span className="typing-cursor" />}
      </div>

      {/* 音频控件 */}
      {(message.hasAudio || message.audioGenerating || message.audioError) && (
        <div style={{ marginTop: '0.75rem' }}>
          {message.audioGenerating && (
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
          
          {message.hasAudio && (
            <Button
              size="small"
              onClick={() => {
                onAudioPlay?.();
                audioPlayer.playAudio(message.id, message.role);
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
          
          {message.audioError && (
            <span style={{
              color: '#ff6b6b',
              fontSize: '0.75rem'
            }}>
              语音生成失败
            </span>
          )}
        </div>
      )}
    </div>
  );
};
