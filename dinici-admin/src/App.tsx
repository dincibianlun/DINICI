import { useState, useEffect } from 'react';
import { Button, Layout, Menu, Card, Table, Space, MessagePlugin, Dialog, Input, Textarea, Select, Tag } from 'tdesign-react';
import { DashboardIcon, ArticleIcon, UserIcon, SettingIcon } from 'tdesign-icons-react';
import './App.css';

const { Header, Aside, Content } = Layout;

// 类型定义
interface User {
  id: string;
  email: string;
  created_at: string;
  last_active_at: string;
}

interface Debate {
  id: string;
  topic: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
  tags: string[];
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

interface CaseReview {
  id: string;
  debate_id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reviews, setReviews] = useState<CaseReview[]>([]);
  
  // 文章编辑相关状态
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleDialogVisible, setArticleDialogVisible] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'tutorial',
    is_published: false
  });

  // 案例审核相关状态
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState<CaseReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 模拟数据加载
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 模拟用户数据
    setUsers([
      {
        id: '1',
        email: 'user1@example.com',
        created_at: '2024-01-15T10:00:00Z',
        last_active_at: '2024-01-20T15:30:00Z'
      },
      {
        id: '2',
        email: 'user2@example.com',
        created_at: '2024-01-16T11:00:00Z',
        last_active_at: '2024-01-21T09:15:00Z'
      }
    ]);

    // 模拟辩论数据
    setDebates([
      {
        id: '1',
        topic: '人工智能是否会取代人类工作',
        user_id: '1',
        created_at: '2024-01-20T14:00:00Z',
        is_public: false,
        tags: ['科技', '就业']
      },
      {
        id: '2',
        topic: '远程工作是否提高工作效率',
        user_id: '2',
        created_at: '2024-01-21T10:00:00Z',
        is_public: true,
        tags: ['工作', '效率']
      }
    ]);

    // 模拟文章数据
    setArticles([
      {
        id: '1',
        title: '如何获取OpenRouter API密钥',
        content: '详细介绍获取OpenRouter API密钥的步骤...',
        category: 'tutorial',
        is_published: true,
        created_at: '2024-01-15T12:00:00Z'
      }
    ]);

    // 模拟审核数据
    setReviews([
      {
        id: '1',
        debate_id: '1',
        status: 'pending',
        created_at: '2024-01-20T14:30:00Z'
      }
    ]);
  };

  // 菜单配置
  const menuItems = [
    { value: 'dashboard', label: '数据统计', icon: <DashboardIcon /> },
    { value: 'users', label: '用户管理', icon: <UserIcon /> },
    { value: 'articles', label: '文章管理', icon: <ArticleIcon /> },
    { value: 'reviews', label: '案例审核', icon: <SettingIcon /> },
  ];

  // 处理文章保存
  const handleSaveArticle = () => {
    if (!articleForm.title || !articleForm.content) {
      MessagePlugin.error('请填写完整的文章信息');
      return;
    }

    const newArticle: Article = {
      id: editingArticle?.id || Date.now().toString(),
      ...articleForm,
      created_at: editingArticle?.created_at || new Date().toISOString()
    };

    if (editingArticle) {
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? newArticle : a));
      MessagePlugin.success('文章更新成功');
    } else {
      setArticles(prev => [...prev, newArticle]);
      MessagePlugin.success('文章创建成功');
    }

    setArticleDialogVisible(false);
    setEditingArticle(null);
    setArticleForm({ title: '', content: '', category: 'tutorial', is_published: false });
  };

  // 处理案例审核
  const handleReviewCase = (action: 'approved' | 'rejected') => {
    if (!currentReview) return;

    if (action === 'rejected' && !rejectionReason) {
      MessagePlugin.error('请填写拒绝理由');
      return;
    }

    setReviews(prev => prev.map(r => 
      r.id === currentReview.id 
        ? { ...r, status: action, rejection_reason: rejectionReason }
        : r
    ));

    MessagePlugin.success(action === 'approved' ? '案例已批准' : '案例已拒绝');
    setReviewDialogVisible(false);
    setCurrentReview(null);
    setRejectionReason('');
  };

  // 渲染数据统计页面
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">数据统计</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{users.length}</div>
            <div className="text-gray-300">总用户数</div>
          </div>
        </Card>
        <Card className="bg-gray-800 border-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{debates.length}</div>
            <div className="text-gray-300">辩论总数</div>
          </div>
        </Card>
        <Card className="bg-gray-800 border-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{debates.filter(d => d.is_public).length}</div>
            <div className="text-gray-300">公开案例</div>
          </div>
        </Card>
        <Card className="bg-gray-800 border-purple-500">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{reviews.filter(r => r.status === 'pending').length}</div>
            <div className="text-gray-300">待审核</div>
          </div>
        </Card>
      </div>
    </div>
  );

  // 渲染用户管理页面
  const renderUsers = () => {
    const columns = [
      { colKey: 'email', title: '邮箱', width: 200 },
      { colKey: 'created_at', title: '注册时间', width: 180, cell: ({ row }: any) => new Date(row.created_at).toLocaleDateString() },
      { colKey: 'last_active_at', title: '最后活跃', width: 180, cell: ({ row }: any) => new Date(row.last_active_at).toLocaleDateString() },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-purple-400">用户管理</h2>
        <Table data={users} columns={columns} rowKey="id" className="bg-gray-800" />
      </div>
    );
  };

  // 渲染文章管理页面
  const renderArticles = () => {
    const columns = [
      { colKey: 'title', title: '标题', width: 200 },
      { colKey: 'category', title: '分类', width: 100 },
      { 
        colKey: 'is_published', 
        title: '状态', 
        width: 100, 
        cell: ({ row }: any) => (
          <Tag theme={row.is_published ? 'success' : 'warning'}>
            {row.is_published ? '已发布' : '草稿'}
          </Tag>
        )
      },
      { colKey: 'created_at', title: '创建时间', width: 180, cell: ({ row }: any) => new Date(row.created_at).toLocaleDateString() },
      {
        colKey: 'actions',
        title: '操作',
        width: 150,
        cell: ({ row }: any) => (
          <Space>
            <Button size="small" onClick={() => {
              setEditingArticle(row);
              setArticleForm({
                title: row.title,
                content: row.content,
                category: row.category,
                is_published: row.is_published
              });
              setArticleDialogVisible(true);
            }}>
              编辑
            </Button>
          </Space>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-purple-400">文章管理</h2>
          <Button theme="primary" onClick={() => {
            setEditingArticle(null);
            setArticleForm({ title: '', content: '', category: 'tutorial', is_published: false });
            setArticleDialogVisible(true);
          }}>
            新建文章
          </Button>
        </div>
        <Table data={articles} columns={columns} rowKey="id" className="bg-gray-800" />
      </div>
    );
  };

  // 渲染案例审核页面
  const renderReviews = () => {
    const columns = [
      { colKey: 'debate_id', title: '辩论ID', width: 150 },
      { 
        colKey: 'status', 
        title: '状态', 
        width: 100, 
        cell: ({ row }: any) => (
          <Tag theme={
            row.status === 'approved' ? 'success' : 
            row.status === 'rejected' ? 'danger' : 'warning'
          }>
            {row.status === 'approved' ? '已批准' : 
             row.status === 'rejected' ? '已拒绝' : '待审核'}
          </Tag>
        )
      },
      { colKey: 'created_at', title: '提交时间', width: 180, cell: ({ row }: any) => new Date(row.created_at).toLocaleDateString() },
      {
        colKey: 'actions',
        title: '操作',
        width: 200,
        cell: ({ row }: any) => (
          row.status === 'pending' ? (
            <Space>
              <Button size="small" theme="success" onClick={() => {
                setCurrentReview(row);
                handleReviewCase('approved');
              }}>
                批准
              </Button>
              <Button size="small" theme="danger" onClick={() => {
                setCurrentReview(row);
                setReviewDialogVisible(true);
              }}>
                拒绝
              </Button>
            </Space>
          ) : null
        )
      }
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-purple-400">案例审核</h2>
        <Table data={reviews} columns={columns} rowKey="id" className="bg-gray-800" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Layout>
        <Header className="bg-gray-800 border-b border-purple-500">
          <div className="flex items-center justify-between px-6">
            <h1 className="text-2xl font-bold text-cyan-400">DINCI 管理后台</h1>
            <div className="text-purple-300">管理员面板</div>
          </div>
        </Header>
        
        <Layout>
          <Aside className="bg-gray-800 border-r border-purple-500" width="200px">
            <Menu
              value={activeTab}
              onChange={(value) => setActiveTab(value as string)}
              className="bg-gray-800"
            >
              {menuItems.map(item => (
                <Menu.MenuItem key={item.value} value={item.value}>
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Menu.MenuItem>
              ))}
            </Menu>
          </Aside>
          
          <Content className="p-6">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'articles' && renderArticles()}
            {activeTab === 'reviews' && renderReviews()}
          </Content>
        </Layout>
      </Layout>

      {/* 文章编辑对话框 */}
      <Dialog
        visible={articleDialogVisible}
        onClose={() => setArticleDialogVisible(false)}
        header={editingArticle ? '编辑文章' : '新建文章'}
        width="800px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <Input
              value={articleForm.title}
              onChange={(value) => setArticleForm(prev => ({ ...prev, title: value }))}
              placeholder="请输入文章标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">分类</label>
            <Select
              value={articleForm.category}
              onChange={(value) => setArticleForm(prev => ({ ...prev, category: value as string }))}
              options={[
                { label: '教程', value: 'tutorial' },
                { label: '公告', value: 'announcement' },
                { label: '帮助', value: 'help' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">内容</label>
            <Textarea
              value={articleForm.content}
              onChange={(value) => setArticleForm(prev => ({ ...prev, content: value }))}
              placeholder="请输入文章内容"
              rows={10}
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={articleForm.is_published}
                onChange={(e) => setArticleForm(prev => ({ ...prev, is_published: e.target.checked }))}
              />
              <span>立即发布</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setArticleDialogVisible(false)}>取消</Button>
          <Button theme="primary" onClick={handleSaveArticle}>保存</Button>
        </div>
      </Dialog>

      {/* 案例拒绝对话框 */}
      <Dialog
        visible={reviewDialogVisible}
        onClose={() => setReviewDialogVisible(false)}
        header="拒绝案例"
        width="500px"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">拒绝理由</label>
            <Textarea
              value={rejectionReason}
              onChange={setRejectionReason}
              placeholder="请输入拒绝理由"
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={() => setReviewDialogVisible(false)}>取消</Button>
          <Button theme="danger" onClick={() => handleReviewCase('rejected')}>确认拒绝</Button>
        </div>
      </Dialog>
    </div>
  );
}

export default App;
