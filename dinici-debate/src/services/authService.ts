import { supabase } from '../lib/supabaseClient';

// 认证响应类型定义
export interface AuthResponse {
  data?: {
    user: {
      id: string;
      email: string | null;
      // 其他用户信息字段
    };
    session?: {
      access_token: string;
      refresh_token: string;
      // 其他会话信息字段
    };
  };
  error?: Error;
}

/**
 * 用户注册功能
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @returns 认证响应对象
 */
export const signUp = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // 参数验证
    if (!email || !password) {
      throw new Error('邮箱和密码都是必需的');
    }
    
    // 调用Supabase的注册API
    const result = await supabase.auth.signUp({
      email,
      password
    });
    
    return result;
  } catch (error) {
    console.error('注册失败:', error);
    return {
      error: error instanceof Error ? error : new Error('注册失败，请重试')
    };
  }
};

/**
 * 用户登录功能
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @returns 认证响应对象
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    // 参数验证
    if (!email || !password) {
      throw new Error('邮箱和密码都是必需的');
    }
    
    // 调用Supabase的登录API
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return result;
  } catch (error) {
    console.error('登录失败:', error);
    return {
      error: error instanceof Error ? error : new Error('登录失败，请重试')
    };
  }
};

/**
 * 用户登出功能
 * @returns 登出操作是否成功
 */
export const signOut = async (): Promise<{ error?: Error }> => {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error('登出失败:', error);
    return {
      error: error instanceof Error ? error : new Error('登出失败，请重试')
    };
  }
};

/**
 * 获取当前登录用户信息
 * @returns 当前用户信息或null
 */
export const getCurrentUser = async (): Promise<{
  data: {
    user: any | null;
  };
  error?: Error;
}> => {
  try {
    return await supabase.auth.getUser();
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      data: { user: null },
      error: error instanceof Error ? error : new Error('获取用户信息失败')
    };
  }
};

/**
 * 重置密码功能
 * @param email - 用户邮箱
 * @returns 重置密码操作是否成功
 */
export const resetPassword = async (
  email: string
): Promise<{ data: { user: null }, error?: Error }> => {
  try {
    // 参数验证
    if (!email) {
      throw new Error('邮箱是必需的');
    }
    
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    return {
      data: { user: null },
      error: error instanceof Error ? error : new Error('重置密码失败，请重试')
    };
  }
};

/**
 * 刷新用户会话
 * @returns 刷新操作的结果
 */
export const refreshSession = async (): Promise<AuthResponse> => {
  try {
    return await supabase.auth.refreshSession();
  } catch (error) {
    console.error('刷新会话失败:', error);
    return {
      error: error instanceof Error ? error : new Error('刷新会话失败')
    };
  }
};