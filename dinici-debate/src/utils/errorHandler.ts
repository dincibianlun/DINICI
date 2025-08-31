import { MessagePlugin } from 'tdesign-react';

// 错误类型枚举
export enum ErrorType {
  CONFIG_ERROR = 'CONFIG_ERROR',
  API_ERROR = 'API_ERROR',
  TTS_ERROR = 'TTS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DEBATE_FLOW_ERROR = 'DEBATE_FLOW_ERROR',
  USER_ERROR = 'USER_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 增强的错误类
export class DiniciError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly userMessage: string;
  public readonly technicalDetails: any;
  public readonly timestamp: number;
  public readonly suggestions: string[];

  constructor({
    type,
    severity = ErrorSeverity.MEDIUM,
    code,
    message,
    userMessage,
    technicalDetails,
    suggestions = []
  }: {
    type: ErrorType;
    severity?: ErrorSeverity;
    code: string;
    message: string;
    userMessage: string;
    technicalDetails?: any;
    suggestions?: string[];
  }) {
    super(message);
    this.name = 'DiniciError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.userMessage = userMessage;
    this.technicalDetails = technicalDetails;
    this.timestamp = Date.now();
    this.suggestions = suggestions;
  }
}

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: DiniciError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 处理错误并显示用户友好的消息
   */
  handleError(error: unknown, context?: string): DiniciError {
    const diniciError = this.convertToDiniciError(error, context);
    
    // 记录错误
    this.logError(diniciError);
    
    // 显示用户消息
    this.showUserMessage(diniciError);
    
    // 报告错误（如果需要）
    this.reportError(diniciError);
    
    return diniciError;
  }

  /**
   * 将普通错误转换为DiniciError
   */
  private convertToDiniciError(error: unknown, context?: string): DiniciError {
    // 如果已经是DiniciError，直接返回
    if (error instanceof DiniciError) {
      return error;
    }

    // 如果是普通Error
    if (error instanceof Error) {
      return this.categorizeError(error, context);
    }

    // 如果是字符串
    if (typeof error === 'string') {
      return new DiniciError({
        type: ErrorType.SYSTEM_ERROR,
        code: 'UNKNOWN_STRING_ERROR',
        message: error,
        userMessage: '发生了未知错误，请稍后重试',
        suggestions: ['请刷新页面重试', '如果问题持续，请联系技术支持']
      });
    }

    // 其他类型的错误
    return new DiniciError({
      type: ErrorType.SYSTEM_ERROR,
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      userMessage: '发生了未知错误，请稍后重试',
      technicalDetails: error,
      suggestions: ['请刷新页面重试', '如果问题持续，请联系技术支持']
    });
  }

  /**
   * 根据错误信息分类错误
   */
  private categorizeError(error: Error, context?: string): DiniciError {
    const message = error.message.toLowerCase();

    // API密钥相关错误
    if (message.includes('api') && (message.includes('key') || message.includes('token'))) {
      return new DiniciError({
        type: ErrorType.CONFIG_ERROR,
        severity: ErrorSeverity.HIGH,
        code: 'API_KEY_ERROR',
        message: error.message,
        userMessage: 'API密钥配置有误，请检查设置',
        suggestions: [
          '请前往设置页面检查API密钥配置',
          '确保密钥格式正确（通常以sk-开头）',
          '验证密钥是否有效且未过期'
        ]
      });
    }

    // 网络相关错误
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return new DiniciError({
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: '网络连接出现问题，请检查网络连接',
        suggestions: [
          '请检查网络连接',
          '尝试刷新页面',
          '如果问题持续，可能是服务器暂时不可用'
        ]
      });
    }

    // TTS相关错误
    if (message.includes('tts') || message.includes('speech') || message.includes('audio')) {
      return new DiniciError({
        type: ErrorType.TTS_ERROR,
        severity: ErrorSeverity.LOW,
        code: 'TTS_ERROR',
        message: error.message,
        userMessage: '语音合成失败，但不影响辩论继续',
        suggestions: [
          '请检查TTS配置是否正确',
          '可以选择关闭语音功能继续辩论',
          '确保TTS服务访问令牌有效'
        ]
      });
    }

    // OpenRouter API错误
    if (message.includes('openrouter') || message.includes('401') || message.includes('403')) {
      return new DiniciError({
        type: ErrorType.API_ERROR,
        severity: ErrorSeverity.HIGH,
        code: 'OPENROUTER_API_ERROR',
        message: error.message,
        userMessage: 'AI模型调用失败，请检查API配置',
        suggestions: [
          '请检查OpenRouter API密钥是否正确',
          '确认账户余额是否充足',
          '验证所选模型是否可用'
        ]
      });
    }

    // 配置验证错误
    if (message.includes('配置') || message.includes('validation') || message.includes('invalid')) {
      return new DiniciError({
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: 'VALIDATION_ERROR',
        message: error.message,
        userMessage: '配置信息不完整或不正确',
        suggestions: [
          '请检查所有必填项是否已填写',
          '确认输入格式是否正确',
          '重新配置相关设置'
        ]
      });
    }

    // 辩论流程错误
    if (context === 'debate' || message.includes('debate') || message.includes('辩论')) {
      return new DiniciError({
        type: ErrorType.DEBATE_FLOW_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: 'DEBATE_FLOW_ERROR',
        message: error.message,
        userMessage: '辩论流程出现问题',
        suggestions: [
          '尝试重新开始辩论',
          '检查网络连接是否稳定',
          '如果问题持续，请尝试不同的AI模型'
        ]
      });
    }

    // 默认系统错误
    return new DiniciError({
      type: ErrorType.SYSTEM_ERROR,
      severity: ErrorSeverity.MEDIUM,
      code: 'GENERAL_ERROR',
      message: error.message,
      userMessage: '系统出现错误，请稍后重试',
      suggestions: [
        '请尝试刷新页面',
        '如果问题持续，请联系技术支持',
        '您可以尝试重新配置相关设置'
      ]
    });
  }

  /**
   * 记录错误到本地日志
   */
  private logError(error: DiniciError): void {
    this.errorLog.push(error);
    
    // 保持日志大小在限制范围内
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // 开发环境下输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 DiniciError [${error.severity.toUpperCase()}]`);
      console.error('Type:', error.type);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Technical Details:', error.technicalDetails);
      console.error('Suggestions:', error.suggestions);
      console.error('Timestamp:', new Date(error.timestamp).toISOString());
      console.groupEnd();
    }
  }

  /**
   * 显示用户友好的错误消息
   */
  private showUserMessage(error: DiniciError): void {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        MessagePlugin.error({
          content: error.userMessage,
          duration: 8000,
          closeBtn: true
        });
        break;
      case ErrorSeverity.HIGH:
        MessagePlugin.error({
          content: error.userMessage,
          duration: 6000,
          closeBtn: true
        });
        break;
      case ErrorSeverity.MEDIUM:
        MessagePlugin.warning({
          content: error.userMessage,
          duration: 4000
        });
        break;
      case ErrorSeverity.LOW:
        MessagePlugin.info({
          content: error.userMessage,
          duration: 3000
        });
        break;
    }
  }

  /**
   * 报告错误到监控系统（如果配置了）
   */
  private reportError(error: DiniciError): void {
    // 这里可以集成错误监控服务，如Sentry、LogRocket等
    // 目前只在控制台输出
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.warn('High severity error detected:', {
        type: error.type,
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      });
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): DiniciError[] {
    return [...this.errorLog];
  }

  /**
   * 清空错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): { [key in ErrorType]: number } {
    const stats = {} as { [key in ErrorType]: number };
    
    // 初始化所有错误类型为0
    Object.values(ErrorType).forEach(type => {
      stats[type] = 0;
    });
    
    // 统计各类型错误数量
    this.errorLog.forEach(error => {
      stats[error.type]++;
    });
    
    return stats;
  }
}

// 配置验证器增强
export class EnhancedConfigValidator {
  /**
   * 验证OpenRouter API密钥格式
   */
  static validateOpenRouterApiKey(apiKey: string): { isValid: boolean; error?: DiniciError } {
    if (!apiKey || apiKey.trim() === '') {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'EMPTY_API_KEY',
          message: 'API key is empty',
          userMessage: 'OpenRouter API密钥不能为空',
          suggestions: ['请在设置页面添加有效的API密钥']
        })
      };
    }

    const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, '');
    
    if (!cleanKey.startsWith('sk-')) {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'INVALID_API_KEY_FORMAT',
          message: 'Invalid API key format',
          userMessage: 'API密钥格式不正确，通常应以sk-开头',
          suggestions: ['请检查API密钥格式', '从OpenRouter官网复制完整的密钥']
        })
      };
    }

    if (cleanKey.length < 20) {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'API_KEY_TOO_SHORT',
          message: 'API key too short',
          userMessage: 'API密钥长度不足，可能不是有效密钥',
          suggestions: ['请确认复制了完整的API密钥', '检查密钥是否被截断']
        })
      };
    }

    return { isValid: true };
  }

  /**
   * 验证TTS配置
   */
  static validateTTSConfig(config: { appid: string; accessToken: string }): { isValid: boolean; error?: DiniciError } {
    if (!config.appid || config.appid.trim() === '') {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'EMPTY_TTS_APPID',
          message: 'TTS APPID is empty',
          userMessage: 'TTS应用ID不能为空',
          suggestions: ['请在设置页面配置火山引擎TTS的APPID']
        })
      };
    }

    if (!config.accessToken || config.accessToken.trim() === '') {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'EMPTY_TTS_TOKEN',
          message: 'TTS access token is empty',
          userMessage: 'TTS访问令牌不能为空',
          suggestions: ['请在设置页面配置火山引擎TTS的访问令牌']
        })
      };
    }

    return { isValid: true };
  }

  /**
   * 验证辩论主题
   */
  static validateDebateTopic(topic: string): { isValid: boolean; error?: DiniciError } {
    if (!topic || topic.trim() === '') {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'EMPTY_DEBATE_TOPIC',
          message: 'Debate topic is empty',
          userMessage: '请输入辩论主题',
          suggestions: ['输入一个具有争议性的话题', '确保主题清晰明确']
        })
      };
    }

    if (topic.trim().length < 5) {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'TOPIC_TOO_SHORT',
          message: 'Debate topic too short',
          userMessage: '辩论主题过短，请输入更详细的主题',
          suggestions: ['主题应至少包含5个字符', '尽量使主题具体明确']
        })
      };
    }

    if (topic.trim().length > 200) {
      return {
        isValid: false,
        error: new DiniciError({
          type: ErrorType.VALIDATION_ERROR,
          code: 'TOPIC_TOO_LONG',
          message: 'Debate topic too long',
          userMessage: '辩论主题过长，请简化主题描述',
          suggestions: ['主题应控制在200字符以内', '保持主题简洁明了']
        })
      };
    }

    return { isValid: true };
  }
}

// 导出错误处理器实例
export const errorHandler = ErrorHandler.getInstance();

// 全局错误处理函数
export const handleError = (error: unknown, context?: string): DiniciError => {
  return errorHandler.handleError(error, context);
};

// 快捷错误创建函数
export const createConfigError = (message: string, suggestions: string[] = []): DiniciError => {
  return new DiniciError({
    type: ErrorType.CONFIG_ERROR,
    severity: ErrorSeverity.HIGH,
    code: 'CONFIG_ERROR',
    message,
    userMessage: message,
    suggestions
  });
};

export const createAPIError = (message: string, suggestions: string[] = []): DiniciError => {
  return new DiniciError({
    type: ErrorType.API_ERROR,
    severity: ErrorSeverity.HIGH,
    code: 'API_ERROR',
    message,
    userMessage: message,
    suggestions
  });
};

export const createValidationError = (message: string, suggestions: string[] = []): DiniciError => {
  return new DiniciError({
    type: ErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    code: 'VALIDATION_ERROR',
    message,
    userMessage: message,
    suggestions
  });
};