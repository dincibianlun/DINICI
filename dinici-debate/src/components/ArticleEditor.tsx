import { useState, useEffect } from 'react';
import { 
  Card,
  Button,
  Tag,
  MessagePlugin,
  Select,
  Input,
  Textarea
} from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

type Article = {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  created_at?: string;
}

export const ArticleEditor = ({ initialData }: { initialData?: Article }) => {
  const [article, setArticle] = useState<Article>(initialData || {
    title: '',
    content: '',
    tags: []
  });
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 获取所有可用标签
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('tags')
        .select('name')
        .order('name', { ascending: true });
      
      if (data) {
        setAllTags(data.map(t => t.name));
      }
    };
    fetchTags();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutorial_articles')
        .upsert({
          ...article,
          author_id: user?.id,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      MessagePlugin.success('文章保存成功');
      return data?.[0];
    } catch (err) {
      MessagePlugin.error('保存失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && !article.tags.includes(newTag)) {
      setArticle({
        ...article,
        tags: [...article.tags, newTag]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticle({
      ...article,
      tags: article.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Card 
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(0, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00ffff', fontSize: '0.875rem' }}>
            文章标题
          </label>
          <Input
            value={article.title}
            onChange={(value) => setArticle({...article, title: value})}
            placeholder="请输入文章标题"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#ffffff'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00ffff', fontSize: '0.875rem' }}>
            文章标签
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Select
              value={newTag}
              onChange={(value) => setNewTag(value as string)}
              options={allTags.map(tag => ({ label: tag, value: tag }))}
              style={{ width: '12rem' }}
              filterable
              placeholder="选择标签"
            />
            <Button 
              size="small" 
              onClick={addTag}
              disabled={!newTag}
              style={{
                border: '1px solid #00ffff',
                color: '#00ffff',
                background: 'transparent'
              }}
            >
              添加标签
            </Button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {article.tags.map(tag => (
              <Tag
                key={tag}
                closable
                onClose={() => removeTag(tag)}
                style={{
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  color: '#00ffff'
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </Card>

      <Card 
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(0, 255, 255, 0.1)',
          borderRadius: '8px'
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#00ffff', fontSize: '0.875rem' }}>
            文章内容
          </label>
          <Textarea
            value={article.content}
            onChange={(value) => setArticle({...article, content: value})}
            placeholder="请输入文章内容"
            rows={15}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#ffffff',
              resize: 'vertical'
            }}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button 
          variant="outline" 
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#cccccc'
          }}
        >
          取消
        </Button>
        <Button 
          theme="primary" 
          loading={loading}
          onClick={handleSubmit}
          style={{
            background: 'linear-gradient(45deg, #8b5cf6, #00ffff)',
            border: 'none',
            color: 'white'
          }}
        >
          保存文章
        </Button>
      </div>
    </div>
  );
};
