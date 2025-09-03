import { useState, useEffect } from 'react';
import { Button, Input, MessagePlugin } from 'tdesign-react';
import { signUp, signIn } from '../services/authService';
import PasswordReset from '../components/PasswordReset';
import '../styles/auth-input-fix.css';
import '../styles/auth-dark-mode.css';
import '../styles/password-icon.css';

// 表单错误类型定义
export interface FormErrors {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AuthPage() {
  const [tab, setTab] = useState<string>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    // 邮箱验证
    if (!email.trim()) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    // 密码验证
    if (!password) {
      errors.password = '请输入密码';
    } else if (password.length < 6) {
      errors.password = '密码至少需要6个字符';
    }
    
    // 确认密码验证（仅在注册时）
    if (tab === 'register' && password !== confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }
    
    setFormErrors(errors);
    
    // 检查是否有错误
    return !errors.email && !errors.password && !(tab === 'register' && errors.confirmPassword);
  };

  // 切换标签时重置表单
  useEffect(() => {
    setFormErrors({ email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
  }, [tab]);

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      if (tab === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        MessagePlugin.success('登录成功，正在跳转...');
        setTimeout(() => {
          window.location.href = '/debate';
        }, 1500);
      } else if (tab === 'register') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        MessagePlugin.success('注册成功，请检查邮箱验证');
        setTab('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ?
        (error.message.includes('Invalid login credentials') ? '邮箱或密码错误' : error.message) :
        '操作失败，请重试';
      MessagePlugin.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="auth-page-dark"
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

      {/* 青色荧光装饰 */}
      <div 
        style={{
          position: 'absolute',
          top: '15%',
          right: '20%',
          width: '1px',
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, #00ffff, transparent)',
          opacity: 0.4
        }}
      />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10 }}>
        {/* 返回首页 */}
        <div style={{ marginBottom: '2rem' }}>
          <Button
            variant="text"
            onClick={() => window.history.back()}
            style={{
              color: '#00ffff',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 300
            }}
          >
            ← 返回首页
          </Button>
        </div>

        {/* 主要表单容器 */}
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '3rem 2rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 
              style={{
                fontSize: '2rem',
                fontWeight: 300,
                letterSpacing: '0.1em',
                color: '#ffffff',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => window.location.href = '/'}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              DINCI
            </h1>
            <div 
              style={{
                width: '40px',
                height: '1px',
                background: '#00ffff',
                margin: '0 auto',
                opacity: 0.6
              }}
            />
          </div>
        
        {/* 简约标签页 */}
        <div style={{ marginBottom: '2rem' }}>
          <div 
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              padding: '2px'
            }}
          >
            {['login', 'register', 'reset'].map((tabKey) => (
              <button
                key={tabKey}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  borderRadius: '2px',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === tabKey ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                  color: tab === tabKey ? '#00ffff' : '#888888'
                }}
                onClick={() => setTab(tabKey)}
                onMouseEnter={(e) => {
                  if (tab !== tabKey) {
                    e.currentTarget.style.color = '#cccccc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== tabKey) {
                    e.currentTarget.style.color = '#888888';
                  }
                }}
              >
                {tabKey === 'login' ? '登录' : tabKey === 'register' ? '注册' : '重置密码'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'reset' ? (
          <PasswordReset onSuccess={() => setTab('login')} />
        ) : (
          <div>
            {/* 邮箱输入 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#cccccc',
                  marginBottom: '0.5rem',
                  fontWeight: 300
                }}
              >
                邮箱地址
              </label>
              <Input
                value={email}
                onChange={(value) => setEmail(value)}
                placeholder="请输入邮箱地址"
                className="auth-input"
                style={{
                  width: '100%',
                  height: '3rem',
                  fontSize: '0.875rem',
                  padding: '0 1rem',
                  transition: 'all 0.2s ease'
                }}
              />
              {formErrors.email && (
                <span style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.email}
                </span>
              )}
            </div>
            
            {/* 密码输入 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: '#cccccc',
                  marginBottom: '0.5rem',
                  fontWeight: 300
                }}
              >
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(value) => setPassword(value)}
                  placeholder="请输入密码"
                  className="auth-input"
                  style={{
                    width: '100%',
                    height: '3rem',
                    fontSize: '0.875rem',
                    padding: '0 1rem',
                    transition: 'all 0.2s ease'
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    backgroundImage: showPassword 
                      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='%23ffffff'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E\")" 
                      : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='%23ffffff'%3E%3Cpath d='M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'/%3E%3C/svg%3E\")",
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {formErrors.password && (
                <span style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {formErrors.password}
                </span>
              )}
            </div>
            
            {/* 确认密码（注册时） */}
            {tab === 'register' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: '#cccccc',
                    marginBottom: '0.5rem',
                    fontWeight: 300
                  }}
                >
                  确认密码
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(value) => setConfirmPassword(value)}
                    placeholder="请再次输入密码"
                    className="auth-input"
                    style={{
                      width: '100%',
                      height: '3rem',
                      fontSize: '0.875rem',
                      padding: '0 1rem',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      backgroundImage: showPassword 
                        ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='%23ffffff'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E\")" 
                        : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='%23ffffff'%3E%3Cpath d='M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'/%3E%3C/svg%3E\")",
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <span style={{ color: '#ff6b6b', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {formErrors.confirmPassword}
                  </span>
                )}
              </div>
            )}
            
            {/* 简约提交按钮 */}
            <Button
              block
              loading={loading}
              onClick={handleSubmit}
              className="auth-button"
              style={{
                width: '100%',
                height: '3rem',
                background: '#ffffff',
                border: '1px solid #e9ecef',
                fontSize: '0.875rem',
                fontWeight: 400,
                borderRadius: '4px',
                marginTop: '2rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {tab === 'login' ? '登录' : '注册'}
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
