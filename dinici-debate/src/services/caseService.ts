import { supabase } from '../lib/supabaseClient'
import type { Case } from '../types/case'
import { recordCaseStats, recordUserActivity } from './analyticsService'

export interface SearchOptions {
  query: string
  tags?: string[]
  sortBy?: 'hot'|'new'
  page?: number
  pageSize?: number
}

export const searchCases = async (options: SearchOptions): Promise<Case[]> => {
  const { 
    query, 
    tags = [], 
    sortBy = 'new',
    page = 1,
    pageSize = 10
  } = options

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let queryBuilder = supabase
    .from('cases')
    .select('*', { count: 'exact' })
    .textSearch('fts', query, {
      type: 'plain',
      config: 'english'
    })
    .range(from, to)

  if (tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags)
  }

  if (sortBy === 'hot') {
    queryBuilder = queryBuilder.order('hot_score', { ascending: false })
  } else {
    queryBuilder = queryBuilder.order('created_at', { ascending: false })
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Search cases error:', error)
    throw error
  }

  return data || []
}

export const viewCase = async (caseId: string, userId?: string): Promise<void> => {
  // 记录案例浏览统计
  await recordCaseStats(caseId, 'view')
  
  // 记录用户活动（如果有用户ID）
  if (userId) {
    await recordUserActivity(userId, 'view')
  }
}

export const likeCase = async (caseId: string, userId: string): Promise<void> => {
  // 记录案例点赞统计
  await recordCaseStats(caseId, 'like')
  
  // 记录用户活动
  await recordUserActivity(userId, 'like')
}

export const commentCase = async (caseId: string, userId: string): Promise<void> => {
  // 记录案例评论统计
  await recordCaseStats(caseId, 'comment')
  
  // 记录用户活动
  await recordUserActivity(userId, 'comment')
}

export const shareCase = async (caseId: string): Promise<void> => {
  // 记录案例分享统计
  await recordCaseStats(caseId, 'share')
}

export const approveCase = async (caseId: string) => {
  const { error } = await supabase
    .from('case_reviews')
    .insert({
      case_id: caseId,
      status: 'approved',
      reviewed_at: new Date().toISOString()
    })

  if (error) {
    console.error('Approve case error:', error)
    throw error
  }

  return true
}

export const rejectCase = async (caseId: string, reason: string) => {
  const { error } = await supabase
    .from('case_reviews')
    .insert({
      case_id: caseId,
      status: 'rejected',
      reason,
      reviewed_at: new Date().toISOString()
    })

  if (error) {
    console.error('Reject case error:', error)
    throw error
  }

  return true
}

export const getCaseTags = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('case_tags')
    .select('tag')
    .order('count', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Get tags error:', error)
    return []
  }

  return data.map(item => item.tag)
}

export const recordDebateActivity = async (userId: string): Promise<void> => {
  // 记录用户发起辩论活动
  await recordUserActivity(userId, 'debate')
}
