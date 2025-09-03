import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown } from 'tdesign-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user, logout, isAdmin, refreshAdminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 组件加载时只刷新一次管理员状态
  useEffect(() => {
    // 使用一个标记来避免重复请求
    const adminCheckDone = sessionStorage.getItem('admin_check_done');
    if (user && !adminCheckDone) {
      console.log('💬 Header: 首次加载时刷新管理员状态');
      refreshAdminStatus();
      // 设置会话标记避免重复请求
      sessionStorage.setItem('admin_check_done', 'true');
    }
  }, [user]);
  
  const navigationItems = [
    { path: '/', label: '首页', icon: '' },
    { path: '/debate', label: '开始辩论', icon: '' },
    { path: '/library', label: '案例库', icon: '' },
    // 帮助中心链接修改为外部链接，在新窗口打开
    { 
      path: 'https://lcnad7wrmp5x.feishu.cn/wiki/KCGBw9I7BiIryokq1KbcLvTInIc?from=from_copylink', 
      label: '帮助中心', 
      icon: '',
      isExternal: true 
    },
    // 管理员专用导航项
    ...(isAdmin ? [{ path: '/hao', label: '管理后台', icon: '' }] : [])
  ];
  
  const userMenuItems = [
    {
      content: <span style={{ color: '#495057', letterSpacing: '0.05em', padding: '0.75rem 1rem', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>用户中心</span>,
      value: 'profile',
      onClick: () => navigate('/profile')
    },
    {
      content: <span style={{ color: '#495057', letterSpacing: '0.05em', padding: '0.75rem 1rem', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>设置</span>,
      value: 'settings', 
      onClick: () => navigate('/settings')
    },
    // 管理员专用菜单
    ...(isAdmin ? [{
      content: <span style={{ color: '#495057', letterSpacing: '0.05em', padding: '0.75rem 1rem', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>管理后台</span>,
      value: 'admin',
      onClick: () => navigate('/hao')
    }] : []),
    {      content: <span style={{ color: '#495057', letterSpacing: '0.05em', padding: '0.75rem 1rem', display: 'block', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>退出登录</span>,      value: 'logout',      onClick: logout    }
  ];
  
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#ffffff',
      borderBottom: '1px solid #e9ecef',
      padding: '0 2rem',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Logo区域 */}
      <Link 
        to="/" 
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1a1a1a',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        DINCI
      </Link>
      
      {/* 导航菜单 */}
      <nav style={{ display: 'flex', gap: '1rem' }}>
        {navigationItems.map(item => (
          item.isExternal ? (
            // 外部链接在新窗口打开
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                color: location.pathname === '/overview' ? '#1a1a1a' : '#666666',
                background: location.pathname === '/overview' 
                  ? '#f5f5f5' 
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: location.pathname === '/overview' 
                  ? '1px solid #1a1a1a' 
                  : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== '/overview') {
                  e.currentTarget.style.color = '#1a1a1a';
                  e.currentTarget.style.background = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== '/overview') {
                  e.currentTarget.style.color = '#666666';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.label}</span>
            </a>
          ) : (
            // 内部路由链接
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                color: location.pathname === item.path ? '#1a1a1a' : '#666666',
                background: location.pathname === item.path 
                  ? '#f5f5f5' 
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: location.pathname === item.path 
                  ? '1px solid #1a1a1a' 
                  : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.color = '#1a1a1a';
                  e.currentTarget.style.background = '#f8f8f8';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.color = '#666666';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.label}</span>
            </Link>
          )
        ))}
      </nav>
      
      {/* 用户区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <Dropdown 
            options={userMenuItems}
            trigger="click"
            popupProps={{ 
              placement: 'bottom-left',
              overlayClassName: 'user-menu-popup',
              overlayStyle: { 
                padding: '0.5rem 0',
                width: '200px',
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              width: '200px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e9ecef';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8f9fa';
            }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span style={{ color: '#333333', fontSize: '1rem' }}>
                {user.email?.split('@')[0]}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            style={{
              background: '#ffffff',
              border: '1px solid #e9ecef',
              color: '#000000',
              borderRadius: '6px',
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem'
            }}
          >
            登录
          </Button>
        )}
      </div>
    </header>
  );
};