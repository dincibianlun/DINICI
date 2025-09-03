import { DebatePhase } from '../services/userConfigService';

export interface Message {
  id: string;
  role: string;
  content: string;
  hasAudio: boolean;
  audioGenerating: boolean;
  audioError: boolean;
  phase: DebatePhase;
  wordCount: number;
  timestamp: string;
  speaker: string;
}

export interface DebateConfig {
  topic: string;
  positiveModel: string;
  negativeModel: string;
  judgeModel: string;
  voiceEnabled: boolean;
  autoPlayEnabled: boolean;
}
