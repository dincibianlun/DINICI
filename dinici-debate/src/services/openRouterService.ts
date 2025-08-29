export const callOpenRouter = async (
  model: string,
  messages: Array<{role: string, content: string}>,
  apiKey: string
) => {
  try {
    // 验证参数
    if (!model || !messages || !apiKey) {
      throw new Error('缺少必要的参数: model, messages 和 apiKey 都是必需的')
    }
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages 必须是非空数组')
    }
    
    // 检查每个消息格式
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('每条消息必须包含 role 和 content 字段')
      }
    }

    const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
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
    })

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenRouter API 错误: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error.message || JSON.stringify(errorData.error)}` : ''}`)
    }

    const data = await response.json()
    
    // 检查响应数据格式
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('OpenRouter 响应格式无效: 缺少有效的 choices 数组')
    }
    
    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('OpenRouter 响应格式无效: 缺少消息内容')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenRouter API 调用失败:', error)
    // 重新抛出错误，让上层处理
    throw error
  }
}