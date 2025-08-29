import { useState, useEffect } from 'react'
import { 
  Card,
  Button,
  Space,
  Tag,
  Message,
  Select,
  Input
} from 'tdesign-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Editor } from '@tinymce/tinymce-react'

type Article = {
  id?: string
  title: string
  content: string
  tags: string[]
  created_at?: string
}

export const ArticleEditor = ({ initialData }: { initialData?: Article }) => {
  const [article, setArticle] = useState<Article>(initialData || {
    title: '',
    content: '',
    tags: []
  })
  const [allTags, setAllTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // 获取所有可用标签
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('article_tags')
        .select('name')
        .order('name', { ascending: true })
      
      if (data) {
        setAllTags(data.map(t => t.name))
      }
    }
    fetchTags()
  }, [])

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('articles')
        .upsert({
          ...article,
          user_id: user?.id
        })
        .select()
      
      if (error) throw error
      Message.success('文章保存成功')
      return data?.[0]
    } catch (err) {
      Message.error('保存失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (newTag && !article.tags.includes(newTag)) {
      setArticle({
        ...article,
        tags: [...article.tags, newTag]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setArticle({
      ...article,
      tags: article.tags.filter(tag => tag !== tagToRemove)
    })
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-purple-500/30">
        <Input
          label="文章标题"
          value={article.title}
          onChange={(value) => setArticle({...article, title: value})}
          className="mb-4 bg-gray-900 border-purple-500"
        />

        <div className="mb-4">
          <label className="text-sm text-gray-300 mb-2 block">文章标签</label>
          <div className="flex gap-2 mb-2">
            <Select
              value={newTag}
              onChange={(value) => setNewTag(value as string)}
              options={allTags.map(tag => ({ label: tag, value: tag }))}
              className="w-48 bg-gray-900 border-purple-500"
              filterable
            />
            <Button 
              size="small" 
              onClick={addTag}
              disabled={!newTag}
            >
              添加标签
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => removeTag(tag)}
                theme="primary"
                className="bg-purple-900 border-purple-500"
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-gray-800 border-purple-500/30">
        <Editor
          apiKey="your-tinymce-api-key"
          value={article.content}
          onEditorChange={(content) => setArticle({...article, content})}
          init={{
            height: 500,
            menubar: true,
            skin: 'oxide-dark',
            content_css: 'dark',
            plugins: [
              'advlist autolink lists link image charmap print preview anchor',
              'searchreplace visualblocks code fullscreen',
              'insertdatetime media table paste code help wordcount'
            ],
            toolbar: 'undo redo | formatselect | bold italic backcolor | \
             alignleft aligncenter alignright alignjustify | \
             bullist numlist outdent indent | removeformat | help'
          }}
        />
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" className="border-purple-500 text-purple-300">
          取消
        </Button>
        <Button 
          theme="primary" 
          loading={loading}
          onClick={handleSubmit}
          className="bg-purple-600 hover:bg-purple-500"
        >
          保存文章
        </Button>
      </div>
    </div>
  )
}