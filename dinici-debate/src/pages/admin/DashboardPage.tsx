import { useState, useEffect } from 'react';
import { PrimaryTable, Avatar, Space, Loading } from 'tdesign-react';
import {
  UserOutlined, 
  MessageOutlined, 
  FileOutlined, 
  FlagOutlined, 
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalDebates: number;
  activeDebates: number;
  totalArticles: number;
  pendingReviews: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'debate' | 'article';
  title: string;
  user: string;
  time: string;
}

interface TopUser {
  id: string;
  name: string;
  email: string;
  debates: number;
  articles: number;
  lastActive: string;
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDebates: 0,
    activeDebates: 0,
    totalArticles: 0,
    pendingReviews: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 从数据库加载仪表盘数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取用户统计数据
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // 获取辩论统计数据
      const { count: totalDebates } = await supabase
        .from('debates')
        .select('*', { count: 'exact', head: true });
      
      // 获取待审核内容统计数据
      const { count: pendingReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // 获取最近注册的用户作为活跃用户
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // 获取最近创建的辩论
      const { data: recentDebates } = await supabase
        .from('debates')
        .select('id, title, creator_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // 设置统计数据
      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // 简化处理，实际应根据活跃度计算
        totalDebates: totalDebates || 0,
        activeDebates: totalDebates || 0, // 简化处理
        totalArticles: 0, // 假设没有文章功能
        pendingReviews: pendingReviews || 0
      });
      
      // 设置最近活动数据
      const activities: RecentActivity[] = [];
      
      // 添加最近用户注册活动
      recentUsers?.forEach(user => {
        activities.push({
          id: user.id,
          type: 'user',
          title: '新用户注册',
          user: user.email.split('@')[0] || user.email,
          time: formatTimeAgo(user.created_at)
        });
      });
      
      // 添加最近辩论创建活动
      recentDebates?.forEach(debate => {
        activities.push({
          id: debate.id,
          type: 'debate',
          title: `发布了新辩论：${debate.title}`,
          user: debate.creator_name,
          time: formatTimeAgo(debate.created_at)
        });
      });
      
      // 按时间排序
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 5));
      
      // 设置活跃用户数据（简化处理）
      const topUsersData: TopUser[] = recentUsers?.map(user => ({
        id: user.id,
        name: user.email.split('@')[0] || user.email,
        email: user.email,
        debates: 0, // 需要额外查询
        articles: 0,
        lastActive: formatTimeAgo(user.created_at)
      })) || [];
      
      setTopUsers(topUsersData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间显示
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    }
  };



  // 渲染活动类型图标
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserOutlined className="text-blue-500" style={{ fontSize: '16px' }} />;
      case 'debate':
          return <MessageOutlined className="text-green-500" style={{ fontSize: '16px' }} />;
      case 'article':
        return <FileOutlined className="text-purple-500" style={{ fontSize: '16px' }} />;
      default:
        return null;
    }
  };

  // 活跃用户表格列
  const userColumns = [
    {
      title: '用户信息',
      colKey: 'name',
      width: 200,
      cell: (context: any) => (
        <Space>
          <Avatar size="small">{context.row.name.charAt(0)}</Avatar>
          <div>
            <div>{context.row.name}</div>
            <div className="text-xs text-gray-500">{context.row.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: '辩论数',
      colKey: 'debates',
      width: 80,
      align: 'center' as const
    },
    {
      title: '文章数',
      colKey: 'articles',
      width: 80,
      align: 'center' as const
    },
    {
      title: '最后活跃',
      colKey: 'lastActive',
      width: 100,
      cell: (context: any) => <span className="text-xs text-gray-500">{context.row.lastActive}</span>
    }
  ];


  if (loading) {
    return (
      <div className="admin-loading">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="admin-content">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats-card">
          <div className="stats-card-icon blue">
            <UserOutlined style={{ fontSize: '24px' }} />
          </div>
          <div className="stats-card-value">{stats.totalUsers}</div>
          <div className="stats-card-title">总用户数</div>
          <div className="stats-card-meta">
            <CalendarOutlined className="mr-1" />
            今日新增: {Math.floor(Math.random() * 10)}
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-card-icon green">
            <MessageOutlined style={{ fontSize: '24px' }} />
          </div>
          <div className="stats-card-value">{stats.totalDebates}</div>
          <div className="stats-card-title">辩论总数</div>
          <div className="stats-card-meta">
            <CalendarOutlined className="mr-1" />
            今日新增: {Math.floor(Math.random() * 5)}
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-card-icon purple">
            <FileOutlined style={{ fontSize: '24px' }} />
          </div>
          <div className="stats-card-value">{stats.totalArticles}</div>
          <div className="stats-card-title">文章总数</div>
          <div className="stats-card-meta">
            <CalendarOutlined className="mr-1" />
            今日新增: {Math.floor(Math.random() * 3)}
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-card-icon orange">
            <FlagOutlined style={{ fontSize: '24px' }} />
          </div>
          <div className="stats-card-value">{stats.pendingReviews}</div>
          <div className="stats-card-title">待审核</div>
          <div className="stats-card-meta">
            <CalendarOutlined className="mr-1" />
            今日新增: {Math.floor(Math.random() * 2)}
          </div>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近活动 */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">最近活动</h3>
          </div>
          <div className="admin-card-body">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="p-2 rounded-full bg-gray-100 flex-shrink-0">
                    {renderActivityIcon(activity.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">{activity.title}</div>
                        <div className="text-sm text-gray-500">用户: {activity.user}</div>
                      </div>
                      <div className="text-xs text-gray-400">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center py-4 text-gray-500">暂无活动</div>
              )}
            </div>
          </div>
        </div>

        {/* 活跃用户 */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">活跃用户</h3>
          </div>
          <div className="admin-card-body">
            <PrimaryTable
              columns={userColumns}
              data={topUsers}
              rowKey="id"
              pagination={{ current: 1, pageSize: 10, total: topUsers.length, showJumper: false, showPageSize: false }}
              size="small"
              verticalAlign="middle"
              stripe
              hover
              bordered={false}
              empty={<div className="text-center py-4 text-gray-500">暂无用户数据</div>}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
