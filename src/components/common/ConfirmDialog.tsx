import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', onConfirm, danger, confirmText, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; confirmLabel?: string; onConfirm: () => void; danger?: boolean; confirmText?: string; children?: ReactNode }) {
  const [typed, setTyped] = useState('')
  const blocked = confirmText !== undefined && typed.trim().toLowerCase() !== confirmText.toLowerCase()
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped('')
        onOpenChange(o)
      }}
    >
      <DialogContent
        size="sm"
        title={title}
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant={danger ? 'danger' : 'primary'}
              disabled={blocked}
              onClick={() => {
                onConfirm()
                setTyped('')
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        {description && <div className="text-[13px] leading-relaxed text-fg-2">{description}</div>}
        {children}
        {confirmText !== undefined && (
          <div className="mt-3">
            <label className="mb-1.5 block text-[12.5px] text-fg-2" htmlFor="confirm-text">
              Type <b className="text-fg">{confirmText}</b> to confirm
            </label>
            <Input id="confirm-text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
