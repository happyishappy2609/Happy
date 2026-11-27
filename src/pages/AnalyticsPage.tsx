import { CheckCircle2, DollarSign, FilterX, Gauge, RefreshCcw, ScanSearch, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, makeTooltip, SERIES } from '@/components/charts/ChartTooltip'
import { QualityTrendChart } from '@/components/charts/QualityTrendChart'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { EmptyState, FilterBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { getDailySeries } from '@/data/metrics'
import { useLookups, useProjectStatsMap } from '@/hooks/useData'
import { isLiveScan, resolveRange, type DateRange } from '@/hooks/useMetrics'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode, Severity } from '@/types'
import { daysBetween, formatDate } from '@/utils/dates'
import { formatCompact } from '@/utils/format'
import { LANGUAGES, langShort, TARGET_LANGS } from '@/utils/languages'
import { CATEGORY_LABELS, isOpen, round1, SEVERITY_ORDER } from '@/utils/quality'
import { createRng, hashString } from '@/utils/random'
import { BarChart3 } from 'lucide-react'

const SEV_COLORS: Record<Severity, string> = { critical: 'var(--error-dot)', major: 'var(--major-dot)', minor: 'var(--warning-dot)', info: 'var(--info-dot)' }
const HOURLY_RATE = 38

function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[12px] text-fg-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={i.dashed ? 'h-0 w-3 border-t border-dashed' : 'size-2 rounded-sm'} style={i.dashed ? { borderColor: i.color } : { background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const projects = useAppStore((s) => s.projects)
  const issues = useAppStore((s) => s.issues)
  const scans = useAppStore((s) => s.scans)
  const statsMap = useProjectStatsMap()
  const { clients, team, clientById } = useLookups()
  const [range, setRange] = useState<DateRange>({ preset: '30' })
  const [client, setClient] = useState('all')
  const [project, setProject] = useState('all')
  const [lang, setLang] = useState('all')
  const [member, setMember] = useState('all')

  const r = resolveRange(range)
  const anyFilter = client !== 'all' || project !== 'all' || lang !== 'all' || member !== 'all'

  const data = useMemo(() => {
    const series = getDailySeries()
    const cur = series.filter((m) => m.daysAgo <= r.start && m.daysAgo >= r.end)
    const prev = series.filter((m) => m.daysAgo <= r.start + r.days && m.daysAgo >= r.end + r.days)

    const inScope = projects.filter((p) => {
      if (client !== 'all' && p.clientId !== client) return false
      if (project !== 'all' && p.id !== project) return false
      if (lang !== 'all' && !p.targetLangs.includes(lang as LangCode)) return false
      if (member !== 'all' && p.pmId !== member && !p.translatorIds.includes(member) && !p.reviewerIds.includes(member)) return false
      return true
    })
    const ids = new Set(inScope.map((p) => p.id))
    const allWords = projects.reduce((s, p) => s + p.words, 0)
    const scopeWords = inScope.reduce((s, p) => s + (lang === 'all' ? p.words : p.words / p.targetLangs.length), 0)
    const share = anyFilter ? scopeWords / Math.max(1, allWords) : 1

    const inWindow = (iso: string) => {
      const d = Math.floor(daysBetween(iso, new Date().toISOString()))
      return d <= r.start && d >= r.end
    }
    const scopedIssues = issues.filter((i) => ids.has(i.projectId) && (lang === 'all' || i.lang === lang))
    const windowIssues = scopedIssues.filter((i) => inWindow(i.createdAt))

    // Quality — mean of in-scope active projects; daily series reconstructed per project (deterministic) and anchored to today's live score.
    const active = inScope.filter((p) => p.status !== 'completed')
    const scoreOf = (pid: string, l?: LangCode) => {
      const st = statsMap.get(pid)
      return st ? (l ? (st.langScores[l] ?? st.score) : st.score) : 0
    }
    const scopeScore = (pList: typeof inScope) => (pList.length ? pList.reduce((s, p) => s + scoreOf(p.id, lang === 'all' ? undefined : (lang as LangCode)), 0) / pList.length : 0)
    const avgNow = scopeScore(active.length ? active : inScope)
    const trend = [...cur].reverse().map((m) => {
      if (!anyFilter) return { date: m.date, score: round1(m.daysAgo === 0 ? avgNow : m.quality) }
      const rng = createRng(hashString(`${client}${project}${lang}${member}${m.daysAgo}`))
      const drift = m.daysAgo * 0.06 + (rng() - 0.5) * 0.8
      return { date: m.date, score: round1(Math.min(99.5, m.daysAgo === 0 ? avgNow : avgNow - drift)) }
    })
    const avgPrev = anyFilter ? avgNow - r.days * 0.06 : (series.find((m) => m.daysAgo === r.end + r.days)?.quality ?? avgNow)
    const target = inScope.length ? inScope.reduce((s, p) => s + p.qualityThreshold, 0) / inScope.length : 95

    const liveScans = scans.filter((s) => isLiveScan(s) && ids.has(s.projectId) && inWindow(s.completedAt))
    const sum = (arr: typeof cur, f: (m: (typeof cur)[number]) => number) => arr.reduce((s, m) => s + f(m), 0)
    const totalScans = Math.round(sum(cur, (m) => m.scans) * share) + liveScans.length
    const prevScans = Math.round(sum(prev, (m) => m.scans) * share)
    const words = sum(cur, (m) => m.words) * share
    const prevWords = sum(prev, (m) => m.words) * share
    const saved = sum(cur, (m) => m.hoursSaved) * share + liveScans.reduce((s, x) => s + x.summary.reviewMinutesSaved / 60, 0)
    const prevSaved = sum(prev, (m) => m.hoursSaved) * share
    const manual = (words / 1000) * 0.42
    const cost = ((manual - saved) * HOURLY_RATE) / Math.max(1, words)
    const prevCost = (((prevWords / 1000) * 0.42 - prevSaved) * HOURLY_RATE) / Math.max(1, prevWords)
    const rework = sum(cur, (m) => m.reworkRate) / Math.max(1, cur.length)
    const reworkPrev = sum(prev, (m) => m.reworkRate) / Math.max(1, prev.length)
    // Workspace issues are a recent sample; historical volume (seeded baseline, ~84% closed) is blended in.
    const baselineTotal = Math.round(400 * (r.days / 30) * share)
    const closed = scopedIssues.filter((i) => !isOpen(i)).length + Math.round(baselineTotal * 0.84)
    const totalIssues = scopedIssues.length + baselineTotal
    const resolution = totalIssues ? (closed / totalIssues) * 100 : 0

    const byCategory = Object.entries(
      windowIssues.reduce<Record<string, number>>((acc, i) => {
        const k = CATEGORY_LABELS[i.category]
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    const langs = (lang === 'all' ? TARGET_LANGS : [lang as LangCode]).filter((l) => inScope.some((p) => p.targetLangs.includes(l)))
    const byLanguage = langs
      .map((l) => {
        const ps = inScope.filter((p) => p.targetLangs.includes(l) && p.status !== 'completed')
        const v = ps.length ? ps.reduce((s, p) => s + scoreOf(p.id, l), 0) / ps.length : 0
        return { name: LANGUAGES[l].name, short: langShort(l), score: round1(v), projects: ps.length }
      })
      .filter((x) => x.projects > 0)
      .sort((a, b) => b.score - a.score)

    const byClient = clients
      .map((c) => {
        const ps = inScope.filter((p) => p.clientId === c.id && p.status !== 'completed')
        return { name: c.name.replace(' Technologies', '').replace(' Interactive', ''), score: ps.length ? round1(ps.reduce((s, p) => s + scoreOf(p.id), 0) / ps.length) : 0, target: c.qualityTarget, n: ps.length }
      })
      .filter((x) => x.n > 0)

    const bySeverity = clients
      .map((c) => {
        const row: Record<string, number | string> = { name: c.name.split(' ')[0]! }
        for (const s of SEVERITY_ORDER) row[s] = windowIssues.filter((i) => i.severity === s && projects.find((p) => p.id === i.projectId)?.clientId === c.id).length
        return row
      })
      .filter((row) => SEVERITY_ORDER.some((s) => (row[s] as number) > 0))

    const months: { month: string; manual: number; assisted: number; saved: number }[] = []
    for (let k = 5; k >= 0; k--) {
      const ms = series.filter((m) => m.daysAgo >= k * 30 && m.daysAgo < (k + 1) * 30)
      const w = ms.reduce((s, m) => s + m.words, 0) * share
      const sv = ms.reduce((s, m) => s + m.hoursSaved, 0) * share
      const man = (w / 1000) * 0.42
      const d = new Date()
      d.setDate(d.getDate() - k * 30)
      months.push({ month: d.toLocaleString('en-US', { month: 'short' }), manual: Math.round(man), assisted: Math.round(man - sv), saved: Math.round(sv) })
    }

    const reviewers = team
      .filter((m) => m.role.includes('Reviewer') && (member === 'all' || m.id === member))
      .filter((m) => !anyFilter || member !== 'all' || inScope.some((p) => p.reviewerIds.includes(m.id)))
      .map((m) => ({ name: m.name.split(' ')[0]!, full: m.name, quality: m.qualityTrend.at(-1) ?? 0, prev: m.qualityTrend.at(-2) ?? 0, volume: m.reviewsCompleted, turnaround: m.avgTurnaroundHours }))

    return {
      kpi: { avgNow, avgPrev, totalScans, prevScans, rework, reworkPrev, saved, prevSaved, cost, prevCost, resolution, closed, total: totalIssues, words },
      trend,
      target,
      byCategory,
      byLanguage,
      byClient,
      bySeverity,
      months,
      reviewers,
      scopeCount: inScope.length,
    }
  }, [projects, issues, scans, statsMap, clients, team, client, project, lang, member, r.start, r.end, r.days, anyFilter])

  const pct = (a: number, b: number) => (b ? ((a - b) / Math.abs(b)) * 100 : 0)
  const cmp = `vs previous ${r.days}d`
  const NumTip = makeTooltip((_n, v) => String(v))
  const ScoreTip = makeTooltip((_n, v) => `${v.toFixed(1)}%`)
  const HoursTip = makeTooltip((_n, v) => `${v}h`)
  const RevTip = makeTooltip((n, v) => (n === 'Quality score' ? `${v.toFixed(1)}%` : `${v}`))

  return (
    <div>
      <PageHeader title="Quality Analytics" subtitle="Understand quality trends, team performance, and operational efficiency." actions={<DateRangePicker value={range} onChange={setRange} />} />

      <Card className="mb-4 p-3">
        <FilterBar>
          <Select size="sm" className="w-auto min-w-[150px]" aria-label="Client" value={client} onValueChange={(v) => { setClient(v); setProject('all') }} options={[{ value: 'all', label: 'All clients' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
          <Select size="sm" className="w-auto min-w-[170px]" aria-label="Project" value={project} onValueChange={setProject} options={[{ value: 'all', label: 'All projects' }, ...projects.filter((p) => client === 'all' || p.clientId === client).map((p) => ({ value: p.id, label: p.name }))]} />
          <Select size="sm" className="w-auto min-w-[140px]" aria-label="Language" value={lang} onValueChange={setLang} options={[{ value: 'all', label: 'All languages' }, ...TARGET_LANGS.map((l) => ({ value: l, label: LANGUAGES[l].name }))]} />
          <Select size="sm" className="w-auto min-w-[150px]" aria-label="Team member" value={member} onValueChange={setMember} options={[{ value: 'all', label: 'All team members' }, ...team.filter((m) => m.status !== 'invited').map((m) => ({ value: m.id, label: m.name, hint: m.role.replace('Senior ', 'Sr. ') }))]} />
          {anyFilter && (
            <Button size="sm" variant="ghost" onClick={() => { setClient('all'); setProject('all'); setLang('all'); setMember('all') }}>
              <FilterX /> Clear
            </Button>
          )}
          <span className="ml-auto text-[12px] text-fg-3">
            {data.scopeCount} projects · {formatCompact(data.kpi.words)} words · {r.label.toLowerCase()}
          </span>
        </FilterBar>
      </Card>

      {data.scopeCount === 0 ? (
        <Card>
          <EmptyState icon={<BarChart3 />} title="No data for these filters" description="No projects match the selected client, project, language and team member." action={<Button onClick={() => { setClient('all'); setProject('all'); setLang('all'); setMember('all') }}>Clear filters</Button>} />
        </Card>
      ) : (
        <>
          <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6" aria-label="Analytics KPIs">
            <KPIStatCard label="Average Quality Score" icon={<Gauge />} value={`${data.kpi.avgNow.toFixed(1)}%`} delta={pct(data.kpi.avgNow, data.kpi.avgPrev)} deltaDigits={1} comparison={cmp} />
            <KPIStatCard label="Total QA Scans" icon={<ScanSearch />} value={formatCompact(data.kpi.totalScans)} delta={pct(data.kpi.totalScans, data.kpi.prevScans)} comparison={cmp} />
            <KPIStatCard label="Rework Rate" icon={<RefreshCcw />} value={`${data.kpi.rework.toFixed(1)}%`} delta={pct(data.kpi.rework, data.kpi.reworkPrev)} inverse comparison={cmp} tooltip="Share of delivered segments sent back for correction after client or final review." />
            <KPIStatCard label="Review Hours Saved" icon={<Timer />} value={`${Math.round(data.kpi.saved)}h`} delta={pct(data.kpi.saved, data.kpi.prevSaved)} comparison={cmp} tooltip="Estimated, based on segments pre-screened by automated QA. Demo estimate." />
            <KPIStatCard label="Cost per Word" icon={<DollarSign />} value={`$${data.kpi.cost.toFixed(4)}`} delta={pct(data.kpi.cost, data.kpi.prevCost)} inverse comparison={cmp} tooltip={`Linguistic QA cost per source word, assuming $${HOURLY_RATE}/h reviewer rate. Demo assumption.`} />
            <KPIStatCard label="Issue Resolution Rate" icon={<CheckCircle2 />} value={`${Math.round(data.kpi.resolution)}%`} footer={`${data.kpi.closed} of ${data.kpi.total} issues closed`} />
          </section>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Quality trend" description="Average quality score of projects in scope" action={<ChartLegend items={[{ label: 'Quality score', color: 'var(--chart-1)' }, { label: 'Target', color: 'var(--chart-target)', dashed: true }]} />} />
              <CardBody>
                <QualityTrendChart data={data.trend} target={Math.round(data.target * 10) / 10} height={260} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Issues by category" description={`Findings created · ${r.label.toLowerCase()}`} />
              <CardBody>
                {data.byCategory.length === 0 ? (
                  <EmptyState className="py-8" icon={<BarChart3 />} title="No issues in range" description="Try a longer date range." />
                ) : (
                  <div style={{ height: Math.max(200, data.byCategory.length * 26 + 20) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.byCategory} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                        <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                        <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={104} />
                        <Tooltip content={<NumTip />} cursor={{ fill: 'var(--hover)' }} />
                        <Bar dataKey="value" name="Issues" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Quality by language" description="Average score of active projects, per target language" />
              <CardBody>
                <div style={{ height: Math.max(180, data.byLanguage.length * 30 + 20) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byLanguage} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                      <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                      <XAxis type="number" domain={[80, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} width={124} />
                      <Tooltip content={<ScoreTip />} cursor={{ fill: 'var(--hover)' }} />
                      <Bar dataKey="score" name="Quality score" fill="var(--chart-2)" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[11.5px] text-fg-3">Axis starts at 80 to show differences between languages; all scores are on a 0–100 scale.</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Quality by client" description="Average score vs. client quality target" action={<ChartLegend items={[{ label: 'Quality score', color: 'var(--chart-1)' }, { label: 'Client target', color: 'var(--chart-6)' }]} />} />
              <CardBody>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byClient} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barGap={2}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
                      <YAxis domain={[80, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
                      <Tooltip content={<ScoreTip />} cursor={{ fill: 'var(--hover)' }} />
                      <Bar dataKey="score" name="Quality score" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                      <Bar dataKey="target" name="Client target" fill="var(--chart-6)" radius={[4, 4, 0, 0]} barSize={16} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Issues by severity" description={`Per client · ${r.label.toLowerCase()}`} action={<ChartLegend items={SEVERITY_ORDER.map((s) => ({ label: s[0]!.toUpperCase() + s.slice(1), color: SEV_COLORS[s] }))} />} />
              <CardBody>
                {data.bySeverity.length === 0 ? (
                  <EmptyState className="py-8" icon={<BarChart3 />} title="No issues in range" />
                ) : (
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.bySeverity} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
                        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                        <Tooltip content={<NumTip />} cursor={{ fill: 'var(--hover)' }} />
                        {SEVERITY_ORDER.map((s, i) => (
                          <Bar key={s} dataKey={s} name={s[0]!.toUpperCase() + s.slice(1)} stackId="sev" fill={SEV_COLORS[s]} barSize={22} radius={i === SEVERITY_ORDER.length - 1 ? [4, 4, 0, 0] : undefined} isAnimationActive={false} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="QA efficiency" description="Linguistic review hours per month (estimate)" action={<ChartLegend items={[{ label: 'Manual review', color: 'var(--chart-6)' }, { label: 'AI-assisted', color: 'var(--chart-1)' }, { label: 'Time saved', color: 'var(--chart-2)' }]} />} />
              <CardBody>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.months} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barGap={2}>
                      <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                      <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${v}h`} />
                      <Tooltip content={<HoursTip />} cursor={{ fill: 'var(--hover)' }} />
                      <Bar dataKey="manual" name="Manual review" fill="var(--chart-6)" radius={[4, 4, 0, 0]} barSize={14} isAnimationActive={false} />
                      <Bar dataKey="assisted" name="AI-assisted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={14} isAnimationActive={false} />
                      <Line dataKey="saved" name="Time saved" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'var(--chart-2)' }} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[11.5px] text-fg-3">Manual baseline assumes ~2,400 words reviewed per hour. Estimates for demonstration.</p>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title="Reviewer performance" description="Latest quality score and review volume (last 30 days)" action={<ChartLegend items={[{ label: 'Reviews completed', color: 'var(--chart-3)' }, { label: 'Quality score', color: 'var(--chart-1)' }]} />} />
            <CardBody>
              {data.reviewers.length === 0 ? (
                <EmptyState className="py-8" icon={<BarChart3 />} title="No reviewers in scope" description="Select a reviewer or clear the team member filter." />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.reviewers} margin={{ top: 8, right: 0, bottom: 0, left: -12 }}>
                        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
                        <YAxis yAxisId="v" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                        <YAxis yAxisId="q" orientation="right" domain={[90, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} />
                        <Tooltip content={<RevTip />} cursor={{ fill: 'var(--hover)' }} />
                        <Legend content={() => null} />
                        <Bar yAxisId="v" dataKey="volume" name="Reviews completed" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={22} isAnimationActive={false} />
                        <Line yAxisId="q" dataKey="quality" name="Quality score" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3.5, strokeWidth: 0, fill: 'var(--chart-1)' }} isAnimationActive={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="divide-y divide-border rounded-[10px] border border-border text-[12.5px]">
                    {data.reviewers.map((rv, i) => (
                      <li key={rv.full} className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
                          <span className="font-medium text-fg">{rv.full}</span>
                        </span>
                        <span className="text-fg-2 tabular">
                          {rv.quality.toFixed(1)}%{' '}
                          <span className={rv.quality >= rv.prev ? 'text-success' : 'text-error'}>
                            {rv.quality >= rv.prev ? '▲' : '▼'} {Math.abs(rv.quality - rv.prev).toFixed(1)}
                          </span>{' '}
                          · {rv.turnaround}h TAT
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
          <p className="mt-3 text-[11.5px] text-fg-3">
            Historical figures are seeded demo data; current-period values reflect live changes made in this workspace. Last updated {formatDate(new Date().toISOString(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.
            {client !== 'all' && ` Client: ${clientById.get(client)?.name}.`}
          </p>
        </>
      )}
    </div>
  )
}
