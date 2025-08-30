import { Button, Dialog, Textarea } from 'tdesign-react'
import { useState } from 'react'

interface Props {
  visible: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

export const CaseRejectDialog = ({ visible, onClose, onSubmit }: Props) => {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit(reason)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      header="拒绝案例"
      visible={visible}
      onClose={onClose}
      footer={
        <>
          <Button theme="default" onClick={onClose}>取消</Button>
          <Button 
            theme="danger" 
            loading={loading}
            onClick={handleSubmit}
            disabled={!reason.trim()}
          >
            确认拒绝
          </Button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        <p>请输入拒绝理由 (必填)</p>
        <Textarea
          value={reason}
          onChange={setReason}
          placeholder="请详细说明拒绝原因..."
          rows={4}
        />
      </div>
    </Dialog>
  )
}
