import { useState } from 'react'
import { showSuccess, showError } from '../utils/message'
import { securePasswordReset } from '../patches/passwordResetFix'
import { Button, Input } from 'tdesign-react'
// 确保引入样式修复
import '../styles/auth-input-fix.css'
import '../styles/auth-dark-mode.css'
import '../styles/password-icon.css'

export default function PasswordReset({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const { error } = await securePasswordReset(email)
      if (error) throw error
      setSent(true)
showSuccess('密码重置邮件已发送，请检查您的邮箱')
onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '请求失败'
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="auth-page-dark"
      style={{
        maxWidth: '28rem',
        margin: '0 auto',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(0, 255, 255, 0.1)',
        borderRadius: '8px'
      }}
    >
      <h3 
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#00ffff',
          marginBottom: '1rem'
        }}
      >
        找回密码
      </h3>
      
      {sent ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <p style={{ color: '#888888', marginBottom: '1rem' }}>
            我们已向 {email} 发送了密码重置链接
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSent(false)}
            style={{
              border: '1px solid #00ffff',
              color: '#00ffff',
              background: 'transparent'
            }}
          >
            重新发送
          </Button>
        </div>
      ) : (
        <>
          <Input
            type="text"
            value={email}
            onChange={setEmail}
            placeholder="请输入注册邮箱"
            className="auth-input"
            style={{
              marginBottom: '1rem',
              width: '100%',
              height: '3rem',
              fontSize: '0.875rem',
              padding: '0 1rem',
              transition: 'all 0.2s ease'
            }}
          />
          <Button
            block
            loading={loading}
            onClick={handleSubmit}
            className="auth-button"
            style={{
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              border: 'none',
              height: '3rem',
              fontSize: '0.875rem',
              fontWeight: 400,
              borderRadius: '4px',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
          >
            发送重置链接
          </Button>
        </>
      )}
    </div>
  )
}