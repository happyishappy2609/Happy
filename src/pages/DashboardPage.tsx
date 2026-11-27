import { ArrowRight, Bot, Clock3, FileText, FolderKanban, Gauge, OctagonAlert, Plus, ScanSearch, Timer } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IssuesDonutChart } from '@/components/charts/IssuesDonutChart'
import { QualityTrendChart } from '@/components/charts/QualityTrendChart'
import { ActivityFeed } from '@/components/common/ActivityFeed'
import { QualityScoreBadge, RiskBadge } from '@/components/common/badges'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { LangPair } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/controls'
import { CURRENT_USER } from '@/data/seed/team'
import { useCan, useLookups, useProjectStatsMap } from '@/hooks/useData'
import { topRiskProjects, useDashboardMetrics, type DateRange } from '@/hooks/useMetrics'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/utils/cn'
import { deadlineLabel, daysUntil, formatDate, greeting } from '@/utils/dates'
import { formatCompact, formatNumber } from '@/utils/format'
import { QUALITY_SCORE_TOOLTIP } from '@/utils/quality'

export function DashboardPage() {
  const [range, setRange] = useState<DateRange>({ preset: '30' })
  const statsMap = useProjectStatsMap()
  const m = useDashboardMetrics(range, statsMap)
  const projects = useAppStore((s) => s.projects)
  const activities = useAppStore((s) => s.activities)
  const setCreateOpen = useAppStore((s) => s.setCreateProjectOpen)
  const { clientById } = useLookups()
  const navigate = useNavigate()
  const can = useCan()

  const pinned = projects.filter((p) => p.pinned && p.status !== 'completed').slice(0, 5)
  const featured = pinned.length >= 3 ? pinned : projects.filter((p) => p.status === 'active').slice(0, 5)
  const risky = topRiskProjects(projects, statsMap, 3)
  const comparison = range.preset === 'custom' ? 'vs prior period' : `vs previous ${m.days}d`

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${CURRENT_USER.name.split(' ')[0]}`}
        subtitle="Here's what's happening across your localization operations."
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="primary" onClick={() => setCreateOpen(true)} disabled={!can('project.create')} title={!can('project.create') ? 'Your role cannot create projects' : undefined}>
              <Plus /> Create project
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <KPIStatCard label="Active Projects" icon={<FolderKanban />} value={formatNumber(m.kpis.activeProjects.value)} delta={m.kpis.activeProjects.delta} comparison={comparison} spark={m.kpis.activeProjects.spark} onClick={() => navigate('/projects?status=active')} />
        <KPIStatCard label="Words Processed" icon={<FileText />} value={formatCompact(m.kpis.words.value)} delta={m.kpis.words.delta} comparison={comparison} spark={m.kpis.words.spark} tooltip="Source words translated, reviewed or QA-scanned in the selected period." />
        <KPIStatCard label="Average Quality Score" icon={<Gauge />} value={`${m.kpis.quality.value.toFixed(1)}%`} delta={m.kpis.quality.delta} deltaDigits={1} comparison={comparison} spark={m.kpis.quality.spark} tooltip={`Mean score across active projects. ${QUALITY_SCORE_TOOLTIP}`} onClick={() => navigate('/analytics')} />
        <KPIStatCard label="Critical Issues" icon={<OctagonAlert />} value={formatNumber(m.kpis.critical.value)} delta={m.kpis.critical.delta} inverse comparison={comparison} spark={m.kpis.critical.spark} tooltip="Unresolved critical issues across all projects." onClick={() => navigate('/issues?severity=critical&status=unresolved')} />
        <KPIStatCard label="QA Automation Rate" icon={<Bot />} value={`${Math.round(m.kpis.automation.value)}%`} delta={m.kpis.automation.delta} comparison={comparison} spark={m.kpis.automation.spark} tooltip="Share of quality findings detected automatically (AI simulation + rule checks) rather than reported manually." />
        <KPIStatCard label="Review Hours Saved" icon={<Timer />} value={`${Math.round(m.kpis.hours.value)}h`} delta={m.kpis.hours.delta} comparison={comparison} spark={m.kpis.hours.spark} tooltip="Estimated reviewer time saved by automated pre-screening, based on segments analyzed and findings triaged. Demo estimate." />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Quality Performance"
            description={`Average quality score vs. QA target · ${m.label.toLowerCase()}`}
            action={
              <div className="hidden items-center gap-3 text-[12px] text-fg-2 sm:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-[var(--chart-1)]" /> Quality Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0 w-3 border-t border-dashed border-[var(--chart-target)]" /> QA Target
                </span>
              </div>
            }
          />
          <CardBody>
            <QualityTrendChart data={m.trend} target={95} height={250} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Quality Issues by Category" description={`All projects · ${m.label.toLowerCase()}`} action={<Link to="/issues" className="text-[12.5px] font-medium text-primary hover:underline">View issues</Link>} />
          <CardBody>
            <IssuesDonutChart data={m.mix} centerLabel="Issues found" height={176} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Active Projects"
            description="Pinned projects and their delivery health"
            action={
              <Link to="/projects" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                View all <ArrowRight />
              </Link>
            }
          />
          <div className="relative overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-y border-border bg-subtle/60 text-left text-[11.5px] text-fg-2">
                  <th className="py-2 pr-3 pl-5 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium">Language</th>
                  <th className="px-3 py-2 font-medium">Progress</th>
                  <th className="px-3 py-2 font-medium">Quality</th>
                  <th className="px-3 py-2 font-medium">Deadline</th>
                  <th className="py-2 pr-5 pl-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((p) => {
                  const st = statsMap.get(p.id)!
                  const d = daysUntil(p.deadline)
                  return (
                    <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${p.id}`)} tabIndex={0} className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-hover focus-visible:bg-hover">
                      <td className="py-3 pr-3 pl-5">
                        <div className="font-medium text-fg">{p.name}</div>
                        <div className="text-[12px] text-fg-3">{clientById.get(p.clientId)?.name}</div>
                      </td>
                      <td className="px-3 py-3">
                        <LangPair source={p.sourceLang} targets={p.targetLangs} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex w-32 items-center gap-2">
                          <ProgressBar value={st.progress} size="sm" label={`${p.name} progress`} />
                          <span className="w-8 text-right text-[12px] text-fg-2 tabular">{st.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <QualityScoreBadge score={st.score} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-fg tabular">{formatDate(p.deadline)}</div>
                        <div className={cn('text-[12px]', d <= 4 ? 'text-error' : 'text-fg-3')}>{deadlineLabel(p.deadline)}</div>
                      </td>
                      <td className="py-3 pr-5 pl-3">
                        <RiskBadge risk={st.risk} reasons={st.riskReasons} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Projects Requiring Attention" description="Highest calculated delivery risk" icon={<OctagonAlert className="size-4 text-error" />} />
          <ul className="divide-y divide-border border-t border-border">
            {risky.map(({ project: p, stats: st }) => (
              <li key={p.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className={cn('flex size-10 shrink-0 flex-col items-center justify-center rounded-lg text-[13px] font-semibold tabular', st.risk === 'high' ? 'bg-error-soft text-error' : st.risk === 'medium' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success')} title="Risk score (0–100)">
                  {st.riskScore}
                  <span className="text-[9px] font-medium opacity-80">risk</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/projects/${p.id}`} className="truncate text-[13px] font-medium text-fg hover:underline">
                      {p.name}
                    </Link>
                    <Button size="sm" onClick={() => navigate(`/quality?project=${p.id}&status=unresolved`)}>
                      Review
                    </Button>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-fg-2">
                    <span className="inline-flex items-center gap-1 text-error">
                      <OctagonAlert className="size-3" /> {st.openBySeverity.critical} critical
                    </span>
                    <span>·</span>
                    <span>Q {st.score.toFixed(1)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" /> {deadlineLabel(p.deadline)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-fg-3">{st.riskReasons.filter((r) => !r.includes('critical') && !r.startsWith('Due')).slice(0, 2).join(' · ') || 'Elevated delivery risk'}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-3">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => useAppStore.getState().openScanDialog({ projectId: risky[0]?.project.id })} disabled={!can('qa.run')}>
              <ScanSearch /> Run QA on highest-risk project
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader title="Recent Activity" description="Across all projects and team members" />
          <CardBody>
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <ActivityFeed items={activities.slice(0, 5)} limit={5} />
              <div className="mt-4 md:mt-0">
                <ActivityFeed items={activities.slice(5, 10)} limit={5} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
