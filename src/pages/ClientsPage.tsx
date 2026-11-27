import { Building2, FolderKanban, Gauge, Languages } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { EmptyState, LangChip, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { QualityScoreBadge } from '@/components/common/badges'
import { Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useProjectStatsMap } from '@/hooks/useData'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode } from '@/types'
import { formatCompact } from '@/utils/format'

const STATUS = { active: { label: 'Active', tone: 'success' }, onboarding: { label: 'Onboarding', tone: 'primary' }, paused: { label: 'Paused', tone: 'neutral' } } as const

export default function ClientsPage() {
  const clients = useAppStore((s) => s.clients)
  const projects = useAppStore((s) => s.projects)
  const statsMap = useProjectStatsMap()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const rows = useMemo(
    () =>
      clients
        .filter((c) => !q.trim() || `${c.name} ${c.industry}`.toLowerCase().includes(q.trim().toLowerCase()))
        .map((c) => {
          const ps = projects.filter((p) => p.clientId === c.id)
          const active = ps.filter((p) => p.status === 'active' || p.status === 'in_review')
          const langs = [...new Set(ps.flatMap((p) => p.targetLangs))] as LangCode[]
          const avg = active.length ? active.reduce((s, p) => s + (statsMap.get(p.id)?.score ?? 0), 0) / active.length : null
          return { c, active: active.length, langs, avg }
        }),
    [clients, projects, statsMap, q],
  )

  const belowTarget = rows.filter((r) => r.avg !== null && r.avg < r.c.qualityTarget).length

  return (
    <div>
      <PageHeader title="Clients" subtitle="Manage client accounts and quality expectations." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIStatCard label="Clients" icon={<Building2 />} value={clients.length} footer={`${clients.filter((c) => c.status === 'onboarding').length} onboarding`} />
        <KPIStatCard label="Active projects" icon={<FolderKanban />} value={rows.reduce((s, r) => s + r.active, 0)} footer="Across all clients" />
        <KPIStatCard label="Languages delivered" icon={<Languages />} value={new Set(projects.flatMap((p) => p.targetLangs)).size} footer="Target languages" />
        <KPIStatCard label="Below quality target" icon={<Gauge />} value={belowTarget} footer="Clients with avg. score under target" />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <span className="text-[12px] text-fg-3 tabular">{rows.length} clients</span>
          <SearchBar value={q} onChange={setQ} placeholder="Search clients…" className="w-full sm:w-72" />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Building2 />} title="No clients found" description="Try a different search term." />
        ) : (
          <TableWrap>
            <Table className="min-w-[860px]">
              <thead>
                <tr>
                  <Th>Client</Th>
                  <Th>Industry</Th>
                  <Th>Active Projects</Th>
                  <Th>Languages</Th>
                  <Th>Quality Target</Th>
                  <Th>Avg. Quality</Th>
                  <Th>Words This Month</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, active, langs, avg }) => (
                  <Tr key={c.id} onClick={() => navigate(`/clients/${c.id}`)} aria-label={`Open ${c.name}`}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg text-[13px] font-bold text-white" style={{ background: c.color }}>
                          {c.name[0]}
                        </span>
                        <span>
                          <span className="block font-medium text-fg">{c.name}</span>
                          <span className="block text-[12px] text-fg-3">{c.contactName}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="text-fg-2">{c.industry}</Td>
                    <Td className="tabular">{active}</Td>
                    <Td>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {langs.slice(0, 5).map((l) => (
                          <LangChip key={l} lang={l} />
                        ))}
                        {langs.length > 5 && <span className="text-[11.5px] text-fg-3">+{langs.length - 5}</span>}
                      </div>
                    </Td>
                    <Td className="tabular">{c.profile.minQuality}%</Td>
                    <Td>{avg !== null ? <QualityScoreBadge score={avg} /> : <span className="text-fg-3">—</span>}</Td>
                    <Td className="tabular">{formatCompact(c.wordsThisMonth)}</Td>
                    <Td>
                      <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  )
}
