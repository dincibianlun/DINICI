import { useState, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Select, 
  Tag,
  List,
  Button,
  Space,
  Message
} from 'tdesign-react'
import { supabase } from '../lib/supabaseClient'

type DebateCase = {
  id: string
  topic: string
  positive_model: string
  negative_model: string
  created_at: string
  tags?: string[]
  is_public: boolean
}

export const CaseLibraryPage = () => {
  const [cases, setCases] = useState<DebateCase[]>([])
  const [filteredCases, setFilteredCases] = useState<DebateCase[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [loading, setLoading] = useState(true)

  // 获取所有标签
  const allTags = [
    { label: '全部', value: 'all' },
    { label: '科技', value: 'tech' },
    { label: '社会', value: 'society' },
    { label: '教育', value: 'education' },
    { label: '经济', value: 'economy' }
  ]

  useEffect(() => {
    fetchCases()
  }, [])

  useEffect(() => {
    filterCases()
  }, [searchText, selectedTag, cases])

  const fetchCases = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('debates')
        .select('id,topic,positive_model,negative_model,created_at,tags,is_public')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setCases(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterCases = () => {
    let result = [...cases]
    
    // 按搜索文本过滤
    if (searchText) {
      result = result.filter(item => 
        item.topic.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    
    // 按标签过滤
    if (selectedTag !== 'all') {
      result = result.filter(item => 
        item.tags?.includes(selectedTag)
      )
    }
    
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
        <h1 className="text-3xl font-bold text-cyan-400">辩论案例库</h1>
        <p className="text-sm text-purple-400">浏览其他用户分享的精彩辩论案例</p>
      </header>

      {/* 搜索和筛选区 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="搜索辩题..."
          value={searchText}
          onChange={setSearchText}
          className="flex-1 bg-gray-800 border-purple-500"
          clearable
        />
        <Select
          value={selectedTag}
          onChange={setSelectedTag}
          options={allTags}
          className="w-full md:w-40"
        />
      </div>

      {/* 案例列表 */}
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-8 text-gray-500">没有找到匹配的案例</div>
      ) : (
        <List>
          {filteredCases.map(item => (
            <List.Item key={item.id}>
              <Card
                bordered
                className="bg-gray-800 border-purple-500 hover:border-cyan-400 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">{item.topic}</h3>
                    <div className="flex gap-2 mb-3">
                      <Tag theme="primary">正方: {item.positive_model}</Tag>
                      <Tag theme="danger">反方: {item.negative_model}</Tag>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags?.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Space className="md:self-end">
                    <Button 
                      variant="outline" 
                      className="border-cyan-400 text-cyan-400 hover:bg-cyan-900"
                    >
                      查看详情
                    </Button>
                  </Space>
                </div>
              </Card>
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}