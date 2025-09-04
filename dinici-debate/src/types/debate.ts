// 辩论相关类型定义

// 从现有文件中导入已有类型
export type { DebateMessage, DebateRole } from '../hooks/useEnhancedDebateFlow';
export { DebatePhase } from '../services/userConfigService';

// 通用 Message 类型，兼容不同场景
export interface Message {
  id?: string;
  role: 'host' | 'positive' | 'negative' | 'judge' | 'user';
  content: string;
  speaker?: string;
  phase?: number | string;
  timestamp?: number | string;
  wordCount?: number;
  hasAudio?: boolean;
  audioGenerating?: boolean;
  audioError?: boolean;
  finalized?: boolean;
}

// 扩展的辩论配置
export interface ExtendedDebateConfig {
  topic: string;
  positiveModel: string;
  negativeModel: string;
  judgeModel: string;
  voiceEnabled: boolean;
  autoPlayEnabled?: boolean;
}