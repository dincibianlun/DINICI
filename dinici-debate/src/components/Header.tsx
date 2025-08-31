import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown } from 'tdesign-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigationItems = [
    { path: '/', label: '首页', icon: '' },
    { path: '/debate', label: '开始辩论', icon: '' },
    { path: '/library', label: '案例库', icon: '' },
    { path: '/overview', label: '帮助中心', icon: '' }
  ];
  
  const userMenuItems = [
    {
      content: '用户中心',
      value: 'profile',
      onClick: () => navigate('/profile')
    },
    {
      content: '设置',
      value: 'settings', 
      onClick: () => navigate('/settings')
    },
    {
      content: '退出登录',
      value: 'logout',
      onClick: signOut
    }
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
        ))}
      </nav>
      
      {/* 用户区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <Dropdown 
            options={userMenuItems}
            trigger="click"
            popupProps={{ 
              placement: 'bottom-right',
              overlayClassName: 'user-menu-popup'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid #00ffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
            }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span style={{ color: '#333333' }}>
                {user.email?.split('@')[0]}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            style={{
              background: '#1a1a1a',
              border: 'none',
              color: '#ffffff',
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