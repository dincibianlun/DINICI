import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userPermissions: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  forceRefresh: () => void;
  debugUserStatus: () => Promise<void>; // 添加调试函数到接口定义
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📚 Initial session check:', { 
        session, 
        user: session?.user 
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('📚 Auth state changed:', { 
        event: _event, 
        session, 
        user: session?.user 
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔑 Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log('🔑 Sign in successful:', { 
        user: data.user,
        session: data.session
      });
      
      // 立即更新状态而不等待监听器
      setSession(data.session);
      setUser(data.user);
      
      // 登录成功后多次检查管理员状态，确保权限正确加载
      if (data.user?.email) {
        // 立即检查一次
        await checkAdminStatus();
        
        // 设置登录时间，防止重复检查
        sessionStorage.setItem('admin_last_check_time', new Date().getTime().toString());
      }
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('💪 Signing out user');
      
      // 清除管理员状态
      localStorage.removeItem('dinici_admin_status');
      localStorage.removeItem('dinici_admin_email');
      setIsAdmin(false);
      setUserPermissions([]);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // 退出登录后跳转到首页
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 检查用户是否为管理员
  const checkAdminStatus = async () => {
    if (!user?.id || !user?.email) {
      console.log('❔ No user or email, setting as regular user');
      setIsAdmin(false);
      setUserPermissions([]);
      return;
    }

    // 特定用户自动以管理员身份访问
    if (user.id === 'f5c513a2-addc-4d42-85db-818a682b4231' && user.email === 'zyh531592@163.com') {
      // 检查是否已经设置为管理员
      if (isAdmin) {
        console.log('✅ 预定义管理员已处于管理员状态，无需重复设置');
        return; // 已是管理员，无需重复设置
      }
      
      console.log('🌟 Setting predefined admin user:', user.email);
      setIsAdmin(true);
      setUserPermissions(['admin', 'user_management', 'content_management']);
      localStorage.setItem('dinici_admin_status', 'true');
      localStorage.setItem('dinici_admin_email', user.email);
      return;
    }

    try {
      console.log('🔍 Checking admin status for user:', { id: user.id, email: user.email });
      
      // 通过邮箱查询用户角色
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', user.email)
        .single();
      
      console.log('📊 Database query result:', { userData, error });
      
      if (error) {
        console.error('❔ Database query error:', error);
        // 尝试从本地存储获取备份信息
        const savedAdminStatus = localStorage.getItem('dinici_admin_status');
        const savedAdminEmail = localStorage.getItem('dinici_admin_email');
        
        if (savedAdminStatus === 'true' && savedAdminEmail === user.email) {
          console.log('💾 Restoring admin status from localStorage despite DB error');
          setIsAdmin(true);
          setUserPermissions(['admin', 'user_management', 'content_management']);
          return;
        }
        
        setIsAdmin(false);
        setUserPermissions(['user']);
        return;
      }
      
      // 用户存在，检查角色
      console.log('✅ User found with role:', userData?.role);
      console.log('🔐 Current email check:', { userEmail: user.email, dbEmail: userData?.email, role: userData?.role });
      
      // 检查用户是否为管理员
      const isAdminUser = userData?.role === 'admin';
      console.log('🔐 Is admin check result:', { 
        dbRole: userData?.role, 
        email: user.email, 
        isAdminUser 
      });
      
      if (isAdminUser) {
        console.log('🎉 SETTING USER AS ADMIN - Success!');
        setIsAdmin(true);
        setUserPermissions(['admin', 'user_management', 'content_management']);
        // 将管理员状态存入localStorage作为备份
        localStorage.setItem('dinici_admin_status', 'true');
        localStorage.setItem('dinici_admin_email', user.email);
        // 确保localStorage更新生效
        window.dispatchEvent(new Event('storage'));
      } else {
        console.log('👤 Setting user as regular user, role is:', userData?.role);
        setIsAdmin(false);
        setUserPermissions(['user']);
        localStorage.removeItem('dinici_admin_status');
        localStorage.removeItem('dinici_admin_email');
      }
    } catch (error) {
      console.error('💥 Error in checkAdminStatus:', error);
      // 尝试从本地存储获取备份信息
      const savedAdminStatus = localStorage.getItem('dinici_admin_status');
      const savedAdminEmail = localStorage.getItem('dinici_admin_email');
      
      if (savedAdminStatus === 'true' && savedAdminEmail === user.email) {
        console.log('💾 Restoring admin status from localStorage despite error');
        setIsAdmin(true);
        setUserPermissions(['admin', 'user_management', 'content_management']);
        return;
      }
      
      setIsAdmin(false);
      setUserPermissions(['user']);
    }
  };

  // 初始化时从本地存储加载管理员状态
  useEffect(() => {
    if (!user?.email) {
      return; // 如果没有用户电子邮件，直接返回
    }
    
    const savedAdminStatus = localStorage.getItem('dinici_admin_status');
    const savedAdminEmail = localStorage.getItem('dinici_admin_email');
    
    console.log('💾 Checking localStorage for admin status:', { 
      savedAdminStatus, 
      savedAdminEmail,
      currentUserEmail: user.email
    });
    
    if (savedAdminStatus === 'true' && savedAdminEmail === user.email) {
      console.log('💾 Loading admin status from localStorage:', { email: user.email });
      setIsAdmin(true);
      setUserPermissions(['admin', 'user_management', 'content_management']);
      
      // 从本地存储加载后，同步验证数据库中的角色
      setTimeout(() => {
        console.log('🔄 Validating admin status from database after localStorage load');
        checkAdminStatus();
      }, 500);
    } else {
      // 如果本地存储没有管理员状态，查询数据库
      console.log('🔄 No admin status in localStorage, checking database');
      checkAdminStatus();
    }
  }, [user?.email]);

  // 强制清除缓存并刷新整个页面
  const forceRefresh = () => {
    console.log('🔥 Forcing a hard refresh of the page');
    window.location.reload();
  };

  // 强制刷新管理员状态
  const refreshAdminStatus = async () => {
    // 防止短时间内多次调用
    const lastManualCheckTime = parseInt(sessionStorage.getItem('admin_manual_check_time') || '0');
    const now = new Date().getTime();
    const manualCheckInterval = 3000; // 3秒内不重复检查
    
    if (now - lastManualCheckTime < manualCheckInterval) {
      console.log('⏰ 已跳过重复的手动刷新请求，3秒内只刷新一次');
      return;
    }
    
    console.log('🔄 Manual refresh admin status triggered');
    sessionStorage.setItem('admin_manual_check_time', now.toString());
    await checkAdminStatus();
  };

  // 调试函数：检查用户在数据库中的状态
  const debugUserStatus = async () => {
    if (!user?.email) {
      console.log('❌ No user email to debug');
      return;
    }
    
    console.log('🔍 Debugging user status for:', user.email);
    
    try {
      // 查询用户
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', user.email)
        .single();
      
      console.log('📊 Debug database query result:', { userData, error });
      
      // 检查localStorage
      const savedAdminStatus = localStorage.getItem('dinici_admin_status');
      const savedAdminEmail = localStorage.getItem('dinici_admin_email');
      
      console.log('💾 Debug localStorage:', { 
        savedAdminStatus, 
        savedAdminEmail,
        isAdminState: isAdmin,
        userPermissionsState: userPermissions
      });
    } catch (error) {
      console.error('💥 Debug error:', error);
    }
  };

  // 当用户状态变化时检查管理员权限
  useEffect(() => {
    if (user?.id && user?.email) {
      console.log('🔄 User changed, triggering admin check for:', user.email);
      
      // 防止过多的检查请求
      const lastCheckTime = parseInt(sessionStorage.getItem('admin_last_check_time') || '0');
      const now = new Date().getTime();
      const checkInterval = 60 * 1000; // 1分钟内不重复检查
      
      if (now - lastCheckTime > checkInterval) {
        console.log('⏰ Checking admin status, last check was more than 1 minute ago');
        // 立即检查一次
        checkAdminStatus();
        sessionStorage.setItem('admin_last_check_time', now.toString());
        
        // 设置一个间隔检查器，每10分钟自动检查一次管理员状态
        const intervalId = setInterval(() => {
          console.log('🕔 Periodic admin status check');
          checkAdminStatus();
        }, 10 * 60 * 1000); // 10分钟
        
        return () => clearInterval(intervalId); // 清除间隔器
      } else {
        console.log('⏰ Skipping admin check, last check was less than 1 minute ago');
      }
    } else {
      console.log('🔄 No user or incomplete user data, resetting admin status');
      setIsAdmin(false);
      setUserPermissions([]);
    }
  }, [user?.id, user?.email]);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      isAdmin,
      userPermissions,
      signIn, 
      signOut: logout,
      logout, 
      signUp,
      refreshAdminStatus,
      forceRefresh,
      debugUserStatus // 添加调试函数到context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
