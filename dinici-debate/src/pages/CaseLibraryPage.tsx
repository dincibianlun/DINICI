import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Card, 
  Input, 
  Select, 
  Tag,
  Button,
  Space,
  Message,
  Loading
} from 'tdesign-react'
import { 
  SearchIcon, 
  TrendingUpIcon, 
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
  tags?: string[]
  is_public: boolean
  views?: number
  likes?: number
  comments?: number
  summary?: string
}

export const CaseLibraryPage = () => {
  const [cases, setCases] = useState<DebateCase[]>([])
  const [filteredCases, setFilteredCases] = useState<DebateCase[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [sortOption, setSortOption] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState<{label: string, value: string}[]>([
    { label: '全部标签', value: 'all' }
  ])

  useEffect(() => {
    fetchCases()
    fetchTags()
  }, [])

  useEffect(() => {
    filterCases()
  }, [searchText, selectedTag, cases, sortOption])

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .order('name')
      
      if (!error && data) {
        const tagOptions = data.map(tag => ({
          label: tag.name,
          value: tag.name
        }))
        setAvailableTags([{ label: '全部标签', value: 'all' }, ...tagOptions])
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }

  const fetchCases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setCases(data)
      }
    } catch (err) {
      console.error('Error fetching cases:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterCases = () => {
    let result = [...cases]
    
    // 按搜索文本过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      result = result.filter(item => 
        item.topic.toLowerCase().includes(lowerSearch) || 
        (item.summary && item.summary.toLowerCase().includes(lowerSearch))
      )
    }
    
    // 按标签过滤
    if (selectedTag !== 'all') {
      result = result.filter(item => 
        item.tags?.includes(selectedTag)
      )
    }
    
    // 排序逻辑
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'popular':
          const aPopularity = (a.views || 0) + (a.likes || 0) * 2 + (a.comments || 0) * 3
          const bPopularity = (b.views || 0) + (b.likes || 0) * 2 + (b.comments || 0) * 3
          return bPopularity - aPopularity
        case 'views':
          return (b.views || 0) - (a.views || 0)
        case 'likes':
          return (b.likes || 0) - (a.likes || 0)
        default:
          return 0
      }
    })
    
    setFilteredCases(result)
  }

  const handleShare = async (caseId: string) => {
    const { error } = await supabase
      .from('debates')
      .update({ is_public: true })
      .eq('id', caseId)
    
    if (!error) {
      Message.success('案例已分享到公开库')
      fetchCases()
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">辩论案例库</h1>
            <p className="text-sm text-purple-400">浏览其他用户分享的精彩辩论案例</p>
          </div>
          <Link to="/overview">
            <Button variant="outline" className="border-cyan-400 text-cyan-400">
              查看总览
            </Button>
          </Link>
        </div>
      </header>

      {/* 搜索和筛选区 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-800 rounded-lg border border-purple-500/30">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="搜索辩题或摘要..."
            value={searchText}
            onChange={(value) => setSearchText(value)}
            className="pl-10 bg-gray-900 border-purple-500 focus:border-cyan-400"
            clearable
          />
        </div>
        <div className="flex gap-3">
          <Select
            value={selectedTag}
            onChange={(value) => setSelectedTag(value as string)}
            options={availableTags}
            className="w-full md:w-36 bg-gray-900 border-purple-500"
          />
          <Select
            value={sortOption}
            onChange={(value) => setSortOption(value as string)}
            options={[
              { label: '最新', value: 'newest' },
              { label: '最热', value: 'popular' },
              { label: '浏览最多', value: 'views' },
              { label: '点赞最多', value: 'likes' }
            ]}
            className="w-full md:w-36 bg-gray-900 border-purple-500"
          />
        </div>
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" content="加载案例中..." />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-dashed border-purple-500/30">
          <p className="text-gray-400">没有找到匹配的案例</p>
          <Button variant="text" className="mt-4 text-cyan-400" onClick={fetchCases}>
            重新加载
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map(item => (
            <Link key={item.id} to={`/case/${item.id}`} className="block no-underline hover:no-underline">
              <Card
                bordered
                className="h-full bg-gray-800 border-purple-500/30 hover:border-cyan-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              >
                <div className="flex flex-col h-full">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-2 line-clamp-2">{item.topic}</h3>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Tag theme="primary" className="bg-purple-900 border-purple-500">
                        正方: {item.positive_model.split('/')[1]}
                      </Tag>
                      <Tag theme="danger" className="bg-pink-900 border-pink-500">
                        反方: {item.negative_model.split('/')[1]}
                      </Tag>
                    </div>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                      {item.summary || '该案例没有摘要信息'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags?.map(tag => (
                        <Tag key={tag} variant="outline" className="border-purple-500/50 text-purple-300">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto flex justify-between items-center">
                    <div className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <Space>
                      <Button 
                        variant="outline" 
                        size="small"
                        className="border-cyan-400 text-cyan-400 hover:bg-cyan-900/30"
                      >
                        查看详情
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}