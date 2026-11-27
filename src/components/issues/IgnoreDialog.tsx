import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, NativeSelect, Textarea } from '@/components/ui/input'

const REASONS = ['False positive', 'Client-approved exception', 'Brand name / do not translate', 'Preferential change — meaning preserved', 'Out of scope for this delivery', 'Other']

export function IgnoreDialog({ open, onOpenChange, onConfirm, count = 1 }: { open: boolean; onOpenChange: (o: boolean) => void; onConfirm: (reason: string) => void; count?: number }) {
  const [reason, setReason] = useState(REASONS[0]!)
  const [note, setNote] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (open) {
      setReason(REASONS[0]!)
      setNote('')
      setTouched(false)
    }
  }, [open])
  const needsNote = reason === 'Other'
  const err = touched && needsNote && !note.trim() ? 'Describe why this finding is being ignored.' : undefined
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        title={count > 1 ? `Ignore ${count} findings` : 'Ignore finding'}
        description="Ignored findings are excluded from quality scoring and suppressed in future scans."
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setTouched(true)
                if (needsNote && !note.trim()) return
                onConfirm(note.trim() ? `${reason}: ${note.trim()}` : reason)
                onOpenChange(false)
              }}
            >
              Ignore
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Reason" htmlFor="ignore-reason">
            <NativeSelect id="ignore-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Note" htmlFor="ignore-note" optional={!needsNote} error={err}>
            <Textarea id="ignore-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for the reviewer audit trail…" aria-invalid={!!err} />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}
