import { BadgeCheck, Clock, FileText, Gauge, MailPlus, MessageSquareQuote, UserCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, makeTooltip } from '@/components/charts/ChartTooltip'
import { Avatar } from '@/components/common/Avatar'
import { QualityScoreBadge, severityMeta } from '@/components/common/badges'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { EmptyState, FilterBar, LangChip, SearchBar, SectionTitle } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/controls'
import { Drawer } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { useCan, useProjectStatsMap } from '@/hooks/useData'
import { InviteDialog } from '@/components/team/InviteDialog'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode, TeamMember } from '@/types'
import { cn } from '@/utils/cn'
import { formatCompact } from '@/utils/format'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'
import { CATEGORY_LABELS, isOpen } from '@/utils/quality'

const STATUS: Record<TeamMember['status'], { label: string; tone: 'success' | 'warning' | 'neutral' | 'primary' }> = {
  available: { label: 'Available', tone: 'success' },
  busy: { label: 'Busy', tone: 'warning' },
  away: { label: 'Away', tone: 'neutral' },
  invited: { label: 'Invited', tone: 'primary' },
}

const MONTHS = (() => {
  const out: string[] = []
  const d = new Date()
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(m.toLocaleString('en-US', { month: 'short' }))
  }
  return out
})()

function workloadTone(w: number) {
  return w > 85 ? 'error' : w > 70 ? 'warning' : 'success'
}

const TrendTip = makeTooltip((n, v) => (n === 'Quality' ? `${v.toFixed(1)}%` : formatCompact(v)))

export default function TeamPage() {
  const [params, setParams] = useSearchParams()
  const team = useAppStore((s) => s.team)
  const projects = useAppStore((s) => s.projects)
  const issues = useAppStore((s) => s.issues)
  const can = useCan()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [lang, setLang] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const memberId = params.get('member')

  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'completed'), [projects])
  const projectsOf = (id: string) => activeProjects.filter((p) => p.pmId === id || p.translatorIds.includes(id) || p.reviewerIds.includes(id))
  const openAssigned = (id: string) => issues.filter((i) => isOpen(i) && i.assigneeId === id).length

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return team.filter((m) => {
      if (role !== 'all' && (role === 'reviewer' ? !m.role.includes('Reviewer') : role === 'translator' ? m.role !== 'Translator' : m.role !== 'Project Manager' && m.role !== 'Vendor Manager')) return false
      if (lang !== 'all' && !m.languages.includes(lang as LangCode)) return false
      if (term && !`${m.name} ${m.specializations.join(' ')} ${m.role}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [team, q, role, lang])

  const linguists = team.filter((m) => m.role === 'Translator')
  const reviewers = team.filter((m) => m.role.includes('Reviewer'))
  const scored = team.filter((m) => m.qualityTrend.length && (m.role === 'Translator' || m.role.includes('Reviewer')))
  const avg = scored.reduce((s, m) => s + m.qualityTrend[m.qualityTrend.length - 1]!, 0) / Math.max(1, scored.length)

  const member = memberId ? team.find((m) => m.id === memberId) : undefined
  const setMember = (id: string | null) => {
    const n = new URLSearchParams(params)
    if (id) n.set('member', id)
    else n.delete('member')
    setParams(n, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Linguists & Reviewers"
        subtitle="Manage your localization team and monitor quality performance."
        actions={
          <Button variant="primary" onClick={() => setInviteOpen(true)} disabled={!can('settings.roles')}>
            <MailPlus /> Invite member
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIStatCard label="Team Members" icon={<Users />} value={team.length} footer={`${team.filter((m) => m.vendor !== 'In-house').length} freelance or vendor partners`} />
        <KPIStatCard label="Active Linguists" icon={<FileText />} value={linguists.filter((m) => m.status !== 'invited' && m.status !== 'away').length} footer={`of ${linguists.length} translators`} />
        <KPIStatCard label="Active Reviewers" icon={<UserCheck />} value={reviewers.filter((m) => m.status !== 'invited' && m.status !== 'away').length} footer={`of ${reviewers.length} reviewers`} />
        <KPIStatCard label="Average Quality Score" icon={<Gauge />} value={`${avg.toFixed(1)}%`} footer="Delivered work, last 30 days" tooltip="Average quality of delivered segments. Content difficulty, source quality and deadlines also affect scores — review alongside other metrics." />
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar>
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Role" value={role} onValueChange={setRole} options={[{ value: 'all', label: 'All roles' }, { value: 'translator', label: 'Translators' }, { value: 'reviewer', label: 'Reviewers' }, { value: 'pm', label: 'Project & vendor managers' }]} />
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Language" value={lang} onValueChange={setLang} options={[{ value: 'all', label: 'All languages' }, ...TARGET_LANGS.map((l) => ({ value: l, label: LANGUAGES[l].name }))]} />
            <span className="text-[12px] text-fg-3 tabular">{filtered.length} members</span>
          </FilterBar>
          <SearchBar value={q} onChange={setQ} placeholder="Search name or specialization…" className="w-full lg:w-72" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Users />} title="No team members match" description="Try a different role or language filter." action={<Button onClick={() => { setQ(''); setRole('all'); setLang('all') }}>Clear filters</Button>} />
        ) : (
          <>
            <TableWrap className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Languages</Th>
                    <Th>Specializations</Th>
                    <Th>Projects</Th>
                    <Th>Quality Score</Th>
                    <Th>Issues</Th>
                    <Th>Workload</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const q2 = m.qualityTrend[m.qualityTrend.length - 1]
                    return (
                      <Tr key={m.id} onClick={() => setMember(m.id)} aria-label={`Open ${m.name}`}>
                        <Td>
                          <span className="flex items-center gap-2.5">
                            <Avatar name={m.name} color={m.color} size={30} />
                            <span>
                              <span className="block font-medium whitespace-nowrap text-fg">{m.name}</span>
                              <span className="block text-[12px] text-fg-3">{m.vendor}</span>
                            </span>
                          </span>
                        </Td>
                        <Td className="whitespace-nowrap text-fg-2">{m.role}</Td>
                        <Td>
                          <div className="flex gap-1">
                            {m.languages.map((l) => (
                              <LangChip key={l} lang={l} />
                            ))}
                          </div>
                        </Td>
                        <Td>
                          <span className="block max-w-[200px] truncate text-fg-2" title={m.specializations.join(', ')}>
                            {m.specializations.join(', ') || '—'}
                          </span>
                        </Td>
                        <Td className="tabular">{projectsOf(m.id).length}</Td>
                        <Td>{q2 !== undefined && m.role !== 'Project Manager' && m.role !== 'Vendor Manager' ? <QualityScoreBadge score={q2} /> : <span className="text-fg-3">—</span>}</Td>
                        <Td className="tabular">{openAssigned(m.id)}</Td>
                        <Td>
                          <div className="flex w-28 items-center gap-2">
                            <ProgressBar value={m.workload} size="sm" tone={workloadTone(m.workload)} label={`${m.name} workload`} />
                            <span className="w-8 text-right text-[12px] tabular">{m.workload}%</span>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Table>
            </TableWrap>
            <ul className="divide-y divide-border md:hidden">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover" onClick={() => setMember(m.id)}>
                    <Avatar name={m.name} color={m.color} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-fg">{m.name}</span>
                      <span className="block truncate text-[12px] text-fg-3">
                        {m.role} · {m.languages.map((l) => l.toUpperCase()).join('/')}
                      </span>
                    </span>
                    <span className="text-right text-[12px]">
                      <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                      <span className="mt-1 block text-fg-3 tabular">{m.workload}% load</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <MemberDrawer member={member} onClose={() => setMember(null)} projectsOf={projectsOf} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

function MemberDrawer({ member, onClose, projectsOf }: { member?: TeamMember; onClose: () => void; projectsOf: (id: string) => { id: string; name: string; targetLangs: LangCode[] }[] }) {
  const issues = useAppStore((s) => s.issues)
  const projects = useAppStore((s) => s.projects)
  const statsMap = useProjectStatsMap()
  const activities = useAppStore((s) => s.activities)
  if (!member) return <Drawer open={false} onOpenChange={() => onClose()} title="">{null}</Drawer>

  const isPM = member.role === 'Project Manager' || member.role === 'Vendor Manager'
  const theirProjects = projectsOf(member.id)
  const related = issues.filter((i) => {
    const p = projects.find((x) => x.id === i.projectId)
    if (!p || !member.languages.includes(i.lang)) return false
    return member.role === 'Translator' ? p.translatorIds.includes(member.id) : p.reviewerIds.includes(member.id) || i.assigneeId === member.id
  })
  const byCat = Object.entries(
    related.reduce<Record<string, number>>((acc, i) => {
      acc[CATEGORY_LABELS[i.category]] = (acc[CATEGORY_LABELS[i.category]] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])
  const maxCat = Math.max(1, ...byCat.map(([, v]) => v))
  const resolvedBy = issues.filter((i) => i.history.some((h) => h.by === member.id && /resolv|Accepted|Edited/i.test(h.action))).slice(0, 5)
  const trend = member.qualityTrend.map((v, i) => ({ month: MONTHS[i] ?? '', score: v, volume: Math.round(member.wordsThisMonth * (0.72 + i * 0.06)) || member.reviewsCompleted * 1000 }))
  const memberActivity = activities.filter((a) => a.actorId === member.id).slice(0, 4)

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      width="max-w-[600px]"
      title={
        <span className="flex items-center gap-3">
          <Avatar name={member.name} color={member.color} size={40} />
          <span>
            <span className="block">{member.name}</span>
            <span className="block text-[12.5px] font-normal text-fg-2">
              {member.role} · {member.vendor} · {member.timezone.replace('_', ' ')}
            </span>
          </span>
        </span>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS[member.status].tone}>{STATUS[member.status].label}</Badge>
          {member.languages.map((l) => (
            <Badge key={l} tone="outline">
              {LANGUAGES[l].name}
            </Badge>
          ))}
          {member.specializations.map((s) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}
        </div>

        <div>
          <SectionTitle>Performance</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { icon: Gauge, label: 'Quality score', value: isPM ? '—' : `${member.qualityTrend.at(-1)?.toFixed(1) ?? '—'}%` },
              { icon: Clock, label: 'On-time delivery', value: `${member.onTimeRate}%` },
              { icon: BadgeCheck, label: member.role === 'Translator' ? 'Words this month' : 'Reviews completed', value: member.role === 'Translator' ? formatCompact(member.wordsThisMonth) : String(member.reviewsCompleted) },
              { icon: Clock, label: 'Avg. turnaround', value: member.avgTurnaroundHours ? `${member.avgTurnaroundHours}h` : '—' },
              { icon: MessageSquareQuote, label: member.role === 'Translator' ? 'Feedback accepted' : 'Suggestions accepted', value: member.feedbackAcceptance ? `${member.feedbackAcceptance}%` : '—' },
              { icon: Users, label: 'Workload', value: `${member.workload}%` },
            ].map((x) => (
              <div key={x.label} className="rounded-[10px] border border-border px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11.5px] text-fg-3">
                  <x.icon className="size-3" /> {x.label}
                </div>
                <div className="mt-0.5 text-[17px] font-semibold text-fg tabular">{x.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-fg-3">Scores are influenced by content difficulty, source quality and deadlines. Use them together with delivery, turnaround and reviewer feedback — not as a sole measure of performance.</p>
        </div>

        {!isPM && trend.length > 1 && (
          <div>
            <SectionTitle>Quality score trend</SectionTitle>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis domain={[(m: number) => Math.floor(m - 1), (m: number) => Math.min(100, Math.ceil(m + 1))]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
                  <Tooltip content={<TrendTip />} />
                  <Line type="monotone" dataKey="score" name="Quality" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'var(--chart-1)' }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <SectionTitle>Workload</SectionTitle>
          <ProgressBar value={member.workload} tone={workloadTone(member.workload)} label="Workload" />
          <p className="mt-1.5 text-[12px] text-fg-2">
            {member.workload > 85 ? 'At capacity — avoid assigning new urgent work.' : member.workload > 70 ? 'Busy — limited capacity this week.' : 'Has capacity for new assignments.'}
          </p>
        </div>

        <div>
          <SectionTitle>Active projects ({theirProjects.length})</SectionTitle>
          {theirProjects.length === 0 ? (
            <p className="text-[12.5px] text-fg-3">No active projects.</p>
          ) : (
            <ul className="divide-y divide-border rounded-[10px] border border-border">
              {theirProjects.map((p) => {
                const st = statsMap.get(p.id)
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <Link to={`/projects/${p.id}`} className="min-w-0 truncate text-[13px] font-medium text-fg hover:underline">
                      {p.name}
                    </Link>
                    {st && <QualityScoreBadge score={st.score} />}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {related.length > 0 && (
          <div>
            <SectionTitle>Issue breakdown · {member.role === 'Translator' ? 'in translated content' : 'in reviewed projects'}</SectionTitle>
            <ul className="space-y-1.5">
              {byCat.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-28 shrink-0 text-fg-2">{k}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                    <span className="block h-full rounded-full bg-primary/80" style={{ width: `${(v / maxCat) * 100}%` }} />
                  </span>
                  <span className="w-5 text-right font-medium tabular">{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-3 text-[12px] text-fg-2">
              {(['critical', 'major', 'minor', 'info'] as const).map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span className={cn('size-2 rounded-full', severityMeta[s].dot)} /> {related.filter((i) => i.severity === s).length} {severityMeta[s].label.toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionTitle>Review history</SectionTitle>
          {resolvedBy.length === 0 && memberActivity.length === 0 ? (
            <p className="text-[12.5px] text-fg-3">No recent review activity.</p>
          ) : (
            <ul className="space-y-2 text-[12.5px]">
              {memberActivity.map((a) => (
                <li key={a.id} className="text-fg-2">
                  {a.message}
                </li>
              ))}
              {resolvedBy.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <Link to={`/issues?issue=${i.id}`} className="truncate text-fg hover:underline">
                    {i.id} · {CATEGORY_LABELS[i.category]} — {i.source}
                  </Link>
                  <Badge tone="success">Resolved</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  )
}
