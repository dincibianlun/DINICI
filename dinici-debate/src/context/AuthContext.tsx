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
      
      // 登录成功后立即检查管理员状态
      if (data.user?.email) {
        setTimeout(() => checkAdminStatus(), 100);
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
      console.log('❌ No user or email, setting as regular user');
      setIsAdmin(false);
      setUserPermissions([]);
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
        console.error('❌ Database query error:', error);
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
      } else {
        console.log('👤 Setting user as regular user, role is:', userData?.role);
        setIsAdmin(false);
        setUserPermissions(['user']);
        localStorage.removeItem('dinici_admin_status');
        localStorage.removeItem('dinici_admin_email');
      }
    } catch (error) {
      console.error('💥 Error in checkAdminStatus:', error);
      setIsAdmin(false);
      setUserPermissions(['user']);
    }
  };

  // 初始化时从本地存储加载管理员状态
  useEffect(() => {
    const savedAdminStatus = localStorage.getItem('dinici_admin_status');
    const savedAdminEmail = localStorage.getItem('dinici_admin_email');
    
    console.log('💾 Checking localStorage for admin status:', { 
      savedAdminStatus, 
      savedAdminEmail,
      currentUserEmail: user?.email
    });
    
    if (savedAdminStatus === 'true' && user?.email && savedAdminEmail === user.email) {
      console.log('💾 Loading admin status from localStorage:', { email: user.email });
      setIsAdmin(true);
      setUserPermissions(['admin', 'user_management', 'content_management']);
    }
  }, [user?.email]);

  // 强制清除缓存并刷新整个页面
  const forceRefresh = () => {
    console.log('🔥 Forcing a hard refresh of the page');
    window.location.reload();
  };

  // 强制刷新管理员状态
  const refreshAdminStatus = async () => {
    console.log('🔄 Manual refresh admin status triggered');
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
      checkAdminStatus();
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
