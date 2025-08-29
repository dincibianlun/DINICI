import { useState, useEffect } from 'react'
import { 
  Card,
  Form,
  Input,
  Button,
  Switch,
  Message,
  Loading,
  Select,
  Space
} from 'tdesign-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

type TTSConfig = {
  cluster_id: string
  disable_markdown_filter: boolean
  enable_latex_tn: boolean
  cache_config: {
    enabled: boolean
    max_age: number
  }
}

export const TTSSettingsPage = () => {
  const [config, setConfig] = useState<TTSConfig>({
    cluster_id: 'volcano_tts', // 默认Cluster ID
    disable_markdown_filter: false,
    enable_latex_tn: false,
    cache_config: {
      enabled: true,
      max_age: 3600
    }
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_settings')
        .select('tts_config')
        .eq('user_id', user?.id)
        .single()
      
      if (!error && data?.tts_config) {
        setConfig(data.tts_config)
      }
    } catch (err) {
      Message.error('配置加载失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user?.id,
          tts_config: config 
        })
      
      if (!error) {
        Message.success('TTS配置已保存')
      }
    } catch (err) {
      Message.error('保存失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const validateClusterId = (value: string) => {
    return value === 'volcano_tts' || /^[a-f0-9]{24}$/.test(value)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">TTS语音配置</h1>
        <p className="text-sm text-purple-400">调整文本转语音的高级参数设置</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-purple-500/30">
            <Form layout="vertical">
              <Form.FormItem 
                label="Cluster ID" 
                help="输入'volcano_tts'使用默认服务或24位专属ID"
                status={config.cluster_id && !validateClusterId(config.cluster_id) ? 'error' : undefined}
              >
                <Input
                  value={config.cluster_id}
                  onChange={(value) => setConfig({...config, cluster_id: value})}
                  placeholder="输入您的Cluster ID"
                  className="bg-gray-900 border-purple-500"
                />
              </Form.FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="bg-gray-800 border-purple-500/30">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">内容处理</h3>
                  <Form.FormItem label="禁用Markdown过滤">
                    <Switch
                      value={config.disable_markdown_filter}
                      onChange={(value) => setConfig({...config, disable_markdown_filter: value})}
                    />
                  </Form.FormItem>
                  <Form.FormItem label="启用LaTeX转换">
                    <Switch
                      value={config.enable_latex_tn}
                      onChange={(value) => setConfig({...config, enable_latex_tn: value})}
                    />
                  </Form.FormItem>
                </Card>

                <Card className="bg-gray-800 border-purple-500/30">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">音频缓存</h3>
                  <Form.FormItem label="启用缓存">
                    <Switch
                      value={config.cache_config.enabled}
                      onChange={(value) => setConfig({
                        ...config, 
                        cache_config: {
                          ...config.cache_config,
                          enabled: value
                        }
                      })}
                    />
                  </Form.FormItem>
                  <Form.FormItem label="缓存有效期(秒)">
                    <Input
                      type="number"
                      value={config.cache_config.max_age}
                      onChange={(value) => setConfig({
                        ...config, 
                        cache_config: {
                          ...config.cache_config,
                          max_age: Number(value)
                        }
                      })}
                      className="bg-gray-900 border-purple-500"
                    />
                  </Form.FormItem>
                </Card>
              </div>

              <div className="mt-6">
                <Space>
                  <Button 
                    theme="primary" 
                    onClick={handleSubmit}
                    disabled={!validateClusterId(config.cluster_id)}
                  >
                    保存配置
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={fetchConfig}
                  >
                    恢复默认
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
        </div>
      )}
    </div>
  )
}