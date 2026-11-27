import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useAppStore, type NewProjectInput } from '@/store/useAppStore'
import type { LangCode, ProjectType } from '@/types'
import { dayKey, fromInputDate } from '@/utils/dates'
import { LANGUAGES } from '@/utils/languages'
import { LanguageMultiSelect } from './LanguageMultiSelect'

export const PROJECT_TYPES: ProjectType[] = ['Software Localization', 'Website Localization', 'Marketing Content', 'Product Documentation', 'Game Localization', 'Legal', 'Medical']

interface FormState {
  name: string
  clientId: string
  sourceLang: LangCode
  targetLangs: LangCode[]
  words: string
  pmId: string
  deadline: string
  qualityThreshold: string
  type: ProjectType
  description: string
}

const empty = (): FormState => ({
  name: '',
  clientId: '',
  sourceLang: 'en',
  targetLangs: [],
  words: '',
  pmId: 'm-emma',
  deadline: dayKey(new Date(Date.now() + 14 * 86_400_000)),
  qualityThreshold: '95',
  type: 'Software Localization',
  description: '',
})

export function validateProject(f: FormState) {
  const e: Partial<Record<keyof FormState, string>> = {}
  if (!f.name.trim()) e.name = 'Project name is required.'
  else if (f.name.trim().length < 3) e.name = 'Use at least 3 characters.'
  if (!f.clientId) e.clientId = 'Select a client.'
  if (!f.targetLangs.length) e.targetLangs = 'Select at least one target language.'
  const w = Number(f.words.replace(/[,\s]/g, ''))
  if (!f.words || Number.isNaN(w) || w <= 0) e.words = 'Enter a positive word count.'
  else if (w > 10_000_000) e.words = 'Word count looks too large.'
  if (!f.deadline) e.deadline = 'Choose a deadline.'
  else if (f.deadline < dayKey(new Date())) e.deadline = 'Deadline cannot be in the past.'
  const q = Number(f.qualityThreshold)
  if (Number.isNaN(q) || q < 50 || q > 100) e.qualityThreshold = 'Use a value between 50 and 100.'
  return e
}

export function CreateProjectDialog() {
  const open = useAppStore((s) => s.createProjectOpen)
  const setOpen = useAppStore((s) => s.setCreateProjectOpen)
  const clients = useAppStore((s) => s.clients)
  const team = useAppStore((s) => s.team)
  const createProject = useAppStore((s) => s.createProject)
  const navigate = useNavigate()
  const [f, setF] = useState<FormState>(empty)
  const [touched, setTouched] = useState(false)
  const errors = validateProject(f)
  const show = (k: keyof FormState) => (touched ? errors[k] : undefined)
  const pms = team.filter((m) => m.role === 'Project Manager' || m.role === 'Vendor Manager')

  useEffect(() => {
    if (open) {
      setF(empty())
      setTouched(false)
    }
  }, [open])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }))

  const submit = () => {
    setTouched(true)
    if (Object.keys(errors).length) return
    const input: NewProjectInput = {
      name: f.name,
      clientId: f.clientId,
      sourceLang: f.sourceLang,
      targetLangs: f.targetLangs,
      words: Number(f.words.replace(/[,\s]/g, '')),
      pmId: f.pmId,
      deadline: fromInputDate(f.deadline),
      qualityThreshold: Number(f.qualityThreshold),
      type: f.type,
      description: f.description.trim() || undefined,
    }
    const id = createProject(input)
    setOpen(false)
    toast.success('Project created.', { description: `${input.name} is ready. Upload translations to run AI QA.` })
    navigate(`/projects/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        size="lg"
        title="Create project"
        description="Set up a localization project and its quality expectations."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              Create Project
            </Button>
          </>
        }
      >
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          noValidate
        >
          <fieldset className="space-y-4">
            <legend className="mb-3 text-[12px] font-semibold tracking-wide text-fg-3 uppercase">Project details</legend>
            <Field label="Project Name" htmlFor="cp-name" error={show('name')}>
              <Input id="cp-name" autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nova Winter Campaign" aria-invalid={!!show('name')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client" htmlFor="cp-client" error={show('clientId')}>
                <NativeSelect
                  id="cp-client"
                  value={f.clientId}
                  aria-invalid={!!show('clientId')}
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value)
                    setF((s) => ({ ...s, clientId: e.target.value, qualityThreshold: c ? String(c.qualityTarget) : s.qualityThreshold }))
                  }}
                >
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Project Type" htmlFor="cp-type">
                <NativeSelect id="cp-type" value={f.type} onChange={(e) => set('type', e.target.value as ProjectType)}>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-[12px] font-semibold tracking-wide text-fg-3 uppercase">Languages</legend>
            <Field label="Source Language" htmlFor="cp-src" className="sm:max-w-[50%]">
              <NativeSelect id="cp-src" value={f.sourceLang} onChange={(e) => setF((s) => ({ ...s, sourceLang: e.target.value as LangCode, targetLangs: s.targetLangs.filter((l) => l !== e.target.value) }))}>
                {(Object.keys(LANGUAGES) as LangCode[]).map((l) => (
                  <option key={l} value={l}>
                    {LANGUAGES[l].name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Target Languages" htmlFor="cp-targets" error={show('targetLangs')} hint={f.targetLangs.length ? `${f.targetLangs.length} selected` : undefined}>
              <LanguageMultiSelect id="cp-targets" value={f.targetLangs} onChange={(v) => set('targetLangs', v)} exclude={f.sourceLang} invalid={!!show('targetLangs')} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-[12px] font-semibold tracking-wide text-fg-3 uppercase">Scope, schedule & quality</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Word Count" htmlFor="cp-words" error={show('words')}>
                <Input id="cp-words" inputMode="numeric" value={f.words} onChange={(e) => set('words', e.target.value)} placeholder="e.g. 25,000" aria-invalid={!!show('words')} />
              </Field>
              <Field label="Project Manager" htmlFor="cp-pm">
                <NativeSelect id="cp-pm" value={f.pmId} onChange={(e) => set('pmId', e.target.value)}>
                  {pms.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  <option value="u-alex">Alex Morgan</option>
                </NativeSelect>
              </Field>
              <Field label="Deadline" htmlFor="cp-deadline" error={show('deadline')}>
                <Input id="cp-deadline" type="date" min={dayKey(new Date())} value={f.deadline} onChange={(e) => set('deadline', e.target.value)} aria-invalid={!!show('deadline')} />
              </Field>
              <Field label="Quality Threshold" htmlFor="cp-q" error={show('qualityThreshold')} hint="Defaults to the client's quality target.">
                <div className="relative">
                  <Input id="cp-q" inputMode="decimal" value={f.qualityThreshold} onChange={(e) => set('qualityThreshold', e.target.value)} className="pr-7" aria-invalid={!!show('qualityThreshold')} />
                  <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-fg-3">%</span>
                </div>
              </Field>
            </div>
            <Field label="Description" htmlFor="cp-desc" optional>
              <Textarea id="cp-desc" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Scope, content type, special instructions…" />
            </Field>
          </fieldset>
          <button type="submit" className="hidden" />
        </form>
      </DialogContent>
    </Dialog>
  )
}
