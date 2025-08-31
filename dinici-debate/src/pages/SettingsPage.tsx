import { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  MessagePlugin,
  Card
} from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';

type ApiKey = {
  id: string;
  key_name: string;
  api_key: string;
  service_type: 'openrouter' | 'tts';
  created_at: string;
}

type TTSConfig = {
  id: string;
  appid: string;
  access_token: string;
  created_at: string;
}

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [ttsConfigs, setTtsConfigs] = useState<TTSConfig[]>([]);
  const [showOpenRouterForm, setShowOpenRouterForm] = useState(false);
  const [showTTSForm, setShowTTSForm] = useState(false);
  const [formData, setFormData] = useState({
    key_name: '',
    api_key: '',
    appid: '',
    access_token: ''
  });

  useEffect(() => {
    fetchApiKeys();
    fetchTtsConfigs();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'openrouter')
        .order('created_at', { ascending: false });
      
      if (!error && data) setApiKeys(data);
    } catch (err) {
      console.error('获取API密钥失败:', err);
    }
  };

  const fetchTtsConfigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'tts')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const configs = data.map(item => {
          const config = JSON.parse(item.api_key);
          return {
            id: item.id,
            appid: config.appid,
            access_token: config.access_token,
            created_at: item.created_at
          };
        });
        setTtsConfigs(configs);
      }
    } catch (err) {
      console.error('获取TTS配置失败:', err);
    }
  };

  const handleAddOpenRouter = () => {
    setFormData({
      key_name: '',
      api_key: '',
      appid: '',
      access_token: ''
    });
    setShowOpenRouterForm(true);
    setShowTTSForm(false);
  };

  const handleAddTTS = () => {
    setFormData({
      key_name: '',
      api_key: '',
      appid: '',
      access_token: ''
    });
    setShowTTSForm(true);
    setShowOpenRouterForm(false);
  };

  const handleSubmitOpenRouter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      if (!formData.key_name || !formData.api_key) {
        MessagePlugin.error('请填写完整信息');
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_name: formData.key_name,
          api_key: formData.api_key,
          service_type: 'openrouter'
        });
      
      if (!error) {
        MessagePlugin.success('API密钥添加成功');
        fetchApiKeys();
        setShowOpenRouterForm(false);
        setFormData({ key_name: '', api_key: '', appid: '', access_token: '' });
      } else {
        MessagePlugin.error('添加失败: ' + error.message);
      }
    } catch (err) {
      MessagePlugin.error('操作失败');
    }
  };

  const handleSubmitTTS = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      if (!formData.appid || !formData.access_token) {
        MessagePlugin.error('请填写完整信息');
        return;
      }

      const ttsConfig = {
        appid: formData.appid,
        access_token: formData.access_token
      };
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_name: 'TTS配置',
          api_key: JSON.stringify(ttsConfig),
          service_type: 'tts'
        });
      
      if (!error) {
        MessagePlugin.success('TTS配置添加成功');
        fetchApiKeys();
        fetchTtsConfigs();
        setShowTTSForm(false);
        setFormData({ key_name: '', api_key: '', appid: '', access_token: '' });
      } else {
        MessagePlugin.error('添加失败: ' + error.message);
      }
    } catch (err) {
      MessagePlugin.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('api_keys').delete().eq('id', id);
      MessagePlugin.success('删除成功');
      fetchApiKeys();
      fetchTtsConfigs();
    } catch (err) {
      MessagePlugin.error('删除失败');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem' }}>
        {/* 主容器 */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* 页面标题 */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 400, 
              color: '#ffffff',
              marginBottom: '0.5rem'
            }}>
              设置
            </h1>
            <div 
              style={{
                width: '40px',
                height: '1px',
                background: '#00ffff',
                margin: '0 auto',
                marginBottom: '1rem'
              }}
            />
            <p style={{ 
              color: '#888888', 
              fontSize: '0.875rem'
            }}>
              配置您的API密钥和语音合成参数
            </p>
          </div>

          {/* API密钥配置区域 */}
          <Card style={{
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
            color: '#000000'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 500, 
                color: '#000000',
                marginBottom: '0.5rem'
              }}>
                OpenRouter API密钥
              </h2>
              <p style={{ color: '#666666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                用于调用AI模型进行辩论。请在OpenRouter官网获取您的API密钥。
              </p>
            </div>

            {apiKeys.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                {apiKeys.map(key => (
                  <div 
                    key={key.id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: '#000000' }}>{key.key_name}</div>
                      <div style={{ color: '#666666', fontSize: '0.75rem' }}>
                        {key.api_key.slice(0, 8)}...{key.api_key.slice(-4)}
                      </div>
                    </div>
                    <Button 
                      theme="danger" 
                      size="small" 
                      variant="text"
                      onClick={() => handleDelete(key.id)}
                      style={{ color: '#999999' }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666666',
                fontSize: '0.875rem'
              }}>
                暂无配置的API密钥
              </div>
            )}

            <Button 
              onClick={handleAddOpenRouter}
              style={{
                background: '#00ffff',
                border: 'none',
                color: '#000000',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                width: '100%'
              }}
            >
              添加API密钥
            </Button>

            {/* 内联OpenRouter表单 */}
            {showOpenRouterForm && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#00ffff', marginBottom: '1rem', fontSize: '1rem' }}>
                  添加OpenRouter API密钥
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#cccccc',
                    fontSize: '0.875rem'
                  }}>
                    密钥名称
                  </label>
                  <Input
                    value={formData.key_name}
                    onChange={(value) => setFormData({...formData, key_name: value})}
                    placeholder="请输入密钥名称"
                    style={{
                      background: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#cccccc',
                    fontSize: '0.875rem'
                  }}>
                    API密钥
                  </label>
                  <Input
                    value={formData.api_key}
                    onChange={(value) => setFormData({...formData, api_key: value})}
                    placeholder="请输入API密钥（以sk-开头）"
                    type="password"
                    style={{
                      background: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button
                    onClick={() => {
                      setShowOpenRouterForm(false);
                      setFormData({ key_name: '', api_key: '', appid: '', access_token: '' });
                    }}
                    style={{
                      flex: 1,
                      background: '#333333',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '4px'
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSubmitOpenRouter}
                    style={{
                      flex: 1,
                      background: '#00ffff',
                      border: 'none',
                      color: '#000000',
                      borderRadius: '4px'
                    }}
                  >
                    确定
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* TTS配置区域 */}
          <Card style={{
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '2rem'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 500, 
                color: '#00ffff',
                marginBottom: '0.5rem'
              }}>
                语音合成配置
              </h2>
              <p style={{ color: '#666666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                配置火山引擎TTS服务，为辩论内容生成语音。
              </p>
            </div>

            {ttsConfigs.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                {ttsConfigs.map(config => (
                  <div 
                    key={config.id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f8f9fa',
                      border: '1px solid #00ffff',
                      borderRadius: '8px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, color: '#ffffff' }}>TTS配置</div>
                      <div style={{ color: '#888888', fontSize: '0.75rem' }}>
                        APPID: {config.appid.slice(0, 8)}...
                      </div>
                    </div>
                    <Button 
                      theme="danger" 
                      size="small" 
                      variant="text"
                      onClick={() => handleDelete(config.id)}
                      style={{ color: '#ff6b6b' }}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#666666',
                fontSize: '0.875rem'
              }}>
                暂无配置的TTS参数
              </div>
            )}

            <Button 
              onClick={handleAddTTS}
              style={{
                background: '#00ffff',
                border: 'none',
                color: '#000000',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                width: '100%'
              }}
            >
              添加TTS配置
            </Button>

            {/* 内联TTS表单 */}
            {showTTSForm && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#00ffff', marginBottom: '1rem', fontSize: '1rem' }}>
                  添加TTS配置
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#cccccc',
                    fontSize: '0.875rem'
                  }}>
                    APPID
                  </label>
                  <Input
                    value={formData.appid}
                    onChange={(value) => setFormData({...formData, appid: value})}
                    placeholder="请输入火山引擎TTS的APPID"
                    style={{
                      background: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#cccccc',
                    fontSize: '0.875rem'
                  }}>
                    Access Token
                  </label>
                  <Input
                    value={formData.access_token}
                    onChange={(value) => setFormData({...formData, access_token: value})}
                    placeholder="请输入Access Token"
                    type="password"
                    style={{
                      background: '#000000',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button
                    onClick={() => {
                      setShowTTSForm(false);
                      setFormData({ key_name: '', api_key: '', appid: '', access_token: '' });
                    }}
                    style={{
                      flex: 1,
                      background: '#333333',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '4px'
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSubmitTTS}
                    style={{
                      flex: 1,
                      background: '#00ffff',
                      border: 'none',
                      color: '#000000',
                      borderRadius: '4px'
                    }}
                  >
                    确定
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
