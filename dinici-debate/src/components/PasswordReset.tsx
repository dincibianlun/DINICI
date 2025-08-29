import { useState } from 'react'
import { showSuccess, showError } from '../utils/message'
import { securePasswordReset } from '../patches/passwordResetFix'
import { Button, Input } from 'tdesign-react'



import { Button, Input } from 'tdesign-react'

export const PasswordReset = ({ onSuccess }: { onSuccess?: () => void }) => {
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
    <div className="max-w-md mx-auto p-6 border-2 border-purple-500 rounded-lg bg-gray-800">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">找回密码</h3>
      
      {sent ? (
        <div className="text-center py-4">
          <p className="text-purple-300 mb-4">
            我们已向 {email} 发送了密码重置链接
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSent(false)}
            className="border-cyan-400 text-cyan-400"
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
            className="mb-4 bg-gray-700 border-purple-500"
          />
          <Button
            block
            loading={loading}
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-500"
          >
            发送重置链接
          </Button>
        </>
      )}
    </div>
  )
}