import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useAppStore } from '@/store/useAppStore'
import type { Project, ProjectStatus } from '@/types'
import { cn } from '@/utils/cn'
import { dayKey, fromInputDate } from '@/utils/dates'
import { langShort } from '@/utils/languages'

export function AssignReviewerDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const team = useAppStore((s) => s.team)
  const assign = useAppStore((s) => s.assignReviewer)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    if (open) setSelected(null)
  }, [open])
  const candidates = team
    .filter((m) => (m.role === 'Reviewer' || m.role === 'Senior Reviewer') && m.status !== 'invited')
    .map((m) => ({ m, match: m.languages.some((l) => project.targetLangs.includes(l)), assigned: project.reviewerIds.includes(m.id) }))
    .sort((a, b) => Number(b.match) - Number(a.match) || a.m.workload - b.m.workload)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Assign reviewer"
        description={`Add a linguistic reviewer to ${project.name}. Reviewers matching the target languages are listed first.`}
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                assign(project.id, selected)
                toast.success('Reviewer assigned.', { description: `${team.find((m) => m.id === selected)?.name} added to ${project.name}.` })
                onOpenChange(false)
              }}
            >
              Assign reviewer
            </Button>
          </>
        }
      >
        <ul role="radiogroup" className="space-y-1.5">
          {candidates.map(({ m, match, assigned }) => (
            <li key={m.id}>
              <button
                role="radio"
                aria-checked={selected === m.id}
                disabled={assigned}
                onClick={() => setSelected(m.id)}
                className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55', selected === m.id ? 'border-primary bg-primary-soft/50 ring-1 ring-primary' : 'border-border hover:bg-hover')}
              >
                <Avatar name={m.name} color={m.color} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-fg">
                    {m.name}
                    {match && <span className="rounded bg-accent-soft px-1 text-[10.5px] font-medium text-accent">Language match</span>}
                    {assigned && <span className="text-[11px] text-fg-3">Already assigned</span>}
                  </div>
                  <div className="text-[12px] text-fg-3">
                    {m.role} · {m.languages.map(langShort).join('/')} · {m.specializations.slice(0, 2).join(', ')}
                  </div>
                </div>
                <div className="text-right text-[12px]">
                  <div className={cn('font-medium tabular', m.workload > 85 ? 'text-error' : m.workload > 70 ? 'text-warning' : 'text-success')}>{m.workload}%</div>
                  <div className="text-fg-3">workload</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

export function EditProjectDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const update = useAppStore((s) => s.updateProject)
  const [name, setName] = useState(project.name)
  const [deadline, setDeadline] = useState(dayKey(project.deadline))
  const [threshold, setThreshold] = useState(String(project.qualityThreshold))
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [description, setDescription] = useState(project.description ?? '')
  const [tp, setTp] = useState(String(project.translationProgress))
  const [rp, setRp] = useState(String(project.reviewProgress))
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDeadline(dayKey(project.deadline))
      setThreshold(String(project.qualityThreshold))
      setStatus(project.status)
      setDescription(project.description ?? '')
      setTp(String(project.translationProgress))
      setRp(String(project.reviewProgress))
    }
  }, [open, project])
  const pct = (v: string) => Number(v) >= 0 && Number(v) <= 100 && v !== ''
  const errors = {
    name: !name.trim() ? 'Name is required.' : undefined,
    threshold: !(Number(threshold) >= 50 && Number(threshold) <= 100) ? 'Use 50–100.' : undefined,
    tp: !pct(tp) ? '0–100' : undefined,
    rp: !pct(rp) ? '0–100' : undefined,
  }
  const invalid = Object.values(errors).some(Boolean)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Edit project"
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={invalid}
              onClick={() => {
                update(project.id, { name: name.trim(), deadline: fromInputDate(deadline), qualityThreshold: Number(threshold), status, description, translationProgress: Number(tp), reviewProgress: Number(rp) })
                toast.success('Project updated.')
                onOpenChange(false)
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project name" htmlFor="ep-name" className="sm:col-span-2" error={errors.name}>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="ep-status">
            <NativeSelect id="ep-status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              <option value="active">Active</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </NativeSelect>
          </Field>
          <Field label="Deadline" htmlFor="ep-deadline">
            <Input id="ep-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Translation progress (%)" htmlFor="ep-tp" error={errors.tp}>
            <Input id="ep-tp" inputMode="numeric" value={tp} onChange={(e) => setTp(e.target.value)} />
          </Field>
          <Field label="Review progress (%)" htmlFor="ep-rp" error={errors.rp}>
            <Input id="ep-rp" inputMode="numeric" value={rp} onChange={(e) => setRp(e.target.value)} />
          </Field>
          <Field label="Quality threshold (%)" htmlFor="ep-q" error={errors.threshold}>
            <Input id="ep-q" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="ep-desc" className="sm:col-span-2" optional>
            <Textarea id="ep-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}
