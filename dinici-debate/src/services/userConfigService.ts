import { supabase } from '../lib/supabaseClient';

// 用户辩论配置类型定义
export interface UserDebateConfig {
  // 用户选择的基础配置
  topic: string; // 用户自定义辩题
  positiveModel: string; // 用户选择的正方模型
  negativeModel: string; // 用户选择的反方模型
  judgeModel: string; // 用户选择的裁判模型
  
  // 用户API配置
  apiCredentials: {
    openRouterApiKey: string; // 从用户数据库获取
    keyId: string; // 密钥记录ID
    keyName: string; // 用户给密钥的备注名
  };
  
  // 用户TTS配置
  ttsCredentials: {
    appid: string; // 从用户数据库获取
    accessToken: string;
    configId: string; // TTS配置记录ID
    clusterId?: string;
  };
  
  // 辩论参数设置
  debateSettings: {
    enabledPhases: DebatePhase[];
    wordLimits: Record<DebatePhase, number>; // 字数控制
    freeDebateRounds: number;
    voiceEnabled: boolean;
    autoPlayEnabled?: boolean; // 自动播放语音设置
  };
  // 可选：为正反双方提供的简短观点提示（前端可选输入）
  sideHints?: {
    positive?: string;
    negative?: string;
  };
}

// 辩论阶段枚举
export enum DebatePhase {
  PREPARING = 'preparing',
  HOST_INTRO = 'host_intro',
  STATEMENT = 'statement',
  INQUIRY = 'inquiry',
  REBUTTAL = 'rebuttal',
  FREE_DEBATE = 'free_debate',
  FINAL_SUMMARY = 'final_summary',
  JUDGE_VERDICT = 'judge_verdict',
  COMPLETED = 'completed'
}

// 字数限制配置（覆盖所有阶段）
export type DebateWordLimits = Record<DebatePhase, number>;

// 默认字数限制
export const DEFAULT_WORD_LIMITS: DebateWordLimits = {
  [DebatePhase.HOST_INTRO]: 120,
  [DebatePhase.STATEMENT]: 250,
  [DebatePhase.INQUIRY]: 60,
  [DebatePhase.REBUTTAL]: 200,
  [DebatePhase.FREE_DEBATE]: 150,
  [DebatePhase.FINAL_SUMMARY]: 200,
  [DebatePhase.JUDGE_VERDICT]: 300,
  [DebatePhase.PREPARING]: 0,
  [DebatePhase.COMPLETED]: 0
};

// 配置错误类型
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

// 验证结果类型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 用户配置管理器
 */
export class UserConfigManager {
  /**
   * 获取用户的辩论配置
   * @param userId 用户ID
   * @returns 用户配置或null（如果配置不完整）
   */
  async getUserDebateConfig(userId: string): Promise<UserDebateConfig | null> {
    try {
      // 1. 获取用户的OpenRouter API密钥
      const apiKeys = await this.getOpenRouterKeys(userId);
      if (!apiKeys || apiKeys.length === 0) {
        throw new ConfigError('未找到OpenRouter API密钥，请先在设置中配置');
      }
      
      // 2. 获取用户的TTS配置
      const ttsConfigs = await this.getTTSConfigs(userId);
      if (!ttsConfigs || ttsConfigs.length === 0) {
        throw new ConfigError('未找到TTS配置，请先在设置中配置');
      }
      
      // 3. 使用最新的配置（按创建时间排序第一个）
      const latestApiKey = apiKeys[0];
      const latestTTSConfig = ttsConfigs[0];
      
      return {
        topic: '', // 待用户输入
        positiveModel: 'openai/gpt-5-chat', // 默认值，用户可修改
        negativeModel: 'anthropic/claude-3-haiku',
        judgeModel: 'openai/gpt-5-chat',
        apiCredentials: {
          openRouterApiKey: this.parseOpenRouterKey(latestApiKey.api_key),
          keyId: latestApiKey.id,
          keyName: latestApiKey.key_name
        },
        ttsCredentials: this.parseTTSConfig(latestTTSConfig),
        debateSettings: this.getDefaultDebateSettings()
      };
    } catch (error) {
      console.error('获取用户配置失败:', error);
      return null;
    }
  }
  
  /**
   * 获取用户的OpenRouter API密钥
   */
  private async getOpenRouterKeys(userId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'openrouter')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  /**
   * 获取用户的TTS配置
   */
  private async getTTSConfigs(userId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'tts')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  /**
   * 解析OpenRouter API密钥
   */
  private parseOpenRouterKey(rawKey: string): string {
    try {
      // 尝试解析JSON格式的密钥
      const keyConfig = JSON.parse(rawKey);
      return keyConfig.key?.trim() || keyConfig.api_key?.trim() || '';
    } catch {
      // 解析失败则视为纯文本密钥
      let cleanKey = rawKey.trim();
      cleanKey = cleanKey.replace(/^["']|["']$/g, ''); // 移除引号
      return cleanKey;
    }
  }

  /**
   * 解析TTS配置
   */
  private parseTTSConfig(configRecord: any) {
    const ttsConfig = JSON.parse(configRecord.api_key);
    return {
      appid: ttsConfig.appid,
      accessToken: ttsConfig.access_token,
      configId: configRecord.id,
      clusterId: ttsConfig.cluster_id || 'volcano_tts'
    };
  }

  /**
   * 获取默认辩论设置
   */
  private getDefaultDebateSettings() {
    return {
      enabledPhases: [
        DebatePhase.HOST_INTRO,
        DebatePhase.STATEMENT,
        DebatePhase.INQUIRY,
        DebatePhase.REBUTTAL,
        DebatePhase.FREE_DEBATE,
        DebatePhase.FINAL_SUMMARY,
        DebatePhase.JUDGE_VERDICT
      ],
      wordLimits: DEFAULT_WORD_LIMITS,
      freeDebateRounds: 3,
      voiceEnabled: true,
      autoPlayEnabled: false // 默认关闭自动播放
    };
  }

  /**
   * 检查用户配置的简化版本（用于快速检查）
   */
  async checkUserConfigExists(userId: string): Promise<boolean> {
    try {
      const [apiKeys, ttsConfigs] = await Promise.all([
        this.getOpenRouterKeys(userId),
        this.getTTSConfigs(userId)
      ]);
      
      return !!(apiKeys && apiKeys.length > 0 && ttsConfigs && ttsConfigs.length > 0);
    } catch (error) {
      console.error('检查用户配置失败:', error);
      return false;
    }
  }
}

/**
 * 配置验证器
 */
export class ConfigValidator {
  /**
   * 验证用户配置的完整性
   */
  validateUserConfig(config: UserDebateConfig): ValidationResult {
    const errors: string[] = [];
    
    // 验证基础配置
    if (!config.topic?.trim()) {
      errors.push('请输入辩论主题');
    }
    
    // 验证模型选择
    if (!this.isValidModel(config.positiveModel)) {
      errors.push('正方模型选择无效');
    }
    if (!this.isValidModel(config.negativeModel)) {
      errors.push('反方模型选择无效');
    }
    if (!this.isValidModel(config.judgeModel)) {
      errors.push('裁判模型选择无效');
    }
    
    // 验证API凭据
    if (!config.apiCredentials.openRouterApiKey) {
      errors.push('OpenRouter API密钥不能为空');
    }
    
    // 验证TTS凭据
    if (!config.ttsCredentials.appid || !config.ttsCredentials.accessToken) {
      errors.push('TTS配置不完整');
    }
    
    // 验证字数限制
    for (const [phase, limit] of Object.entries(config.debateSettings.wordLimits)) {
      if (typeof limit !== 'number' || limit <= 0) {
        errors.push(`${phase}阶段字数限制无效`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 验证模型是否在支持列表中
   */
  private isValidModel(model: string): boolean {
    const validModels = [
      'openai/gpt-5-chat',
      'anthropic/claude-3-haiku',
      'deepseek/deepseek-chat-v3.1',
      'baidu/ernie-4.5-vl-28b-a3b',
      'z-ai/glm-4.5',
      'moonshotai/kimi-k2',
      'x-ai/grok-4',
      'qwen/qwen-max',
      'google/gemini-2.5-pro'
    ];
    return validModels.includes(model);
  }
}

// 导出实例
export const userConfigManager = new UserConfigManager();
export const configValidator = new ConfigValidator();