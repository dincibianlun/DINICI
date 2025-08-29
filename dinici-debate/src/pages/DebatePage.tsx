import { useState, useEffect, useRef } from 'react';
import { Button, Message, Select } from 'tdesign-react';
import { SpeakerHighlight } from '../components/SpeakerHighlight';
import { useDebateFlow } from '../hooks/useDebateFlow';
import { getEnvironmentVariable, getSafeEnvironmentVariable } from '../utils/env';
import { supabase } from '../lib/supabaseClient';

// 环境变量类型定义
export interface EnvironmentVariables {
  OPENROUTER_API_KEY: string;
  TTS_APPID: string;
  TTS_ACCESS_TOKEN: string;
}

// 添加TTS相关类型定义
interface TTSConfig {
  appId: string;
  accessToken: string;
}

// 添加消息类型定义
interface DebateMessage {
  id: string;
  role: 'host' | 'positive' | 'negative' | 'judge';
  content: string;
  audio?: string | null;
}

// 需求文档定义的可选模型列表
const MODEL_OPTIONS = [
  { label: 'OPENAI', value: 'openai/gpt-5-chat' },
  { label: 'Claude', value: 'anthropic/claude-3-haiku' },
  { label: 'DeepSeek', value: 'deepseek/deepseek-chat-v3.1' },
  { label: '百度文心一言', value: 'baidu/ernie-4.5-vl-28b-a3b' },
  { label: '智谱清言', value: 'z-ai/glm-4.5' },
  { label: '月之暗面', value: 'moonshotai/kimi-k2' },
  { label: 'XAI-Grok', value: 'x-ai/grok-4' },
  { label: '通义千问', value: 'qwen/qwen-max' },
  { label: '谷歌gemini', value: 'google/gemini-2.5-pro' },
];

export const DebatePage = () => {
  const { phase, messages, isLoading, startNewDebate } = useDebateFlow();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVariables | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [positiveModel, setPositiveModel] = useState('openai/gpt-5-chat');
  const [negativeModel, setNegativeModel] = useState('anthropic/claude-3-haiku');
  const [judgeModel, setJudgeModel] = useState('openai/gpt-5-chat');
  const [debateTopic, setDebateTopic] = useState<string>('人工智能的发展对人类社会利大于弊');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  // 使用已配置的supabase客户端
  // const supabaseUrl = getSafeEnvironmentVariable('VITE_SUPABASE_URL');
  // const supabaseAnonKey = getSafeEnvironmentVariable('VITE_SUPABASE_ANON_KEY');
  // const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 加载环境变量
  useEffect(() => {
    try {
      const openRouterKey = getSafeEnvironmentVariable('OPENROUTER_API_KEY');
      const ttsAppid = getSafeEnvironmentVariable('TTS_APPID');
      const ttsToken = getSafeEnvironmentVariable('TTS_ACCESS_TOKEN');

      setEnvironmentVars({
        OPENROUTER_API_KEY: openRouterKey,
        TTS_APPID: ttsAppid,
        TTS_ACCESS_TOKEN: ttsToken
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载环境变量失败';
      setError(errorMessage);
      Message.error(errorMessage);
    }
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = async () => {
    if (!environmentVars) {
      Message.error('环境变量未加载完成');
      return;
    }

    try {
      await startNewDebate(
        debateTopic,
        positiveModel,
        negativeModel,
        judgeModel,
        environmentVars.OPENROUTER_API_KEY,
        {
          appid: environmentVars.TTS_APPID,
          accessToken: environmentVars.TTS_ACCESS_TOKEN
        }
      );
    } catch (error) {
      console.error('Failed to start debate:', error);
      Message.error('开始辩论失败');
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('debates')
        .insert([{
          topic: debateTopic,
          positive_model: positiveModel,
          negative_model: negativeModel,
          judge_model: judgeModel,
          content: messages,
          created_at: new Date().toISOString(),
          is_public: isPublic
        }]);

      if (error) throw error;
      Message.success('辩论记录已保存');
    } catch (err) {
      console.error('Failed to save debate:', err);
      Message.error('保存辩论记录失败');
    }
  };

  const handleShare = async () => {
    try {
      const { data: debate, error: fetchError } = await supabase
        .from('debates')
        .select('id')
        .eq('topic', debateTopic)
        .order('created_at', { ascending: false })
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('debates')
        .update({ is_public: true })
        .eq('id', debate.id);

      if (error) throw error;
      Message.success('辩论案例已分享到公开库');
    } catch (err) {
      console.error('Failed to share debate:', err);
      Message.error('分享辩论案例失败');
    }
  };

  // 计算辩论进度宽度
  const getProgressWidth = (currentPhase: string) => {
    const phases = [
      'preparing',
      'host_intro', 
      'positive_statement',
      'negative_rebuttal',
      'free_debate',
      'judge_summary',
      'completed'
    ];
    const currentIndex = phases.indexOf(currentPhase);
    return `${((currentIndex + 1) / phases.length) * 100}%`;
  };

  // 判断是否为当前活跃发言者
  const isActiveSpeaker = (index: number) => {
    return index === messages.length - 1 && isLoading;
  };

  // 渲染错误信息
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-red-300 p-4 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">环境配置错误</h1>
        <p className="mb-6 text-center">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500">
          刷新页面
        </Button>
      </div>
    );
  }

  // 环境变量加载中
  if (!environmentVars) {
    return (
      <div className="min-h-screen bg-gray-900 text-purple-300 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">正在加载环境配置...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      {/* 顶部导航 */}
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">DINCI AI辩论</h1>
        
        {/* 动态进度指示器 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-purple-400 mb-2">
            <span>辩论进度</span>
            <span className="text-yellow-400">{phase}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: getProgressWidth(phase),
                animation: 'pulse 2s infinite'
              }}
            />
          </div>
        </div>
      </header>

      {/* 模型选择区 */}
      {messages.length === 0 && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-purple-500">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">辩论设置</h3>
          <div className="mb-4">
            <label className="block text-sm mb-2 text-white">辩论题目</label>
            <input
              type="text"
              value={debateTopic}
              onChange={(e) => setDebateTopic(e.target.value)}
              className="w-full p-2 border border-purple-500 rounded-md bg-gray-900 text-white"
              placeholder="请输入辩论题目"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded text-purple-500"
              />
              <span className="text-sm text-white">分享到公开案例库</span>
            </label>
          </div>
          <h3 className="text-lg font-bold mb-4 text-cyan-400">选择辩论模型</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-green-400">正方模型</label>
              <Select
                value={positiveModel}
                onChange={(val) => setPositiveModel(val as string)}
                options={MODEL_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-red-400">反方模型</label>
              <Select
                value={negativeModel}
                onChange={(val) => setNegativeModel(val as string)}
                options={MODEL_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-yellow-400">裁判模型</label>
              <Select
                value={judgeModel}
                onChange={(val) => setJudgeModel(val as string)}
                options={MODEL_OPTIONS}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 辩论内容区 */}
      <main className="mb-20 space-y-6">
        {messages.map((msg, index) => (
          <SpeakerHighlight key={index} speaker={msg.role} isActive={isActiveSpeaker(index)}>
            <div className="font-bold mb-2">
              {msg.role === 'host' && '👨‍⚖️ 主持人'}
              {msg.role === 'positive' && '🟢 正方'}
              {msg.role === 'negative' && '🔴 反方'}
              {msg.role === 'judge' && '🏆 裁判'}
            </div>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.audio && (
              <audio 
                controls
                src={msg.audio}
                className="mt-2 w-full"
              />
            )}
          </SpeakerHighlight>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* 底部控制区 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-purple-500 p-4">
        {messages.length === 0 ? (
          <Button 
            theme="primary" 
            onClick={handleStart}
            loading={isLoading}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500"
          >
            开始辩论
          </Button>
        ) : (
          <div className="flex space-x-4">
            <Button className="flex-1 bg-cyan-600 hover:bg-cyan-500" onClick={handleSave}>
              保存记录
            </Button>
            {isPublic && (
              <Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={handleShare}>
                分享到公开库
              </Button>
            )}
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-500"
              onClick={() => window.location.reload()}
              loading={isLoading}
              disabled={isLoading}
            >
              新的辩论
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
};