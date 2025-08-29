import { useState } from 'react'
import { Button, Card, Loading, Message, Table, Tag } from 'tdesign-react'
import { CaseRejectDialog } from '../components/CaseRejectDialog'
import { rejectCase, approveCase } from '../services/caseService'
import type { Case } from '../types/case'

const columns = [
  { title: '案例标题', colKey: 'title' },
  { title: '提交人', colKey: 'author' },
  { title: '标签', colKey: 'tags', cell: ({ row }: any) => (
    <div className="flex gap-2">
      {row.tags.map((tag: string) => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </div>
  )},
  { title: '操作', colKey: 'action', cell: ({ row }: any) => (
    <div className="flex gap-2">
      <Button theme="primary" onClick={() => approveCase(row.id)}>
        通过
      </Button>
      <Button theme="danger" onClick={() => handleReject(row.id)}>
        拒绝
      </Button>
    </div>
  )}
]

export const CaseReviewPage = () => {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false)
  const [currentCaseId, setCurrentCaseId] = useState('')

  const handleReject = (caseId: string) => {
    setCurrentCaseId(caseId)
    setRejectDialogVisible(true)
  }

  const handleRejectSubmit = async (reason: string) => {
    try {
      await rejectCase(currentCaseId, reason)
      Message.success('案例已拒绝')
      fetchPendingCases()
    } catch (err) {
      Message.error('操作失败')
    } finally {
      setRejectDialogVisible(false)
    }
  }

  const fetchPendingCases = async () => {
    setLoading(true)
    try {
      // TODO: 实现获取待审核案例的API
      const mockData: Case[] = []
      setCases(mockData)
    } catch (err) {
      Message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingCases()
  }, [])

  return (
    <div className="p-4">
      <Card title="案例审核" className="bg-gray-800/50 backdrop-blur">
        {loading ? (
          <Loading />
        ) : (
          <Table
            data={cases}
            columns={columns}
            rowKey="id"
            empty="暂无待审核案例"
          />
        )}
      </Card>

      <CaseRejectDialog
        caseId={currentCaseId}
        visible={rejectDialogVisible}
        onClose={() => setRejectDialogVisible(false)}
        onSubmit={handleRejectSubmit}
      />
    </div>
  )
}