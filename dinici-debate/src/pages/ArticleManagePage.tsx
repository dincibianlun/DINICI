import React, { useState, useEffect } from 'react';
import { 
  Card,
  Table,
  Button,
  Tag,
  Space,
  Loading,
  Dialog,
  MessagePlugin
} from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ArticleEditor } from '../components/ArticleEditor';
import { Link } from 'react-router-dom';

type Article = {
  id: string;
  title: string;
  tags: string[];
  created_at: string;
  content?: string;
  category?: string;
  is_published?: boolean;
};

export const ArticleManagePage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutorial_articles')
        .select('id,title,tags,created_at,category,is_published')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article: Article) => {
    setCurrentArticle(article);
    setEditVisible(true);
  };

  const handleCreate = () => {
    setCurrentArticle(null);
    setEditVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        const { error } = await supabase
          .from('tutorial_articles')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        MessagePlugin.success('文章删除成功');
        fetchArticles();
      } catch (err) {
        console.error(err);
        MessagePlugin.error('删除失败');
      }
    }
  };

  const columns = [
    {
      title: '标题',
      colKey: 'title',
      cell: ({ row }: { row: Article }) => (
        <Link 
          to={`/article/${row.id}`} 
          className="text-cyan-400 hover:underline"
        >
          {row.title}
        </Link>
      )
    },
    {
      title: '标签',
      colKey: 'tags',
      cell: ({ row }: { row: Article }) => (
        <Space>
          {row.tags.map((tag: string) => (
            <Tag key={tag} theme="primary" className="bg-purple-900 border-purple-500">
              {tag}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '创建时间',
      colKey: 'created_at',
      cell: ({ row }: { row: Article }) => new Date(row.created_at).toLocaleString()
    },
    {
      title: '操作',
      colKey: 'actions',
      cell: ({ row }: { row: Article }) => (
        <Space>
          <Button 
            variant="outline" 
            size="small"
            onClick={() => handleEdit(row)}
            className="border-cyan-400 text-cyan-400"
          >
            编辑
          </Button>
          <Button 
            variant="outline" 
            size="small"
            onClick={() => handleDelete(row.id)}
            className="border-red-400 text-red-400"
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-cyan-400">教程文章管理</h1>
          <Button 
            theme="primary" 
            onClick={handleCreate}
            className="bg-purple-600 hover:bg-purple-500"
          >
            新建文章
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" />
        </div>
      ) : (
        <Card className="bg-gray-800 border-purple-500/30">
          <Table 
            data={articles}
            columns={columns}
            rowKey="id"
            empty="暂无文章数据"
          />
        </Card>
      )}

      <Dialog
        header={currentArticle ? '编辑文章' : '新建文章'}
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        footer={null}
        width="90%"
        className="bg-gray-800"
      >
        <ArticleEditor 
          initialData={currentArticle ? {
            id: currentArticle.id,
            title: currentArticle.title,
            content: currentArticle.content || '',
            tags: currentArticle.tags,
            created_at: currentArticle.created_at
          } : null}
          onSuccess={() => {
            setEditVisible(false);
            fetchArticles();
          }}
        />
      </Dialog>
    </div>
  );
};