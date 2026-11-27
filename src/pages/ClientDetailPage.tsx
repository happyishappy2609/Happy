import { ArrowLeft, BookText, Building2, FileText, Mail, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { QualityTrendChart } from '@/components/charts/QualityTrendChart'
import { QualityScoreBadge } from '@/components/common/badges'
import { EmptyState, LangChip, Stat } from '@/components/common/misc'
import { ProjectTable } from '@/components/projects/ProjectTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Checkbox, Switch } from '@/components/ui/controls'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCan, useProjectStatsMap } from '@/hooks/useData'
import { ALL_RULES } from '@/services/qa/types'
import { useAppStore } from '@/store/useAppStore'
import type { ClientQualityProfile, LangCode } from '@/types'
import { formatDateLong } from '@/utils/dates'
import { formatCompact } from '@/utils/format'
import { createRng, hashString } from '@/utils/random'

export default function ClientDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const client = useAppStore((s) => s.clients.find((c) => c.id === id))
  const projects = useAppStore((s) => s.projects)
  const glossary = useAppStore((s) => s.glossary)
  const updateClient = useAppStore((s) => s.updateClient)
  const statsMap = useProjectStatsMap()
  const can = useCan()
  const [profile, setProfile] = useState<ClientQualityProfile | null>(null)
  const [styleGuide, setStyleGuide] = useState('')
  const [ruleText, setRuleText] = useState('')
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (client) {
      setProfile(structuredClone(client.profile))
      setStyleGuide(client.styleGuide)
      setRuleText(client.profile.criticalRules.join('\n'))
    }
  }, [client])

  const ps = useMemo(() => projects.filter((p) => p.clientId === id), [projects, id])
  const active = ps.filter((p) => p.status === 'active' || p.status === 'in_review')
  const langs = [...new Set(ps.flatMap((p) => p.targetLangs))] as LangCode[]
  const terms = glossary.filter((t) => t.clientId === id)
  const avg = active.length ? active.reduce((s, p) => s + (statsMap.get(p.id)?.score ?? 0), 0) / active.length : null

  const history = useMemo(() => {
    if (!client || avg === null) return []
    const rng = createRng(hashString(client.id))
    const out = []
    for (let d = 89; d >= 0; d -= 3) {
      const date = new Date()
      date.setDate(date.getDate() - d)
      out.push({ date: date.toISOString(), score: Math.round((d === 0 ? avg : Math.min(99.5, avg - d * 0.025 + (rng() - 0.5) * 1.2)) * 10) / 10 })
    }
    return out
  }, [client, avg])

  if (!client || !profile) {
    return <EmptyState icon={<Building2 />} title="Client not found" action={<Button onClick={() => navigate('/clients')}>Back to clients</Button>} />
  }

  const dirty = JSON.stringify({ ...profile, criticalRules: ruleText.split('\n').map((s) => s.trim()).filter(Boolean) }) !== JSON.stringify(client.profile) || styleGuide !== client.styleGuide
  const minErr = !(profile.minQuality >= 50 && profile.minQuality <= 100) ? 'Use a value between 50 and 100.' : undefined

  const save = () => {
    if (minErr) return
    updateClient(client.id, { profile: { ...profile, criticalRules: ruleText.split('\n').map((s) => s.trim()).filter(Boolean) }, styleGuide, qualityTarget: profile.minQuality })
    toast.success('Quality profile saved.', { description: `${client.name}: minimum quality ${profile.minQuality}% applied to ${active.length} active projects.` })
  }

  return (
    <div>
      <Link to="/clients" className="mb-3 inline-flex items-center gap-1 text-[12.5px] text-fg-2 hover:text-fg">
        <ArrowLeft className="size-3.5" /> Clients
      </Link>
      <Card className="mb-4 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl text-[18px] font-bold text-white" style={{ background: client.color }}>
              {client.name[0]}
            </span>
            <div>
              <h1 className="text-[20px] leading-7 font-semibold text-fg">{client.name}</h1>
              <div className="text-[13px] text-fg-2">
                {client.industry} · Client since {formatDateLong(client.since)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`mailto:${client.contactEmail}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-card px-3 text-[13px] font-medium text-fg hover:bg-hover">
              <Mail className="size-4" /> Contact
            </a>
            <Button variant="primary" onClick={() => navigate(`/projects?client=${client.id}`)}>
              View projects
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Primary contact" value={client.contactName} />
          <Stat label="Active projects" value={active.length} />
          <Stat label="Quality target" value={`${client.profile.minQuality}%`} />
          <Stat label="Avg. quality" value={avg !== null ? <QualityScoreBadge score={avg} /> : '—'} />
          <Stat label="Words this month" value={formatCompact(client.wordsThisMonth)} />
          <Stat
            label="Languages"
            value={
              <span className="flex flex-wrap gap-1">
                {langs.map((l) => (
                  <LangChip key={l} lang={l} />
                ))}
              </span>
            }
          />
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" count={ps.length}>
            Projects
          </TabsTrigger>
          <TabsTrigger value="profile">Quality profile</TabsTrigger>
          <TabsTrigger value="glossary" count={terms.length}>
            Glossary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Quality history" description="Average score across active projects · last 90 days" />
            <CardBody>{history.length ? <QualityTrendChart data={history} target={client.profile.minQuality} height={240} /> : <EmptyState icon={<FileText />} title="No active projects" />}</CardBody>
          </Card>
          <Card>
            <CardHeader title="Style guide" icon={<FileText className="size-4 text-fg-3" />} />
            <CardBody className="space-y-3 text-[13px] leading-relaxed text-fg-2">
              <p>{client.styleGuide}</p>
              <div>
                <div className="mb-1 text-[12px] font-medium text-fg">Critical issue rules</div>
                <ul className="list-disc space-y-0.5 pl-4">
                  {client.profile.criticalRules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-[12px] font-medium text-fg">Automatic QA rules</div>
                <div className="flex flex-wrap gap-1">
                  {client.profile.autoQARules.map((r) => (
                    <Badge key={r} tone="primary">
                      {ALL_RULES.find((x) => x.id === r)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <ProjectTable projects={ps} statsMap={statsMap} />
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader title="Client-specific quality profile" description="These settings are applied whenever projects for this client are scanned." action={<Button variant="primary" onClick={save} disabled={!dirty || !!minErr || !can('client.edit')}><Save /> Save changes</Button>} />
            <CardBody className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <Field label="Minimum quality score" htmlFor="cq-min" error={minErr} hint="Also becomes the threshold for this client's active projects.">
                  <div className="relative max-w-[160px]">
                    <Input id="cq-min" inputMode="decimal" value={profile.minQuality} onChange={(e) => setProfile({ ...profile, minQuality: Number(e.target.value) })} className="pr-7" disabled={!can('client.edit')} />
                    <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-fg-3">%</span>
                  </div>
                </Field>
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <span>
                    <span className="block text-[13px] font-medium text-fg">Enforce preferred terminology</span>
                    <span className="block text-[12px] text-fg-3">Flag deviations from the {terms.filter((t) => t.status === 'approved').length} approved client terms.</span>
                  </span>
                  <Switch checked={profile.enforceTerminology} onCheckedChange={(v) => setProfile({ ...profile, enforceTerminology: v })} disabled={!can('client.edit')} aria-label="Enforce preferred terminology" />
                </label>
                <Field label="Style preferences" htmlFor="cq-style">
                  <Textarea id="cq-style" value={profile.stylePreferences} onChange={(e) => setProfile({ ...profile, stylePreferences: e.target.value })} disabled={!can('client.edit')} />
                </Field>
                <Field label="Locale conventions" htmlFor="cq-locale">
                  <Textarea id="cq-locale" value={profile.localeConventions} onChange={(e) => setProfile({ ...profile, localeConventions: e.target.value })} disabled={!can('client.edit')} />
                </Field>
              </div>
              <div className="space-y-4">
                <Field label="Critical issue rules" htmlFor="cq-critical" hint="One rule per line. Findings matching these rules are always escalated to Critical.">
                  <Textarea id="cq-critical" value={ruleText} onChange={(e) => setRuleText(e.target.value)} className="min-h-[110px]" disabled={!can('client.edit')} />
                </Field>
                <div>
                  <div className="mb-2 text-[12.5px] font-medium text-fg">Automatic QA rules</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ALL_RULES.map((r) => (
                      <Checkbox
                        key={r.id}
                        id={`cq-rule-${r.id}`}
                        disabled={!can('client.edit')}
                        checked={profile.autoQARules.includes(r.id)}
                        onCheckedChange={(v) => setProfile({ ...profile, autoQARules: v ? [...profile.autoQARules, r.id] : profile.autoQARules.filter((x) => x !== r.id) })}
                        label={r.label}
                      />
                    ))}
                  </div>
                </div>
                <Field label="Style guide" htmlFor="cq-sg">
                  <Textarea id="cq-sg" value={styleGuide} onChange={(e) => setStyleGuide(e.target.value)} className="min-h-[90px]" disabled={!can('client.edit')} />
                </Field>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="glossary">
          <Card>
            <CardHeader title="Client glossary" description="Approved and pending terms specific to this client" action={<Button size="sm" onClick={() => navigate(`/terminology?client=${client.id}`)}><BookText /> Manage in Terminology</Button>} />
            {terms.length === 0 ? (
              <EmptyState icon={<BookText />} title="No client-specific terms" description="Global terms still apply. Add client terms in Terminology." />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {terms.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-[13px]">
                    <span>
                      <span className="text-fg-2">{t.source}</span> → <span className="font-medium text-fg">{t.target}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <LangChip lang={t.targetLang} />
                      <Badge tone={t.status === 'approved' ? 'success' : t.status === 'pending' ? 'warning' : 'neutral'}>{t.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
