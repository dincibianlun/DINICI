import { supabase } from '../lib/supabaseClient'

export interface PlatformStats {
  date: string
  total_users: number
  active_users: number
  total_debates: number
  total_cases: number
  total_views: number
  total_likes: number
  active_rate: number
}

export interface UserActivity {
  user_id: string
  email: string
  total_debates: number
  total_case_views: number
  total_likes: number
  total_comments: number
  total_score: number
  rank: number
}

export interface TrendingCase {
  id: string
  topic: string
  positive_model: string
  negative_model: string
  created_at: string
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  popularity_score: number
}

export interface DateRange {
  startDate: string
  endDate: string
}

/**
 * 获取平台统计数据
 */
export const getPlatformStats = async (dateRange?: DateRange): Promise<PlatformStats[]> => {
  let query = supabase
    .from('daily_platform_stats')
    .select('*')
    .order('date', { ascending: false })

  if (dateRange) {
    query = query
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取平台统计失败:', error)
    throw error
  }

  return data || []
}

/**
 * 获取用户活跃度排名
 */
export const getUserActivityRanking = async (limit = 20): Promise<UserActivity[]> => {
  const { data, error } = await supabase
    .from('user_activity_ranking')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('获取用户活跃度排名失败:', error)
    throw error
  }

  return data || []
}

/**
 * 获取热门案例
 */
export const getTrendingCases = async (limit = 10): Promise<TrendingCase[]> => {
  const { data, error } = await supabase
    .from('trending_cases')
    .select('*')
    .limit(limit)

  if (error) {
    console.error('获取热门案例失败:', error)
    throw error
  }

  return data || []
}

/**
 * 记录用户活动
 */
export const recordUserActivity = async (
  userId: string,
  activityType: 'debate' | 'view' | 'like' | 'comment',
  count = 1
): Promise<void> => {
  try {
    // 检查是否已存在相同用户和活动类型的记录
    const { data: existing, error: queryError } = await supabase
      .from('user_activity_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', activityType)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 是"结果不是单个行"的错误
      console.error('查询用户活动记录失败:', queryError);
      return;
    }
    
    if (existing) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('user_activity_stats')
        .update({
          count: existing.count + count,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('更新用户活动统计失败:', updateError);
      }
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('user_activity_stats')
        .insert({
          user_id: userId,
          activity_type: activityType,
          count: count,
          last_activity_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('创建用户活动统计失败:', insertError);
      }
    }
  } catch (err) {
    console.error('记录用户活动时发生错误:', err);
  }
}

/**
 * 记录案例统计
 */
export const recordCaseStats = async (
  caseId: string,
  statType: 'view' | 'like' | 'comment' | 'share',
  count = 1
): Promise<void> => {
  try {
    // 我们暂时不实现case_stats表的操作，因为该表可能不存在或结构不同
    // 只对辩论记录表进行更新
    
    if (statType === 'like') {
      // 获取当前辩论记录
      const { data: debateData, error: debateError } = await supabase
        .from('debates')
        .select('likes')
        .eq('id', caseId)
        .single();
      
      if (debateError) {
        console.error('获取辩论记录失败:', debateError);
        return;
      }
      
      // 更新likes字段
      const currentLikes = debateData.likes || 0;
      
      const { error: updateError } = await supabase
        .from('debates')
        .update({ likes: currentLikes + count })
        .eq('id', caseId);
      
      if (updateError) {
        console.error('更新案例点赞数失败:', updateError);
      }
    }
    
    // 对于其他类型的统计，比如view、comment、share，暂不处理
  } catch (err) {
    console.error('记录案例统计时发生错误:', err);
  }
}

/**
 * 计算用户得分（根据活动类型加权）
 * 注意：由于表结构变化，此函数可能不再使用，但保留以维持API兼容性
 */
const calculateScore = (
  stats: any,
  activityType: string,
  count: number
): number => {
  const weights = {
    debate: 10,    // 发起辩论
    view: 1,       // 浏览案例
    like: 3,       // 点赞
    comment: 5     // 评论
  }

  const currentScore = stats.total_score || 0
  return currentScore + (weights[activityType as keyof typeof weights] || 0) * count
}

/**
 * 获取日期范围内的统计数据
 */
export const getStatsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<{
  platformStats: PlatformStats[]
  userRanking: UserActivity[]
  trendingCases: TrendingCase[]
}> => {
  const [platformStats, userRanking, trendingCases] = await Promise.all([
    getPlatformStats({ startDate, endDate }),
    getUserActivityRanking(50),
    getTrendingCases(20)
  ])

  return {
    platformStats,
    userRanking,
    trendingCases
  }
}