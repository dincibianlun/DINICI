import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Loading, Message, Tag } from 'tdesign-react'
import { supabase } from '../lib/supabaseClient'

export const ArticleDetailPage = () => {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticle()
  }, [id])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      setArticle(data)
    } catch (err) {
      Message.error('加载文章失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !article) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <Card className="bg-gray-800 border-purple-500/30 mb-6">
        <h1 className="text-2xl font-bold text-cyan-400 mb-4">{article.title}</h1>
        <div className="flex gap-2 mb-4">
          {article.tags.map(tag => (
            <Tag key={tag} theme="primary" className="bg-purple-900 border-purple-500">
              {tag}
            </Tag>
          ))}
        </div>
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </Card>
    </div>
  )
}