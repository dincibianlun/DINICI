import { useDebateFlow } from '../hooks/useDebateFlow'
import { Button, Message } from 'tdesign-react'
import { useEffect, useRef } from 'react'

export const DebatePage = () => {
  const { phase, messages, isLoading, startNewDebate } = useDebateFlow()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = () => {
    startNewDebate(
      '人工智能是否威胁就业',
      'openai/gpt-5-chat',
      'anthropic/claude-3-haiku',
      'openai/gpt-5-chat',
      '您的OpenRouter密钥',
      { appid: '', accessToken: '' }
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      {/* 顶部导航 */}
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">DINCI AI辩论</h1>
        <div className="text-sm text-purple-400">
          当前阶段: <span className="text-yellow-400">{phase}</span>
        </div>
      </header>

      {/* 辩论内容区 */}
      <main className="mb-20 space-y-6">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border-2 ${
              msg.role === 'host' 
                ? 'border-cyan-400 bg-cyan-900 bg-opacity-20'
                : msg.role === 'positive'
                ? 'border-green-400 bg-green-900 bg-opacity-20'
                : msg.role === 'negative'
                ? 'border-red-400 bg-red-900 bg-opacity-20'
                : 'border-yellow-400 bg-yellow-900 bg-opacity-20'
            }`}
          >
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
                src={`data:audio/mp3;base64,${msg.audio}`}
                className="mt-2 w-full"
              />
            )}
          </div>
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
            className="w-full bg-purple-600 hover:bg-purple-500"
          >
            开始辩论
          </Button>
        ) : (
          <div className="flex space-x-4">
            <Button className="flex-1 bg-cyan-600 hover:bg-cyan-500">
              保存记录
            </Button>
            <Button className="flex-1 bg-purple-600 hover:bg-purple-500">
              新的辩论
            </Button>
          </div>
        )}
      </footer>
    </div>
  )
}
