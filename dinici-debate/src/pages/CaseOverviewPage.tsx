import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Card, 
  Tree,
  Button,
  Loading,
  MessagePlugin,
  Tag
} from 'tdesign-react'
import { 
  TimeIcon,
  ThumbUpIcon
} from 'tdesign-icons-react'
import { supabase } from '../lib/supabaseClient'

type DebateCase = {
  id: string
  topic: string
  positive_model: string
  negative_model: string
  created_at: string
  views: number
  likes: number
  tags?: string[]
}

type TagNode = {
  label: string
  value: string
  children?: TagNode[]
}

export const CaseOverviewPage = () => {
  const [popularCases, setPopularCases] = useState<DebateCase[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [loading, setLoading] = useState(true)

  // 获取热门案例
  useEffect(() => {
    const fetchPopularCases = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('debates')
          .select('*')
          .eq('is_public', true)
          .order('views', { ascending: false })
          .limit(8)
        
        if (!error && data) {
          setPopularCases(data)
        }
      } catch (err) {
        console.error('加载热门案例失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularCases()
  }, [])

  // 获取标签树
  useEffect(() => {
    const fetchTagTree = async () => {
      const { data } = await supabase
        .from('tags')
        .select('id,name,category,parent_id')
        .order('name', { ascending: true })
      
      if (data) {
        const tree = data
          .filter(tag => !tag.parent_id)
          .map(tag => ({
            label: tag.name,
            value: tag.id,
            children: data
              .filter(t => t.parent_id === tag.id)
              .map(t => ({ label: t.name, value: t.id }))
          }))
        
        setTagTree(tree)
      }
    }

    fetchTagTree()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">案例库总览</h1>
        <p className="text-sm text-purple-400">探索热门辩论案例和分类</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 分类导航 */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-purple-500/30 p-4">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">分类导航</h2>
          <Tree
            data={tagTree}
            className="bg-transparent"
          />
        </div>

        {/* 热门案例 */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-cyan-400 flex items-center gap-2">
              <span className="text-orange-400">🔥</span> 热门案例
            </h2>
            <Link to="/cases">
              <Button variant="text" className="text-purple-400 hover:text-cyan-400">
                查看全部案例 →
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loading size="large" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularCases.map(item => (
                <Link to={`/case/${item.id}`} key={item.id} className="no-underline">
                  <Card
                    bordered
                    className="h-full bg-gray-800 border-purple-500/30 hover:border-cyan-400 transition-all"
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="text-lg font-bold text-cyan-400 mb-2 line-clamp-2">
                        {item.topic}
                      </h3>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <Tag theme="primary" className="bg-purple-900 border-purple-500">
                          正方: {item.positive_model.split('/')[1]}
                        </Tag>
                        <Tag theme="danger" className="bg-pink-900 border-pink-500">
                          反方: {item.negative_model.split('/')[1]}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <span>👁️</span> {item.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbUpIcon size={14} /> {item.likes || 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}