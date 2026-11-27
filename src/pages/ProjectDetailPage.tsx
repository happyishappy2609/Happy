import { ArrowLeft, Calendar, CircleUser, Edit3, FileText, FolderX, Hash, Languages, MoreHorizontal, Pin, PinOff, ScanSearch, Trash2, Upload, UserMinus, UserPlus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, makeTooltip } from '@/components/charts/ChartTooltip'
import { QualityGauge } from '@/components/charts/QualityGauge'
import { ActivityFeed } from '@/components/common/ActivityFeed'
import { Avatar } from '@/components/common/Avatar'
import { QualityScoreBadge, RiskBadge, severityMeta, StatusBadge } from '@/components/common/badges'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ExportMenu } from '@/components/common/ExportMenu'
import { ClientBadge, EmptyState, LangChip, Stat } from '@/components/common/misc'
import { Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { IssueDrawer } from '@/components/issues/IssueDrawer'
import { IssueTable } from '@/components/issues/IssueTable'
import { AssignReviewerDialog, EditProjectDialog } from '@/components/projects/ProjectDialogs'
import { UploadTranslationsDialog } from '@/components/projects/UploadTranslationsDialog'
import { QAReportSummary } from '@/components/quality/QAReport'
import { SegmentWorkbench } from '@/components/quality/SegmentWorkbench'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/controls'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { Segmented, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCan, useLookups, useProjectStats } from '@/hooks/useData'
import { exportProjectReport } from '@/services/exportService'
import { useAppStore } from '@/store/useAppStore'
import type { Severity } from '@/types'
import { cn } from '@/utils/cn'
import { daysUntil, deadlineLabel, formatDate, formatDateLong, formatRelative } from '@/utils/dates'
import { formatBytes, formatNumber } from '@/utils/format'
import { LANGUAGES, langName } from '@/utils/languages'
import { isOpen, SEVERITY_ORDER } from '@/utils/quality'
import { hashString } from '@/utils/random'

export default function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const project = useAppStore((s) => s.projects.find((p) => p.id === id))
  const stats = useProjectStats(id)
  const allIssues = useAppStore((s) => s.issues)
  const scans = useAppStore((s) => s.scans)
  const files = useAppStore((s) => s.files)
  const activities = useAppStore((s) => s.activities)
  const segments = useAppStore((s) => s.segments)
  const openScan = useAppStore((s) => s.openScanDialog)
  const updateProject = useAppStore((s) => s.updateProject)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const removeReviewer = useAppStore((s) => s.removeReviewer)
  const { clientById, memberById } = useLookups()
  const can = useCan()
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [issueView, setIssueView] = useState<'open' | 'all'>('open')

  const tab = params.get('tab') ?? 'overview'
  const setTab = (t: string) => {
    const n = new URLSearchParams(params)
    if (t === 'overview') n.delete('tab')
    else n.set('tab', t)
    n.delete('segment')
    setParams(n, { replace: true })
  }
  const openIssue = params.get('issue')
  const setIssue = (iid: string | null) => {
    const n = new URLSearchParams(params)
    if (iid) n.set('issue', iid)
    else n.delete('issue')
    setParams(n, { replace: true })
  }

  useEffect(() => {
    if (params.get('scan') === '1' && project) {
      openScan({ projectId: project.id })
      const n = new URLSearchParams(params)
      n.delete('scan')
      setParams(n, { replace: true })
    }
  }, [params, project, openScan, setParams])

  const issues = useMemo(() => allIssues.filter((i) => i.projectId === id), [allIssues, id])
  const projectScans = useMemo(() => scans.filter((s) => s.projectId === id), [scans, id])
  const projectFiles = useMemo(() => files.filter((f) => f.projectId === id), [files, id])
  const projectActivity = useMemo(() => activities.filter((a) => a.projectId === id), [activities, id])
  const segCount = useMemo(() => segments.filter((s) => s.projectId === id).length, [segments, id])

  if (!project || !stats) {
    return (
      <EmptyState
        icon={<FolderX />}
        title="Project not found"
        description="This project may have been deleted or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => navigate('/projects')}>
            Back to projects
          </Button>
        }
      />
    )
  }

  const client = clientById.get(project.clientId)
  const pm = memberById.get(project.pmId)
  const latestScan = projectScans[0]
  const d = daysUntil(project.deadline)

  const langRows = project.targetLangs.map((l) => {
    const off = (hashString(project.id + l) % 13) - 6
    const tp = project.status === 'completed' ? 100 : Math.max(0, Math.min(100, project.translationProgress + (project.translationProgress >= 98 ? 0 : off)))
    const rp = project.status === 'completed' ? 100 : Math.max(0, Math.min(tp, project.reviewProgress + Math.round(off * 0.8)))
    return { lang: l, tp, rp, score: stats.langScores[l] ?? stats.score, open: stats.langOpen[l] ?? 0 }
  })

  const historyData = project.qualityHistory.map((h) => ({ date: h.date, score: h.score, label: h.label }))
  const HistTip = makeTooltip((_n, v) => `${v.toFixed(1)}%`, (label, payload) => `${formatDate(String(label))} · ${payload[0]?.payload?.label ?? ''}`)

  const team = [
    ...(pm ? [{ m: pm, role: 'Project Manager' }] : []),
    ...project.translatorIds.map((t) => memberById.get(t)).filter(Boolean).map((m) => ({ m: m!, role: 'Translator' })),
    ...project.reviewerIds.map((t) => memberById.get(t)).filter(Boolean).map((m) => ({ m: m!, role: 'Reviewer' })),
  ]

  const onExport = (f: Parameters<typeof exportProjectReport>[0]) => exportProjectReport(f, project, client, issues, latestScan, stats.score)

  return (
    <div>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-fg-2 hover:text-fg">
        <ArrowLeft className="size-3.5" /> Projects
      </Link>

      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] leading-7 font-semibold tracking-[-0.01em] text-fg">{project.name}</h1>
              <StatusBadge status={project.status} />
              {project.status !== 'completed' && <RiskBadge risk={stats.risk} reasons={stats.riskReasons} />}
              {project.pinned && <Pin className="size-3.5 text-fg-3" aria-label="Pinned" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-2">
              <ClientBadge client={client} link />
              <span className="inline-flex items-center gap-1">
                <Hash className="size-3.5 text-fg-3" />
                {project.code}
              </span>
              <span>{project.type}</span>
            </div>
            {project.description && <p className="mt-2 max-w-3xl text-[13px] text-fg-2">{project.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={() => openScan({ projectId: project.id })} disabled={!can('qa.run') || segCount === 0}>
              <ScanSearch /> Run AI QA
            </Button>
            <ExportMenu onExport={onExport} />
            <Button onClick={() => setAssignOpen(true)} disabled={!can('project.assign')}>
              <UserPlus /> Assign reviewer
            </Button>
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button size="icon" aria-label="More options">
                  <MoreHorizontal />
                </Button>
              </DropdownTrigger>
              <DropdownContent className="w-56">
                <DropdownItem icon={<Edit3 />} disabled={!can('project.edit')} onSelect={() => setEditOpen(true)}>
                  Edit project
                </DropdownItem>
                <DropdownItem icon={<Upload />} disabled={!can('segment.edit')} onSelect={() => setUploadOpen(true)}>
                  Upload translations
                </DropdownItem>
                <DropdownItem
                  icon={project.pinned ? <PinOff /> : <Pin />}
                  onSelect={() => {
                    updateProject(project.id, { pinned: !project.pinned })
                    toast.success(project.pinned ? 'Removed from dashboard.' : 'Pinned to dashboard.')
                  }}
                >
                  {project.pinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                </DropdownItem>
                {project.status !== 'completed' && (
                  <DropdownItem
                    icon={<FileText />}
                    disabled={!can('project.edit')}
                    onSelect={() => {
                      updateProject(project.id, { status: project.status === 'in_review' ? 'completed' : 'in_review', ...(project.status === 'in_review' ? { translationProgress: 100, reviewProgress: 100 } : {}) })
                      toast.success(project.status === 'in_review' ? 'Project marked completed.' : 'Project moved to In Review.')
                    }}
                  >
                    {project.status === 'in_review' ? 'Mark as completed' : 'Move to In Review'}
                  </DropdownItem>
                )}
                <DropdownSeparator />
                <DropdownItem icon={<Trash2 />} danger disabled={!can('project.delete')} onSelect={() => setDeleteOpen(true)}>
                  Delete project
                </DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Project manager"
            value={
              <span className="inline-flex items-center gap-1.5">
                <CircleUser className="size-3.5 text-fg-3" />
                {pm?.name ?? 'Alex Morgan'}
              </span>
            }
          />
          <Stat
            label="Deadline"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-fg-3" />
                {formatDateLong(project.deadline)}
                {project.status !== 'completed' && <span className={cn('text-[12px] font-normal', d <= 4 ? 'text-error' : 'text-fg-3')}>· {deadlineLabel(project.deadline)}</span>}
              </span>
            }
            className="col-span-2 sm:col-span-1 lg:col-span-1"
          />
          <Stat
            label="Language pair"
            value={
              <span className="inline-flex flex-wrap items-center gap-1">
                <Languages className="size-3.5 text-fg-3" /> EN →{' '}
                {project.targetLangs.map((l) => (
                  <LangChip key={l} lang={l} />
                ))}
              </span>
            }
          />
          <Stat label="Total word count" value={formatNumber(project.words)} />
          <Stat label="Quality score" value={<QualityScoreBadge score={stats.score} showLabel />} />
          <Stat
            label="Progress"
            value={
              <span className="flex items-center gap-2">
                <ProgressBar value={stats.progress} size="sm" className="max-w-[110px]" label="Overall progress" />
                <span className="tabular">{stats.progress}%</span>
              </span>
            }
          />
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments" count={segCount}>
            Segments
          </TabsTrigger>
          <TabsTrigger value="qa" count={projectScans.length}>
            AI QA
          </TabsTrigger>
          <TabsTrigger value="issues" count={stats.open}>
            Issues
          </TabsTrigger>
          <TabsTrigger value="reviewers" count={team.length}>
            Reviewers
          </TabsTrigger>
          <TabsTrigger value="files" count={projectFiles.length}>
            Files
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Project progress" description={`${formatNumber(segCount)} segments in workspace`} />
              <CardBody className="space-y-4">
                {[
                  { label: 'Translation', v: project.status === 'completed' ? 100 : project.translationProgress, tone: 'primary' as const },
                  { label: 'Review', v: project.status === 'completed' ? 100 : project.reviewProgress, tone: 'accent' as const },
                  { label: 'Completion', v: stats.progress, tone: 'success' as const },
                ].map((x) => (
                  <div key={x.label}>
                    <div className="mb-1.5 flex justify-between text-[12.5px]">
                      <span className="text-fg-2">{x.label}</span>
                      <span className="font-medium text-fg tabular">{x.v}%</span>
                    </div>
                    <ProgressBar value={x.v} tone={x.tone} label={`${x.label} progress`} />
                  </div>
                ))}
                <p className="text-[12px] text-fg-3">Completion weights translation 60% and review 40%.</p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Quality score" description={latestScan ? `Last scan ${formatRelative(latestScan.completedAt)}` : 'Based on open issues and earlier LQA sampling'} />
              <CardBody className="flex justify-center">
                <QualityGauge score={stats.score} threshold={project.qualityThreshold} size={210} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Issue summary" description={`${stats.open} unresolved · ${stats.resolved} resolved · ${stats.ignored} ignored`} />
              <CardBody>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_ORDER.map((s: Severity) => (
                    <button key={s} onClick={() => setTab('issues')} className="rounded-[10px] border border-border p-3 text-left transition-colors hover:bg-hover">
                      <div className="flex items-center gap-1.5 text-[12px] text-fg-2">
                        <span className={cn('size-2 rounded-full', severityMeta[s].dot)} /> {severityMeta[s].label}
                      </div>
                      <div className="mt-1 text-[22px] font-semibold text-fg tabular">{stats.openBySeverity[s]}</div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Quality timeline" description="Score after each scan or review milestone" />
              <CardBody>
                {historyData.length > 1 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(String(v))} minTickGap={20} />
                        <YAxis domain={[(min: number) => Math.floor(Math.min(min, project.qualityThreshold) - 2), 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
                        <Tooltip content={<HistTip />} />
                        <ReferenceLine y={project.qualityThreshold} stroke="var(--chart-target)" strokeDasharray="4 4" label={{ value: `Threshold ${project.qualityThreshold}%`, position: 'insideTopRight', fill: 'var(--fg-3)', fontSize: 11 }} />
                        <Line type="monotone" dataKey="score" name="Quality score" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'var(--chart-1)' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState className="py-8" icon={<ScanSearch />} title="No quality history yet" description="Run the first AI QA scan to start tracking quality over time." action={<Button variant="primary" size="sm" onClick={() => openScan({ projectId: project.id })} disabled={!can('qa.run') || segCount === 0}>Run AI QA</Button>} />
                )}
              </CardBody>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Assigned team" action={<Button size="sm" variant="ghost" onClick={() => setTab('reviewers')}>Manage</Button>} />
              <ul className="divide-y divide-border border-t border-border">
                {team.slice(0, 6).map(({ m, role }) => (
                  <li key={m.id + role} className="flex items-center gap-3 px-5 py-2.5">
                    <Avatar name={m.name} color={m.color} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-fg">{m.name}</div>
                      <div className="text-[12px] text-fg-3">{role}</div>
                    </div>
                    <div className="flex gap-1">
                      {m.languages.filter((l) => l !== 'en').map((l) => (
                        <LangChip key={l} lang={l} />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <CardHeader title="Language status" description="Per-language progress and quality" />
            <TableWrap>
              <Table className="min-w-[640px]">
                <thead>
                  <tr>
                    <Th>Language</Th>
                    <Th>Translation</Th>
                    <Th>Review</Th>
                    <Th>QA score</Th>
                    <Th>Unresolved issues</Th>
                    <Th>Deadline</Th>
                  </tr>
                </thead>
                <tbody>
                  {langRows.map((r) => (
                    <Tr key={r.lang} onClick={() => setParams({ tab: 'segments' }, { replace: true })}>
                      <Td>
                        <span className="flex items-center gap-2 font-medium text-fg">
                          <LangChip lang={r.lang} /> {langName(r.lang)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex w-32 items-center gap-2">
                          <ProgressBar value={r.tp} size="sm" label={`${langName(r.lang)} translation`} />
                          <span className="w-8 text-right text-[12px] tabular">{r.tp}%</span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex w-32 items-center gap-2">
                          <ProgressBar value={r.rp} size="sm" tone="accent" label={`${langName(r.lang)} review`} />
                          <span className="w-8 text-right text-[12px] tabular">{r.rp}%</span>
                        </div>
                      </Td>
                      <Td>
                        <QualityScoreBadge score={r.score} />
                      </Td>
                      <Td>
                        <span className="tabular">{r.open}</span>
                      </Td>
                      <Td className="text-fg-2">{formatDate(project.deadline)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>

          <Card>
            <CardHeader title="Recent activity" action={<Button size="sm" variant="ghost" onClick={() => setTab('activity')}>View all</Button>} />
            <CardBody>
              <ActivityFeed items={projectActivity} limit={4} compact />
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card className="overflow-hidden">
            <SegmentWorkbench projectId={project.id} focusSegmentId={params.get('segment')} onOpenIssue={setIssue} />
          </Card>
        </TabsContent>

        <TabsContent value="qa" className="space-y-4">
          {latestScan ? (
            <Card>
              <CardHeader
                title="Latest QA report"
                description={`${LANGUAGES[latestScan.lang].name} · ${formatRelative(latestScan.completedAt)} · ${latestScan.engine}`}
                action={
                  <Button size="sm" variant="primary" onClick={() => navigate(`/quality?scan=${latestScan.id}&project=${project.id}`)}>
                    Review findings
                  </Button>
                }
              />
              <div className="px-5 pb-5">
                <QAReportSummary scan={latestScan} threshold={project.qualityThreshold} compact />
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState icon={<ScanSearch />} title="No QA scans yet" description="Run an AI QA scan to generate a quality report for this project." action={<Button variant="primary" onClick={() => openScan({ projectId: project.id })} disabled={!can('qa.run') || segCount === 0}><ScanSearch /> Run AI QA</Button>} />
            </Card>
          )}
          {projectScans.length > 0 && (
            <Card>
              <CardHeader title="Scan history" />
              <TableWrap>
                <Table className="min-w-[640px]">
                  <thead>
                    <tr>
                      <Th>Scan</Th>
                      <Th>Language</Th>
                      <Th>Score</Th>
                      <Th>Segments</Th>
                      <Th>Issues</Th>
                      <Th>Critical</Th>
                      <Th>Sensitivity</Th>
                      <Th>Completed</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectScans.map((s) => (
                      <Tr key={s.id} onClick={() => navigate(`/quality?scan=${s.id}&project=${project.id}`)}>
                        <Td className="font-medium text-fg">{s.id.length > 7 ? `SC-${s.id.slice(-6)}` : s.id}</Td>
                        <Td>
                          <LangChip lang={s.lang} />
                        </Td>
                        <Td>
                          <QualityScoreBadge score={s.summary.score} />
                        </Td>
                        <Td className="tabular">{s.summary.totalSegments}</Td>
                        <Td className="tabular">{s.summary.issuesDetected}</Td>
                        <Td className="tabular">{s.summary.severity.critical}</Td>
                        <Td className="capitalize">{s.config.sensitivity.replace('_', ' ')}</Td>
                        <Td className="text-fg-2">{formatRelative(s.completedAt)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <Segmented
                size="sm"
                value={issueView}
                onChange={setIssueView}
                aria-label="Issue status"
                options={[
                  { value: 'open', label: 'Unresolved', count: stats.open },
                  { value: 'all', label: 'All', count: issues.length },
                ]}
              />
              <Button size="sm" variant="ghost" onClick={() => navigate(`/quality?project=${project.id}`)}>
                Open in AI Quality
              </Button>
            </div>
            <IssueTable issues={issueView === 'open' ? issues.filter(isOpen) : issues} onOpen={setIssue} showProject={false} />
          </Card>
        </TabsContent>

        <TabsContent value="reviewers">
          <Card>
            <CardHeader title="Project team" description="Translators, reviewers and project management" action={<Button size="sm" variant="primary" onClick={() => setAssignOpen(true)} disabled={!can('project.assign')}><UserPlus /> Assign reviewer</Button>} />
            <TableWrap>
              <Table className="min-w-[680px]">
                <thead>
                  <tr>
                    <Th>Member</Th>
                    <Th>Project role</Th>
                    <Th>Languages</Th>
                    <Th>Workload</Th>
                    <Th>Open issues assigned</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(({ m, role }) => (
                    <Tr key={m.id + role}>
                      <Td>
                        <Link to={`/team?member=${m.id}`} className="flex items-center gap-2.5 hover:underline">
                          <Avatar name={m.name} color={m.color} size={28} />
                          <span>
                            <span className="block font-medium text-fg">{m.name}</span>
                            <span className="block text-[12px] text-fg-3">{m.role}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={role === 'Reviewer' ? 'primary' : role === 'Translator' ? 'accent' : 'neutral'}>{role}</Badge>
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          {m.languages.map((l) => (
                            <LangChip key={l} lang={l} />
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex w-28 items-center gap-2">
                          <ProgressBar value={m.workload} size="sm" tone={m.workload > 85 ? 'error' : m.workload > 70 ? 'warning' : 'success'} label="Workload" />
                          <span className="text-[12px] tabular">{m.workload}%</span>
                        </div>
                      </Td>
                      <Td className="tabular">{issues.filter((i) => isOpen(i) && i.assigneeId === m.id).length}</Td>
                      <Td className="text-right">
                        {role === 'Reviewer' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!can('project.assign') || project.reviewerIds.length <= 1}
                            title={project.reviewerIds.length <= 1 ? 'A project needs at least one reviewer' : undefined}
                            onClick={() => {
                              removeReviewer(project.id, m.id)
                              toast.success('Reviewer removed.', { description: `${m.name} was removed from ${project.name}.` })
                            }}
                          >
                            <UserMinus /> Remove
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader title="Files" description="Source, translation and reference files" action={<Button size="sm" variant="primary" onClick={() => setUploadOpen(true)} disabled={!can('segment.edit')}><Upload /> Upload translations</Button>} />
            {projectFiles.length === 0 ? (
              <EmptyState icon={<FileText />} title="No files yet" description="Upload a bilingual file to add segments to this project." />
            ) : (
              <TableWrap>
                <Table className="min-w-[640px]">
                  <thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Type</Th>
                      <Th>Format</Th>
                      <Th>Size</Th>
                      <Th>Segments</Th>
                      <Th>Uploaded</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectFiles.map((f) => (
                      <Tr key={f.id}>
                        <Td>
                          <span className="flex items-center gap-2 font-medium text-fg">
                            <FileText className="size-4 text-fg-3" /> {f.name}
                          </span>
                        </Td>
                        <Td className="capitalize">{f.kind}</Td>
                        <Td>
                          <Badge tone="outline">{f.format}</Badge>
                        </Td>
                        <Td className="text-fg-2 tabular">{formatBytes(f.sizeKb * 1024)}</Td>
                        <Td className="tabular">{f.segments || '—'}</Td>
                        <Td className="text-fg-2">
                          {formatRelative(f.uploadedAt)} · {f.uploadedBy === 'u-alex' ? 'Alex Morgan' : (memberById.get(f.uploadedBy)?.name ?? '—')}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader title="Activity" description="Everything that happened on this project" />
            <CardBody>
              <ActivityFeed items={projectActivity} limit={50} compact />
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignReviewerDialog project={project} open={assignOpen} onOpenChange={setAssignOpen} />
      <EditProjectDialog project={project} open={editOpen} onOpenChange={setEditOpen} />
      <UploadTranslationsDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={project.id} />
      <IssueDrawer issueId={openIssue} onClose={() => setIssue(null)} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        danger
        title="Delete project?"
        description={`This permanently removes ${project.name}, its ${segCount} segments, ${issues.length} issues and scan history from this demo workspace.`}
        confirmLabel="Delete project"
        confirmText={project.code}
        onConfirm={() => {
          deleteProject(project.id)
          toast.success('Project deleted.')
          navigate('/projects')
        }}
      />
    </div>
  )
}
