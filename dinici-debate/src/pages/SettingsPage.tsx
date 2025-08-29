import { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Dialog, 
  Message,
  Form,
  Select,
  Space,
  List,
  Card,
  Divider
} from 'tdesign-react'
import { supabase } from '../lib/supabaseClient'

type ApiKey = {
  id: string
  key_name: string
  api_key: string
  service_type: 'openrouter' | 'tts'
  created_at: string
}

type TTSConfig = {
  id: string
  appid: string
  access_token: string
  created_at: string
}

export const SettingsPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [ttsConfigs, setTtsConfigs] = useState<TTSConfig[]>([])
  const [visible, setVisible] = useState(false)
  const [currentService, setCurrentService] = useState<'openrouter' | 'tts'>('openrouter')
  const [formData, setFormData] = useState({
    key_name: '',
    api_key: '',
    appid: '',
    access_token: ''
  })

  useEffect(() => {
    fetchApiKeys()
    fetchTtsConfigs()
  }, [])

  const fetchApiKeys = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setApiKeys(data)
  }

  const fetchTtsConfigs = async () => {
    const { data, error } = await supabase
      .from('tts_configs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setTtsConfigs(data)
  }

  const handleAddKey = () => {
    setFormData({
      key_name: '',
      api_key: '',
      appid: '',
      access_token: ''
    })
    setVisible(true)
  }

  const handleSubmit = async () => {
    if (currentService === 'openrouter') {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          key_name: formData.key_name,
          api_key: formData.api_key,
          service_type: 'openrouter'
        })
      
      if (!error) {
        Message.success('API密钥添加成功')
        fetchApiKeys()
        setVisible(false)
      }
    } else {
      const { error } = await supabase
        .from('tts_configs')
        .insert({
          appid: formData.appid,
          access_token: formData.access_token
        })
      
      if (!error) {
        Message.success('TTS配置添加成功')
        fetchTtsConfigs()
        setVisible(false)
      }
    }
  }

  const handleDelete = async (id: string, type: 'api' | 'tts') => {
    if (type === 'api') {
      await supabase.from('api_keys').delete().eq('id', id)
      fetchApiKeys()
    } else {
      await supabase.from('tts_configs').delete().eq('id', id)
      fetchTtsConfigs()
    }
    Message.success('删除成功')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">密钥与配置管理</h1>
      </header>

      <main className="space-y-8">
        {/* OpenRouter密钥管理 */}
        <Card
          title="OpenRouter API密钥"
          bordered
          className="bg-gray-800 border-purple-500"
          actions={
            <Button 
              theme="primary" 
              onClick={() => {
                setCurrentService('openrouter')
                handleAddKey()
              }}
              className="bg-purple-600 hover:bg-purple-500"
            >
              添加密钥
            </Button>
          }
        >
          <List>
            {apiKeys.map(key => (
              <List.Item key={key.id}>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-bold">{key.key_name}</div>
                    <div className="text-sm text-gray-400">
                      创建于: {new Date(key.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Space>
                    <Button 
                      variant="text" 
                      onClick={() => navigator.clipboard.writeText(key.api_key)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      复制
                    </Button>
                    <Button 
                      variant="text" 
                      onClick={() => handleDelete(key.id, 'api')}
                      className="text-red-400 hover:text-red-300"
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </List.Item>
            ))}
          </List>
        </Card>

        {/* TTS配置管理 */}
        <Card
          title="语音合成(TTS)配置"
          bordered
          className="bg-gray-800 border-purple-500"
          actions={
            <Button 
              theme="primary" 
              onClick={() => {
                setCurrentService('tts')
                handleAddKey()
              }}
              className="bg-purple-600 hover:bg-purple-500"
            >
              添加配置
            </Button>
          }
        >
          <List>
            {ttsConfigs.map(config => (
              <List.Item key={config.id}>
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-bold">APPID: {config.appid}</div>
                    <div className="text-sm text-gray-400">
                      创建于: {new Date(config.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Space>
                    <Button 
                      variant="text" 
                      onClick={() => navigator.clipboard.writeText(config.access_token)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      复制Token
                    </Button>
                    <Button 
                      variant="text" 
                      onClick={() => handleDelete(config.id, 'tts')}
                      className="text-red-400 hover:text-red-300"
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </List.Item>
            ))}
          </List>
        </Card>
      </main>

      {/* 添加密钥/配置的对话框 */}
      <Dialog
        header={currentService === 'openrouter' ? '添加OpenRouter密钥' : '添加TTS配置'}
        visible={visible}
        onClose={() => setVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button 
              theme="primary" 
              onClick={handleSubmit}
              className="bg-purple-600 hover:bg-purple-500"
            >
              确认
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" className="p-4">
          {currentService === 'openrouter' ? (
            <>
              <Form.FormItem label="密钥名称" required>
                <Input 
                  value={formData.key_name}
                  onChange={(value) => setFormData({...formData, key_name: value})}
                  placeholder="例如: 我的OpenRouter密钥"
                />
              </Form.FormItem>
              <Form.FormItem label="API密钥" required>
                <Input 
                  type="password"
                  value={formData.api_key}
                  onChange={(value) => setFormData({...formData, api_key: value})}
                  placeholder="输入OpenRouter API密钥"
                />
              </Form.FormItem>
            </>
          ) : (
            <>
              <Form.FormItem label="APPID" required>
                <Input 
                  value={formData.appid}
                  onChange={(value) => setFormData({...formData, appid: value})}
                  placeholder="输入豆包语音APPID"
                />
              </Form.FormItem>
              <Form.FormItem label="Access Token" required>
                <Input 
                  type="password"
                  value={formData.access_token}
                  onChange={(value) => setFormData({...formData, access_token: value})}
                  placeholder="输入豆包语音Access Token"
                />
              </Form.FormItem>
            </>
          )}
        </Form>
      </Dialog>
    </div>
  )
}