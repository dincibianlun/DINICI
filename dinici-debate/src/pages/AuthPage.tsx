import { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Tabs, 
  Space, 
  Divider, 
  Form, 
  Message 
} from 'tdesign-react'
import { signUp, signIn } from '../services/authService'
import { supabase } from '../lib/supabaseClient'
import { PasswordReset } from '../components/PasswordReset'

const tabList = [
  { value: 'login', label: '登录' },
  { value: 'register', label: '注册' },
  { value: 'reset', label: '重置密码' }
]

export const AuthPage = () => {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({ email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [form] = Form.useForm()

  // 表单验证
  const validateForm = () => {
    const errors: { email: string; password: string; confirmPassword: string } = { 
      email: '', 
      password: '', 
      confirmPassword: '' 
    }
    
    // 邮箱验证
    if (!email.trim()) {
      errors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '请输入有效的邮箱地址'
    }
    
    // 密码验证
    if (!password) {
      errors.password = '请输入密码'
    } else if (password.length < 6) {
      errors.password = '密码至少需要6个字符'
    }
    
    // 确认密码验证（仅在注册时）
    if (tab === 'register' && password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }
    
    setFormErrors(errors)
    
    // 检查是否有错误
    return !errors.email && !errors.password && !(tab === 'register' && errors.confirmPassword)
  }

  // 切换标签时重置表单
  useEffect(() => {
    setFormErrors({ email: '', password: '', confirmPassword: '' })
    setShowPassword(false)
  }, [tab])

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        Message.success('登录成功，正在跳转...')
        setTimeout(() => {
          window.location.href = '/debate'
        }, 1500)
      } else if (tab === 'register') {
        const { error } = await signUp(email, password)
        if (error) throw error
        Message.success('注册成功，请检查邮箱验证')
        setTab('login')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? 
        (error.message.includes('Invalid login credentials') ? '邮箱或密码错误' : error.message) : 
        '操作失败，请重试'
      Message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/debate`
        }
      })
      if (error) throw error
    } catch (error) {
      Message.error('OAuth登录失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] to-[#1e1b4b] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#4b5563] rounded-xl p-8 bg-[#1f2937] shadow-lg fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#8b5cf6] mb-2">
            DINCI AI辩论平台
          </h1>
          <p className="text-[#9ca3af]">
            探索AI驱动的智能辩论体验
          </p>
        </div>
        
        <Tabs 
          value={tab} 
          onChange={setTab} 
          className="mb-6"
          items={[
            { 
              value: 'login', 
              label: '登录', 
              className: 'text-[#d1d5db] hover:text-[#8b5cf6]'
            },
            { 
              value: 'register', 
              label: '注册', 
              className: 'text-[#d1d5db] hover:text-[#8b5cf6]'
            },
            { 
              value: 'reset', 
              label: '重置密码', 
              className: 'text-[#d1d5db] hover:text-[#8b5cf6]'
            }
          ]}
        />

        {tab === 'reset' ? (
          <PasswordReset onSuccess={() => setTab('login')} />
        ) : (
          <Form layout="vertical" className="space-y-4" form={form}>
            <Form.Item 
              name="email" 
              label="邮箱地址" 
              required 
              validateStatus={formErrors.email ? 'error' : undefined}
              help={formErrors.email}
            >
              <Input
                type="email"
                value={email}
                onChange={(value) => setEmail(value)}
                placeholder="请输入邮箱地址"
                className="bg-[#374151] border-[#4b5563] focus:border-[#8b5cf6] text-[#f3f4f6]"
                clearable
                autoComplete="email"
              />
            </Form.Item>
            
            <Form.Item 
              name="password" 
              label="密码" 
              required 
              validateStatus={formErrors.password ? 'error' : undefined}
              help={formErrors.password}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(value) => setPassword(value)}
                placeholder="请输入密码"
                className="bg-[#374151] border-[#4b5563] focus:border-[#8b5cf6] text-[#f3f4f6]"
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                suffix={
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#9ca3af] hover:text-[#f3f4f6]"
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </Button>
                }
              />
            </Form.Item>
            
            {tab === 'register' && (
              <Form.Item 
                name="confirmPassword" 
                label="确认密码" 
                required 
                validateStatus={formErrors.confirmPassword ? 'error' : undefined}
                help={formErrors.confirmPassword}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(value) => setConfirmPassword(value)}
                  placeholder="请再次输入密码"
                  className="bg-[#374151] border-[#4b5563] focus:border-[#8b5cf6] text-[#f3f4f6]"
                  autoComplete="new-password"
                />
              </Form.Item>
            )}
            
            <Button
              block
              loading={loading}
              onClick={handleSubmit}
              className="mt-6 h-12 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-all transform hover:scale-[1.02]"
            >
              {tab === 'login' ? '登录' : '注册'}
            </Button>

            <Divider className="my-6 text-[#4b5563]">
              或通过以下方式登录
            </Divider>

            <Space direction="vertical" className="w-full">
              <Button
                variant="outline"
                block
                onClick={() => handleOAuthLogin('github')}
                className="h-12 border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4]/10 transition-all"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                使用 GitHub 登录
              </Button>
              <Button
                variant="outline"
                block
                onClick={() => handleOAuthLogin('google')}
                className="h-12 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 19.79c-3.17-.47-5.65-2.9-5.65-5.79 0-.67.12-1.32.34-1.94L2.5 5.5v13l3.63-1.62c.85.91 1.96 1.62 3.35 1.91zM19.5 7.38c-.88-.39-1.84-.62-2.86-.62-1.16 0-2.23.3-3.1.83l-1.97-1.97C11.75 4.75 9.9 4.5 7.99 4.5c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.91 0 3.76-.25 5.41-.7l2.06 2.06C15.92 19.8 14.07 20 12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8c1.95 0 3.73.6 5.15 1.6L19.5 7.38z"/>
                </svg>
                使用 Google 登录
              </Button>
            </Space>
          </Form>
        )}
      </div>
    </div>
  )
}