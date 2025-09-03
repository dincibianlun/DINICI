import { useState, useEffect, useRef } from 'react';
import { 
  PrimaryTable, 
  Button, 
  Space, 
  Input, 
  Tag, 
  Popconfirm, 
  MessagePlugin,
  Select,
  Loading
} from 'tdesign-react';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Layout } from 'tdesign-react';
import MarkdownEditor, { MarkdownEditorRef } from '../../components/MarkdownEditor';
import { useArticleStore, Article } from '../../store/articleStore';
import { supabase } from '../../lib/supabaseClient';

const { Content } = Layout;

export const ArticleManagementPage = () => {
  const editorRef = useRef<any>(null);
  const articles = useArticleStore((state: any) => state.articles);
  const addArticle = useArticleStore((state: any) => state.addArticle);
  const updateArticle = useArticleStore((state: any) => state.updateArticle);
  const deleteArticle = useArticleStore((state: any) => state.deleteArticle);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'tutorial',
    tags: [] as string[],
    is_published: true
  });
  const [tagInput, setTagInput] = useState('');

  // 初始化时从数据库加载文章数据
  useEffect(() => {
    // 避免频繁加载，使用标志记录是否已加载
    const articlesLoadedFlag = sessionStorage.getItem('articles_loaded');
    
    const fetchArticles = async () => {
      // 如果已经加载过文章，则跳过
      if (articlesLoadedFlag === 'true' && articles.length > 0) {
        console.log('文章数据已加载，跳过重复加载');
        return;
      }
      
      setLoading(true);
      try {
        console.log('从数据库加载文章数据...');
        // 从Supabase查询文章数据
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`成功加载 ${data.length} 篇文章`);
          // 转换数据格式以匹配Article接口
          const formattedArticles = data.map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            category: article.category,
            tags: article.tags || [],
            created_at: article.created_at,
            is_published: article.is_published,
            author_id: article.author_id,
            updated_at: article.updated_at
          }));
          
          // 将数据批量添加到Zustand存储
          formattedArticles.forEach(article => addArticle(article));
          
          // 设置标志，避免重复加载
          sessionStorage.setItem('articles_loaded', 'true');
        } else {
          console.log('数据库中没有文章或查询结果为空');
        }
      } catch (error) {
        console.error('加载文章数据失败:', error);
        MessagePlugin.error('加载文章数据失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
    
    // 清理函数，组件卸载时不需要清除标志，因为这是会话级别的
  }, []); // 移除addArticle依赖，避免循环依赖问题

  // 过滤文章
  const filteredArticles = articles.filter((article: Article) => {
    const matchesSearch = 
      (article.title && article.title.toLowerCase().includes(searchText.toLowerCase())) ||
      (article.content && article.content.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || article.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // 处理表单输入变化
  const handleInputChange = (field: keyof typeof articleForm, value: any) => {
    console.log(`Field ${field} changed to:`, value);
    setArticleForm(prev => {
      const newState = {
        ...prev,
        [field]: value
      };
      console.log('New article form state:', newState);
      return newState;
    });
  };

  // 处理标签输入
  const addTag = () => {
    if (tagInput.trim() !== '' && !articleForm.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...articleForm.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    handleInputChange('tags', articleForm.tags.filter(t => t !== tag));
  };

  // 打开编辑对话框
  const openEditDialog = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags || [],
        is_published: article.is_published
      });
    } else {
      setEditingArticle(null);
      setArticleForm({
        title: '',
        content: '',
        category: 'tutorial',
        tags: [],
        is_published: true
      });
    }
    setShowModal(true);
  };

  // 模拟图片上传
  const handleImageUpload = async (blob: Blob, callback: (url: string, altText: string) => void) => {
    // 显示上传中提示
    MessagePlugin.info('正在处理图片...');
    
    try {
      // 将图片文件转换为Base64编码的数据URL
      const reader = new FileReader();
      
      // 创建一个Promise来处理异步的FileReader操作
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // 短暂延迟模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 回调提供数据URL
      callback(dataUrl, 'image');
      MessagePlugin.success('图片处理成功');
    } catch (error) {
      console.error('图片处理失败:', error);
      MessagePlugin.error('图片处理失败');
      
      // 失败时使用占位符图片
      const fallbackUrl = 'https://via.placeholder.com/600x400.png/000000/FFFFFF?text=图片处理失败';
      callback(fallbackUrl, 'image');
    }
  };

  // 保存文章
  const saveArticle = async () => {
    console.log('保存文章 - 当前表单状态:', articleForm);
    
    if (!articleForm.title.trim()) {
      MessagePlugin.error('请填写标题');
      return;
    }

    try {
      // 获取编辑器内容
      let content = articleForm.content || '';
      
      if (editorRef.current) {
        try {
          const editorContent = editorRef.current.getContent();
          if (editorContent && editorContent.trim()) {
            content = editorContent;
          }
          console.log('获取的编辑器内容长度:', content.length, ' 字节');
        } catch (editorError) {
          console.error('获取编辑器内容失败:', editorError);
        }
      } else {
        console.warn('编辑器引用不存在');
      }

      if (!content.trim()) {
        MessagePlugin.error('请填写文章内容');
        return;
      }

      // 内容长度检查
      // 检查内容大小，避免超过PostgreSQL tsvector的限制
      const contentSizeInBytes = new Blob([content]).size;
      const MAX_CONTENT_SIZE = 900000; // 设置为900KB，留一些安全边界

      if (contentSizeInBytes > MAX_CONTENT_SIZE) {
        MessagePlugin.error(`文章内容过大 (${Math.round(contentSizeInBytes/1024)} KB)，超过了数据库限制（最大900 KB）。\n请减少内容或分成多篇文章。`);
        return;
      }

      // 显示保存进度
      MessagePlugin.loading('正在保存文章...');
      
      if (editingArticle) {
        // 编辑现有文章
        const updatedArticleData = {
          title: articleForm.title,
          content: content,
          category: articleForm.category,
          tags: articleForm.tags,
          is_published: articleForm.is_published,
          updated_at: new Date().toISOString()
        };
        
        // 更新到数据库
        const { error } = await supabase
          .from('articles')
          .update(updatedArticleData)
          .eq('id', editingArticle.id);
          
        if (error) throw error;
        
        // 更新到全局存储
        updateArticle(editingArticle.id, updatedArticleData);
        MessagePlugin.success('文章已更新');
      } else {
        // 创建新文章
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!userData || !userData.user) {
          throw new Error('未获取到用户信息，请重新登录');
        }
        
        const newArticleData = {
          title: articleForm.title,
          content: content,
          category: articleForm.category,
          tags: articleForm.tags,
          is_published: articleForm.is_published,
          author_id: userData.user.id
        };
        
        // 添加到数据库
        const { data: insertedArticle, error } = await supabase
          .from('articles')
          .insert(newArticleData)
          .select()
          .single();
          
        if (error) throw error;
        
        if (!insertedArticle) {
          throw new Error('文章创建失败，未返回数据');
        }
        
        // 添加到全局存储
        const newArticle: Article = {
          id: insertedArticle.id,
          title: insertedArticle.title,
          content: insertedArticle.content,
          category: insertedArticle.category,
          tags: insertedArticle.tags || [],
          is_published: insertedArticle.is_published,
          author_id: insertedArticle.author_id,
          created_at: insertedArticle.created_at
        };
        
        addArticle(newArticle);
        MessagePlugin.success('文章已创建');
      }
      
      // 关闭加载提示
      MessagePlugin.closeAll(); // 关闭所有提示
      setShowModal(false);
      
      // 重置筛选条件
      setTimeout(() => {
        setFilterCategory('all');
        setSearchText('');
      }, 100);
    } catch (error: any) {
      // 关闭加载提示
      MessagePlugin.closeAll();
      
      console.error('Error saving article:', error);
      MessagePlugin.error((editingArticle ? '更新文章失败' : '创建文章失败') + ': ' + (error.message || '未知错误'));
    }
  };

  // 删除文章
  const handleDeleteArticle = async (articleId: string) => {
    try {
      MessagePlugin.loading('正在删除文章...');
      
      // 从数据库删除
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);
        
      if (error) throw error;
      
      // 从全局存储中删除
      deleteArticle(articleId);
      MessagePlugin.success('文章已删除');
    } catch (error: any) {
      console.error('Error deleting article:', error);
      MessagePlugin.error('删除文章失败: ' + (error.message || '未知错误'));
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 获取分类标签
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'tutorial': '教程指南',
      'announcement': '公告通知',
      'help': '帮助文档',
      'faq': '常见问题'
    };
    return labels[category] || category;
  };

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'tutorial': 'blue',
      'announcement': 'green',
      'help': 'orange',
      'faq': 'purple'
    };
    return colors[category] || 'gray';
  };

  // 表格列配置
  const columns = [
    {
      title: '标题',
      colKey: 'title',
      width: 300
    },
    {
      title: '分类',
      colKey: 'category',
      width: 120,
      cell: (context: any) => (
        <Tag color={getCategoryColor(context.row.category)}>
          {getCategoryLabel(context.row.category)}
        </Tag>
      )
    },
    {
      title: '状态',
      colKey: 'is_published',
      width: 100,
      cell: (context: any) => (
        <Tag color={context.row.is_published ? 'green' : 'gray'}>
          {context.row.is_published ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      colKey: 'created_at',
      width: 180,
      cell: (context: any) => formatDate(context.row.created_at)
    },
    {
      title: '操作',
      width: 150,
      cell: (context: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined style={{ fontSize: 14 }} />}
            onClick={() => window.open(`/article/${context.row.id}`, '_blank')}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => openEditDialog(context.row)}
          >
            编辑
          </Button>
          <Popconfirm
            onConfirm={() => handleDeleteArticle(context.row.id)}
            content="确定要删除这篇文章吗？"
            confirmBtn="确定"
            cancelBtn="取消"
          >
            <Button
              size="small"
              icon={<DeleteOutlined style={{ fontSize: 14 }} />}
              theme="danger"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        <Loading size="large" />
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="admin-card-title">文章管理</h3>
            <div className="flex items-center flex-wrap gap-4">
              <div className="relative">
                <Input
                  placeholder="搜索文章标题或内容"
                  value={searchText}
                  onChange={(e: any) => setSearchText(e.target.value)}
                  className="w-64 pl-9"
                />
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              </div>
              <Select
                value={filterCategory}
                onChange={(value: any) => setFilterCategory(value)}
                className="w-32"
                options={[
                  { label: '全部分类', value: 'all' },
                  { label: '教程指南', value: 'tutorial' },
                  { label: '公告通知', value: 'announcement' },
                  { label: '帮助文档', value: 'help' },
                  { label: '常见问题', value: 'faq' }
                ]}
              />
              <Button
                icon={<PlusOutlined />}
                onClick={() => openEditDialog()}
                theme="primary"
              >
                创建文章
              </Button>
            </div>
          </div>
        </div>
        <div className="admin-card-body">
          <PrimaryTable
            columns={columns}
            data={filteredArticles}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: filteredArticles.length
            }}
            empty={<div className="text-center py-8 text-gray-500">暂无文章数据</div>}
            stripe
            hover
          />
        </div>
      </div>

      {/* 文章编辑对话框 */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingArticle ? '编辑文章' : '创建文章'}</h3>
            </div>
            <div className="admin-modal-body">
              <div className="space-y-4">
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    文章标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={articleForm.title}
                    onChange={(val: any, context: any) => {
                      // 确保我们获取到正确的值
                      const value = typeof val === 'object' ? 
                        (val.target ? val.target.value : val) : val;
                      handleInputChange('title', value);
                      console.log('Title changed to:', value); // 调试日志
                    }}
                    placeholder="请输入文章标题"
                    className="admin-form-input"
                    style={{ color: '#333333', backgroundColor: '#ffffff' }}
                  />
                </div>
                
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    分类
                  </label>
                  <Select
                    value={articleForm.category}
                    onChange={(value: any) => handleInputChange('category', value)}
                    options={[
                      { label: '教程指南', value: 'tutorial' },
                      { label: '公告通知', value: 'announcement' },
                      { label: '帮助文档', value: 'help' },
                      { label: '常见问题', value: 'faq' }
                    ]}
                    className="admin-form-select w-full"
                    style={{ color: '#333333' }}
                  />
                </div>
                
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {articleForm.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="admin-tag admin-tag-blue"
                      >
                        {tag}
                        <span 
                          className="ml-1 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(val: any, context: any) => {
                        // 确保我们获取到正确的值
                        const value = typeof val === 'object' ? 
                          (val.target ? val.target.value : val) : val;
                        setTagInput(value);
                        console.log('Tag input changed to:', value); // 调试日志
                      }}
                      onKeydown={(e: any) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="输入标签后按回车添加"
                      className="admin-form-input"
                      style={{ color: '#333333', backgroundColor: '#ffffff' }}
                    />
                    <Button onClick={addTag} theme="default">
                      添加
                    </Button>
                  </div>
                </div>
                
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    文章内容 <span className="text-red-500">*</span>
                  </label>
                  <div className="border rounded-md border-gray-300 toast-ui-editor-container">
                    <MarkdownEditor
                      ref={editorRef}
                      initialValue={articleForm.content}
                      height="400px"
                      onChange={(content: string) => {
                        handleInputChange('content', content);
                        console.log('Editor content changed:', content.substring(0, 50) + '...');
                      }}
                      onImageUpload={handleImageUpload}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    支持Markdown语法和图片上传
                  </p>
                </div>
                
                <div className="admin-form-item">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={articleForm.is_published}
                      onChange={(e: any) => handleInputChange('is_published', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                      发布文章
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <Button 
                onClick={() => setShowModal(false)} 
                theme="default"
                className="admin-btn admin-btn-default"
              >
                取消
              </Button>
              <Button 
                theme="primary" 
                onClick={saveArticle}
                className="admin-btn admin-btn-primary"
              >
                {editingArticle ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};