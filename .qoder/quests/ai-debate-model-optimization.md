# DINICI AI辩论平台全局优化设计

## 概述

本设计文档专注于DINICI AI辩论平台的全局用户体验优化，主要解决当前系统在UI组件、导航体验、数据管理和用户功能方面存在的问题。设计基于现有技术架构，采用渐进式优化而非完全重构的方式，确保在提升用户体验的同时保持系统稳定性。

## 当前问题分析

### 1. UI组件问题
- **模型选择器展开方向错误**：TDesign Select组件向上展开，与上方文字重叠
- **缺少全局导航**：各页面独立，用户无法便捷切换功能
- **Logo不可点击**：左上角DINCI标识无法返回首页
- **页面布局不一致**：各页面样式和布局缺乏统一性

### 2. 功能缺失问题
- **无用户中心**：用户无法查看个人辩论历史记录
- **导航菜单缺失**：缺少主导航和面包屑导航
- **状态管理不完善**：页面间数据传递和状态同步存在问题
- **页面跳转逻辑不清晰**：用户流程导向不明确

### 3. 数据库表结构待完善
- **缺少用户行为统计字段**：浏览量、点赞数等
- **缺少用户设置表**：个人偏好、界面配置等
- **缺少必要的关联查询字段**：影响查询效率

## 技术环境说明

### 部署架构
- **前端**：Vercel 部署
- **后端**：Supabase (已部署，包含基础SQL表)
- **API策略**：用户自行配置OpenRouter API密钥和豆包TTS参数
- **技术栈**：React 18 + TypeScript + TDesign UI + Supabase

### 优化原则
- ✅ 基于现有架构渐进式优化
- ✅ 保持现有文件结构和技术选型
- ✅ 专注用户体验提升
- ❌ 避免完全重构项目
- ❌ 不添加测试和高级功能（按用户要求砍掉）

## 优化设计方案

### 1. UI组件优化

#### 1.1 模型选择器修复

**问题描述**：当前TDesign Select组件在辩论页面向上展开，与上方文字重叠

**解决方案**：
``typescript
// 在 DebatePage.tsx 中修改 Select 组件
<Select
  value={positiveModel}
  onChange={(val) => setPositiveModel(val as string)}
  options={MODEL_OPTIONS}
  popupProps={{
    placement: 'bottom-left',  // 强制向下展开
    overlayClassName: 'model-select-popup'
  }}
  style={{ 
    width: '100%',
    zIndex: 1000  // 确保下拉菜单在最上层
  }}
/>
```

**CSS样式补充**：
``css
/* 在 App.css 或相关样式文件中添加 */
.model-select-popup {
  z-index: 9999 !important;
  border: 1px solid rgba(0, 255, 255, 0.3);
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
}

.model-select-popup .t-select-option {
  color: #ffffff;
  background: transparent;
}

.model-select-popup .t-select-option:hover {
  background: rgba(0, 255, 255, 0.1);
}
```

#### 1.2 全局导航组件设计

**新增 Header 组件**：
``typescript
// src/components/Header.tsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Dropdown, Avatar } from 'tdesign-react';
import { LogoutIcon, SettingIcon, UserIcon } from 'tdesign-icons-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navigationItems = [
    { path: '/', label: '首页', icon: 'home' },
    { path: '/debate', label: '开始辩论', icon: 'chat' },
    { path: '/library', label: '案例库', icon: 'book' },
    { path: '/overview', label: '总览', icon: 'dashboard' }
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
      onClick: logout
    }
  ];
  
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(0, 255, 255, 0.1)',
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
          color: '#00ffff',
          textDecoration: 'none',
          letterSpacing: '0.1em'
        }}
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
              color: location.pathname === item.path ? '#00ffff' : '#cccccc',
              background: location.pathname === item.path 
                ? 'rgba(0, 255, 255, 0.1)' 
                : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: location.pathname === item.path 
                ? '1px solid rgba(0, 255, 255, 0.3)' 
                : '1px solid transparent'
            }}
          >
            {item.label}
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
              borderRadius: '20px',
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              cursor: 'pointer'
            }}>
              <Avatar size="small" style={{ background: '#00ffff' }}>
                {user.email?.[0]?.toUpperCase()}
              </Avatar>
              <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                {user.email}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button 
            onClick={() => navigate('/auth')}
            style={{
              background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
              border: 'none',
              color: 'white'
            }}
          >
            登录
          </Button>
        )}
      </div>
    </header>
  );
};
```

#### 1.3 面包屑导航组件

``typescript
// src/components/Breadcrumb.tsx
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from 'tdesign-icons-react';

interface BreadcrumbItem {
  path: string;
  label: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const location = useLocation();
  
  // 默认面包屑映射
  const defaultBreadcrumbs: Record<string, BreadcrumbItem[]> = {
    '/': [{ path: '/', label: '首页' }],
    '/debate': [
      { path: '/', label: '首页' },
      { path: '/debate', label: '开始辩论' }
    ],
    '/library': [
      { path: '/', label: '首页' },
      { path: '/library', label: '案例库' }
    ],
    '/profile': [
      { path: '/', label: '首页' },
      { path: '/profile', label: '用户中心' }
    ],
    '/settings': [
      { path: '/', label: '首页' },
      { path: '/settings', label: '设置' }
    ]
  };
  
  const breadcrumbItems = items || defaultBreadcrumbs[location.pathname] || [
    { path: '/', label: '首页' }
  ];
  
  return (
    <nav style={{
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#888888'
    }}>
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {index === breadcrumbItems.length - 1 ? (
            <span style={{ color: '#00ffff' }}>{item.label}</span>
          ) : (
            <>
              <Link 
                to={item.path}
                style={{
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#00ffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
              >
                {item.label}
              </Link>
              <ChevronRightIcon size="small" style={{ color: '#666666' }} />
            </>
          )}
        </div>
      ))}
    </nav>
  );
};
```

### 2. 用户中心功能实现

#### 2.1 个人辩论历史页面

```typescript
// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  MessagePlugin,
  Loading,
  Statistic,
  Row,
  Col
} from 'tdesign-react';
import { 
  TimeIcon, 
  EyeIcon, 
  ChatIcon,
  ShareIcon,
  DeleteIcon
} from 'tdesign-icons-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';

type UserDebate = {
  id: string;
  topic: string;
  positive_model: string;
  negative_model: string;
  judge_model: string;
  created_at: string;
  is_public: boolean;
  views?: number;
  tags?: string[];
};

type UserStats = {
  totalDebates: number;
  publicDebates: number;
  totalViews: number;
  joinDate: string;
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [debates, setDebates] = useState<UserDebate[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // 获取用户辩论记录
      const { data: debatesData, error: debatesError } = await supabase
        .from('debates')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (debatesError) throw debatesError;
      
      // 获取用户统计信息
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', user!.id)
        .single();
      
      if (userError) throw userError;
      
      setDebates(debatesData || []);
      
      // 计算统计数据
      const publicDebates = debatesData?.filter(d => d.is_public) || [];
      const totalViews = debatesData?.reduce((sum, d) => sum + (d.views || 0), 0) || 0;
      
      setStats({
        totalDebates: debatesData?.length || 0,
        publicDebates: publicDebates.length,
        totalViews,
        joinDate: userData.created_at
      });
      
    } catch (error) {
      console.error('获取用户数据失败:', error);
      MessagePlugin.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteDebate = async (debateId: string) => {
    try {
      const { error } = await supabase
        .from('debates')
        .delete()
        .eq('id', debateId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      MessagePlugin.success('删除成功');
      fetchUserData(); // 重新加载数据
    } catch (error) {
      console.error('删除失败:', error);
      MessagePlugin.error('删除失败');
    }
  };
  
  const handleTogglePublic = async (debateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('debates')
        .update({ is_public: !currentStatus })
        .eq('id', debateId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      MessagePlugin.success(currentStatus ? '取消公开' : '设为公开');
      fetchUserData();
    } catch (error) {
      console.error('更新失败:', error);
      MessagePlugin.error('操作失败');
    }
  };
  
  const columns = [
    {
      colKey: 'topic',
      title: '辩论题目',
      width: 200,
      cell: ({ row }: { row: UserDebate }) => (
        <Link 
          to={`/library/${row.id}`}
          style={{ color: '#00ffff', textDecoration: 'none' }}
        >
          {row.topic}
        </Link>
      )
    },
    {
      colKey: 'models',
      title: '模型配置',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ fontSize: '0.75rem', color: '#888888' }}>
          <div>正方: {row.positive_model.split('/').pop()}</div>
          <div>反方: {row.negative_model.split('/').pop()}</div>
          <div>裁判: {row.judge_model.split('/').pop()}</div>
        </div>
      )
    },
    {
      colKey: 'status',
      title: '状态',
      cell: ({ row }: { row: UserDebate }) => (
        <Tag 
          theme={row.is_public ? 'success' : 'default'}
          variant="light"
        >
          {row.is_public ? '公开' : '私有'}
        </Tag>
      )
    },
    {
      colKey: 'views',
      title: '浏览量',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <EyeIcon size="small" />
          <span>{row.views || 0}</span>
        </div>
      )
    },
    {
      colKey: 'created_at',
      title: '创建时间',
      cell: ({ row }: { row: UserDebate }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <TimeIcon size="small" />
          <span>{new Date(row.created_at).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      colKey: 'actions',
      title: '操作',
      cell: ({ row }: { row: UserDebate }) => (
        <Space>
          <Button 
            theme="primary"
            variant="text"
            size="small"
            onClick={() => handleTogglePublic(row.id, row.is_public)}
          >
            <ShareIcon size="small" />
            {row.is_public ? '取消公开' : '设为公开'}
          </Button>
          <Button 
            theme="danger"
            variant="text"
            size="small"
            onClick={() => handleDeleteDebate(row.id)}
          >
            <DeleteIcon size="small" />
            删除
          </Button>
        </Space>
      )
    }
  ];
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loading size="large" />
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 用户统计信息 */}
        <Card 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ padding: '1rem' }}>
            <h2 style={{ 
              color: '#00ffff', 
              marginBottom: '1.5rem',
              fontSize: '1.5rem'
            }}>
              用户中心
            </h2>
            
            <Row gutter={16}>
              <Col span={3}>
                <Statistic 
                  title="总辩论数"
                  value={stats?.totalDebates || 0}
                  suffix="场"
                  titleStyle={{ color: '#888888' }}
                  valueStyle={{ color: '#00ffff' }}
                />
              </Col>
              <Col span={3}>
                <Statistic 
                  title="公开辩论"
                  value={stats?.publicDebates || 0}
                  suffix="场"
                  titleStyle={{ color: '#888888' }}
                  valueStyle={{ color: '#00ff88' }}
                />
              </Col>
              <Col span={3}>
                <Statistic 
                  title="总浏览量"
                  value={stats?.totalViews || 0}
                  suffix="次"
                  titleStyle={{ color: '#888888' }}
                  valueStyle={{ color: '#ffd93d' }}
                />
              </Col>
              <Col span={3}>
                <Statistic 
                  title="加入时间"
                  value={stats?.joinDate ? new Date(stats.joinDate).toLocaleDateString() : '-'}
                  titleStyle={{ color: '#888888' }}
                  valueStyle={{ color: '#ff6b6b', fontSize: '1rem' }}
                />
              </Col>
            </Row>
          </div>
        </Card>
        
        {/* 辩论历史 */}
        <Card 
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)'
          }}
        >
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#00ffff' }}>辩论历史</h3>
              <Button 
                onClick={() => window.location.href = '/debate'}
                style={{
                  background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                  border: 'none'
                }}
              >
                <ChatIcon style={{ marginRight: '0.5rem' }} />
                开始新辩论
              </Button>
            </div>
            
            <Table 
              data={debates}
              columns={columns}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showJumper: true,
                showSizeChanger: true
              }}
              empty="暂无辩论记录"
              style={{
                '--td-table-bg': 'transparent',
                '--td-table-header-bg': 'rgba(0, 255, 255, 0.05)',
                '--td-table-tr-even-bg': 'rgba(255, 255, 255, 0.02)',
                '--td-table-tr-hover-bg': 'rgba(0, 255, 255, 0.05)'
              } as any}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
```

### 3. 数据库表结构优化

#### 3.1 新增缺失字段

**当前表结构问题**：
- `debates` 表缺少 `views` (浏览量) 和 `likes` (点赞数) 字段
- 缺少 `user_settings` 表存储用户个人配置
- 缺少 `debate_statistics` 表统计用户行为数据

**SQL更新脚本**：
```sql
-- 1. 给 debates 表添加缺失字段
ALTER TABLE debates 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 创建用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    ui_theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'zh-CN',
    notification_enabled BOOLEAN DEFAULT true,
    auto_save_debates BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. 创建辩论统计表
CREATE TABLE IF NOT EXISTS debate_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'view', 'like', 'share', 'comment'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(debate_id, user_id, action_type) -- 防止重复操作
);

-- 4. 创建用户活动记录表
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'debate_created', 'debate_shared', 'profile_updated'
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建浏览历史表
CREATE TABLE IF NOT EXISTS browse_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, debate_id, DATE(visited_at)) -- 每日一条记录
);

-- 6. 创建用户反馈表
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL, -- 'bug_report', 'feature_request', 'general'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    contact_email TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'closed'
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 为用户表添加缺失字段
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_debates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- 8. 创建视图 - 用户统计信息
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.nickname,
    u.created_at as join_date,
    u.last_active_at,
    COUNT(d.id) as total_debates,
    COUNT(CASE WHEN d.is_public = true THEN 1 END) as public_debates,
    COALESCE(SUM(d.views), 0) as total_views,
    COALESCE(SUM(d.likes), 0) as total_likes
FROM users u
LEFT JOIN debates d ON u.id = d.user_id
GROUP BY u.id, u.email, u.nickname, u.created_at, u.last_active_at;

-- 9. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_debates_public_views ON debates(is_public, views DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_debates_user_created ON debates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debates_tags ON debates USING GIN(tags);

-- 完成提示
SELECT '数据库表结构优化完成！' as result;
```

### 4. AI辩论模型调用优化

#### 4.1 流式AI调用实现

**当前问题**：OpenRouter服务只支持非流式调用，用户需要等待完整响应

**优化方案**：
```typescript
// src/services/openRouterService.ts 增强版
export interface StreamingResponse {
  id: string;
  object: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}

export interface StreamingConfig {
  model: string;
  messages: OpenRouterMessage[];
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  stream: true;
  onProgress?: (content: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

// 新增流式调用方法
export const callOpenRouterStreaming = async (
  config: StreamingConfig
): Promise<AsyncIterable<string>> => {
  const { model, messages, apiKey, onProgress, onComplete, onError } = config;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 800,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API 错误: ${response.status} ${response.statusText}`);
    }

    return parseStreamingResponse(response, onProgress, onComplete, onError);
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
};

// 流式响应解析器
async function* parseStreamingResponse(
  response: Response,
  onProgress?: (content: string) => void,
  onComplete?: (fullContent: string) => void,
  onError?: (error: Error) => void
): AsyncIterable<string> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  
  if (!reader) {
    throw new Error('无法读取响应流');
  }
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (onComplete) {
          onComplete(fullContent);
        }
        break;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const parsed: StreamingResponse = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            
            if (content) {
              fullContent += content;
              if (onProgress) {
                onProgress(content);
              }
              yield content;
            }
          } catch (parseError) {
            console.warn('解析流式数据失败:', parseError);
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}
```

#### 4.2 请求频率控制优化

**问题分析**：缺少防抖、节流和重试机制，可能导致API频繁调用

**解决方案**：
```typescript
// src/utils/requestController.ts
interface RequestController {
  debounceTime: number;      // 防抖延迟 (500ms)
  throttleInterval: number;  // 节流间隔 (2000ms)
  maxRetries: number;        // 最大重试次数 (3次)
  retryDelay: number;        // 重试延迟 (3000ms)
}

class DebateRequestController {
  private config: RequestController;
  private lastRequestTime: number = 0;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(config: Partial<RequestController> = {}) {
    this.config = {
      debounceTime: 500,
      throttleInterval: 2000,
      maxRetries: 3,
      retryDelay: 3000,
      ...config
    };
  }
  
  // 防抖处理
  debounce<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    key: string
  ): T {
    return ((...args: any[]) => {
      return new Promise((resolve, reject) => {
        // 清除之前的定时器
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // 设置新的定时器
        const timer = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, this.config.debounceTime);
        
        this.debounceTimers.set(key, timer);
      });
    }) as T;
  }
  
  // 节流检查
  private checkThrottle(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < this.config.throttleInterval) {
      return false;
    }
    this.lastRequestTime = now;
    return true;
  }
  
  // 带重试的请求
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    requestKey: string
  ): Promise<T> {
    // 检查是否有相同的请求正在执行
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }
    
    // 节流检查
    if (!this.checkThrottle()) {
      throw new Error('请求过于频繁，请稍后再试');
    }
    
    const executeRequest = async (attempt: number = 1): Promise<T> => {
      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        if (attempt >= this.config.maxRetries) {
          throw error;
        }
        
        // 等待后重试
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * attempt)
        );
        
        return executeRequest(attempt + 1);
      }
    };
    
    const requestPromise = executeRequest();
    this.pendingRequests.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }
}

export const debateRequestController = new DebateRequestController();
```

### 5. 豆包TTS语音合成优化

#### 5.1 增强的TTS服务实现

**当前问题**：文字生成完毕后才开始语音合成，用户等待时间长

**优化方案**：
```typescript
// src/services/ttsService.ts 增强版
export interface EnhancedTTSConfig {
  appid: string;
  accessToken: string;
  clusterId?: string;
  
  // 基础音频参数
  voiceType: string;
  encoding: 'mp3' | 'wav' | 'pcm' | 'ogg_opus';
  rate: 8000 | 16000 | 24000;
  bitrate?: number;
  
  // 语音控制参数
  speedRatio: number;        // 语速 [0.8, 2.0]
  loudnessRatio: number;     // 音量 [0.5, 2.0]
  
  // 情感控制参数
  emotion?: 'angry' | 'happy' | 'sad' | 'neutral';
  enableEmotion: boolean;
  emotionScale: number;      // 情绪强度 [1, 5]
  
  // 高级处理参数
  disableMarkdownFilter: boolean;
  enableLatexTn: boolean;
  disableEmojiFilter: boolean;
  cacheEnabled: boolean;
}

class OptimizedTTSService {
  private cache: Map<string, string> = new Map();
  private processingQueue: Map<string, Promise<string>> = new Map();
  
  async synthesizeSpeech(
    text: string,
    config: EnhancedTTSConfig
  ): Promise<string> {
    // 1. 文本预处理
    const processedText = this.preprocessText(text, config);
    
    // 2. 缓存检查
    const cacheKey = this.getCacheKey(processedText, config);
    if (config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 3. 检查是否正在处理相同请求
    if (this.processingQueue.has(cacheKey)) {
      return this.processingQueue.get(cacheKey)!;
    }
    
    // 4. 开始处理
    const processingPromise = this.callTTSAPI(processedText, config);
    this.processingQueue.set(cacheKey, processingPromise);
    
    try {
      const audioData = await processingPromise;
      
      // 5. 缓存结果
      if (config.cacheEnabled) {
        this.cache.set(cacheKey, audioData);
        
        // 限制缓存大小
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
      }
      
      return audioData;
    } finally {
      this.processingQueue.delete(cacheKey);
    }
  }
  
  // 文本预处理
  private preprocessText(text: string, config: EnhancedTTSConfig): string {
    let processed = text;
    
    // 移除Markdown语法
    if (config.disableMarkdownFilter) {
      processed = processed
        .replace(/\*\*(.+?)\*\*/g, '$1')  // 移除加粗
        .replace(/\*(.+?)\*/g, '$1')      // 移除斜体
        .replace(/```[\s\S]*?```/g, '')   // 移除代码块
        .replace(/`(.+?)`/g, '$1');       // 移除行内代码
    }
    
    // 处理emoji
    if (config.disableEmojiFilter) {
      // 保留emoji原样
    } else {
      // 移除emoji
      processed = processed.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
    }
    
    // 标准化空白字符
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    // 限制文本长度（豆包API限制）
    if (processed.length > 1000) {
      processed = processed.substring(0, 1000) + '...';
    }
    
    return processed;
  }
  
  // 调用豆包TTS API
  private async callTTSAPI(text: string, config: EnhancedTTSConfig): Promise<string> {
    const requestBody = {
      app: {
        appid: config.appid,
        token: config.accessToken,
        cluster: config.clusterId || 'volcano_tts'
      },
      user: {
        uid: 'dinici-user-' + Date.now()
      },
      audio: {
        voice_type: config.voiceType,
        encoding: config.encoding,
        rate: config.rate,
        speed_ratio: config.speedRatio,
        loudness_ratio: config.loudnessRatio,
        ...(config.enableEmotion && {
          emotion: config.emotion,
          enable_emotion: true,
          emotion_scale: config.emotionScale
        }),
        ...(config.bitrate && { bitrate: config.bitrate })
      },
      request: {
        reqid: crypto.randomUUID(),
        text: text,
        operation: 'query',
        extra_param: JSON.stringify({
          disable_markdown_filter: config.disableMarkdownFilter,
          enable_latex_tn: config.enableLatexTn,
          disable_emoji_filter: config.disableEmojiFilter,
          cache_config: config.cacheEnabled ? {
            text_type: 1,
            use_cache: true
          } : undefined
        })
      }
    };
    
    const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer;${config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`TTS API 错误: ${response.status} - ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 3000) {
      throw new Error(`TTS 合成失败: ${data.message}`);
    }
    
    return data.data; // 返回base64编码的音频数据
  }
  
  // 生成缓存key
  private getCacheKey(text: string, config: EnhancedTTSConfig): string {
    const keyData = {
      text,
      voiceType: config.voiceType,
      encoding: config.encoding,
      speedRatio: config.speedRatio,
      emotion: config.emotion,
      emotionScale: config.emotionScale
    };
    return btoa(JSON.stringify(keyData));
  }
  
  // 清理缓存
  clearCache(): void {
    this.cache.clear();
  }
  
  // 获取缓存统计
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const optimizedTTSService = new OptimizedTTSService();

// 优化后的语音配置
export const OPTIMIZED_VOICE_CONFIG = {
  HOST: {
    voiceType: 'zh_female_meilinvyou_moon_bigtts',
    encoding: 'mp3' as const,
    rate: 24000 as const,
    speedRatio: 1.1,
    loudnessRatio: 1.2,
    emotion: 'neutral' as const,
    enableEmotion: true,
    emotionScale: 3
  },
  POSITIVE: {
    voiceType: 'zh_female_sajiaonvyou_moon_bigtts',
    encoding: 'mp3' as const,
    rate: 24000 as const,
    speedRatio: 1.0,
    loudnessRatio: 1.0,
    emotion: 'happy' as const,
    enableEmotion: true,
    emotionScale: 4
  },
  NEGATIVE: {
    voiceType: 'zh_female_shuangkuaisisi_moon_bigtts',
    encoding: 'mp3' as const,
    rate: 24000 as const,
    speedRatio: 0.95,
    loudnessRatio: 1.1,
    emotion: 'neutral' as const,
    enableEmotion: true,
    emotionScale: 3
  }
};
```

#### 5.2 流式文字与TTS协调机制

**问题分析**：需要实现文字流式显示的同时进行语音合成

**协调方案**：
```typescript
// src/hooks/useStreamingDebate.ts
import { useState, useCallback } from 'react';
import { callOpenRouterStreaming } from '../services/openRouterService';
import { optimizedTTSService, OPTIMIZED_VOICE_CONFIG } from '../services/ttsService';
import { debateRequestController } from '../utils/requestController';

interface StreamingDebateMessage {
  role: 'host' | 'positive' | 'negative' | 'judge';
  content: string;
  isStreaming: boolean;
  audioData?: string;
  audioLoading?: boolean;
}

export const useStreamingDebate = () => {
  const [messages, setMessages] = useState<StreamingDebateMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 流式生成辩论内容
  const generateStreamingMessage = useCallback(async (
    role: 'host' | 'positive' | 'negative' | 'judge',
    prompt: string,
    model: string,
    apiKey: string,
    ttsConfig: any
  ) => {
    setIsProcessing(true);
    
    // 创建初始消息
    const messageId = Date.now().toString();
    const initialMessage: StreamingDebateMessage = {
      role,
      content: '',
      isStreaming: true,
      audioLoading: false
    };
    
    setMessages(prev => [...prev, initialMessage]);
    
    let fullContent = '';
    let shouldStartTTS = false;
    
    try {
      // 设置流式配置
      const streamConfig = {
        model,
        messages: [{ role: 'user', content: prompt }],
        apiKey,
        stream: true as const,
        onProgress: (chunk: string) => {
          fullContent += chunk;
          
          // 实时更新显示
          setMessages(prev => 
            prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
          
          // 当文字达到一定长度时开始准备TTS
          if (fullContent.length > 50 && !shouldStartTTS) {
            shouldStartTTS = true;
            // 开始预处理TTS（但不立即执行）
            prepareTTSGeneration(role, ttsConfig);
          }
        },
        onComplete: async (finalContent: string) => {
          // 流式结束，开始生成语音
          setMessages(prev => 
            prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, content: finalContent, isStreaming: false, audioLoading: true }
                : msg
            )
          );
          
          // 生成语音
          await generateAudio(finalContent, role, ttsConfig);
        },
        onError: (error: Error) => {
          console.error('流式生成失败:', error);
          setMessages(prev => 
            prev.map((msg, index) => 
              index === prev.length - 1 
                ? { ...msg, isStreaming: false, content: '生成失败，请重试' }
                : msg
            )
          );
        }
      };
      
      // 开始流式生成
      const streamIterator = await debateRequestController.executeWithRetry(
        () => callOpenRouterStreaming(streamConfig),
        `debate-${role}-${messageId}`
      );
      
      // 消费流式数据
      for await (const chunk of streamIterator) {
        // 流式数据已在onProgress中处理
      }
      
    } catch (error) {
      console.error('辩论生成错误:', error);
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...msg, isStreaming: false, content: `错误: ${error.message}` }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // 预处理TTS生成
  const prepareTTSGeneration = useCallback((role: string, ttsConfig: any) => {
    // 可以在这里做一些预处理，比如预加载配置等
    console.log(`预处理${role}角色的TTS生成`);
  }, []);
  
  // 生成语音
  const generateAudio = useCallback(async (
    text: string,
    role: 'host' | 'positive' | 'negative' | 'judge',
    ttsConfig: any
  ) => {
    try {
      // 获取角色配置
      const voiceConfig = OPTIMIZED_VOICE_CONFIG[role.toUpperCase() as keyof typeof OPTIMIZED_VOICE_CONFIG] 
        || OPTIMIZED_VOICE_CONFIG.HOST;
      
      const enhancedConfig = {
        appid: ttsConfig.appid,
        accessToken: ttsConfig.accessToken,
        clusterId: 'volcano_tts',
        ...voiceConfig,
        disableMarkdownFilter: true,
        enableLatexTn: false,
        disableEmojiFilter: false,
        cacheEnabled: true
      };
      
      const audioData = await optimizedTTSService.synthesizeSpeech(text, enhancedConfig);
      
      // 更新消息中的音频数据
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...msg, audioData, audioLoading: false }
            : msg
        )
      );
      
    } catch (error) {
      console.error('语音合成失败:', error);
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 
            ? { ...msg, audioLoading: false }
            : msg
        )
      );
    }
  }, []);
  
  return {
    messages,
    isProcessing,
    generateStreamingMessage
  };
};
```

### 6. 增强的辩论流程控制

#### 6.1 智能辩论状态机

**问题分析**：当前的辩论流程是固定序列执行，缺少智能的交替发言控制

**优化方案**：
```typescript
// src/hooks/useEnhancedDebateFlow.ts
import { useState, useCallback } from 'react';
import { useStreamingDebate } from './useStreamingDebate';
import { debateRequestController } from '../utils/requestController';

type DebatePhase = 
  | 'preparing'
  | 'host_intro'
  | 'positive_opening'
  | 'negative_opening'
  | 'free_debate_round'
  | 'judge_summary'
  | 'completed'
  | 'error';

interface DebateState {
  phase: DebatePhase;
  currentRound: number;
  maxRounds: number;
  currentSpeaker: 'positive' | 'negative' | null;
  debateContext: {
    topic: string;
    keyPoints: {
      positive: string[];
      negative: string[];
    };
    qualityMetrics: {
      coherenceScore: number;
      diversityScore: number;
      totalWords: number;
    };
  };
}

export const useEnhancedDebateFlow = () => {
  const { messages, isProcessing, generateStreamingMessage } = useStreamingDebate();
  const [debateState, setDebateState] = useState<DebateState>({
    phase: 'preparing',
    currentRound: 0,
    maxRounds: 3,
    currentSpeaker: null,
    debateContext: {
      topic: '',
      keyPoints: { positive: [], negative: [] },
      qualityMetrics: { coherenceScore: 0, diversityScore: 0, totalWords: 0 }
    }
  });
  
  // 开始增强的辩论流程
  const startEnhancedDebate = useCallback(async (
    topic: string,
    positiveModel: string,
    negativeModel: string,
    judgeModel: string,
    apiKey: string,
    ttsConfig: any
  ) => {
    setDebateState(prev => ({
      ...prev,
      phase: 'host_intro',
      debateContext: { ...prev.debateContext, topic }
    }));
    
    try {
      // 1. 主持人开场
      await generateStreamingMessage(
        'host',
        generateHostPrompt(topic),
        judgeModel,
        apiKey,
        ttsConfig
      );
      
      setDebateState(prev => ({ ...prev, phase: 'positive_opening' }));
      
      // 2. 正方开场立论
      await generateStreamingMessage(
        'positive',
        generatePositiveOpeningPrompt(topic),
        positiveModel,
        apiKey,
        ttsConfig
      );
      
      setDebateState(prev => ({ ...prev, phase: 'negative_opening' }));
      
      // 3. 反方开场立论
      const positiveOpening = messages[messages.length - 1]?.content || '';
      await generateStreamingMessage(
        'negative',
        generateNegativeOpeningPrompt(topic, positiveOpening),
        negativeModel,
        apiKey,
        ttsConfig
      );
      
      setDebateState(prev => ({ 
        ...prev, 
        phase: 'free_debate_round',
        currentSpeaker: 'positive'
      }));
      
      // 4. 自由辩论回合
      await conductFreeDebateRounds(
        topic,
        positiveModel,
        negativeModel,
        apiKey,
        ttsConfig
      );
      
      setDebateState(prev => ({ ...prev, phase: 'judge_summary' }));
      
      // 5. 裁判总结
      await generateStreamingMessage(
        'judge',
        generateJudgeSummaryPrompt(topic, messages),
        judgeModel,
        apiKey,
        ttsConfig
      );
      
      setDebateState(prev => ({ ...prev, phase: 'completed' }));
      
    } catch (error) {
      console.error('辩论流程错误:', error);
      setDebateState(prev => ({ ...prev, phase: 'error' }));
    }
  }, [messages, generateStreamingMessage]);
  
  // 自由辩论回合
  const conductFreeDebateRounds = useCallback(async (
    topic: string,
    positiveModel: string,
    negativeModel: string,
    apiKey: string,
    ttsConfig: any
  ) => {
    for (let round = 1; round <= debateState.maxRounds; round++) {
      setDebateState(prev => ({ 
        ...prev, 
        currentRound: round,
        currentSpeaker: 'positive'
      }));
      
      // 正方发言
      const recentHistory = getRecentDebateHistory(messages, 4);
      await generateStreamingMessage(
        'positive',
        generateFreeDebatePrompt(
          topic, 
          'positive', 
          recentHistory, 
          round,
          debateState.debateContext.keyPoints
        ),
        positiveModel,
        apiKey,
        ttsConfig
      );
      
      // 更新辩论上下文
      updateDebateContext('positive', messages[messages.length - 1]?.content || '');
      
      setDebateState(prev => ({ ...prev, currentSpeaker: 'negative' }));
      
      // 反方回应
      const updatedHistory = getRecentDebateHistory(messages, 4);
      await generateStreamingMessage(
        'negative',
        generateFreeDebatePrompt(
          topic,
          'negative',
          updatedHistory,
          round,
          debateState.debateContext.keyPoints
        ),
        negativeModel,
        apiKey,
        ttsConfig
      );
      
      // 更新辩论上下文
      updateDebateContext('negative', messages[messages.length - 1]?.content || '');
      
      // 回合间暂停
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [debateState, messages, generateStreamingMessage]);
  
  // 更新辩论上下文
  const updateDebateContext = useCallback((side: 'positive' | 'negative', content: string) => {
    setDebateState(prev => {
      const keyPoints = extractKeyPoints(content);
      return {
        ...prev,
        debateContext: {
          ...prev.debateContext,
          keyPoints: {
            ...prev.debateContext.keyPoints,
            [side]: [...prev.debateContext.keyPoints[side], ...keyPoints]
          },
          qualityMetrics: {
            ...prev.debateContext.qualityMetrics,
            totalWords: prev.debateContext.qualityMetrics.totalWords + content.split(' ').length
          }
        }
      };
    });
  }, []);
  
  return {
    messages,
    debateState,
    isProcessing,
    startEnhancedDebate
  };
};

// 生成主持人提示词
function generateHostPrompt(topic: string): string {
  return `你是一名专业的辩论主持人，请为以下辩题做开场白：

辩题：${topic}

请在开场白中：
1. 欢迎观众参与辩论
2. 简要介绍辩题背景
3. 说明辩论规则和流程
4. 保持中立客观的态度

请控制在150字以内，语言严谨且有吸引力。`;
}

// 生成正方开场提示词
function generatePositiveOpeningPrompt(topic: string): string {
  return `你是正方辩手，请为以下辩题做开场立论：

辩题：${topic}

作为正方，你需要：
1. 明确表达你的立场和观点
2. 提出3-4个有力的论据支持你的观点
3. 使用具体的事实、数据或例子
4. 逻辑清晰，论证有力

请控制在200-250字之间，语言精练有力。`;
}

// 生成反方开场提示词
function generateNegativeOpeningPrompt(topic: string, positiveOpening: string): string {
  return `你是反方辩手，请为以下辩题做开场立论，并针对正方观点进行反驳：

辩题：${topic}

正方观点：
${positiveOpening}

作为反方，你需要：
1. 明确表达你的反对立场
2. 针对正方的关键论点进行有力反驳
3. 提出你自己的论据和例证
4. 指出正方论证的漏洞或不足

请控制在200-250字之间，语言锐利有力。`;
}

// 生成自由辩论提示词
function generateFreeDebatePrompt(
  topic: string,
  side: 'positive' | 'negative',
  recentHistory: string,
  round: number,
  keyPoints: { positive: string[]; negative: string[] }
): string {
  const opponent = side === 'positive' ? 'negative' : 'positive';
  const myPoints = keyPoints[side].join('、');
  const opponentPoints = keyPoints[opponent].join('、');
  
  return `辩题：${topic}

你是${side === 'positive' ? '正方' : '反方'}辩手，现在进行第${round}轮自由辩论。

最近的辩论历史：
${recentHistory}

你已经提出的要点：${myPoints || '无'}
对方已提出的要点：${opponentPoints || '无'}

请你：
1. 针对对方最新的观点进行有力反驳
2. 提出新的论据或视角，避免重复之前的观点
3. 保持逻辑严密，论证有深度
4. 语言精练，直击要害

请控制在120-150字之间。`;
}

// 生成裁判总结提示词
function generateJudgeSummaryPrompt(topic: string, messages: any[]): string {
  const debateContent = messages
    .filter(msg => ['positive', 'negative'].includes(msg.role))
    .map(msg => `${msg.role === 'positive' ? '正方' : '反方'}：${msg.content}`)
    .join('\n\n');
  
  return `你是辩论裁判，请对以下辩论进行公正客观的总结和评价：

辩题：${topic}

辩论内容：
${debateContent}

请你：
1. 分析双方的主要论点和论证质量
2. 评价双方的逻辑严密性和说服力
3. 指出双方的优势和不足
4. 给出你的裁判结果和理由
5. 提出对这个话题的客观看法

请保持中立客观，控制在250-300字之间。`;
}

// 获取最近的辩论历史
function getRecentDebateHistory(messages: any[], count: number): string {
  return messages
    .slice(-count)
    .map(msg => `${msg.role === 'positive' ? '正方' : '反方'}：${msg.content}`)
    .join('\n\n');
}

// 提取关键论点
function extractKeyPoints(content: string): string[] {
  // 简单的关键词提取逻辑，可以后续优化
  const sentences = content.split(/[,。;\n]/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 2); // 取前两个主要句子作为关键论点
}
```

### 7. 前端组件集成优化

#### 7.1 增强的辩论页面集成

**核心辩论页面更新**：
```typescript
// src/pages/EnhancedDebatePage.tsx
import { useState, useEffect, useRef } from 'react';
import { Button, MessagePlugin, Select, Card, Progress, Space } from 'tdesign-react';
import { PlayIcon, PauseIcon, StopIcon } from 'tdesign-icons-react';
import { useEnhancedDebateFlow } from '../hooks/useEnhancedDebateFlow';
import { StreamingDebateMessage } from '../components/StreamingDebateMessage';
import { Header } from '../components/Header';
import { Breadcrumb } from '../components/Breadcrumb';
import { supabase } from '../lib/supabaseClient';

const MODEL_OPTIONS = [
  { label: 'OPENAI', value: 'openai/gpt-5-chat' },
  { label: 'Claude', value: 'anthropic/claude-3-haiku' },
  { label: 'DeepSeek', value: 'deepseek/deepseek-chat-v3.1' },
  { label: '百度文心一言', value: 'baidu/ernie-4.5-vl-28b-a3b' },
  { label: '智谱清言', value: 'z-ai/glm-4.5' },
  { label: '月之暗面', value: 'moonshotai/kimi-k2' },
  { label: 'XAI-Grok', value: 'x-ai/grok-4' },
  { label: '通义千问', value: 'qwen/qwen-max' },
  { label: '谷歌gemini', value: 'google/gemini-2.5-pro' }
];

export const EnhancedDebatePage = () => {
  const { messages, debateState, isProcessing, startEnhancedDebate } = useEnhancedDebateFlow();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [positiveModel, setPositiveModel] = useState('openai/gpt-5-chat');
  const [negativeModel, setNegativeModel] = useState('anthropic/claude-3-haiku');
  const [judgeModel, setJudgeModel] = useState('openai/gpt-5-chat');
  const [debateTopic, setDebateTopic] = useState('人工智能的发展对人类社会利大于弊');
  const [isPublic, setIsPublic] = useState(false);
  
  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 检查API密钥配置
  const checkUserApiKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('请先登录');
      }
      
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'openrouter')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const { data: ttsConfigs } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_type', 'tts')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!apiKeys || apiKeys.length === 0) {
        MessagePlugin.warning('开始辩论需要先配置OpenRouter API密钥');
        setTimeout(() => window.location.href = '/settings', 2000);
        return null;
      }
      
      if (!ttsConfigs || ttsConfigs.length === 0) {
        MessagePlugin.warning('开始辩论需要先配置TTS语音合成参数');
        setTimeout(() => window.location.href = '/tts-settings', 2000);
        return null;
      }
      
      const openRouterConfig = JSON.parse(apiKeys[0].api_key);
      const ttsConfig = JSON.parse(ttsConfigs[0].api_key);
      
      return {
        apiKey: openRouterConfig.key || openRouterConfig.api_key,
        ttsConfig: {
          appid: ttsConfig.appid,
          accessToken: ttsConfig.accessToken || ttsConfig.access_token
        }
      };
    } catch (error) {
      console.error('配置检查失败:', error);
      MessagePlugin.error(error.message);
      return null;
    }
  };
  
  // 开始辩论
  const handleStartDebate = async () => {
    const config = await checkUserApiKeys();
    if (!config) return;
    
    await startEnhancedDebate(
      debateTopic,
      positiveModel,
      negativeModel,
      judgeModel,
      config.apiKey,
      config.ttsConfig
    );
  };
  
  // 获取阶段进度百分比
  const getProgressPercentage = () => {
    const phaseMap = {
      'preparing': 0,
      'host_intro': 15,
      'positive_opening': 25,
      'negative_opening': 35,
      'free_debate_round': 50 + (debateState.currentRound / debateState.maxRounds) * 35,
      'judge_summary': 90,
      'completed': 100,
      'error': 0
    };
    return phaseMap[debateState.phase] || 0;
  };
  
  // 获取阶段描述
  const getPhaseDescription = () => {
    const descriptions = {
      'preparing': '准备开始辩论',
      'host_intro': '主持人开场',
      'positive_opening': '正方开场立论',
      'negative_opening': '反方开场立论',
      'free_debate_round': `自由辩论 第${debateState.currentRound}/${debateState.maxRounds}轮`,
      'judge_summary': '裁判总结',
      'completed': '辩论完成',
      'error': '辩论异常'
    };
    return descriptions[debateState.phase] || '未知阶段';
  };
  
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ffffff' }}>
      <Header />
      <Breadcrumb />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 辩论配置区域 */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            marginBottom: '2rem'
          }}
        >
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#00ffff', marginBottom: '1.5rem' }}>辩论配置</h2>
            
            {/* 辩题输入 */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cccccc' }}>
                辩论题目
              </label>
              <input
                type="text"
                value={debateTopic}
                onChange={(e) => setDebateTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.875rem'
                }}
                placeholder="请输入辩论题目"
              />
            </div>
            
            {/* 模型选择 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00ff88' }}>
                  正方模型
                </label>
                <Select
                  value={positiveModel}
                  onChange={(val) => setPositiveModel(val as string)}
                  options={MODEL_OPTIONS}
                  popupProps={{
                    placement: 'bottom-left',
                    overlayClassName: 'model-select-popup'
                  }}
                  style={{ width: '100%' }}
                  disabled={isProcessing}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ff6b6b' }}>
                  反方模型
                </label>
                <Select
                  value={negativeModel}
                  onChange={(val) => setNegativeModel(val as string)}
                  options={MODEL_OPTIONS}
                  popupProps={{
                    placement: 'bottom-left',
                    overlayClassName: 'model-select-popup'
                  }}
                  style={{ width: '100%' }}
                  disabled={isProcessing}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ffd93d' }}>
                  裁判模型
                </label>
                <Select
                  value={judgeModel}
                  onChange={(val) => setJudgeModel(val as string)}
                  options={MODEL_OPTIONS}
                  popupProps={{
                    placement: 'bottom-left',
                    overlayClassName: 'model-select-popup'
                  }}
                  style={{ width: '100%' }}
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            {/* 操作按钮 */}
            <Space>
              <Button
                onClick={handleStartDebate}
                disabled={isProcessing || !debateTopic.trim()}
                style={{
                  background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                  border: 'none',
                  padding: '0.75rem 2rem'
                }}
              >
                {isProcessing ? '辩论进行中...' : '开始辩论'}
              </Button>
              
              {debateState.phase === 'completed' && (
                <Button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid #00ffff',
                    color: '#00ffff'
                  }}
                >
                  新建辩论
                </Button>
              )}
            </Space>
          </div>
        </Card>
        
        {/* 辩论进度 */}
        {debateState.phase !== 'preparing' && (
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(0, 255, 255, 0.1)',
              marginBottom: '2rem'
            }}
          >
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                  {getPhaseDescription()}
                </span>
                <span style={{ color: '#888888', fontSize: '0.875rem' }}>
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <Progress
                percentage={getProgressPercentage()}
                theme="success"
                style={{
                  '--td-progress-bg': 'rgba(255, 255, 255, 0.1)',
                  '--td-progress-bar-bg': 'linear-gradient(90deg, #00ffff, #ff00ff)'
                } as any}
              />
            </div>
          </Card>
        )}
        
        {/* 辩论消息区域 */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(0, 255, 255, 0.1)',
            minHeight: '400px'
          }}
        >
          <div style={{ padding: '1rem' }}>
            <h3 style={{ color: '#00ffff', marginBottom: '1rem' }}>辩论过程</h3>
            
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#888888',
                  padding: '3rem',
                  fontSize: '1rem'
                }}>
                  点击"开始辩论"开始AI智能辩论
                </div>
              ) : (
                messages.map((message, index) => (
                  <StreamingDebateMessage
                    key={index}
                    role={message.role}
                    content={message.content}
                    isStreaming={message.isStreaming}
                    audioData={message.audioData}
                    audioLoading={message.audioLoading}
                    onAudioPlay={() => console.log(`播放${message.role}的音频`)}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
```

#### 7.2 流式显示组件

```typescript
// src/components/StreamingDebateMessage.tsx
import { useState, useEffect, useRef } from 'react';
import { Button, Loading } from 'tdesign-react';
import { PlayIcon, PauseIcon, VolumeIcon } from 'tdesign-icons-react';

interface StreamingDebateMessageProps {
  role: 'host' | 'positive' | 'negative' | 'judge';
  content: string;
  isStreaming: boolean;
  audioData?: string;
  audioLoading?: boolean;
  onAudioPlay?: () => void;
}

export const StreamingDebateMessage: React.FC<StreamingDebateMessageProps> = ({
  role,
  content,
  isStreaming,
  audioData,
  audioLoading,
  onAudioPlay
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  
  // 打字机效果
  useEffect(() => {
    if (isStreaming) {
      // 实时更新显示
      setDisplayedContent(content);
    } else {
      // 流式结束后的打字机效果
      let index = displayedContent.length;
      
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
      
      typewriterRef.current = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          if (typewriterRef.current) {
            clearInterval(typewriterRef.current);
          }
        }
      }, 30);
    }
    
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, [content, isStreaming]);
  
  // 音频播放控制
  const handleAudioToggle = () => {
    if (!audioData || !audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
      onAudioPlay?.();
    }
  };
  
  // 角色颜色配置
  const getRoleConfig = (role: string) => {
    const configs = {
      host: { color: '#ffd93d', bg: 'rgba(255, 217, 61, 0.1)', label: '主持人' },
      positive: { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)', label: '正方' },
      negative: { color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)', label: '反方' },
      judge: { color: '#00ffff', bg: 'rgba(0, 255, 255, 0.1)', label: '裁判' }
    };
    return configs[role as keyof typeof configs] || configs.host;
  };
  
  const roleConfig = getRoleConfig(role);
  
  return (
    <div style={{
      background: roleConfig.bg,
      border: `1px solid ${roleConfig.color}30`,
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      position: 'relative'
    }}>
      {/* 角色标签 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem'
      }}>
        <span style={{
          color: roleConfig.color,
          fontWeight: 'bold',
          fontSize: '0.875rem'
        }}>
          {roleConfig.label}
        </span>
        
        {/* 状态指示器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isStreaming && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: roleConfig.color,
              fontSize: '0.75rem'
            }}>
              <Loading size="small" />
              正在生成...
            </div>
          )}
          
          {audioLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#888888',
              fontSize: '0.75rem'
            }}>
              <VolumeIcon size="small" />
              语音合成中...
            </div>
          )}
          
          {audioData && (
            <Button
              variant="text"
              size="small"
              onClick={handleAudioToggle}
              style={{ color: roleConfig.color }}
            >
              {isAudioPlaying ? <PauseIcon size="small" /> : <PlayIcon size="small" />}
            </Button>
          )}
        </div>
      </div>
      
      {/* 内容显示 */}
      <div style={{
        color: '#ffffff',
        lineHeight: 1.6,
        fontSize: '0.875rem'
      }}>
        {displayedContent}
        {isStreaming && (
          <span style={{
            color: roleConfig.color,
            animation: 'pulse 1s infinite'
          }}>|</span>
        )}
      </div>
      
      {/* 隐藏的音频元素 */}
      {audioData && (
        <audio
          ref={audioRef}
          onEnded={() => setIsAudioPlaying(false)}
          onPlay={() => setIsAudioPlaying(true)}
          onPause={() => setIsAudioPlaying(false)}
        >
          <source src={`data:audio/mp3;base64,${audioData}`} type="audio/mp3" />
        </audio>
      )}
    </div>
  );
};
```

## 实施计划

### 阶段一：核心AI辩论功能优化（估计时间：7-10天）

**优先级：最高**

1. **流式AI调用实现** (3天)
   - 实现 `callOpenRouterStreaming` 函数
   - 集成流式响应解析器
   - 添加错误处理和重试机制
   - 测试多种模型的流式调用

2. **请求频率控制系统** (2天)
   - 实现 `DebateRequestController` 类
   - 添加防抖、节流、重试逻辑
   - 集成到现有辩论流程中
   - 性能测试和优化

3. **增强TTS语音合成** (3天)
   - 实现 `OptimizedTTSService` 类
   - 添加缓存和预处理功能
   - 集成豆包TTS高级参数
   - 音频质量优化和测试

4. **智能辩论状态机** (2天)
   - 实现 `useEnhancedDebateFlow` hook
   - 优化辩论交替发言逻辑
   - 增强上下文理解和管理
   - 集成质量评估指标

### 阶段二：UI组件修复与优化（估计时间：3-5天）

**优先级：高**

1. **模型选择器修复** (1天)
   - 修改 `DebatePage.tsx` 中的 Select 组件属性
   - 添加相关 CSS 样式
   - 测试不同浏览器兼容性

2. **全局导航组件** (2天)
   - 创建 `Header.tsx` 组件
   - 创建 `Breadcrumb.tsx` 组件
   - 创建 `GlobalLayout.tsx` 组件
   - 更新 `App.tsx` 路由结构

3. **流式显示组件** (2天)
   - 实现 `StreamingDebateMessage.tsx` 组件
   - 添加打字机效果和音频控制
   - 优化实时更新性能

### 阶段三：用户中心开发（估计时间：5-7天）

**优先级：高**

1. **数据库表结构更新** (1天)
   - 在 Supabase 控制台执行 SQL 更新脚本
   - 验证表结构和索引创建

2. **ProfilePage 组件开发** (3天)
   - 实现用户统计显示
   - 实现辩论历史表格
   - 实现辩论管理功能（删除、公开/私有切换）

3. **数据服务层优化** (2天)
   - 实现用户统计数据查询
   - 实现辩论管理 API 调用
   - 添加数据缓存机制

### 阶段四：系统集成与优化（估计时间：3-4天）

**优先级：中**

1. **状态管理优化** (2天)
   - 实现全局应用状态管理
   - 优化页面间数据传递
   - 实现统一的错误处理

2. **用户体验细节优化** (2天)
   - 添加加载状态和骨架屏
   - 优化移动端响应式布局
   - 添加用户反馈机制

### 成功指标

**技术指标**：
- 流式AI调用响应时间 < 2秒
- TTS语音合成成功率 > 95%
- 请求频率控制有效防止API限流
- 模型选择器无重叠问题，所有设备上正常展开
- 导航组件在所有页面正常显示，Logo点击可返回首页
- 用户中心页面可正常加载和显示辩论历史
- 数据库查询性能无明显退化

**用户体验指标**：
- 文字流式显示流畅，无卡顿现象
- 语音播放与文字显示协调同步
- 用户可便捷在各功能页面间切换
- 用户可查看和管理个人辩论历史
- 页面加载速度提升，无明显卡顿
- 不同设备上的浏览体验一致

**业务指标**：
- 用户辩论完成率提升 40%
- 用户停留时间增加 25%
- 页面间跳转率提升 30%
- 用户创建辩论数量增加 20%
- 用户反馈问题减少 50%

## 总结

本设计文档专注于DINICI AI辩论平台的全局用户体验优化，通过渐进式的方式解决了当前系统在UI组件、导航体验、用户功能和数据管理方面的问题。

**核心改进**：

1. **UI组件修复**：解决模型选择器展开重叠问题，提升用户操作体验
2. **全局导航**：增加统一的导航体系，提高用户在平台内的导向性
3. **用户中心**：新增个人辩论历史管理功能，增强用户粘性
4. **数据管理**：优化数据库表结构，提升查询效率和数据完整性
5. **系统集成**：改善状态管理和页面路由，提升系统的整体稳定性和可维护性

该优化方案严格遵循用户要求，基于现有技术架构进行渐进式改进，避免了完全重构的风险，同时确保了优化效果的可衡量性和实用性。通过分阶段实施，平台将能够在短时间内显著提升用户体验和系统可用性。

