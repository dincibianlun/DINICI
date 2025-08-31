// OpenRouter API 消息类型定义
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// OpenRouter API 响应类型定义
export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 流式调用配置
export interface StreamingConfig {
  enableStreaming: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// 优化的OpenRouter配置
export interface OptimizedOpenRouterConfig {
  model: string; // 由用户选择的模型
  messages: OpenRouterMessage[];
  apiKey: string; // 用户的API密钥
  streaming?: StreamingConfig;
  timeout?: number;
  retryCount?: number;
  temperature?: number;
  maxTokens?: number;
  // 新增：字数控制参数
  targetWordCount?: number; // 目标字数
  minWordCount?: number; // 最小字数
  maxWordCount?: number; // 最大字数
}

/**
 * 优化的OpenRouter API调用服务 - 支持流式和字数控制
 * @param config - 优化的配置参数
 * @returns API返回的文本内容
 */
export const callOpenRouterOptimized = async (
  config: OptimizedOpenRouterConfig
): Promise<string> => {
  const {
    model,
    messages,
    apiKey,
    streaming,
    timeout = 30000,
    retryCount = 3,
    temperature = 0.7,
    maxTokens = 1000,
    targetWordCount,
    minWordCount,
    maxWordCount
  } = config;

  // 增强参数验证
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API密钥不能为空');
  }
  if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('缺少必要的参数: model和messages都是必需的');
  }

  // 验证每个消息格式
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      throw new Error('每条消息必须包含role和content字段');
    }
  }

  // 处理API密钥格式
  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '');
  if (!cleanApiKey.startsWith('sk-')) {
    console.warn('API密钥格式可能不正确，通常应以sk-开头');
  }

  // 构建字数控制提示
  let enhancedMessages = [...messages];
  if (targetWordCount || minWordCount || maxWordCount) {
    const wordRequirement = buildWordCountPrompt(targetWordCount, minWordCount, maxWordCount);
    // 在最后一条用户消息中添加字数要求
    const lastUserMsgIndex = enhancedMessages.map(m => m.role).lastIndexOf('user');
    if (lastUserMsgIndex !== -1) {
      enhancedMessages[lastUserMsgIndex] = {
        ...enhancedMessages[lastUserMsgIndex],
        content: enhancedMessages[lastUserMsgIndex].content + '\n\n' + wordRequirement
      };
    }
  }

  // 构建请求体
  const requestBody = {
    model,
    messages: enhancedMessages,
    temperature,
    max_tokens: maxTokens,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: streaming?.enableStreaming || false
  };

  console.log('发送OpenRouter请求:', {
    model,
    messageCount: messages.length,
    targetWordCount,
    streaming: streaming?.enableStreaming || false,
    isGemini: model.includes('gemini') || model.includes('google')
  });

  // 执行请求（带重试机制）
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (streaming?.enableStreaming) {
        return await executeStreamingRequest(cleanApiKey, requestBody, streaming, timeout);
      } else {
        return await executeNormalRequest(cleanApiKey, requestBody, timeout);
      }
    } catch (error) {
      console.error(`OpenRouter调用失败 (尝试 ${attempt}/${retryCount}):`, error);
      
      if (attempt === retryCount) {
        throw error; // 最后一次尝试失败，抛出错误
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error('所有重试都失败了');
};

/**
 * 构建字数控制提示
 */
function buildWordCountPrompt(targetWordCount?: number, minWordCount?: number, maxWordCount?: number): string {
  let prompt = '';
  
  if (targetWordCount) {
    prompt = `请将回答控制在${targetWordCount}字左右。`;
  } else if (minWordCount && maxWordCount) {
    prompt = `请将回答控制在${minWordCount}-${maxWordCount}字之间。`;
  } else if (minWordCount) {
    prompt = `回答至少需要${minWordCount}字。`;
  } else if (maxWordCount) {
    prompt = `回答不要超过${maxWordCount}字。`;
  }
  
  return prompt;
}

/**
 * 执行普通API请求
 */
async function executeNormalRequest(apiKey: string, requestBody: any, timeout: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetails = errorData.error 
        ? ` - ${errorData.error.message || JSON.stringify(errorData.error)}` 
        : '';
      throw new Error(`OpenRouter API错误: ${response.status} ${response.statusText}${errorDetails}`);
    }

    const data = await response.json() as OpenRouterResponse;
    
    // 检查响应数据格式
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('OpenRouter响应格式无效: 缺少有效的choices数组');
    }
    
    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('OpenRouter响应格式无效: 缺少消息内容');
    }

    const content = data.choices[0].message.content;
    console.log('OpenRouter响应成功:', {
      model: requestBody.model,
      wordCount: content.length,
      tokenUsage: data.usage
    });

    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 执行流式API请求
 */
async function executeStreamingRequest(
  apiKey: string, 
  requestBody: any, 
  streaming: StreamingConfig, 
  timeout: number
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetails = errorData.error 
        ? ` - ${errorData.error.message || JSON.stringify(errorData.error)}` 
        : '';
      throw new Error(`OpenRouter流式API错误: ${response.status} ${response.statusText}${errorDetails}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              streaming.onComplete?.(fullContent);
              return fullContent;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              // 增加调试日志，特别针对Google Gemini模型
              if (requestBody.model.includes('gemini') || requestBody.model.includes('google')) {
                console.log('[Gemini] 解析数据:', { parsed, content, dataLine: data.substring(0, 100) });
              }
              
              if (content) {
                fullContent += content;
                streaming.onChunk?.(content);
              }
            } catch (e) {
              // 对于Google Gemini模型，提供更详细的错误信息
              if (requestBody.model.includes('gemini') || requestBody.model.includes('google')) {
                console.warn('[Gemini] JSON解析失败:', { error: e, data: data.substring(0, 200) });
              }
              // 忽略解析错误，继续处理下一行
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    streaming.onComplete?.(fullContent);
    return fullContent;
  } catch (error) {
    streaming.onError?.(error as Error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 兼容性方法 - 保持向后兼容
 * @deprecated 请使用 callOpenRouterOptimized
 */
export const callOpenRouter = async (
  model: string,
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string> => {
  return callOpenRouterOptimized({
    model,
    messages,
    apiKey
  });
};