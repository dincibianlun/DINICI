import { useState, useEffect } from 'react';
import { 
  PrimaryTable, 
  Button, 
  Space, 
  Input, 
  Tag, 
  Popconfirm, 
  MessagePlugin,
  Loading
} from 'tdesign-react';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Layout } from 'tdesign-react';

const { Content } = Layout;

interface User {
  id: string;
  email: string;
  created_at: string;
  last_active_at: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    role: 'user' as 'admin' | 'user',
    status: 'active' as 'active' | 'inactive'
  });

  // 从数据库加载用户数据
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      MessagePlugin.error('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.email && user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // 处理表单输入变化
  const handleInputChange = (field: keyof typeof userForm, value: any) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 打开编辑对话框
  const openEditDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setUserForm({
        email: '',
        role: 'user',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  // 保存用户
  const saveUser = async () => {
    if (!userForm.email) {
      MessagePlugin.error('请输入邮箱地址');
      return;
    }

    try {
      if (editingUser) {
        // 编辑现有用户
        const { error } = await supabase
          .from('users')
          .update({
            role: userForm.role,
            status: userForm.status,
            last_active_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        
        MessagePlugin.success('用户信息已更新');
      } else {
        // 创建新用户
        const { error } = await supabase
          .from('users')
          .insert({
            email: userForm.email,
            role: userForm.role,
            status: userForm.status,
            created_at: new Date().toISOString(),
            last_active_at: new Date().toISOString()
          });
        
        if (error) throw error;
        
        MessagePlugin.success('用户已创建');
      }
      
      setShowModal(false);
      loadUsers(); // 重新加载用户列表
    } catch (error) {
      console.error('Error saving user:', error);
      MessagePlugin.error(editingUser ? '更新用户信息失败' : '创建用户失败');
    }
  };

  // 删除用户
  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      MessagePlugin.success('用户已删除');
      loadUsers(); // 重新加载用户列表
    } catch (error) {
      console.error('Error deleting user:', error);
      MessagePlugin.error('删除用户失败');
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

  // 表格列配置
  const columns = [
    {
      title: '邮箱地址',
      colKey: 'email',
      width: 200
    },
    {
      title: '角色',
      colKey: 'role',
      width: 100,
      cell: (context: any) => (
        <Tag color={context.row.role === 'admin' ? 'blue' : 'green'}>
          {context.row.role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      colKey: 'status',
      width: 100,
      cell: (context: any) => (
        <Tag color={context.row.status === 'active' ? 'green' : 'gray'}>
          {context.row.status === 'active' ? '活跃' : '禁用'}
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
      title: '最后活跃',
      colKey: 'last_active_at',
      width: 180,
      cell: (context: any) => formatDate(context.row.last_active_at)
    },
    {
      title: '操作',
      width: 150,
      cell: (context: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined style={{ fontSize: 14 }} />}
            onClick={() => openEditDialog(context.row)}
          >
            编辑
          </Button>
          <Popconfirm
            onConfirm={() => deleteUser(context.row.id)}
            content="确定要删除这个用户吗？"
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
            <h3 className="admin-card-title">用户管理</h3>
            <div className="flex items-center flex-wrap gap-4">
              <div className="relative">
                <Input
                  placeholder="搜索用户邮箱"
                  value={searchText}
                  onChange={(e: any) => setSearchText(e.target.value)}
                  className="w-64 pl-9"
                />
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              </div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => openEditDialog()}
                theme="primary"
              >
                添加用户
              </Button>
            </div>
          </div>
        </div>
        <div className="admin-card-body">
          <PrimaryTable
            columns={columns}
            data={filteredUsers}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: filteredUsers.length
            }}
            empty={<div className="text-center py-8 text-gray-500">暂无用户数据</div>}
            stripe
            hover
          />
        </div>
      </div>

      {/* 用户编辑对话框 */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingUser ? '编辑用户' : '添加用户'}</h3>
            </div>
            <div className="admin-modal-body">
              <div className="space-y-4">
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    邮箱地址 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={userForm.email}
                    onChange={(e: any) => handleInputChange('email', e.target.value)}
                    placeholder="请输入邮箱地址"
                    disabled={!!editingUser}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    用户角色
                  </label>
                  <select
                    className="admin-form-select"
                    value={userForm.role}
                    onChange={(e: any) => handleInputChange('role', e.target.value as 'admin' | 'user')}
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div className="admin-form-item">
                  <label className="admin-form-label">
                    账号状态
                  </label>
                  <select
                    className="admin-form-select"
                    value={userForm.status}
                    onChange={(e: any) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">禁用</option>
                  </select>
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
                onClick={saveUser}
                className="admin-btn admin-btn-primary"
              >
                {editingUser ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};