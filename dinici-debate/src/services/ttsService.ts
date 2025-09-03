// TTS配置类型定义 - 基于豆包官方文档
export interface TTSConfig {
  appid: string;
  accessToken: string;
  voiceType: string;
  clusterId?: string;
  // 音频质量参数
  encoding?: 'wav' | 'pcm' | 'ogg_opus' | 'mp3';
  speedRatio?: number; // 0.8-2.0
  rate?: 8000 | 16000 | 24000;
  bitrate?: number; // KB/s，仅MP3生效
  loudnessRatio?: number; // 0.5-2.0
  // 高级参数
  disableMarkdownFilter?: boolean;
  enableLatexTn?: boolean;
  enableEmotion?: boolean;
  emotion?: string;
  emotionScale?: number; // 1-5
}

// 用户TTS凭据类型
export interface UserTTSCredentials {
  appid: string;
  accessToken: string;
  clusterId?: string;
}

// 辩论角色类型
export type DebateRole = 'host' | 'positive' | 'negative' | 'judge';

/**
 * 优化的语音合成服务 - 完全符合豆包官方文档
 * @param text - 要合成的文本内容
 * @param userTTSConfig - 用户TTS凭据
 * @param voiceRole - 辩论角色
 * @param config - 可选的TTS配置参数
 * @returns base64编码的音频数据
 */
export const synthesizeSpeechWithUserConfig = async (
  text: string,
  userTTSConfig: UserTTSCredentials,
  voiceRole: DebateRole,
  config?: Partial<TTSConfig>
): Promise<string> => {
  try {
    // 验证用户配置
    if (!userTTSConfig.appid || !userTTSConfig.accessToken) {
      throw new Error('用户TTS配置不完整');
    }

    // 验证文本内容
    if (!text || text.trim().length === 0) {
      throw new Error('合成文本不能为空');
    }

    // 检查文本长度（豆包建议<300字符）
    if (text.length > 1000) {
      console.warn('文本长度超过推荐值，可能影响合成质量');
    }

    // 根据辩论角色选择音色
    const voiceType = VOICE_TYPES[voiceRole.toUpperCase() as keyof typeof VOICE_TYPES];
    if (!voiceType) {
      throw new Error(`不支持的辩论角色: ${voiceRole}`);
    }

    // 合并默认配置和用户配置
    const finalConfig = {
      encoding: 'mp3' as const,
      speedRatio: 1.0,
      rate: 24000 as const,
      bitrate: 160,
      loudnessRatio: 1.0,
      disableMarkdownFilter: true,
      enableLatexTn: true,
      enableEmotion: false,
      emotionScale: 4,
      ...config
    };

    // 根据杀包官方文档构建请求体
    const requestBody = {
      app: {
        appid: userTTSConfig.appid,
        token: userTTSConfig.accessToken,
        cluster: userTTSConfig.clusterId || 'volcano_tts'
      },
      user: {
        uid: `dinici-user-${Date.now()}`
      },
      audio: {
        voice_type: voiceType,
        encoding: finalConfig.encoding,
        speed_ratio: finalConfig.speedRatio,
        loudness_ratio: finalConfig.loudnessRatio,
        rate: finalConfig.rate,
        ...(finalConfig.encoding === 'mp3' && { bitrate: finalConfig.bitrate })
      },
      request: {
        reqid: crypto.randomUUID(),
        text: text,
        operation: 'query'
      }
    };

    // 先定义 API URL
    const apiUrl = import.meta.env.DEV 
      ? '/api/tts'  // 开发环境使用代理
      : 'https://openspeech.bytedance.com/api/v1/tts';  // 生产环境直接调用

    console.log('发送TTS请求:', {
      url: apiUrl,
      appid: userTTSConfig.appid,
      voiceType,
      textLength: text.length,
      isDev: import.meta.env.DEV
    });

    // 发送请求 - 根据官方文档使用分号分隔，通过Vite代理避免CORS问题
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer;${userTTSConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS请求失败详情:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        headers: Object.fromEntries(response.headers.entries()),
        requestBody: JSON.stringify(requestBody, null, 2)
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // 提供更友好的错误信息
      let userMessage = 'TTS服务失败';
      if (response.status === 401) {
        userMessage = 'TTS认证失败，请检查APPID和Access Token';
      } else if (response.status === 400) {
        userMessage = 'TTS请求参数错误，请检查配置';
      } else if (response.status >= 500) {
        userMessage = 'TTS服务器错误，请稍后重试';
      }
      
      throw new Error(`${userMessage}: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('TTS响应数据:', data);

    // 检查返回数据
    if (data.code !== 3000) {
      console.error('TTS服务错误:', data);
      throw new Error(`TTS服务错误: ${data.message || '未知错误'}`);
    }

    if (!data.data) {
      console.error('TTS返回数据为空:', data);
      throw new Error('TTS返回数据为空');
    }

    console.log('TTS合成成功，音频时长:', data.addition?.duration || '未知');
    return data.data; // base64音频数据
  } catch (error) {
    console.error('TTS请求失败:', error);
    
    // 在开发环境下提供更友好的错误信息
    if (import.meta.env.DEV && error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('无法连接到TTS服务。请检查：\n1. 网络连接是否正常\n2. TTS配置是否正确\n3. 代理服务是否运行正常');
    }
    
    throw error;
  }
};

/**
 * 兼容性方法 - 保持向后兼容
 * @deprecated 请使用 synthesizeSpeechWithUserConfig
 */
export const synthesizeSpeech = async (
  text: string,
  config: TTSConfig
): Promise<string> => {
  const userConfig: UserTTSCredentials = {
    appid: config.appid,
    accessToken: config.accessToken,
    clusterId: config.clusterId
  };
  
  // 从voiceType推断角色
  let role: DebateRole = 'host';
  if (config.voiceType === VOICE_TYPES.POSITIVE) role = 'positive';
  else if (config.voiceType === VOICE_TYPES.NEGATIVE) role = 'negative';
  else if (config.voiceType === VOICE_TYPES.HOST) role = 'host';
  
  return synthesizeSpeechWithUserConfig(text, userConfig, role, config);
};

// 预定义的语音类型 - 针对不同辩论角色
export const VOICE_TYPES = {
  HOST: 'zh_female_yingyujiaoyu_mars_bigtts', // 主持人
  POSITIVE: 'zh_female_yingyujiaoyu_mars_bigtts', // 正方
  NEGATIVE: 'zh_female_shuangkuaisisi_emo_v2_mars_bigtts', // 反方-爽快思思女音
  JUDGE: 'zh_female_yingyujiaoyu_mars_bigtts' // 裁判
};