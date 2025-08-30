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
  }>;
}

/**
 * 调用 OpenRouter API 进行聊天补全
 * @param model - 使用的模型名称
 * @param messages - 消息数组
 * @param apiKey - OpenRouter API 密钥
 * @returns API 返回的文本内容
 */
export const callOpenRouter = async (
  model: string,
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string> => {
  try {
    // 验证参数
    if (!apiKey) {
      throw new Error('API密钥为空，请检查配置');
    }
    if (!model || !messages || !apiKey) {
      throw new Error('缺少必要的参数: model, messages 和 apiKey 都是必需的');
    }
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages 必须是非空数组');
    }
    
    // 检查每个消息格式
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('每条消息必须包含 role 和 content 字段');
      }
    }
    // 验证API密钥
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API密钥为空或无效');
    }
    // 检查Authorization头格式
    if (!apiKey.startsWith('sk-')) {
      console.warn('API密钥格式可能不正确，通常应以sk-开头');
    }
    // 移除可能存在的Bearer前缀
    apiKey = apiKey.replace(/^Bearer\s+/i, '');
    // 调试日志：输出处理后的API密钥和Authorization头
    console.log('处理后的API密钥:', apiKey);
    console.log('构造的Authorization头:', `Bearer ${apiKey}`);
    // 发送 API 请求
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        // 添加更合理的生成参数
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
    });

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorDetails = errorData.error 
        ? ` - ${errorData.error.message || JSON.stringify(errorData.error)}` 
        : '';
      throw new Error(`OpenRouter API 错误: ${response.status} ${response.statusText}${errorDetails}`);
    }

    // 处理响应数据
    const data = await response.json() as OpenRouterResponse;
    
    // 检查响应数据格式
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('OpenRouter 响应格式无效: 缺少有效的 choices 数组');
    }
    
    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('OpenRouter 响应格式无效: 缺少消息内容');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API 调用失败:', error);
    // 重新抛出错误，让上层处理
    throw error;
  }
};