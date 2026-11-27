import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { IssueDetailPanel } from './IssueDetailPanel'

export function IssueDrawer({ issueId, onClose, siblings, onNavigate }: { issueId: string | null; onClose: () => void; siblings?: string[]; onNavigate?: (id: string) => void }) {
  const issue = useAppStore((s) => (issueId ? s.issues.find((i) => i.id === issueId) : undefined))
  const idx = siblings && issueId ? siblings.indexOf(issueId) : -1
  return (
    <Drawer
      open={!!issue}
      onOpenChange={(o) => !o && onClose()}
      width="max-w-[640px]"
      title={issue ? `${issue.id} · ${issue.source.length > 48 ? issue.source.slice(0, 48) + '…' : issue.source}` : ''}
      description={issue ? 'Linguistic issue details' : undefined}
      footer={
        siblings && onNavigate && idx >= 0 ? (
          <div className="mr-auto flex items-center gap-1 text-[12px] text-fg-3">
            <Button size="icon-sm" variant="ghost" disabled={idx <= 0} onClick={() => onNavigate(siblings[idx - 1]!)} aria-label="Previous issue">
              <ChevronUp />
            </Button>
            <Button size="icon-sm" variant="ghost" disabled={idx >= siblings.length - 1} onClick={() => onNavigate(siblings[idx + 1]!)} aria-label="Next issue">
              <ChevronDown />
            </Button>
            <span className="tabular">
              {idx + 1} of {siblings.length}
            </span>
          </div>
        ) : undefined
      }
    >
      {issue && <IssueDetailPanel issue={issue} />}
    </Drawer>
  )
}
