import { useState, useEffect } from 'react';
import { 
  PrimaryTable, 
  Button, 
  Space, 
  Input, 
  Tag, 
  Popconfirm, 
  MessagePlugin, 
  RadioGroup, 
  Radio, 
  Textarea, 
  Divider,
  Loading
} from 'tdesign-react';
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, FlagOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';
import { Layout } from 'tdesign-react';

const { Content } = Layout;

interface ReviewItem {
  id: string;
  type: 'debate' | 'comment' | 'article';
  title: string;
  content: string;
  submitter_id: string;
  submitter_name: string;
  submit_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  review_note?: string;
}

export const ReviewManagementPage = () => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');

  // 从数据库加载审核数据
  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setReviewItems(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      MessagePlugin.error('加载审核数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤审核项
  const filteredItems = reviewItems.filter(item => {
    const matchesSearch = 
      (item.title && item.title.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.content && item.content.toLowerCase().includes(searchText.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 处理审核
  const handleReview = async () => {
    if (!currentItem) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status: reviewAction,
          reviewed_at: new Date().toISOString(),
          reviewer_id: 'admin', // 假设当前是管理员
          reviewer_name: '管理员',
          review_note: reviewNote
        })
        .eq('id', currentItem.id);
      
      if (error) throw error;
      
      MessagePlugin.success(reviewAction === 'approve' ? '已通过审核' : '已拒绝审核');
      setShowModal(false);
      loadReviewItems(); // 重新加载审核列表
    } catch (error) {
      console.error('Error updating review:', error);
      MessagePlugin.error('审核操作失败');
    }
  };

  // 打开审核对话框
  const openReviewDialog = (item: ReviewItem) => {
    setCurrentItem(item);
    setReviewAction('approve');
    setReviewNote('');
    setShowModal(true);
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

  // 表格列配置
  const columns = [
    {
      title: '类型',
      colKey: 'type',
      width: 100,
      cell: (context: any) => {
        let color = '';
        let text = '';
        
        switch (context.row.type) {
          case 'debate':
            color = 'blue';
            text = '辩论';
            break;
          case 'comment':
            color = 'green';
            text = '评论';
            break;
          case 'article':
            color = 'purple';
            text = '文章';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '标题',
      colKey: 'title',
      width: 250
    },
    {
      title: '提交者',
      colKey: 'submitter_name',
      width: 120
    },
    {
      title: '提交原因',
      colKey: 'submit_reason',
      width: 200,
      cell: (context: any) => (
        <div className="text-ellipsis whitespace-nowrap overflow-hidden max-w-[200px]" title={context.row.submit_reason}>
          {context.row.submit_reason}
        </div>
      )
    },
    {
      title: '状态',
      colKey: 'status',
      width: 100,
      cell: (context: any) => {
        let color = '';
        let text = '';
        
        switch (context.row.status) {
          case 'pending':
            color = 'orange';
            text = '待审核';
            break;
          case 'approved':
            color = 'green';
            text = '已通过';
            break;
          case 'rejected':
            color = 'red';
            text = '已拒绝';
            break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '提交时间',
      colKey: 'created_at',
      width: 180,
      cell: (context: any) => formatDate(context.row.created_at)
    },
    {
      title: '操作',
      width: 120,
      cell: (context: any) => (
        <Space>
          {context.row.status === 'pending' ? (
            <Button
              size="small"
              icon={<EyeOutlined style={{ fontSize: 14 }} />}
              onClick={() => openReviewDialog(context.row)}
            >
              审核
            </Button>
          ) : (
            <Button
              size="small"
              icon={<EyeOutlined style={{ fontSize: 14 }} />}
              onClick={() => openReviewDialog(context.row)}
            >
              查看
            </Button>
          )}
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
            <h3 className="admin-card-title">审核管理</h3>
            <div className="flex items-center flex-wrap gap-4">
              <div className="relative">
                <Input
                  placeholder="搜索标题或内容"
                  value={searchText}
                  onChange={(e: any) => setSearchText(e.target.value)}
                  className="w-64 pl-9"
                />
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              </div>
              <div className="flex gap-2">
                <select
                  className="admin-form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">全部类型</option>
                  <option value="debate">辩论</option>
                  <option value="comment">评论</option>
                  <option value="article">文章</option>
                </select>
                <select
                  className="admin-form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="admin-card-body">
          <PrimaryTable
            columns={columns}
            data={filteredItems}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: filteredItems.length
            }}
            empty={<div className="text-center py-8 text-gray-500">暂无审核数据</div>}
            stripe
            hover
          />
        </div>
      </div>

      {/* 审核对话框 */}
      {showModal && currentItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">审核内容</h3>
            </div>
            <div className="admin-modal-body">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`admin-tag ${currentItem.type === 'debate' ? 'admin-tag-blue' : currentItem.type === 'comment' ? 'admin-tag-green' : 'admin-tag-purple'}`}>
                      {currentItem.type === 'debate' ? '辩论' : currentItem.type === 'comment' ? '评论' : '文章'}
                    </span>
                    <h3 className="font-medium text-gray-900">{currentItem.title}</h3>
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(currentItem.created_at)}</div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{currentItem.content}</p>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">提交者:</span> {currentItem.submitter_name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">提交原因:</span> {currentItem.submit_reason}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    审核结果
                  </label>
                  <RadioGroup value={reviewAction} onChange={(value) => setReviewAction(value as 'approve' | 'reject')}>
                    <Radio value="approve">
                      <div className="flex items-center text-green-600">
                        <CheckOutlined style={{ marginRight: '8px' }} />
                        通过
                      </div>
                    </Radio>
                    <Radio value="reject">
                      <div className="flex items-center text-red-600">
                        <CloseOutlined style={{ marginRight: '8px' }} />
                        拒绝
                      </div>
                    </Radio>
                  </RadioGroup>
                </div>
                
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    审核备注
                  </label>
                  <Textarea
                    value={reviewNote}
                    onChange={(value) => setReviewNote(value)}
                    placeholder="请输入审核备注（可选）"
                    className="admin-form-textarea"
                    rows={4}
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
                theme={reviewAction === 'approve' ? 'success' : 'danger'} 
                onClick={handleReview}
                className={reviewAction === 'approve' ? 'admin-btn admin-btn-primary' : 'admin-btn admin-btn-danger'}
              >
                {reviewAction === 'approve' ? '通过审核' : '拒绝审核'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
