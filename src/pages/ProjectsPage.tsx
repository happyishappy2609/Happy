import { FilterX, Plus, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FilterBar, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { useCan, useLookups, useProjectStatsMap } from '@/hooks/useData'
import { useAppStore } from '@/store/useAppStore'
import type { Project } from '@/types'
import { daysUntil } from '@/utils/dates'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'
import type { ProjectStats } from '@/utils/quality'

type StatusFilter = 'all' | 'active' | 'in_review' | 'completed' | 'at_risk'

export const isAtRisk = (p: Project, st: ProjectStats | undefined) => !!st && p.status !== 'completed' && (st.risk === 'high' || st.score < p.qualityThreshold - 3 || st.openBySeverity.critical >= 2)

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams()
  const projects = useAppStore((s) => s.projects)
  const setCreateOpen = useAppStore((s) => s.setCreateProjectOpen)
  const setImportOpen = useAppStore((s) => s.setImportOpen)
  const statsMap = useProjectStatsMap()
  const { clients, team } = useLookups()
  const can = useCan()

  const status = (params.get('status') as StatusFilter) || 'all'
  const [q, setQ] = useState('')
  const [client, setClient] = useState(params.get('client') ?? 'all')
  const [lang, setLang] = useState('all')
  const [pm, setPm] = useState('all')
  const [quality, setQuality] = useState('all')
  const [deadline, setDeadline] = useState('all')

  const setStatus = (s: StatusFilter) => {
    const next = new URLSearchParams(params)
    if (s === 'all') next.delete('status')
    else next.set('status', s)
    setParams(next, { replace: true })
  }

  const counts = useMemo(() => {
    const c = { all: projects.length, active: 0, in_review: 0, completed: 0, at_risk: 0 }
    for (const p of projects) {
      if (p.status === 'active') c.active++
      if (p.status === 'in_review') c.in_review++
      if (p.status === 'completed') c.completed++
      if (isAtRisk(p, statsMap.get(p.id))) c.at_risk++
    }
    return c
  }, [projects, statsMap])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return projects.filter((p) => {
      const st = statsMap.get(p.id)
      if (status === 'at_risk' ? !isAtRisk(p, st) : status !== 'all' && p.status !== status) return false
      if (client !== 'all' && p.clientId !== client) return false
      if (lang !== 'all' && !p.targetLangs.includes(lang as never)) return false
      if (pm !== 'all' && p.pmId !== pm) return false
      if (quality !== 'all' && st) {
        if (quality === 'excellent' && st.score < 98) return false
        if (quality === 'good' && (st.score < 95 || st.score >= 98)) return false
        if (quality === 'attention' && (st.score < 90 || st.score >= 95)) return false
        if (quality === 'risk' && st.score >= 90) return false
      }
      if (deadline !== 'all') {
        const d = daysUntil(p.deadline)
        if (p.status === 'completed') return false
        if (deadline === 'overdue' && d >= 0) return false
        if (deadline === '7' && (d < 0 || d > 7)) return false
        if (deadline === '14' && (d < 0 || d > 14)) return false
        if (deadline === '30' && (d < 0 || d > 30)) return false
      }
      if (term) {
        const c = clients.find((x) => x.id === p.clientId)?.name.toLowerCase() ?? ''
        if (!p.name.toLowerCase().includes(term) && !c.includes(term) && !p.code.toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [projects, statsMap, status, client, lang, pm, quality, deadline, q, clients])

  const anyFilter = q || client !== 'all' || lang !== 'all' || pm !== 'all' || quality !== 'all' || deadline !== 'all'
  const clear = () => {
    setQ('')
    setClient('all')
    setLang('all')
    setPm('all')
    setQuality('all')
    setDeadline('all')
  }
  const pms = team.filter((m) => m.role === 'Project Manager' || m.role === 'Vendor Manager')

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Manage localization projects, quality, and delivery."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)} disabled={!can('project.create')}>
              <Upload /> Import project
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)} disabled={!can('project.create')}>
              <Plus /> Create project
            </Button>
          </>
        }
      />

      <Card>
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented<StatusFilter>
              value={status}
              onChange={setStatus}
              aria-label="Project status"
              options={[
                { value: 'all', label: 'All Projects', count: counts.all },
                { value: 'active', label: 'Active', count: counts.active },
                { value: 'in_review', label: 'In Review', count: counts.in_review },
                { value: 'completed', label: 'Completed', count: counts.completed },
                { value: 'at_risk', label: 'At Risk', count: counts.at_risk },
              ]}
            />
            <SearchBar value={q} onChange={setQ} placeholder="Search by project or client…" className="w-full lg:w-72" />
          </div>
          <FilterBar>
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Client" value={client} onValueChange={setClient} options={[{ value: 'all', label: 'All clients' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Language" value={lang} onValueChange={setLang} options={[{ value: 'all', label: 'All languages' }, ...TARGET_LANGS.map((l) => ({ value: l, label: LANGUAGES[l].name }))]} />
            <Select size="sm" className="w-auto min-w-[150px]" aria-label="Project manager" value={pm} onValueChange={setPm} options={[{ value: 'all', label: 'All managers' }, ...pms.map((m) => ({ value: m.id, label: m.name }))]} />
            <Select
              size="sm"
              className="w-auto min-w-[150px]"
              aria-label="Quality score"
              value={quality}
              onValueChange={setQuality}
              options={[
                { value: 'all', label: 'Any quality' },
                { value: 'excellent', label: 'Excellent', hint: '98–100' },
                { value: 'good', label: 'Good', hint: '95–97.9' },
                { value: 'attention', label: 'Needs attention', hint: '90–94.9' },
                { value: 'risk', label: 'At risk', hint: '<90' },
              ]}
            />
            <Select
              size="sm"
              className="w-auto min-w-[140px]"
              aria-label="Deadline"
              value={deadline}
              onValueChange={setDeadline}
              options={[
                { value: 'all', label: 'Any deadline' },
                { value: 'overdue', label: 'Overdue' },
                { value: '7', label: 'Next 7 days' },
                { value: '14', label: 'Next 14 days' },
                { value: '30', label: 'Next 30 days' },
              ]}
            />
            {anyFilter && (
              <Button size="sm" variant="ghost" onClick={clear}>
                <FilterX /> Clear filters
              </Button>
            )}
            <span className="ml-auto text-[12px] text-fg-3 tabular">{filtered.length} projects</span>
          </FilterBar>
        </div>
        <ProjectTable
          projects={filtered}
          statsMap={statsMap}
          emptyAction={
            <>
              {anyFilter && <Button onClick={clear}>Clear filters</Button>}
              <Button variant="primary" onClick={() => setCreateOpen(true)} disabled={!can('project.create')}>
                <Plus /> Create project
              </Button>
            </>
          }
        />
      </Card>
    </div>
  )
}
