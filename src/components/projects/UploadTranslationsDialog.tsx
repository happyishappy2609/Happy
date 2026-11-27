import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DemoTag } from '@/components/common/misc'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, NativeSelect } from '@/components/ui/input'
import { parseImportFile, type ParsedFile } from '@/services/importService'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode } from '@/types'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'
import { FileDropzone } from './FileDropzone'
import { ParsePreview, useImportProgress } from './ImportProjectDialog'

/** Upload a bilingual file into an existing project (updates or appends segments). */
export function UploadTranslationsDialog({ open, onOpenChange, projectId: fixedProject }: { open: boolean; onOpenChange: (o: boolean) => void; projectId?: string }) {
  const projects = useAppStore((s) => s.projects)
  const importTranslations = useAppStore((s) => s.importTranslations)
  const openScanDialog = useAppStore((s) => s.openScanDialog)
  const [projectId, setProjectId] = useState(fixedProject ?? 'p-nova-ecom')
  const project = projects.find((p) => p.id === projectId)
  const [lang, setLang] = useState<LangCode>(project?.targetLangs[0] ?? 'fr')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [busy, setBusy] = useState(false)
  const { progress, stage, run } = useImportProgress()

  useEffect(() => {
    if (open) {
      setFile(null)
      setParsed(null)
      setError('')
      setBusy(false)
      if (fixedProject) setProjectId(fixedProject)
    }
  }, [open, fixedProject])

  useEffect(() => {
    if (project && !project.targetLangs.includes(lang)) setLang(project.targetLangs[0] ?? 'fr')
  }, [project, lang])

  useEffect(() => {
    if (!file) return setParsed(null)
    parseImportFile(file)
      .then((p) => {
        if (!p.hasTargets) {
          setError('This file has no translations. Upload a bilingual file (source + target).')
          setParsed(null)
        } else setParsed(p)
      })
      .catch((e: Error) => setError(e.message))
  }, [file])

  const submit = () => {
    if (!parsed || !file || !project) return
    setBusy(true)
    run(() => {
      const r = importTranslations(project.id, lang, parsed.segments, { name: file.name, format: parsed.format, sizeKb: Math.max(1, Math.round(file.size / 1024)) })
      onOpenChange(false)
      toast.success('Translations uploaded.', {
        description: `${r.updated} updated, ${r.added} new segments in ${project.name}.`,
        action: { label: 'Run QA', onClick: () => openScanDialog({ projectId: project.id, lang }) },
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent
        title={
          <span className="flex items-center gap-2">
            Upload translations <DemoTag>Demo import</DemoTag>
          </span>
        }
        description="Add or update target segments, then run an AI QA scan on the new batch."
        footer={
          <>
            <Button onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} disabled={!parsed || busy} loading={busy}>
              Upload
            </Button>
          </>
        }
      >
        {busy ? (
          <div className="py-6">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-fg">
              {progress >= 100 ? <CheckCircle2 className="size-4 text-success" /> : <Loader2 className="size-4 animate-spin text-primary" />}
              {stage}… <span className="ml-auto text-fg-2 tabular">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} label="Upload progress" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Project" htmlFor="ut-project">
                <NativeSelect id="ut-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!!fixedProject}>
                  {projects
                    .filter((p) => p.status !== 'completed')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
              <Field label="Target language" htmlFor="ut-lang">
                <NativeSelect id="ut-lang" value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
                  {(project?.targetLangs ?? TARGET_LANGS).map((l) => (
                    <option key={l} value={l}>
                      {LANGUAGES[l].name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <FileDropzone file={file} onFile={setFile} error={error} onError={setError} />
            {parsed && <ParsePreview parsed={parsed} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
