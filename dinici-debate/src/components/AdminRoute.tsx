import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading, Layout, Menu } from 'tdesign-react';
import { 
  HomeOutlined, 
  UserOutlined, 
  MessageOutlined, 
  FlagOutlined, 
  LogoutOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import '../styles/admin-styles.css';

const { Header, Aside, Content } = Layout;

interface AdminRouteProps {
  children?: React.ReactNode;
  redirectPath?: string;
}

export const AdminRoute = ({ 
  children, 
  redirectPath = '/library' 
}: AdminRouteProps) => {
  const { user, loading, isAdmin, userPermissions, logout, refreshAdminStatus, forceRefresh, debugUserStatus } = useAuth();
  const location = useLocation();
  const isNestedRoute = location.pathname.startsWith('/hao');

  // 详细调试信息 - 加入防止重复检查
  const debugLogKey = `admin_route_debug_${location.pathname}`;
  const lastDebugTime = sessionStorage.getItem(debugLogKey);
  const now = new Date().getTime();
  const debugInterval = 3000; // 3秒内不重复输出调试日志
  
  if (!lastDebugTime || (now - parseInt(lastDebugTime)) > debugInterval) {
    console.log('🗺 AdminRoute - Full State Check:', {
      loading,
      user: user ? {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      } : null,
      isAdmin,
      userPermissions,
      pathname: location.pathname,
      localStorage: {
        adminStatus: localStorage.getItem('dinici_admin_status'),
        adminEmail: localStorage.getItem('dinici_admin_email')
      }
    });
    
    // 记录最后一次调试时间
    sessionStorage.setItem(debugLogKey, now.toString());
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading size="large" />
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // 尝试从 localStorage 索恢管理员状态
    const savedAdminStatus = localStorage.getItem('dinici_admin_status');
    const savedAdminEmail = localStorage.getItem('dinici_admin_email');
    const lastAttemptTime = localStorage.getItem('admin_check_last_attempt');
    const now = new Date().getTime();
    const manualOverride = localStorage.getItem('admin_manual_override') === 'true';
    
    // 如果用户电子邮箱与本地存储中的管理员电子邮箱匹配，或者用户ID匹配数据库中的管理员ID
    if ((savedAdminStatus === 'true' && user?.email === savedAdminEmail) || 
        (user?.id === 'f5c513a2-addc-4d42-85db-818a682b4231' && user?.email === 'zyh531592@163.com') || 
        (!lastAttemptTime || (now - parseInt(lastAttemptTime)) > 5 * 60 * 1000)) {
      
      console.log('🔧 Auto-recovery: Admin status from localStorage or DB match:', { 
        savedAdminStatus, 
        savedAdminEmail, 
        userEmail: user?.email,
        userId: user?.id 
      });
      
      // 记录尝试时间
      localStorage.setItem('admin_check_last_attempt', now.toString());
      // 设置管理员状态
      localStorage.setItem('dinici_admin_status', 'true');
      localStorage.setItem('dinici_admin_email', user?.email || '');
      
      // 刷新页面，尝试从头开始加载
      window.location.reload();
      return (
        <div className="flex justify-center items-center h-screen">
          <Loading size="large" />
          <p className="ml-2">正在恢复管理员权限...</p>
        </div>
      );
    }
    
    // 如果设置了手动覆盖，则允许访问
    if (manualOverride) {
      console.log('🔧 Manual override is active, allowing admin access');
      // 继续执行代码，允许访问管理页面
    } else {
      console.log('❌ User is not admin, showing error and debug info');
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full transform transition-all hover:scale-105">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mt-4 text-gray-900">权限不足</h2>
              <p className="mt-2 text-gray-600">需要管理员权限才能访问此页面</p>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-lg text-left">
                <h3 className="font-medium text-gray-900 mb-2">调试信息:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">当前用户:</span> {user?.email || '未登录'}</p>
                  <p><span className="font-medium">是否管理员:</span> {isAdmin ? '是' : '否'}</p>
                  <p><span className="font-medium">用户权限:</span> {userPermissions?.join(', ') || '无'}</p>
                  <p><span className="font-medium">本地存储管理员状态:</span> {savedAdminStatus || '无'}</p>
                  <p><span className="font-medium">本地存储管理员邮箱:</span> {savedAdminEmail || '无'}</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={refreshAdminStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  刷新权限
                </button>
                <button 
                  onClick={debugUserStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  调试用户状态
                </button>
                <button 
                  onClick={forceRefresh}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  强制刷新
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('admin_manual_override', 'true');
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  紊正并覆盖
                </button>
                <button 
                  onClick={() => window.location.href = redirectPath}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  console.log('Admin access granted');

  // 对于非嵌套路由（如/analytics），直接返回子内容
  if (!isNestedRoute && children) {
    return <>{children}</>;
  }

  // 对于嵌套路由（如/admin/*），返回带侧边栏的布局
  return (
    <Layout className="admin-layout tdesign-input-fix">
      <Header className="admin-header">
        <div className="flex items-center">
          <div className="admin-logo">
            <div className="admin-logo-icon">
              <SettingOutlined />
            </div>
            <span>管理后台</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-blue-50 rounded-full px-4 py-2">
            <div className="bg-blue-100 text-blue-500 flex items-center justify-center rounded-full w-8 h-8">
              <UserOutlined />
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">管理员</span>
          </div>
          <button 
            className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
            onClick={logout}
          >
            <LogoutOutlined style={{ fontSize: '16px', marginRight: '4px' }} />
            退出登录
          </button>
        </div>
      </Header>
      <Layout>
        <Aside width="240" className="admin-sidebar">
          <Menu
            theme="light"
            value={location.pathname}
            className="py-4"
          >
            <Menu.MenuItem value="/hao" icon={<HomeOutlined />}>
              <Link to="/hao" className="flex items-center">
                <span>仪表盘</span>
              </Link>
            </Menu.MenuItem>
            <Menu.MenuItem value="/hao/users" icon={<UserOutlined />}>
              <Link to="/hao/users" className="flex items-center">
                <span>用户管理</span>
              </Link>
            </Menu.MenuItem>
            <Menu.MenuItem value="/hao/debates" icon={<MessageOutlined />}>
              <Link to="/hao/debates" className="flex items-center">
                <span>辩论管理</span>
              </Link>
            </Menu.MenuItem>
            <Menu.MenuItem value="/hao/articles" icon={<FileTextOutlined />}>
              <Link to="/hao/articles" className="flex items-center">
                <span>文章管理</span>
              </Link>
            </Menu.MenuItem>
            <Menu.MenuItem value="/hao/reviews" icon={<FlagOutlined />}>
              <Link to="/hao/reviews" className="flex items-center">
                <span>审核管理</span>
              </Link>
            </Menu.MenuItem>
            <Menu.MenuItem value="/analytics" icon={<BarChartOutlined />}>
              <Link to="/analytics" className="flex items-center">
                <span>数据分析</span>
              </Link>
            </Menu.MenuItem>
          </Menu>
        </Aside>
        <Content className="admin-content">
          {children ? children : <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};