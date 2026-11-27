import { AlertTriangle, Check, Copy, Database, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DemoTag, LangChip, SectionTitle } from '@/components/common/misc'
import { FileDropzone } from '@/components/projects/FileDropzone'
import { ParsePreview } from '@/components/projects/ImportProjectDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, Drawer } from '@/components/ui/dialog'
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input'
import { useCan } from '@/hooks/useData'
import { parseImportFile, type ParsedFile } from '@/services/importService'
import { hasValue, suggestKey, validateKeyName } from '@/services/stringKeyService'
import { lookupTM } from '@/services/tmService'
import { useAppStore, type ImportedSegment } from '@/store/useAppStore'
import type { LangCode, Project, StringKeyRow } from '@/types'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/dates'
import { LANGUAGES } from '@/utils/languages'
import { isOpen } from '@/utils/quality'

function LengthHint({ value, max }: { value: string; max?: number }) {
  if (!max) return <span className="text-fg-3 tabular">{value.length} chars</span>
  const over = value.length > max
  return (
    <span className={cn('tabular', over ? 'font-medium text-error' : 'text-fg-3')}>
      {value.length} / {max}
      {over && ' · too long'}
    </span>
  )
}

/* ─────────────────────────────── Add key ─────────────────────────────── */

export function AddKeyDialog({ project, open, onOpenChange, existingKeys, onCreated }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void; existingKeys: Set<string>; onCreated?: (key: string) => void }) {
  const addStringKey = useAppStore((s) => s.addStringKey)
  const [key, setKey] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [maxLength, setMaxLength] = useState('')
  const [values, setValues] = useState<Partial<Record<LangCode, string>>>({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setKey('')
      setSource('')
      setNote('')
      setMaxLength('')
      setValues({})
      setTouched(false)
    }
  }, [open])

  const keyErr = validateKeyName(key, existingKeys)
  const sourceErr = !source.trim() ? 'Source text is required.' : undefined
  const maxErr = maxLength && !(Number(maxLength) >= 1 && Number(maxLength) <= 2000) ? 'Use a number between 1 and 2000.' : undefined
  const namespaces = [...new Set([...existingKeys].map((k) => k.split('.')[0]!))].slice(0, 6)

  const submit = () => {
    setTouched(true)
    if (keyErr || sourceErr || maxErr) return
    addStringKey(project.id, { key, source, note, maxLength: maxLength ? Number(maxLength) : undefined, values })
    const filled = Object.values(values).filter((v) => v?.trim()).length
    toast.success('String key created.', { description: `${key.trim()} · ${filled} of ${project.targetLangs.length} language values added.` })
    onCreated?.(key.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title="Add string key"
        description={`Create a resource key in ${project.name}, then add its value for each target language.`}
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>
              Create key
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-3 text-[12px] font-semibold tracking-wide text-fg-3 uppercase">1 · Key</legend>
            <Field label="Key" htmlFor="k-key" className="sm:col-span-2" error={touched ? (keyErr ?? undefined) : undefined} hint="Dot-separated, e.g. checkout.title. Namespaces group related strings.">
              <div className="flex gap-2">
                <Input id="k-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="checkout.title" className="font-mono text-[12.5px]" aria-invalid={touched && !!keyErr} autoFocus />
                <Button type="button" onClick={() => setKey(suggestKey(source || 'new string', namespaces[0] ?? 'strings', existingKeys))} disabled={!source.trim()} title="Suggest a key from the source text">
                  <Wand2 /> Suggest
                </Button>
              </div>
              {namespaces.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11.5px] text-fg-3">
                  Namespaces:
                  {namespaces.map((n) => (
                    <button type="button" key={n} onClick={() => setKey(`${n}.${key.split('.').slice(1).join('.')}`)} className="rounded bg-subtle px-1.5 py-0.5 font-mono text-fg-2 hover:bg-border">
                      {n}.
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Source text (English)" htmlFor="k-source" className="sm:col-span-2" error={touched ? sourceErr : undefined}>
              <Textarea id="k-source" value={source} onChange={(e) => setSource(e.target.value)} className="min-h-[60px]" placeholder="Proceed to checkout" aria-invalid={touched && !!sourceErr} />
            </Field>
            <Field label="Context note for translators" htmlFor="k-note" optional>
              <Input id="k-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Button on the cart page" />
            </Field>
            <Field label="Max length" htmlFor="k-max" optional error={maxErr} hint="Flagged by QA when a value is longer.">
              <Input id="k-max" inputMode="numeric" value={maxLength} onChange={(e) => setMaxLength(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 24" />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-3 text-[12px] font-semibold tracking-wide text-fg-3 uppercase">2 · Values</legend>
            <p className="-mt-1 text-[12px] text-fg-3">Optional now — empty languages show as missing and can be filled in later.</p>
            {project.targetLangs.map((l) => (
              <div key={l} className="grid gap-1.5 sm:grid-cols-[130px_1fr] sm:items-start">
                <label htmlFor={`k-val-${l}`} className="flex items-center gap-2 pt-1.5 text-[12.5px] font-medium text-fg">
                  <LangChip lang={l} /> {LANGUAGES[l].name}
                </label>
                <div>
                  <Input id={`k-val-${l}`} value={values[l] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [l]: e.target.value }))} placeholder={`${LANGUAGES[l].name} value`} />
                  {(values[l] ?? '').length > 0 && (
                    <div className="mt-1 text-[11.5px]">
                      <LengthHint value={values[l] ?? ''} max={maxLength ? Number(maxLength) : undefined} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────────────────────── Import ─────────────────────────────── */

export function ImportKeysDialog({ project, open, onOpenChange, existingKeys }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void; existingKeys: Set<string> }) {
  const importStringKeys = useAppStore((s) => s.importStringKeys)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [target, setTarget] = useState<'source' | LangCode>('source')

  useEffect(() => {
    if (open) {
      setFile(null)
      setParsed(null)
      setError('')
      setTarget('source')
    }
  }, [open])

  useEffect(() => {
    if (!file) return setParsed(null)
    parseImportFile(file)
      .then((p) => (p.segments.length ? setParsed(p) : setError('No strings could be read from this file.')))
      .catch((e: Error) => setError(e.message))
  }, [file])

  const plan = useMemo(() => {
    if (!parsed) return null
    const rows: ImportedSegment[] = parsed.segments.map((r) => ({
      key: r.key,
      // A key-value file holds one language: its values are source strings or that language's values.
      source: target !== 'source' && !parsed.hasTargets ? '' : r.source,
      target: target === 'source' ? '' : parsed.hasTargets ? r.target : r.source,
    }))
    const known = rows.filter((r) => r.key && existingKeys.has(r.key))
    const unknown = rows.filter((r) => !r.key || !existingKeys.has(r.key))
    const usable = target === 'source' || parsed.hasTargets ? rows : known
    return { rows: usable, create: target === 'source' || parsed.hasTargets ? unknown.length : 0, update: known.length, skipped: rows.length - usable.length }
  }, [parsed, target, existingKeys])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={
          <span className="flex items-center gap-2">
            Import string keys <DemoTag>Parsed in your browser</DemoTag>
          </span>
        }
        description="JSON (flat or nested), CSV with key/source/target columns, or XLIFF with unit IDs."
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!plan || plan.rows.length === 0}
              onClick={() => {
                if (!plan) return
                const r = importStringKeys(project.id, plan.rows, target === 'source' ? null : target)
                toast.success('String keys imported.', { description: `${r.created} created, ${r.updated} updated${plan.skipped ? `, ${plan.skipped} unknown keys skipped` : ''}.` })
                onOpenChange(false)
              }}
            >
              Import
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="File contains" htmlFor="ik-target" hint={target === 'source' ? 'Creates new keys and updates source text of existing keys.' : `Adds ${LANGUAGES[target].name} values to keys that already exist.`}>
            <NativeSelect id="ik-target" value={target} onChange={(e) => setTarget(e.target.value as 'source' | LangCode)}>
              <option value="source">Source strings (English)</option>
              {project.targetLangs.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGES[l].name} values
                </option>
              ))}
            </NativeSelect>
          </Field>
          <FileDropzone file={file} onFile={setFile} error={error} onError={setError} />
          {parsed && <ParsePreview parsed={parsed} />}
          {plan && (
            <p className="rounded-lg bg-subtle px-3 py-2 text-[12.5px] text-fg-2">
              <b className="text-fg">{plan.create}</b> new keys · <b className="text-fg">{plan.update}</b> existing keys updated{plan.skipped > 0 && <> · <b className="text-warning">{plan.skipped}</b> keys not in this project will be skipped</>}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ─────────────────────────────── Key drawer ─────────────────────────────── */

function ValueEditor({ project, row, lang }: { project: Project; row: StringKeyRow; lang: LangCode }) {
  const setKeyValue = useAppStore((s) => s.setKeyValue)
  const tm = useAppStore((s) => s.tm)
  const issues = useAppStore((s) => s.issues)
  const can = useCan()
  const seg = row.values[lang]
  const [draft, setDraft] = useState(seg?.target ?? '')
  useEffect(() => setDraft(seg?.target ?? ''), [seg?.target, row.key])
  const dirty = draft.trim() !== (seg?.target ?? '')
  const open = seg ? issues.filter((i) => i.segmentId === seg.id && isOpen(i)) : []
  const match = useMemo(() => lookupTM(row.source, 'en', lang, tm, project.clientId, 1)[0], [row.source, lang, tm, project.clientId])

  const save = (value = draft) => {
    setKeyValue(project.id, row.key, lang, value)
    toast.success(value.trim() ? 'Value saved.' : 'Value cleared.', { description: `${row.key} · ${LANGUAGES[lang].name}` })
  }

  return (
    <div className="rounded-[10px] border border-border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <LangChip lang={lang} />
        <span className="text-[13px] font-medium text-fg">{LANGUAGES[lang].name}</span>
        {hasValue(seg) ? <Badge tone={seg!.status === 'reviewed' || seg!.status === 'approved' ? 'success' : 'primary'}>{seg!.status === 'approved' ? 'Approved' : seg!.status === 'reviewed' ? 'Reviewed' : 'Translated'}</Badge> : <Badge tone="warning">Missing</Badge>}
        {open.length > 0 && (
          <Link to={`/projects/${project.id}?tab=segments&segment=${seg!.id}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-error hover:underline">
            <AlertTriangle className="size-3" /> {open.length} open {open.length === 1 ? 'issue' : 'issues'}
          </Link>
        )}
        {seg?.editedAt && <span className="ml-auto text-[11.5px] text-fg-3">Edited {formatRelative(seg.editedAt)}</span>}
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && dirty) save()
        }}
        disabled={!can('segment.edit')}
        className="min-h-[56px] text-[13.5px]"
        placeholder={`Add the ${LANGUAGES[lang].name} value…`}
        aria-label={`${LANGUAGES[lang].name} value for ${row.key}`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
        <LengthHint value={draft} max={row.maxLength} />
        {match && match.unit.target !== draft && (
          <button type="button" disabled={!can('segment.edit')} onClick={() => setDraft(match.unit.target)} className="inline-flex max-w-full items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-fg-2 hover:bg-border disabled:opacity-50" title={match.unit.target}>
            <Database className="size-3" /> TM {match.score}%: <span className="truncate">{match.unit.target}</span>
          </button>
        )}
        <span className="ml-auto flex gap-1.5">
          {dirty && (
            <Button size="sm" variant="ghost" onClick={() => setDraft(seg?.target ?? '')}>
              Discard
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={!dirty || !can('segment.edit')} onClick={() => save()} aria-label={`Save ${LANGUAGES[lang].name} value`}>
            <Check /> Save
          </Button>
        </span>
      </div>
    </div>
  )
}

export function KeyDrawer({ project, row, onClose, existingKeys, onRenamed }: { project: Project; row: StringKeyRow | null; onClose: () => void; existingKeys: Set<string>; onRenamed: (key: string) => void }) {
  const updateStringKey = useAppStore((s) => s.updateStringKey)
  const deleteStringKey = useAppStore((s) => s.deleteStringKey)
  const can = useCan()
  const [key, setKey] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [maxLength, setMaxLength] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (row) {
      setKey(row.key)
      setSource(row.source)
      setNote(row.note ?? '')
      setMaxLength(row.maxLength ? String(row.maxLength) : '')
    }
  }, [row])

  if (!row) return <Drawer open={false} onOpenChange={() => onClose()} title="">{null}</Drawer>

  const keyErr = validateKeyName(key, existingKeys, row.key)
  const dirty = key.trim() !== row.key || source.trim() !== row.source || note.trim() !== (row.note ?? '') || (maxLength ? Number(maxLength) : undefined) !== row.maxLength
  const sourceChanged = source.trim() !== row.source
  const filled = project.targetLangs.filter((l) => hasValue(row.values[l])).length

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      width="max-w-[620px]"
      title={<span className="font-mono text-[14px]">{row.key}</span>}
      description={`${filled} of ${project.targetLangs.length} languages have a value`}
      footer={
        <>
          <Button variant="danger-ghost" className="mr-auto" onClick={() => setConfirmDelete(true)} disabled={!can('project.edit')}>
            <Trash2 /> Delete key
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionTitle
            action={
              <button
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(row.key)
                    .then(() => toast.success('Key copied.'))
                    .catch(() => toast.error('Could not copy', { description: 'Select the key text and copy it manually.' }))
                }
              >
                <Copy className="size-3" /> Copy key
              </button>
            }
          >
            Key details
          </SectionTitle>
          <Field label="Key" htmlFor="kd-key" error={keyErr ?? undefined}>
            <Input id="kd-key" value={key} onChange={(e) => setKey(e.target.value)} className="font-mono text-[12.5px]" disabled={!can('project.edit')} />
          </Field>
          <Field label="Source text (English)" htmlFor="kd-source" hint={sourceChanged ? 'Changing the source keeps existing values; re-run QA to verify them.' : undefined}>
            <Textarea id="kd-source" value={source} onChange={(e) => setSource(e.target.value)} className="min-h-[56px]" disabled={!can('project.edit')} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <Field label="Context note" htmlFor="kd-note" optional>
              <Input id="kd-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where this string appears" disabled={!can('project.edit')} />
            </Field>
            <Field label="Max length" htmlFor="kd-max" optional>
              <Input id="kd-max" inputMode="numeric" value={maxLength} onChange={(e) => setMaxLength(e.target.value.replace(/\D/g, ''))} disabled={!can('project.edit')} />
            </Field>
          </div>
          {dirty && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setKey(row.key); setSource(row.source); setNote(row.note ?? ''); setMaxLength(row.maxLength ? String(row.maxLength) : '') }}>
                Discard
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!!keyErr || !source.trim() || !can('project.edit')}
                onClick={() => {
                  updateStringKey(project.id, row.key, { key: key.trim(), source, note, maxLength: maxLength ? Number(maxLength) : 0 })
                  toast.success('Key updated.')
                  if (key.trim() !== row.key) onRenamed(key.trim())
                }}
              >
                <Check /> Save key
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <SectionTitle>
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Values
            </span>
          </SectionTitle>
          {project.targetLangs.map((l) => (
            <ValueEditor key={l} project={project} row={row} lang={l} />
          ))}
          <p className="text-[11.5px] text-fg-3">Tip: Ctrl/⌘ + Enter saves a value. Run AI QA on the project to check new values.</p>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        danger
        title="Delete string key?"
        description={`"${row.key}" and its ${filled} language values will be removed from ${project.name}, together with any QA findings on them.`}
        confirmLabel="Delete key"
        onConfirm={() => {
          deleteStringKey(project.id, row.key)
          toast.success('String key deleted.')
          onClose()
        }}
      />
    </Drawer>
  )
}
