import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DemoTag } from '@/components/common/misc'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { parseImportFile, type ParsedFile } from '@/services/importService'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode } from '@/types'
import { fromInputDate, dayKey } from '@/utils/dates'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'
import { PROJECT_TYPES } from './CreateProjectDialog'
import { FileDropzone } from './FileDropzone'
import type { ProjectType } from '@/types'

type Phase = 'select' | 'review' | 'importing' | 'done'

export function ParsePreview({ parsed }: { parsed: ParsedFile }) {
  return (
    <div className="rounded-[10px] border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[12px] text-fg-2">
        <span>
          <b className="text-fg">{parsed.segments.length}</b> segments parsed · {parsed.format} · {parsed.hasTargets ? 'bilingual' : 'source only'}
        </span>
        <span className="text-fg-3">Preview</span>
      </div>
      <ul className="max-h-40 divide-y divide-border overflow-y-auto text-[12.5px] scrollbar-thin">
        {parsed.segments.slice(0, 6).map((s, i) => (
          <li key={i} className="grid grid-cols-2 gap-3 px-3 py-1.5">
            <span className="truncate text-fg">{s.source}</span>
            <span className="truncate text-fg-2">{s.target || <i className="text-fg-3">untranslated</i>}</span>
          </li>
        ))}
      </ul>
      {parsed.warnings.map((w) => (
        <p key={w} className="border-t border-border bg-warning-soft px-3 py-1.5 text-[12px] text-warning">
          {w}
        </p>
      ))}
    </div>
  )
}

export function useImportProgress() {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const run = (onDone: () => void) => {
    const stages = ['Uploading file', 'Parsing segments', 'Validating structure', 'Creating segments']
    let p = 0
    const t = setInterval(() => {
      p += 6 + Math.random() * 8
      if (p >= 100) {
        clearInterval(t)
        setProgress(100)
        setStage('Done')
        setTimeout(onDone, 250)
      } else {
        setProgress(p)
        setStage(stages[Math.min(stages.length - 1, Math.floor((p / 100) * stages.length))]!)
      }
    }, 110)
    return () => clearInterval(t)
  }
  return { progress, stage, run, reset: () => setProgress(0) }
}

export function ImportProjectDialog() {
  const open = useAppStore((s) => s.importOpen)
  const setOpen = useAppStore((s) => s.setImportOpen)
  const clients = useAppStore((s) => s.clients)
  const createProject = useAppStore((s) => s.createProject)
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [phase, setPhase] = useState<Phase>('select')
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('c-nova')
  const [target, setTarget] = useState<LangCode>('fr')
  const [type, setType] = useState<ProjectType>('Website Localization')
  const [parsing, setParsing] = useState(false)
  const { progress, stage, run } = useImportProgress()

  useEffect(() => {
    if (open) {
      setFile(null)
      setParsed(null)
      setError('')
      setPhase('select')
    }
  }, [open])

  useEffect(() => {
    if (!file) {
      setParsed(null)
      setPhase('select')
      return
    }
    setParsing(true)
    parseImportFile(file)
      .then((p) => {
        if (!p.segments.length) {
          setError('No segments could be read from this file.')
          setParsed(null)
          return
        }
        setParsed(p)
        setName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        setPhase('review')
      })
      .catch((e: Error) => {
        setError(e.message)
        setParsed(null)
      })
      .finally(() => setParsing(false))
  }, [file])

  const start = () => {
    if (!parsed || !file || !name.trim()) return
    setPhase('importing')
    run(() => {
      const words = parsed.segments.reduce((s, x) => s + x.source.split(/\s+/).length, 0)
      const id = createProject(
        {
          name: name.trim(),
          clientId,
          sourceLang: 'en',
          targetLangs: [target],
          words,
          pmId: 'm-emma',
          deadline: fromInputDate(dayKey(new Date(Date.now() + 10 * 86_400_000))),
          qualityThreshold: clients.find((c) => c.id === clientId)?.qualityTarget ?? 95,
          type,
          description: `Imported from ${file.name} (${parsed.format}, ${parsed.segments.length} segments).`,
        },
        { [target]: parsed.segments },
        { name: file.name, format: parsed.format, sizeKb: Math.max(1, Math.round(file.size / 1024)) },
      )
      setPhase('done')
      toast.success('Project imported.', { description: `${parsed.segments.length} segments ready for AI QA.` })
      setOpen(false)
      navigate(`/projects/${id}?tab=segments`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => phase !== 'importing' && setOpen(o)}>
      <DialogContent
        size="md"
        title={
          <span className="flex items-center gap-2">
            Import project <DemoTag>Demo import</DemoTag>
          </span>
        }
        description="Create a project from a bilingual or source file. Files are parsed in your browser and never uploaded."
        footer={
          <>
            <Button onClick={() => setOpen(false)} disabled={phase === 'importing'}>
              Cancel
            </Button>
            <Button variant="primary" onClick={start} disabled={!parsed || phase !== 'review' || !name.trim()} loading={phase === 'importing'}>
              Import project
            </Button>
          </>
        }
      >
        {phase === 'importing' || phase === 'done' ? (
          <div className="py-6">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-fg">
              {progress >= 100 ? <CheckCircle2 className="size-4 text-success" /> : <Loader2 className="size-4 animate-spin text-primary" />}
              {stage}… <span className="ml-auto text-fg-2 tabular">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} label="Import progress" />
            <p className="mt-3 text-[12px] text-fg-3">{file?.name}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <FileDropzone file={file} onFile={setFile} error={error} onError={setError} />
            {parsing && (
              <p className="flex items-center gap-2 text-[12.5px] text-fg-2">
                <Loader2 className="size-3.5 animate-spin" /> Reading file…
              </p>
            )}
            {parsed && (
              <>
                <ParsePreview parsed={parsed} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project name" htmlFor="imp-name" className="sm:col-span-2" error={!name.trim() ? 'Project name is required.' : undefined}>
                    <Input id="imp-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Client" htmlFor="imp-client">
                    <NativeSelect id="imp-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Target language" htmlFor="imp-target">
                    <NativeSelect id="imp-target" value={target} onChange={(e) => setTarget(e.target.value as LangCode)}>
                      {TARGET_LANGS.map((l) => (
                        <option key={l} value={l}>
                          {LANGUAGES[l].name}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Project type" htmlFor="imp-type" className="sm:col-span-2">
                    <NativeSelect id="imp-type" value={type} onChange={(e) => setType(e.target.value as ProjectType)}>
                      {PROJECT_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
