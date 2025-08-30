import { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Dialog, 
  MessagePlugin
} from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

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
  const [visible, setVisible] = useState(false);
  const [currentService, setCurrentService] = useState<'openrouter' | 'tts'>('openrouter');
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

  const handleAddKey = () => {
    setFormData({
      key_name: '',
      api_key: '',
      appid: '',
      access_token: ''
    });
    setVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        MessagePlugin.error('请先登录');
        return;
      }

      if (currentService === 'openrouter') {
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
        console.log('插入API密钥的目标表名: api_keys');
        console.log('插入的数据:', {
          user_id: user.id,
          key_name: formData.key_name,
          api_key: formData.api_key,
          service_type: 'openrouter'
        });
        
        if (!error) {
          MessagePlugin.success('API密钥添加成功');
          fetchApiKeys();
          setVisible(false);
        } else {
          MessagePlugin.error('添加失败: ' + error.message);
        }
      } else {
        if (!formData.appid || !formData.access_token) {
          MessagePlugin.error('请填写完整信息');
          return;
        }

        // TTS配置保存为JSON格式
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
          setVisible(false);
        } else {
          MessagePlugin.error('添加失败: ' + error.message);
        }
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
    <div 
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        padding: '2rem',
        position: 'relative'
      }}
    >
      {/* 简约网格背景 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      <header 
        style={{
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, color: '#00ffff' }}>
            ⚙️ 密钥与配置管理
          </h1>
          <Button
            onClick={() => navigate('/debate')}
            style={{
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              border: 'none',
              color: 'white',
              borderRadius: '0.5rem'
            }}
          >
            返回辩论
          </Button>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* OpenRouter密钥管理 */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#00ffff' }}>
              🤖 OpenRouter API密钥
            </h2>
            <Button 
              onClick={() => {
                setCurrentService('openrouter');
                handleAddKey();
              }}
              style={{
                background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                border: 'none',
                color: 'white',
                borderRadius: '0.5rem'
              }}
            >
              添加密钥
            </Button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {apiKeys.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                暂无API密钥，请添加您的OpenRouter密钥
              </p>
            ) : (
              apiKeys.map(key => (
                <div 
                  key={key.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(55, 65, 81, 0.5)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>{key.key_name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      创建于: {new Date(key.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      variant="text" 
                      onClick={() => navigator.clipboard.writeText(key.api_key)}
                      style={{ color: '#22d3ee' }}
                    >
                      复制
                    </Button>
                    <Button 
                      variant="text" 
                      onClick={() => handleDelete(key.id)}
                      style={{ color: '#ef4444' }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TTS配置管理 */}
        <div 
          style={{
            background: 'rgba(31, 41, 55, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22d3ee' }}>
              🔊 语音合成(TTS)配置
            </h2>
            <Button 
              onClick={() => {
                setCurrentService('tts');
                handleAddKey();
              }}
              style={{
                background: 'linear-gradient(45deg, #8b5cf6, #22d3ee)',
                border: 'none',
                color: 'white',
                borderRadius: '0.5rem'
              }}
            >
              添加配置
            </Button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ttsConfigs.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                暂无TTS配置，请添加您的火山引擎TTS配置
              </p>
            ) : (
              ttsConfigs.map(config => (
                <div 
                  key={config.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'rgba(55, 65, 81, 0.5)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f3f4f6' }}>APPID: {config.appid}</div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      创建于: {new Date(config.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      variant="text" 
                      onClick={() => navigator.clipboard.writeText(config.access_token)}
                      style={{ color: '#22d3ee' }}
                    >
                      复制Token
                    </Button>
                    <Button 
                      variant="text" 
                      onClick={() => handleDelete(config.id)}
                      style={{ color: '#ef4444' }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 添加密钥/配置的对话框 */}
      <Dialog
        header={currentService === 'openrouter' ? '添加OpenRouter密钥' : '添加TTS配置'}
        visible={visible}
        onClose={() => setVisible(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button 
              theme="primary" 
              onClick={handleSubmit}
              style={{
                background: 'linear-gradient(45deg, #8b5cf6, #22d3ee)',
                border: 'none'
              }}
            >
              确认
            </Button>
          </div>
        }
      >
        <div style={{ padding: '1rem' }}>
          {currentService === 'openrouter' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#22d3ee', fontWeight: 500 }}>
                  密钥名称
                </label>
                <Input 
                  value={formData.key_name}
                  onChange={(value) => setFormData({...formData, key_name: value})}
                  placeholder="例如: 我的OpenRouter密钥"
                  style={{
                    background: 'rgba(55, 65, 81, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'white'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#22d3ee', fontWeight: 500 }}>
                  API密钥
                </label>
                <Input 
                  type="password"
                  value={formData.api_key}
                  onChange={(value) => setFormData({...formData, api_key: value})}
                  placeholder="输入OpenRouter API密钥"
                  style={{
                    background: 'rgba(55, 65, 81, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'white'
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#22d3ee', fontWeight: 500 }}>
                  APPID
                </label>
                <Input 
                  value={formData.appid}
                  onChange={(value) => setFormData({...formData, appid: value})}
                  placeholder="输入火山引擎TTS APPID"
                  style={{
                    background: 'rgba(55, 65, 81, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'white'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#22d3ee', fontWeight: 500 }}>
                  Access Token
                </label>
                <Input 
                  type="password"
                  value={formData.access_token}
                  onChange={(value) => setFormData({...formData, access_token: value})}
                  placeholder="输入火山引擎TTS Access Token"
                  style={{
                    background: 'rgba(55, 65, 81, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: 'white'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
};
