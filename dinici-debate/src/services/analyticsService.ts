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
  const today = new Date().toISOString().split('T')[0]
  
  // 获取当前统计
  const { data: existing } = await supabase
    .from('user_activity_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const updateData = {
    user_id: userId,
    date: today,
    debate_count: activityType === 'debate' ? count : 0,
    case_view_count: activityType === 'view' ? count : 0,
    like_count: activityType === 'like' ? count : 0,
    comment_count: activityType === 'comment' ? count : 0
  }

  if (existing) {
    // 更新现有记录
    const { error } = await supabase
      .from('user_activity_stats')
      .update({
        [activityType === 'debate' ? 'debate_count' : 
         activityType === 'view' ? 'case_view_count' :
         activityType === 'like' ? 'like_count' : 'comment_count']: 
        (existing[activityType === 'debate' ? 'debate_count' : 
                  activityType === 'view' ? 'case_view_count' :
                  activityType === 'like' ? 'like_count' : 'comment_count'] || 0) + count,
        total_score: calculateScore(existing, activityType, count)
      })
      .eq('id', existing.id)

    if (error) {
      console.error('更新用户活动统计失败:', error)
    }
  } else {
    // 创建新记录
    const { error } = await supabase
      .from('user_activity_stats')
      .insert({
        ...updateData,
        total_score: calculateScore(updateData, activityType, count)
      })

    if (error) {
      console.error('创建用户活动统计失败:', error)
    }
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
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('case_stats')
    .select('*')
    .eq('case_id', caseId)
    .eq('date', today)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('case_stats')
      .update({
        [statType === 'view' ? 'view_count' :
         statType === 'like' ? 'like_count' :
         statType === 'comment' ? 'comment_count' : 'share_count']:
        (existing[statType === 'view' ? 'view_count' :
                 statType === 'like' ? 'like_count' :
                 statType === 'comment' ? 'comment_count' : 'share_count'] || 0) + count
      })
      .eq('id', existing.id)

    if (error) {
      console.error('更新案例统计失败:', error)
    }
  } else {
    const { error } = await supabase
      .from('case_stats')
      .insert({
        case_id: caseId,
        date: today,
        view_count: statType === 'view' ? count : 0,
        like_count: statType === 'like' ? count : 0,
        comment_count: statType === 'comment' ? count : 0,
        share_count: statType === 'share' ? count : 0
      })

    if (error) {
      console.error('创建案例统计失败:', error)
    }
  }
}

/**
 * 计算用户得分（根据活动类型加权）
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