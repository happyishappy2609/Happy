import { ArrowRight, Info, Play, ScanSearch, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DemoTag } from '@/components/common/misc'
import { UploadTranslationsDialog } from '@/components/projects/UploadTranslationsDialog'
import { Button } from '@/components/ui/button'
import { Checkbox, Switch } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, NativeSelect } from '@/components/ui/input'
import { activeQAProvider } from '@/services/qa/demoQAEngine'
import { ALL_RULES, type QAScanProgress } from '@/services/qa/types'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode, QARuleId, QAScan, ScanConfig, ScanSensitivity } from '@/types'
import { cn } from '@/utils/cn'
import { LANGUAGES } from '@/utils/languages'
import { QAReportSummary } from './QAReport'
import { ScanProgress } from './ScanProgress'

const SENSITIVITY: { value: ScanSensitivity; label: string; description: string }[] = [
  { value: 'balanced', label: 'Balanced', description: 'Recommended. Flags findings with ≥60% confidence.' },
  { value: 'strict', label: 'Strict', description: 'Also surfaces low-confidence style suggestions.' },
  { value: 'high_precision', label: 'High Precision', description: 'Only high-confidence findings (≥85%).' },
]

type Phase = 'config' | 'scanning' | 'report'

export function RunScanDialog() {
  const dialog = useAppStore((s) => s.scanDialog)
  const close = useAppStore((s) => s.closeScanDialog)
  const projects = useAppStore((s) => s.projects)
  const settings = useAppStore((s) => s.settings)
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('config')
  const [projectId, setProjectId] = useState('p-nova-ecom')
  const [lang, setLang] = useState<LangCode | 'all'>('fr')
  const [rules, setRules] = useState<QARuleId[]>(settings.defaultRules)
  const [sensitivity, setSensitivity] = useState<ScanSensitivity>(settings.sensitivity)
  const [opts, setOpts] = useState({ useClientGlossary: true, useProjectTerminology: true, checkStyleGuide: true, prioritizeCritical: true })
  const [progress, setProgress] = useState<QAScanProgress | null>(null)
  const [currentLang, setCurrentLang] = useState<LangCode>('fr')
  const [results, setResults] = useState<QAScan[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const abort = useRef<AbortController | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const segCount = useAppStore((s) => s.segments.filter((x) => x.projectId === projectId && (lang === 'all' || x.lang === lang)).length)

  useEffect(() => {
    if (!dialog.open) return
    const pid = dialog.projectId && projects.some((p) => p.id === dialog.projectId) ? dialog.projectId : (projects.find((p) => p.id === 'p-nova-ecom')?.id ?? projects[0]?.id ?? '')
    const p = projects.find((x) => x.id === pid)
    setProjectId(pid)
    setLang(dialog.lang ?? p?.targetLangs[0] ?? 'fr')
    setRules(settings.defaultRules)
    setSensitivity(settings.sensitivity)
    setPhase('config')
    setResults([])
    setProgress(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.open])

  useEffect(() => {
    if (project && lang !== 'all' && !project.targetLangs.includes(lang)) setLang(project.targetLangs[0] ?? 'fr')
  }, [project, lang])

  const start = async () => {
    if (!project || rules.length === 0) return
    const langs = lang === 'all' ? project.targetLangs : [lang]
    setPhase('scanning')
    const ac = new AbortController()
    abort.current = ac
    const done: QAScan[] = []
    try {
      for (const l of langs) {
        setCurrentLang(l)
        setProgress(null)
        const state = useAppStore.getState()
        const config: ScanConfig = { projectId: project.id, lang: l, rules, sensitivity, ...opts }
        const output = await activeQAProvider.scan(
          { project: state.projects.find((p) => p.id === project.id)!, segments: state.segments, glossary: state.glossary, config, existingIssues: state.issues },
          setProgress,
          ac.signal,
        )
        done.push(useAppStore.getState().applyScan(config, output))
      }
      setResults(done)
      setPhase('report')
      if (project.id === 'p-nova-ecom') useAppStore.getState().markDemoStep('runScan')
      const total = done.reduce((s, x) => s + x.summary.issuesDetected, 0)
      toast.success('QA scan completed.', { description: `${project.name}: ${total} issues found across ${done.length} ${done.length === 1 ? 'language' : 'languages'}.` })
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        toast('Scan cancelled.', { description: done.length ? `${done.length} language(s) completed before cancelling.` : 'No changes were made.' })
        if (done.length) {
          setResults(done)
          setPhase('report')
        } else setPhase('config')
      } else {
        toast.error('Scan failed.', { description: 'Something went wrong while analyzing segments. Please retry.' })
        setPhase('config')
      }
    } finally {
      abort.current = null
    }
  }

  const toggleRule = (r: QARuleId) => setRules((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]))

  const footer =
    phase === 'config' ? (
      <>
        <span className="mr-auto hidden items-center gap-1.5 text-[12px] text-fg-3 sm:flex">
          <Info className="size-3.5" /> {segCount} segments · ~6s per language
        </span>
        <Button onClick={close}>Cancel</Button>
        <Button variant="primary" onClick={start} disabled={!project || rules.length === 0 || segCount === 0}>
          <Play /> Start scan
        </Button>
      </>
    ) : phase === 'scanning' ? (
      <Button onClick={() => abort.current?.abort()}>Cancel scan</Button>
    ) : (
      <>
        <Button
          onClick={() => {
            close()
            navigate(`/projects/${projectId}?tab=qa`)
          }}
        >
          Open project
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            close()
            navigate(`/quality?scan=${results[0]?.id}&project=${projectId}&status=unresolved`)
          }}
        >
          Review findings <ArrowRight />
        </Button>
      </>
    )

  return (
    <>
      <Dialog open={dialog.open} onOpenChange={(o) => (!o && phase === 'scanning' ? undefined : o ? undefined : close())}>
        <DialogContent
          size={phase === 'report' ? 'xl' : 'lg'}
          hideClose={phase === 'scanning'}
          onInteractOutside={(e) => phase === 'scanning' && e.preventDefault()}
          title={
            <span className="flex items-center gap-2">
              <ScanSearch className="size-4 text-primary" />
              {phase === 'report' ? 'QA report' : 'Run QA scan'}
              <DemoTag>AI QA simulation</DemoTag>
            </span>
          }
          description={phase === 'report' ? `${project?.name} · ${results.map((r) => LANGUAGES[r.lang].name).join(', ')}` : 'Configure checks for terminology, accuracy, omissions, fluency, formatting and locale rules.'}
          footer={footer}
        >
          {phase === 'config' && project && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Project" htmlFor="scan-project">
                  <NativeSelect id="scan-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    {projects
                      .filter((p) => p.status !== 'completed')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </NativeSelect>
                </Field>
                <Field label="Target language" htmlFor="scan-lang">
                  <NativeSelect id="scan-lang" value={lang} onChange={(e) => setLang(e.target.value as LangCode | 'all')}>
                    {project.targetLangs.map((l) => (
                      <option key={l} value={l}>
                        {LANGUAGES[l].name}
                      </option>
                    ))}
                    {project.targetLangs.length > 1 && <option value="all">All target languages ({project.targetLangs.length})</option>}
                  </NativeSelect>
                </Field>
              </div>
              {segCount === 0 && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-warning-dot/40 bg-warning-soft px-3 py-2 text-[12.5px] text-warning">
                  This project has no translated segments yet.
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Upload /> Upload translations
                  </Button>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-fg">QA rules</span>
                  <button className="text-[12px] font-medium text-primary hover:underline" onClick={() => setRules(rules.length === ALL_RULES.length ? [] : ALL_RULES.map((r) => r.id))}>
                    {rules.length === ALL_RULES.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ALL_RULES.map((r) => (
                    <label key={r.id} className={cn('flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors', rules.includes(r.id) ? 'border-primary/40 bg-primary-soft/40' : 'border-border hover:bg-hover')}>
                      <span className="mt-0.5">
                        <Checkbox checked={rules.includes(r.id)} onCheckedChange={() => toggleRule(r.id)} aria-label={r.label} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-medium text-fg">{r.label}</span>
                        <span className="block text-[11.5px] leading-snug text-fg-3">{r.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {rules.length === 0 && <p className="mt-2 text-[12px] text-error">Select at least one rule.</p>}
              </div>

              <div>
                <div className="mb-2 text-[12.5px] font-medium text-fg">Sensitivity</div>
                <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                  {SENSITIVITY.map((s) => (
                    <button
                      key={s.value}
                      role="radio"
                      aria-checked={sensitivity === s.value}
                      onClick={() => setSensitivity(s.value)}
                      className={cn('rounded-lg border px-3 py-2 text-left transition-colors', sensitivity === s.value ? 'border-primary bg-primary-soft/50 ring-1 ring-primary' : 'border-border hover:bg-hover')}
                    >
                      <span className="block text-[12.5px] font-medium text-fg">{s.label}</span>
                      <span className="block text-[11.5px] leading-snug text-fg-3">{s.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                {(
                  [
                    ['useClientGlossary', 'Use client glossary'],
                    ['useProjectTerminology', 'Use project terminology'],
                    ['checkStyleGuide', 'Check style guide'],
                    ['prioritizeCritical', 'Prioritize critical errors'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between gap-3 text-[13px] text-fg">
                    {label}
                    <Switch checked={opts[k]} onCheckedChange={(v) => setOpts((o) => ({ ...o, [k]: v }))} aria-label={label} />
                  </label>
                ))}
              </div>
              <p className="rounded-lg bg-subtle px-3 py-2 text-[12px] leading-relaxed text-fg-2">
                <b className="text-fg">About this scan:</b> the demo engine combines real rule-based checks (placeholders, numbers, glossary, punctuation, whitespace, negation, length) with deterministic simulated AI findings. No external AI service is called.
              </p>
            </div>
          )}

          {phase === 'scanning' && project && (
            <div className="mx-auto max-w-[460px] py-2">
              <ScanProgress stages={activeQAProvider.stages} progress={progress} label={`${project.name} · ${LANGUAGES[currentLang].name}`} />
            </div>
          )}

          {phase === 'report' && project && (
            <div className="space-y-4">
              {results.length > 1 && (
                <div className="rounded-lg border border-border">
                  <table className="w-full text-[12.5px]">
                    <thead className="bg-subtle/60 text-left text-fg-2">
                      <tr>
                        <th className="px-3 py-2 font-medium">Language</th>
                        <th className="px-3 py-2 font-medium">Score</th>
                        <th className="px-3 py-2 font-medium">Issues</th>
                        <th className="px-3 py-2 font-medium">Critical</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2">{LANGUAGES[r.lang].name}</td>
                          <td className="px-3 py-2 tabular">{r.summary.score.toFixed(1)}</td>
                          <td className="px-3 py-2 tabular">{r.summary.issuesDetected}</td>
                          <td className="px-3 py-2 tabular">{r.summary.severity.critical}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {results[0] && <QAReportSummary scan={results[results.length - 1]!} threshold={project.qualityThreshold} />}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <UploadTranslationsDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={projectId} />
    </>
  )
}
