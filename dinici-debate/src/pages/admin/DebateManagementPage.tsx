import { useState, useEffect } from 'react';
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
import { supabase } from '../../lib/supabaseClient';
import { Layout } from 'tdesign-react';

const { Content } = Layout;

interface Debate {
  id: string;
  topic: string;
  positive_model: string;
  negative_model: string;
  judge_model: string;
  created_at: string;
  is_public: boolean;
  views?: number;
  likes?: number;
  shares?: number;
  tags?: string[];
}

export const DebateManagementPage = () => {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDebate, setEditingDebate] = useState<Debate | null>(null);
  const [debateForm, setDebateForm] = useState({
    topic: '',
    is_public: false
  });

  // 从数据库加载辩论数据
  useEffect(() => {
    loadDebates();
  }, []);

  const loadDebates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDebates(data || []);
    } catch (error) {
      console.error('Error loading debates:', error);
      MessagePlugin.error('加载辩论数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤辩论
  const filteredDebates = debates.filter(debate => {
    const matchesSearch = 
      (debate.topic && debate.topic.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'public' && debate.is_public) || 
      (filterStatus === 'private' && !debate.is_public);
    return matchesSearch && matchesStatus;
  });

  // 处理表单输入变化
  const handleInputChange = (field: keyof typeof debateForm, value: any) => {
    setDebateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 打开编辑对话框
  const openEditDialog = (debate?: Debate) => {
    if (debate) {
      setEditingDebate(debate);
      setDebateForm({
        topic: debate.topic,
        is_public: debate.is_public
      });
    } else {
      setEditingDebate(null);
      setDebateForm({
        topic: '',
        is_public: false
      });
    }
    setShowModal(true);
  };

  // 保存辩论
  const saveDebate = async () => {
    if (!debateForm.topic) {
      MessagePlugin.error('请填写辩题');
      return;
    }

    try {
      if (editingDebate) {
        // 编辑现有辩论
        const { error } = await supabase
          .from('debates')
          .update({
            topic: debateForm.topic,
            is_public: debateForm.is_public
          })
          .eq('id', editingDebate.id);
        
        if (error) throw error;
        
        MessagePlugin.success('辩论信息已更新');
      }
      
      setShowModal(false);
      loadDebates(); // 重新加载辩论列表
    } catch (error) {
      console.error('Error saving debate:', error);
      MessagePlugin.error(editingDebate ? '更新辩论信息失败' : '保存辩论失败');
    }
  };

  // 删除辩论
  const deleteDebate = async (debateId: string) => {
    try {
      const { error } = await supabase
        .from('debates')
        .delete()
        .eq('id', debateId);
      
      if (error) throw error;
      
      MessagePlugin.success('辩论已删除');
      loadDebates(); // 重新加载辩论列表
    } catch (error) {
      console.error('Error deleting debate:', error);
      MessagePlugin.error('删除辩论失败');
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

  // 查看辩论详情
  const viewDebateDetails = (debateId: string) => {
    // 这里应该导航到辩论详情页面
    // 暂时先用消息提示
    MessagePlugin.info(`查看辩论ID: ${debateId}`);
  };

  // 表格列配置
  const columns = [
    {
      title: '辩题',
      colKey: 'topic',
      width: 300
    },
    {
      title: '正方模型',
      colKey: 'positive_model',
      width: 150
    },
    {
      title: '反方模型',
      colKey: 'negative_model',
      width: 150
    },
    {
      title: '裁判模型',
      colKey: 'judge_model',
      width: 150
    },
    {
      title: '状态',
      colKey: 'is_public',
      width: 100,
      cell: ({ row }: any) => {
        return row.is_public ? 
          <Tag color="green">公开</Tag> : 
          <Tag color="gray">私有</Tag>;
      }
    },
    {
      title: '创建时间',
      colKey: 'created_at',
      width: 180,
      cell: ({ row }: any) => formatDate(row.created_at)
    },
    {
      title: '浏览量',
      colKey: 'views',
      width: 100,
      align: 'center' as 'center'
    },
    {
      title: '点赞数',
      colKey: 'likes',
      width: 100,
      align: 'center' as 'center'
    },
    {
      title: '操作',
      width: 200,
      cell: ({ row }: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined style={{ fontSize: 14 }} />}
            onClick={() => viewDebateDetails(row.id)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => openEditDialog(row)}
          >
            编辑
          </Button>
          <Popconfirm
            onConfirm={() => deleteDebate(row.id)}
            content="确定要删除这个辩论吗？"
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
            <h3 className="admin-card-title">辩论管理</h3>
            <div className="flex items-center flex-wrap gap-4">
              <div className="relative">
                <Input
                  placeholder="搜索辩题"
                  value={searchText}
                  onChange={(value: any) => setSearchText(value)}
                  className="w-64 pl-9"
                />
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              </div>
              <Select
                value={filterStatus}
                onChange={(value: any) => setFilterStatus(value)}
                className="w-32"
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '公开', value: 'public' },
                  { label: '私有', value: 'private' }
                ]}
              />
            </div>
          </div>
        </div>
        <div className="admin-card-body">
          <PrimaryTable
            columns={columns}
            data={filteredDebates}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: filteredDebates.length
            }}
            empty={<div className="text-center py-8 text-gray-500">暂无辩论数据</div>}
            stripe
            hover
          />
        </div>
      </div>

      {/* 辩论编辑对话框 */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">编辑辩论</h3>
            </div>
            <div className="admin-modal-body">
              <div className="space-y-4">
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    辩题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={debateForm.topic}
                    onChange={(value: any) => handleInputChange('topic', value)}
                    placeholder="请输入辩题"
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    是否公开
                  </label>
                  <Select
                    value={debateForm.is_public}
                    onChange={(value: any) => handleInputChange('is_public', value)}
                    options={[
                      { label: '私有', value: false },
                      { label: '公开', value: true }
                    ]}
                    className="admin-form-select w-full"
                  />
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
                onClick={saveDebate}
                className="admin-btn admin-btn-primary"
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};