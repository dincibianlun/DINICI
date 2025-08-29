interface TTSConfig {
  appid: string
  accessToken: string
  voiceType: string
}

export const synthesizeSpeech = async (
  text: string,
  config: TTSConfig
): Promise<string> => {
  const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer;${config.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app: {
        appid: config.appid,
        token: config.accessToken,
        cluster: 'volcano_tts'
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
        operation: 'query'
      }
    })
  })

  if (!response.ok) {
    throw new Error(`语音合成失败: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data // 返回base64编码的音频数据
}

// 预定义的语音类型
export const VOICE_TYPES = {
  HOST: 'zh_female_meilinvyou_moon_bigtts', // 裁判-美少女音
  POSITIVE: 'zh_female_sajiaonvyou_moon_bigtts', // 正方-撒娇女音
  NEGATIVE: 'zh_female_shuangkuaisisi_moon_bigtts' // 反方-爽快女音
}