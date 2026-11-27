import { FilterX, Gauge, Layers, OctagonAlert, ScanSearch, SearchX, Timer, TriangleAlert, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { EmptyState, DemoTag, SearchBar } from '@/components/common/misc'
import { ExportMenu } from '@/components/common/ExportMenu'
import { PageHeader } from '@/components/common/PageHeader'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { IssueDrawer } from '@/components/issues/IssueDrawer'
import { UploadTranslationsDialog } from '@/components/projects/UploadTranslationsDialog'
import { FindingCard } from '@/components/quality/FindingCard'
import { QAReportSummary } from '@/components/quality/QAReport'
import { SegmentWorkbench } from '@/components/quality/SegmentWorkbench'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Segmented, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDailySeries } from '@/data/metrics'
import { useCan, useLookups, useProjectStatsMap } from '@/hooks/useData'
import { isLiveScan } from '@/hooks/useMetrics'
import { exportProjectReport } from '@/services/exportService'
import { useAppStore } from '@/store/useAppStore'
import type { IssueCategory, LangCode } from '@/types'
import { formatRelative } from '@/utils/dates'
import { formatCompact, formatNumber } from '@/utils/format'
import { LANGUAGES, pairLabel } from '@/utils/languages'
import { CATEGORY_LABELS, isOpen, QUALITY_SCORE_TOOLTIP, SEVERITY_ORDER } from '@/utils/quality'

type View = 'all' | 'critical' | 'major' | 'minor' | 'info' | 'unresolved' | 'resolved'

function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setD(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return d
}

export default function QualityPage() {
  const [params, setParams] = useSearchParams()
  const issues = useAppStore((s) => s.issues)
  const scans = useAppStore((s) => s.scans)
  const projects = useAppStore((s) => s.projects)
  const openScan = useAppStore((s) => s.openScanDialog)
  const statsMap = useProjectStatsMap()
  const { team, clientById } = useLookups()
  const can = useCan()
  const desktop = useIsDesktop()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [q, setQ] = useState('')

  const get = (k: string, d = 'all') => params.get(k) ?? d
  const setParam = (k: string, v: string | null, d = 'all') => {
    const next = new URLSearchParams(params)
    if (v === null || v === d) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const statusParam = params.get('status')
  const sevParam = params.get('severity')
  const view: View = (params.get('view') as View) ?? (sevParam as View) ?? (statusParam === 'unresolved' ? 'unresolved' : 'unresolved')
  const project = get('project')
  const lang = get('lang')
  const category = get('category')
  const reviewer = get('reviewer')
  const confidence = get('confidence')
  const scanId = params.get('scan')
  const tab = get('tab', 'findings')

  const scan = scanId ? scans.find((s) => s.id === scanId) : undefined
  const reportScan = scan ?? scans.find((s) => isLiveScan(s)) ?? scans[0]
  const reportProject = reportScan ? projects.find((p) => p.id === reportScan.projectId) : undefined
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  const aiIssues = useMemo(() => issues.filter((i) => i.detectedBy !== 'reviewer'), [issues])

  const base = useMemo(() => {
    const term = q.trim().toLowerCase()
    return aiIssues.filter((i) => {
      if (scan && i.scanId !== scan.id) return false
      if (project !== 'all' && i.projectId !== project) return false
      if (lang !== 'all' && i.lang !== lang) return false
      if (category !== 'all' && i.category !== category) return false
      if (reviewer !== 'all' && (reviewer === 'none' ? !!i.assigneeId : i.assigneeId !== reviewer)) return false
      if (confidence === 'high' && i.confidence < 90) return false
      if (confidence === 'medium' && (i.confidence < 75 || i.confidence >= 90)) return false
      if (confidence === 'low' && i.confidence >= 75) return false
      if (term && !`${i.source} ${i.target} ${i.id}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [aiIssues, scan, project, lang, category, reviewer, confidence, q])

  const filtered = useMemo(() => {
    const list = base.filter((i) => {
      if (view === 'unresolved') return isOpen(i)
      if (view === 'resolved') return !isOpen(i)
      if (view === 'all') return true
      return i.severity === view
    })
    return list.sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || b.confidence - a.confidence)
  }, [base, view])

  const selectedParam = params.get('finding')
  const selectedId = selectedParam ?? (desktop ? filtered[0]?.id : null) ?? null
  const selected = selectedId ? issues.find((i) => i.id === selectedId) : undefined

  const count = (v: View) => base.filter((i) => (v === 'unresolved' ? isOpen(i) : v === 'resolved' ? !isOpen(i) : v === 'all' ? true : i.severity === v)).length

  const kpis = useMemo(() => {
    const series = getDailySeries().slice(0, 30)
    const live = scans.filter(isLiveScan)
    const segs = Math.round(series.reduce((s, m) => s + m.words, 0) / 11) + live.reduce((s, x) => s + x.summary.totalSegments, 0)
    const hours = series.reduce((s, m) => s + m.hoursSaved, 0) + live.reduce((s, x) => s + x.summary.reviewMinutesSaved / 60, 0)
    const active = projects.filter((p) => p.status === 'active' || p.status === 'in_review')
    const avg = active.reduce((s, p) => s + (statsMap.get(p.id)?.score ?? 0), 0) / Math.max(1, active.length)
    return {
      segs,
      detected: aiIssues.length,
      critical: aiIssues.filter((i) => isOpen(i) && i.severity === 'critical').length,
      avg,
      hours,
    }
  }, [scans, aiIssues, projects, statsMap])

  const langs = useMemo(() => [...new Set(aiIssues.map((i) => i.lang))] as LangCode[], [aiIssues])
  const reviewers = team.filter((m) => m.role === 'Reviewer' || m.role === 'Senior Reviewer' || m.role === 'Translator')
  const anyFilter = q || project !== 'all' || lang !== 'all' || category !== 'all' || reviewer !== 'all' || confidence !== 'all' || !!scan
  const segProject = project !== 'all' ? project : (reportScan?.projectId ?? 'p-nova-ecom')

  return (
    <div>
      <PageHeader
        title="AI Quality Assurance"
        subtitle="Detect translation issues, reduce review effort, and deliver with confidence."
        eyebrow={<DemoTag>AI QA simulation · deterministic demo engine</DemoTag>}
        actions={
          <>
            <Button onClick={() => setUploadOpen(true)} disabled={!can('segment.edit')}>
              <Upload /> Upload translations
            </Button>
            <Button variant="primary" onClick={() => openScan(project !== 'all' ? { projectId: project } : undefined)} disabled={!can('qa.run')}>
              <ScanSearch /> Run QA Scan
            </Button>
          </>
        }
      />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="QA overview">
        <KPIStatCard label="Segments analyzed" icon={<Layers />} value={formatCompact(kpis.segs)} footer="Last 30 days" />
        <KPIStatCard label="Issues detected" icon={<TriangleAlert />} value={formatNumber(kpis.detected)} footer="AI + rule-based findings" onClick={() => setParam('view', 'all', 'unresolved')} />
        <KPIStatCard label="Critical issues" icon={<OctagonAlert />} value={formatNumber(kpis.critical)} footer="Unresolved" onClick={() => setParam('view', 'critical', 'unresolved')} />
        <KPIStatCard label="Average quality score" icon={<Gauge />} value={`${kpis.avg.toFixed(1)}%`} footer="Active projects" tooltip={QUALITY_SCORE_TOOLTIP} />
        <KPIStatCard label="Est. review time saved" icon={<Timer />} value={`${Math.round(kpis.hours)}h`} footer="Last 30 days · estimate" tooltip="Estimated reviewer hours saved by automated pre-screening. Demo estimate, not a measured value." />
      </section>

      {reportScan && reportProject && (
        <Card className="mb-4">
          <CardHeader
            title={scan ? 'Scan report' : 'Latest QA report'}
            description={
              <>
                {reportProject.name} · {pairLabel('en', reportScan.lang)} · {formatRelative(reportScan.completedAt)} · {reportScan.engine}
              </>
            }
            action={
              <>
                <Select
                  size="sm"
                  className="hidden w-[220px] sm:inline-flex"
                  aria-label="Select scan report"
                  value={reportScan.id}
                  onValueChange={(v) => setParam('scan', v, '')}
                  options={scans.slice(0, 12).map((s) => ({ value: s.id, label: `${projectName.get(s.projectId)} · ${s.lang.toUpperCase()}`, hint: formatRelative(s.completedAt) }))}
                />
                <ExportMenu
                  size="sm"
                  label="Export"
                  onExport={(f) => exportProjectReport(f, reportProject, clientById.get(reportProject.clientId), issues.filter((i) => reportScan.issueIds.includes(i.id)), reportScan, statsMap.get(reportProject.id)?.score ?? reportScan.summary.score)}
                />
              </>
            }
          />
          <div className="px-5 pb-5">
            <QAReportSummary scan={reportScan} threshold={reportProject.qualityThreshold} compact />
          </div>
        </Card>
      )}

      <Card>
        <Tabs value={tab} onValueChange={(v) => setParam('tab', v, 'findings')}>
          <div className="px-4 pt-1">
            <TabsList className="border-b-0">
              <TabsTrigger value="findings" count={count('unresolved')}>
                AI findings
              </TabsTrigger>
              <TabsTrigger value="segments">Segment review</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="findings" className="border-t border-border">
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <Segmented<View>
                  value={view}
                  onChange={(v) => {
                    const n = new URLSearchParams(params)
                    n.delete('severity')
                    n.delete('status')
                    n.delete('finding')
                    if (v === 'unresolved') n.delete('view')
                    else n.set('view', v)
                    setParams(n, { replace: true })
                  }}
                  aria-label="Finding filter"
                  options={[
                    { value: 'all', label: 'All', count: count('all') },
                    { value: 'critical', label: 'Critical', count: count('critical') },
                    { value: 'major', label: 'Major', count: count('major') },
                    { value: 'minor', label: 'Minor', count: count('minor') },
                    { value: 'info', label: 'Info', count: count('info') },
                    { value: 'unresolved', label: 'Unresolved', count: count('unresolved') },
                    { value: 'resolved', label: 'Resolved', count: count('resolved') },
                  ]}
                />
                <SearchBar value={q} onChange={setQ} placeholder="Search source or target text…" className="w-full xl:w-72" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select size="sm" className="w-auto min-w-[130px]" aria-label="Language pair" value={lang} onValueChange={(v) => setParam('lang', v)} options={[{ value: 'all', label: 'All language pairs' }, ...langs.map((l) => ({ value: l, label: pairLabel('en', l), hint: LANGUAGES[l].name }))]} />
                <Select size="sm" className="w-auto min-w-[150px]" aria-label="Project" value={project} onValueChange={(v) => setParam('project', v)} options={[{ value: 'all', label: 'All projects' }, ...projects.filter((p) => aiIssues.some((i) => i.projectId === p.id)).map((p) => ({ value: p.id, label: p.name }))]} />
                <Select size="sm" className="w-auto min-w-[140px]" aria-label="Issue category" value={category} onValueChange={(v) => setParam('category', v)} options={[{ value: 'all', label: 'All categories' }, ...(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]} />
                <Select size="sm" className="w-auto min-w-[140px]" aria-label="Reviewer" value={reviewer} onValueChange={(v) => setParam('reviewer', v)} options={[{ value: 'all', label: 'Any reviewer' }, { value: 'none', label: 'Unassigned' }, ...reviewers.map((m) => ({ value: m.id, label: m.name }))]} />
                <Select size="sm" className="w-auto min-w-[140px]" aria-label="Confidence" value={confidence} onValueChange={(v) => setParam('confidence', v)} options={[{ value: 'all', label: 'Any confidence' }, { value: 'high', label: 'High', hint: '≥ 90%' }, { value: 'medium', label: 'Medium', hint: '75–89%' }, { value: 'low', label: 'Low', hint: '< 75%' }]} />
                {scan && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-[12px] font-medium text-primary">
                    Scan {scan.id.slice(-6)}
                    <button onClick={() => setParam('scan', null)} aria-label="Clear scan filter" className="rounded hover:bg-primary/10">
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {anyFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setQ('')
                      setParams(new URLSearchParams(), { replace: true })
                    }}
                  >
                    <FilterX /> Reset
                  </Button>
                )}
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title={view === 'unresolved' && base.length ? 'All findings resolved' : 'No findings match'}
                description={view === 'unresolved' && base.length ? 'Great work — every finding in this view has been addressed. Run another scan to check new translations.' : 'Change the filters or run a QA scan to surface findings.'}
                action={
                  <Button variant="primary" onClick={() => openScan(project !== 'all' ? { projectId: project } : undefined)} disabled={!can('qa.run')}>
                    <ScanSearch /> Run QA Scan
                  </Button>
                }
              />
            ) : (
              <div className="grid lg:grid-cols-[minmax(320px,420px)_1fr]">
                <div className="max-h-[calc(100dvh-180px)] min-w-0 overflow-y-auto border-border scrollbar-thin lg:border-r" role="list" aria-label="Findings">
                  {filtered.map((i) => (
                    <FindingCard key={i.id} issue={i} projectName={project === 'all' ? projectName.get(i.projectId) : undefined} selected={i.id === selectedId} onSelect={() => setParam('finding', i.id, '')} />
                  ))}
                </div>
                <div className="hidden min-w-0 lg:block">
                  {selected ? (
                    <div className="sticky top-14 max-h-[calc(100dvh-180px)] overflow-y-auto p-5 scrollbar-thin">
                      <IssueDetailPanel issue={selected} />
                    </div>
                  ) : (
                    <EmptyState icon={<ScanSearch />} title="Select a finding" description="Review the source, translation, explanation and suggested correction." />
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="segments" className="border-t border-border">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-[12.5px] text-fg-2">
              Project
              <Select size="sm" className="w-auto min-w-[200px]" aria-label="Project for segment review" value={segProject} onValueChange={(v) => setParam('project', v)} options={projects.filter((p) => p.status !== 'completed').map((p) => ({ value: p.id, label: p.name }))} />
            </div>
            <SegmentWorkbench key={segProject} projectId={segProject} onOpenIssue={(id) => setParam('finding', id, '')} />
          </TabsContent>
        </Tabs>
      </Card>

      {!desktop && <IssueDrawer issueId={selectedParam} onClose={() => setParam('finding', null)} siblings={filtered.map((i) => i.id)} onNavigate={(id) => setParam('finding', id, '')} />}
      {desktop && tab === 'segments' && <IssueDrawer issueId={selectedParam} onClose={() => setParam('finding', null)} />}
      <UploadTranslationsDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={project !== 'all' ? project : undefined} />
    </div>
  )
}
