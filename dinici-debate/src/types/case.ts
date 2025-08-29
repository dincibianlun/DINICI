export interface Case {
  id: string
  title: string
  description: string
  content: string
  tags: string[]
  views: number
  likes: number
  created_at: string
  updated_at: string
  hot_score?: number
}

export type SearchOptions = {
  query: string
  tags?: string[]
  sortBy?: 'hot'|'new'
  page?: number
  pageSize?: number
}