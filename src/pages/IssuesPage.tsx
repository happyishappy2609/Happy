import { CheckCircle2, FilterX, ListChecks, OctagonAlert, ScanSearch, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { FilterBar, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { IssueDrawer } from '@/components/issues/IssueDrawer'
import { IssueTable } from '@/components/issues/IssueTable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { useCan } from '@/hooks/useData'
import { useAppStore } from '@/store/useAppStore'
import type { IssueCategory, Severity } from '@/types'
import { LANGUAGES } from '@/utils/languages'
import { CATEGORY_LABELS, isOpen } from '@/utils/quality'
import { downloadText, toCSV } from '@/utils/download'

export type StatusFilter = 'unresolved' | 'resolved' | 'ignored' | 'all'

export default function IssuesPage() {
  const [params, setParams] = useSearchParams()
  const issues = useAppStore((s) => s.issues)
  const projects = useAppStore((s) => s.projects)
  const openScan = useAppStore((s) => s.openScanDialog)
  const can = useCan()

  const param = (k: string, d = 'all') => params.get(k) ?? d
  const setParam = (k: string, v: string, d = 'all') => {
    const next = new URLSearchParams(params)
    if (v === d) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }
  const severity = param('severity') as Severity | 'all'
  const status = param('status', 'unresolved') as StatusFilter
  const project = param('project')
  const category = param('category')
  const lang = param('lang')
  const openId = params.get('issue')
  const [q, setQ] = useState('')

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86_400_000
    return {
      total: issues.length,
      critical: issues.filter((i) => isOpen(i) && i.severity === 'critical').length,
      unresolved: issues.filter(isOpen).length,
      resolvedWeek: issues.filter((i) => i.status === 'resolved' && i.resolvedAt && new Date(i.resolvedAt).getTime() >= weekAgo).length,
    }
  }, [issues])

  const base = useMemo(() => {
    const term = q.trim().toLowerCase()
    return issues.filter((i) => {
      if (project !== 'all' && i.projectId !== project) return false
      if (category !== 'all' && i.category !== category) return false
      if (lang !== 'all' && i.lang !== lang) return false
      if (status === 'unresolved' && !isOpen(i)) return false
      if (status === 'resolved' && i.status !== 'resolved') return false
      if (status === 'ignored' && i.status !== 'ignored') return false
      if (term && !`${i.id} ${i.source} ${i.target} ${i.explanation}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [issues, project, category, lang, status, q])

  const filtered = useMemo(() => (severity === 'all' ? base : base.filter((i) => i.severity === severity)), [base, severity])
  const sevCount = (s: Severity) => base.filter((i) => i.severity === s).length
  const langs = useMemo(() => [...new Set(issues.map((i) => i.lang))], [issues])
  const anyFilter = q || project !== 'all' || category !== 'all' || lang !== 'all' || severity !== 'all' || status !== 'unresolved'

  const exportCSV = () => {
    const pName = new Map(projects.map((p) => [p.id, p.name]))
    downloadText(
      toCSV(filtered.map((i) => ({ id: i.id, severity: i.severity, category: i.category, project: pName.get(i.projectId), language: i.lang, segment: i.segmentId, source: i.source, target: i.target, suggestion: i.suggestion, explanation: i.explanation, confidence: i.confidence, status: i.status, created: i.createdAt }))),
      'lingopilot-issues.csv',
      'text/csv;charset=utf-8',
    )
  }

  return (
    <div>
      <PageHeader
        title="Quality Issues"
        subtitle="Review, prioritize, and resolve linguistic risks across projects."
        actions={
          <>
            <Button onClick={exportCSV} disabled={!filtered.length}>
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => openScan(project !== 'all' ? { projectId: project } : undefined)} disabled={!can('qa.run')}>
              <ScanSearch /> Run QA Scan
            </Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIStatCard label="Total Issues" icon={<ListChecks />} value={stats.total} footer="All findings in workspace" onClick={() => setParam('status', 'all', 'unresolved')} />
        <KPIStatCard label="Critical Issues" icon={<OctagonAlert />} value={stats.critical} footer="Unresolved, severity critical" onClick={() => { const n = new URLSearchParams(params); n.set('severity', 'critical'); n.delete('status'); setParams(n, { replace: true }) }} />
        <KPIStatCard label="Unresolved" icon={<TriangleAlert />} value={stats.unresolved} footer="Open or in review" onClick={() => setParam('status', 'unresolved', 'unresolved')} />
        <KPIStatCard label="Resolved This Week" icon={<CheckCircle2 />} value={stats.resolvedWeek} footer="Last 7 days" onClick={() => setParam('status', 'resolved', 'unresolved')} />
      </div>

      <Card>
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented<Severity | 'all'>
              value={severity}
              onChange={(v) => setParam('severity', v)}
              aria-label="Severity"
              options={[
                { value: 'all', label: 'All', count: base.length },
                { value: 'critical', label: 'Critical', count: sevCount('critical') },
                { value: 'major', label: 'Major', count: sevCount('major') },
                { value: 'minor', label: 'Minor', count: sevCount('minor') },
                { value: 'info', label: 'Info', count: sevCount('info') },
              ]}
            />
            <SearchBar value={q} onChange={setQ} placeholder="Search source, target or ID…" className="w-full lg:w-72" />
          </div>
          <FilterBar>
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Status" value={status} onValueChange={(v) => setParam('status', v, 'unresolved')} options={[{ value: 'unresolved', label: 'Unresolved' }, { value: 'resolved', label: 'Resolved' }, { value: 'ignored', label: 'Ignored' }, { value: 'all', label: 'All statuses' }]} />
            <Select size="sm" className="w-auto min-w-[150px]" aria-label="Category" value={category} onValueChange={(v) => setParam('category', v)} options={[{ value: 'all', label: 'All categories' }, ...(Object.keys(CATEGORY_LABELS) as IssueCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))]} />
            <Select size="sm" className="w-auto min-w-[170px]" aria-label="Project" value={project} onValueChange={(v) => setParam('project', v)} options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Language" value={lang} onValueChange={(v) => setParam('lang', v)} options={[{ value: 'all', label: 'All languages' }, ...langs.map((l) => ({ value: l, label: LANGUAGES[l].name }))]} />
            {anyFilter && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQ('')
                  setParams(new URLSearchParams(), { replace: true })
                }}
              >
                <FilterX /> Reset filters
              </Button>
            )}
            <span className="ml-auto text-[12px] text-fg-3 tabular">{filtered.length} issues</span>
          </FilterBar>
        </div>
        <IssueTable
          issues={filtered}
          onOpen={(id) => setParam('issue', id, '')}
          emptyAction={
            <Button variant="primary" onClick={() => openScan()} disabled={!can('qa.run')}>
              <ScanSearch /> Run QA Scan
            </Button>
          }
        />
      </Card>
      <IssueDrawer issueId={openId} onClose={() => setParam('issue', '', '')} siblings={filtered.map((i) => i.id)} onNavigate={(id) => setParam('issue', id, '')} />
    </div>
  )
}
