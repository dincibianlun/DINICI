// TTS配置类型定义
export interface TTSConfig {
  appid: string;
  accessToken: string;
  voiceType: string;
  clusterId?: string;
  disableMarkdownFilter?: boolean;
  enableLatexTn?: boolean;
}

/**
 * 语音合成服务
 * @param text - 要合成的文本内容
 * @param config - TTS配置参数
 * @returns base64编码的音频数据
 */
export const synthesizeSpeech = async (
  text: string,
  config: TTSConfig
): Promise<string> => {
  try {
    // 验证输入参数
    if (!text || !config?.appid || !config?.accessToken) {
      throw new Error('缺少必要的TTS参数');
    }

    // 发送API请求
    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer;${config.accessToken}`, // 正确的格式：Bearer;token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app: {
          appid: config.appid,
          token: config.accessToken,
          cluster: config.clusterId || 'volcano_tts'
        },
        user: {
          uid: 'dinici-user'
        },
        audio: {
          voice_type: config.voiceType,
          encoding: 'mp3'
        },
        request: {
          reqid: crypto.randomUUID(),
          text: text,
          operation: 'query',
          disable_markdown_filter: config.disableMarkdownFilter || false,
          enable_latex_tn: config.enableLatexTn || true
        }
      })
    });

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.message || errorData.error || response.statusText;
      throw new Error(`语音合成失败 (${response.status}): ${errorMsg}`);
    }

    // 处理响应数据
    const data = await response.json();
    if (!data.data) {
      throw new Error('语音合成返回数据格式错误');
    }

    return data.data; // 返回base64编码的音频数据
  } catch (error) {
    console.error('TTS服务错误:', error);
    throw error; // 重新抛出错误以便上层处理
  }
};

// 预定义的语音类型
export const VOICE_TYPES = {
  HOST: 'zh_female_meilinvyou_moon_bigtts', // 裁判-美少女音
  POSITIVE: 'zh_female_sajiaonvyou_moon_bigtts', // 正方-撒娇女音
  NEGATIVE: 'zh_female_shuangkuaisisi_moon_bigtts' // 反方-爽快女音
};