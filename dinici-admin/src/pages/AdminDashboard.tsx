import { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space } from 'tdesign-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
)

type User = {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

type UserRow = User

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
    
    if (!error) setUsers(data)
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    fetchUsers()
  }

  return (
    <div className="p-4">
      <Card title="用户管理" bordered className="mb-6">
        <Table
          rowKey="id"
          data={users}
          columns={[
            { title: '邮箱', colKey: 'email' },
            { 
              title: '角色', 
              colKey: 'role',
              cell: ({ row }: { row: UserRow }) => (
                <Tag theme={row.role === 'admin' ? 'danger' : 'primary'}>
                  {row.role === 'admin' ? '管理员' : '普通用户'}
                </Tag>
              )
            },
            { title: '注册时间', colKey: 'created_at' },
            {
              title: '操作',
              colKey: 'actions',
              cell: ({ row }: { row: UserRow }) => (
                <Space>
                  {row.role !== 'admin' && (
                    <Button 
                      size="small" 
                      onClick={() => handleRoleChange(row.id, 'admin')}
                    >
                      设为管理员
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => handleRoleChange(row.id, 'user')}
                  >
                      设为普通用户
                  </Button>
                </Space>
              )
            }
          ]}
          loading={loading}
        />
      </Card>

      <Card title="案例审核" bordered>
        <div className="p-4 text-gray-500">
          案例审核功能开发中...
        </div>
      </Card>
    </div>
  )
}