import { Check, CreditCard, Database, ImageUp, MailPlus, RotateCcw, Save, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { Avatar } from '@/components/common/Avatar'
import { severityMeta } from '@/components/common/badges'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DemoTag } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Table, TableWrap, Td, Th } from '@/components/common/Table'
import { InviteDialog } from '@/components/team/InviteDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Checkbox, ProgressBar, Switch } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CURRENT_USER } from '@/data/seed/team'
import { useCan } from '@/hooks/useData'
import { isLiveScan } from '@/hooks/useMetrics'
import { ALL_RULES } from '@/services/qa/types'
import { storageIsPersistent } from '@/services/storageService'
import { useAppStore, type ThemeMode } from '@/store/useAppStore'
import type { AccessRole, LangCode, ScanSensitivity, Severity, WorkspaceSettings } from '@/types'
import { cn } from '@/utils/cn'
import { formatDateLong } from '@/utils/dates'
import { formatNumber } from '@/utils/format'
import { LANGUAGES } from '@/utils/languages'
import { PERMISSION_LABELS, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, type Permission } from '@/utils/permissions'
import { SEVERITY_ORDER } from '@/utils/quality'

const TIMEZONES = ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Asia/Ho_Chi_Minh', 'Australia/Sydney', 'UTC']
const PLANS = [
  { id: 'growth', name: 'Growth', price: '$299', seats: 10, words: 100_000, features: ['AI QA', 'Project analytics', 'Terminology management', 'Translation Memory'] },
  { id: 'scale', name: 'Scale', price: '$799', seats: 30, words: 500_000, features: ['Everything in Growth', 'Vendor performance insights', 'Client quality profiles', 'Priority support'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', seats: 0, words: 0, features: ['Everything in Scale', 'SSO & SCIM', 'API & webhooks', 'Bring your own AI provider'] },
] as const

function SaveBar({ dirty, onSave, onReset, disabled }: { dirty: boolean; onSave: () => void; onReset: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {dirty && <span className="mr-auto text-[12px] text-warning">Unsaved changes</span>}
      <Button size="sm" variant="ghost" disabled={!dirty} onClick={onReset}>
        Discard
      </Button>
      <Button size="sm" variant="primary" disabled={!dirty || disabled} onClick={onSave}>
        <Save /> Save changes
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'workspace'
  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your workspace, quality defaults, team access and billing." />
      <Tabs value={tab} onValueChange={(t) => setParams(t === 'workspace' ? {} : { tab: t }, { replace: true })}>
        <TabsList className="mb-5">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="qa">QA Settings</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="demo">Demo data</TabsTrigger>
        </TabsList>
        <TabsContent value="workspace">
          <WorkspaceTab />
        </TabsContent>
        <TabsContent value="qa">
          <QATab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="demo">
          <DemoTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function useSettingsDraft<K extends keyof WorkspaceSettings>(keys: K[]) {
  const settings = useAppStore((s) => s.settings)
  const pick = () => Object.fromEntries(keys.map((k) => [k, structuredClone(settings[k])])) as Pick<WorkspaceSettings, K>
  const [draft, setDraft] = useState(pick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(pick()), [settings])
  const dirty = JSON.stringify(draft) !== JSON.stringify(pick())
  return { draft, setDraft, dirty, reset: () => setDraft(pick()) }
}

function WorkspaceTab() {
  const update = useAppStore((s) => s.updateSettings)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const can = useCan()
  const { draft, setDraft, dirty, reset } = useSettingsDraft(['workspaceName', 'timezone', 'defaultLanguage', 'defaultCurrency', 'logoInitials', 'logoDataUrl'])
  const fileRef = useRef<HTMLInputElement>(null)
  const disabled = !can('settings.workspace')
  const nameErr = !draft.workspaceName.trim() ? 'Workspace name is required.' : undefined

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Workspace" description="Shown in the sidebar, reports and client-facing exports." />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            {draft.logoDataUrl ? (
              <img src={draft.logoDataUrl} alt="Workspace logo" className="size-14 rounded-xl border border-border object-cover" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-xl bg-[#17B890] text-[18px] font-bold text-white">{draft.logoInitials}</span>
            )}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="sr-only"
                  aria-label="Upload logo"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (!f) return
                    if (f.size > 300 * 1024) return toast.error('Logo is too large.', { description: 'Use an image under 300 KB.' })
                    const reader = new FileReader()
                    reader.onload = () => setDraft((d) => ({ ...d, logoDataUrl: String(reader.result) }))
                    reader.readAsDataURL(f)
                  }}
                />
                <Button size="sm" onClick={() => fileRef.current?.click()} disabled={disabled}>
                  <ImageUp /> Upload logo
                </Button>
                {draft.logoDataUrl && (
                  <Button size="sm" variant="ghost" onClick={() => setDraft((d) => ({ ...d, logoDataUrl: undefined }))} disabled={disabled}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[12px] text-fg-3">PNG, JPG or SVG, up to 300 KB. Initials are used when no logo is set.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name" htmlFor="ws-name" error={nameErr}>
              <Input id="ws-name" value={draft.workspaceName} onChange={(e) => setDraft((d) => ({ ...d, workspaceName: e.target.value }))} disabled={disabled} />
            </Field>
            <Field label="Logo initials" htmlFor="ws-initials">
              <Input id="ws-initials" maxLength={3} value={draft.logoInitials} onChange={(e) => setDraft((d) => ({ ...d, logoInitials: e.target.value.toUpperCase() }))} disabled={disabled} />
            </Field>
            <Field label="Time zone" htmlFor="ws-tz">
              <NativeSelect id="ws-tz" value={draft.timezone} onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))} disabled={disabled}>
                {TIMEZONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Default source language" htmlFor="ws-lang">
              <NativeSelect id="ws-lang" value={draft.defaultLanguage} onChange={(e) => setDraft((d) => ({ ...d, defaultLanguage: e.target.value as LangCode }))} disabled={disabled}>
                {(Object.keys(LANGUAGES) as LangCode[]).map((l) => (
                  <option key={l} value={l}>
                    {LANGUAGES[l].name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Default currency" htmlFor="ws-cur">
              <NativeSelect id="ws-cur" value={draft.defaultCurrency} onChange={(e) => setDraft((d) => ({ ...d, defaultCurrency: e.target.value }))} disabled={disabled}>
                {['USD', 'EUR', 'GBP', 'JPY', 'KRW', 'VND'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <SaveBar
            dirty={dirty}
            disabled={!!nameErr || disabled}
            onReset={reset}
            onSave={() => {
              update(draft)
              toast.success('Workspace settings saved.')
            }}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Appearance" description="Personal preference, saved in this browser." />
        <CardBody>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
              <button key={t} role="radio" aria-checked={theme === t} onClick={() => setTheme(t)} className={cn('rounded-lg border p-2 text-center text-[12.5px] font-medium capitalize transition-colors', theme === t ? 'border-primary bg-primary-soft/60 text-primary ring-1 ring-primary' : 'border-border text-fg-2 hover:bg-hover')}>
                <span className={cn('mx-auto mb-1.5 block h-8 w-full rounded-md border border-border', t === 'light' ? 'bg-[#F7F9FC]' : t === 'dark' ? 'bg-[#0b111d]' : 'bg-gradient-to-r from-[#F7F9FC] to-[#0b111d]')} />
                {t}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function QATab() {
  const update = useAppStore((s) => s.updateSettings)
  const can = useCan()
  const disabled = !can('settings.workspace')
  const { draft, setDraft, dirty, reset } = useSettingsDraft(['defaultThreshold', 'severityWeights', 'defaultRules', 'sensitivity', 'autoAssignReviewer', 'autoResolveLowConfidence'])
  const thErr = !(draft.defaultThreshold >= 50 && draft.defaultThreshold <= 100) ? 'Use a value between 50 and 100.' : undefined
  return (
    <Card>
      <CardHeader title="QA defaults" description="Applied to new scans. Each scan can override rules and sensitivity." />
      <CardBody className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field label="Default quality threshold" htmlFor="qa-th" error={thErr} hint="Used for new projects when the client has no target.">
              <div className="relative max-w-[160px]">
                <Input id="qa-th" inputMode="decimal" value={draft.defaultThreshold} onChange={(e) => setDraft((d) => ({ ...d, defaultThreshold: Number(e.target.value) }))} className="pr-7" disabled={disabled} />
                <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[12px] text-fg-3">%</span>
              </div>
            </Field>
            <div>
              <div className="mb-1 text-[12.5px] font-medium text-fg">Severity configuration</div>
              <p className="mb-2 text-[12px] text-fg-3">Penalty points per open issue (per 120 segments) used to compute the quality score.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEVERITY_ORDER.map((s: Severity) => (
                  <label key={s} className="rounded-lg border border-border p-2.5">
                    <span className="flex items-center gap-1.5 text-[12px] text-fg-2">
                      <span className={cn('size-2 rounded-full', severityMeta[s].dot)} /> {severityMeta[s].label}
                    </span>
                    <Input
                      type="number"
                      step="0.05"
                      min={0}
                      max={10}
                      value={draft.severityWeights[s]}
                      onChange={(e) => setDraft((d) => ({ ...d, severityWeights: { ...d.severityWeights, [s]: Math.max(0, Number(e.target.value)) } }))}
                      className="mt-1.5 h-7"
                      disabled={disabled}
                      aria-label={`${severityMeta[s].label} penalty`}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-fg">AI scan sensitivity</div>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                {(['balanced', 'strict', 'high_precision'] as ScanSensitivity[]).map((s) => (
                  <button key={s} role="radio" aria-checked={draft.sensitivity === s} disabled={disabled} onClick={() => setDraft((d) => ({ ...d, sensitivity: s }))} className={cn('rounded-lg border px-3 py-2 text-left text-[12.5px] font-medium capitalize transition-colors', draft.sensitivity === s ? 'border-primary bg-primary-soft/60 text-fg ring-1 ring-primary' : 'border-border text-fg-2 hover:bg-hover')}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-[12.5px] font-medium text-fg">Default QA rules</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_RULES.map((r) => (
                  <Checkbox key={r.id} id={`def-rule-${r.id}`} disabled={disabled} checked={draft.defaultRules.includes(r.id)} onCheckedChange={(v) => setDraft((d) => ({ ...d, defaultRules: v ? [...d.defaultRules, r.id] : d.defaultRules.filter((x) => x !== r.id) }))} label={<span><span className="text-fg">{r.label}</span><span className="block text-[11.5px] text-fg-3">{r.description}</span></span>} />
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span>
                <span className="block text-[13px] font-medium text-fg">Auto-assign reviewer</span>
                <span className="block text-[12px] text-fg-3">New findings are assigned to the project reviewer for that language.</span>
              </span>
              <Switch checked={draft.autoAssignReviewer} onCheckedChange={(v) => setDraft((d) => ({ ...d, autoAssignReviewer: v }))} disabled={disabled} aria-label="Auto-assign reviewer" />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <span>
                <span className="block text-[13px] font-medium text-fg">Auto-resolve low-confidence findings</span>
                <span className="block text-[12px] text-fg-3">Findings under 70% confidence are ignored automatically. Off by default — we recommend human review.</span>
              </span>
              <Switch checked={draft.autoResolveLowConfidence} onCheckedChange={(v) => setDraft((d) => ({ ...d, autoResolveLowConfidence: v }))} disabled={disabled} aria-label="Auto-resolve low-confidence findings" />
            </label>
          </div>
        </div>
        <SaveBar
          dirty={dirty}
          disabled={!!thErr || draft.defaultRules.length === 0 || disabled}
          onReset={reset}
          onSave={() => {
            update(draft)
            toast.success('QA settings saved.', { description: 'Quality scores were recalculated with the new severity weights.' })
          }}
        />
      </CardBody>
    </Card>
  )
}

function UsersTab() {
  const team = useAppStore((s) => s.team)
  const updateMember = useAppStore((s) => s.updateMember)
  const viewAs = useAppStore((s) => s.viewAs)
  const can = useCan()
  const [inviteOpen, setInviteOpen] = useState(false)
  const roles: AccessRole[] = ['admin', 'pm', 'reviewer', 'translator', 'viewer']
  const perms = Object.keys(PERMISSION_LABELS) as Permission[]
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Users" description={`${team.length + 1} users · roles control what each person can do`} action={<Button size="sm" variant="primary" onClick={() => setInviteOpen(true)} disabled={!can('settings.roles')}><MailPlus /> Invite user</Button>} />
        <TableWrap>
          <Table className="min-w-[640px]">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Job title</Th>
                <Th>Access role</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <Avatar name={CURRENT_USER.name} color={CURRENT_USER.color} size={28} />
                    <span>
                      <span className="block font-medium text-fg">{CURRENT_USER.name} (you)</span>
                      <span className="block text-[12px] text-fg-3">{CURRENT_USER.email}</span>
                    </span>
                  </span>
                </Td>
                <Td className="text-fg-2">{CURRENT_USER.title}</Td>
                <Td>
                  <Badge tone="primary">Admin</Badge>
                  {viewAs !== 'admin' && <span className="ml-2 text-[12px] text-warning">previewing as {ROLE_LABELS[viewAs]}</span>}
                </Td>
                <Td>
                  <Badge tone="success">Active</Badge>
                </Td>
              </tr>
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-hover">
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={m.name} color={m.color} size={28} />
                      <span>
                        <span className="block font-medium text-fg">{m.name}</span>
                        <span className="block text-[12px] text-fg-3">{m.email}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-fg-2">{m.role}</Td>
                  <Td>
                    <NativeSelect
                      aria-label={`Access role for ${m.name}`}
                      className="h-7 w-[170px]"
                      value={m.accessRole}
                      disabled={!can('settings.roles')}
                      onChange={(e) => {
                        updateMember(m.id, { accessRole: e.target.value as AccessRole })
                        toast.success('Role updated.', { description: `${m.name} is now ${ROLE_LABELS[e.target.value as AccessRole]}.` })
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </NativeSelect>
                  </Td>
                  <Td>
                    <Badge tone={m.status === 'invited' ? 'primary' : 'success'}>{m.status === 'invited' ? 'Invited' : 'Active'}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
      <Card>
        <CardHeader title="Role permissions" description="Use “View as role” in the account menu to preview the product as any role." />
        <TableWrap>
          <Table className="min-w-[720px]">
            <thead>
              <tr>
                <Th>Permission</Th>
                {roles.map((r) => (
                  <Th key={r} className="text-center" title={ROLE_DESCRIPTIONS[r]}>
                    {ROLE_LABELS[r]}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p}>
                  <Td className="text-fg">{PERMISSION_LABELS[p]}</Td>
                  {roles.map((r) => (
                    <Td key={r} className="text-center">
                      {ROLE_PERMISSIONS[r].includes(p) ? <Check className="mx-auto size-4 text-success" aria-label="Allowed" /> : <span className="text-fg-3" aria-label="Not allowed">—</span>}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

function BillingTab() {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)
  const team = useAppStore((s) => s.team)
  const scans = useAppStore((s) => s.scans)
  const can = useCan()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<WorkspaceSettings['plan']>(settings.plan)
  const plan = PLANS.find((p) => p.id === settings.plan)!
  const seatsUsed = team.filter((m) => m.vendor === 'In-house').length + 1
  const wordsUsed = 72_480 + scans.filter(isLiveScan).reduce((s, x) => s + x.summary.wordsAnalyzed, 0)
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const limitWords = plan.words || 1_000_000
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Current plan" description={<DemoTag>Simulated billing — no payment details are collected</DemoTag>} action={<Button size="sm" variant="primary" onClick={() => { setChoice(settings.plan === 'growth' ? 'scale' : settings.plan); setOpen(true) }} disabled={!can('settings.billing')}><Sparkles /> Upgrade plan</Button>} />
        <CardBody>
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-[12px] border border-border bg-subtle/50 p-4">
            <div>
              <div className="text-[13px] font-medium text-fg-2">{plan.name} Plan</div>
              <div className="mt-1 text-[28px] leading-none font-semibold text-fg">
                {plan.price}
                {plan.price !== 'Custom' && <span className="text-[14px] font-normal text-fg-3">/month</span>}
              </div>
            </div>
            <ul className="grid gap-x-6 gap-y-1 text-[12.5px] text-fg-2 sm:grid-cols-2">
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> {plan.seats ? `${plan.seats} seats` : 'Unlimited seats'}
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-accent" /> {plan.words ? `${formatNumber(plan.words)} QA words/month` : 'Custom QA volume'}
              </li>
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Check className="size-3.5 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span className="text-fg-2">QA words this cycle</span>
                <span className="font-medium text-fg tabular">
                  {formatNumber(wordsUsed)} / {plan.words ? formatNumber(plan.words) : '∞'}
                </span>
              </div>
              <ProgressBar value={(wordsUsed / limitWords) * 100} tone={wordsUsed / limitWords > 0.9 ? 'error' : wordsUsed / limitWords > 0.75 ? 'warning' : 'primary'} label="QA word usage" />
              <p className="mt-1.5 text-[12px] text-fg-3">{plan.words ? `${formatNumber(Math.max(0, plan.words - wordsUsed))} credits remaining` : 'No limit'}</p>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span className="text-fg-2">Seats</span>
                <span className="font-medium text-fg tabular">
                  {seatsUsed} / {plan.seats || '∞'}
                </span>
              </div>
              <ProgressBar value={(seatsUsed / (plan.seats || 100)) * 100} label="Seat usage" />
              <p className="mt-1.5 text-[12px] text-fg-3">Freelance and vendor reviewers join as free guest seats.</p>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Billing details" />
        <CardBody className="space-y-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-fg-2">Next billing date</span>
            <span className="font-medium text-fg">{formatDateLong(next)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-2">Payment method</span>
            <span className="flex items-center gap-1.5 font-medium text-fg">
              <CreditCard className="size-3.5" /> Demo card
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-2">Billing contact</span>
            <span className="font-medium text-fg">{CURRENT_USER.name}</span>
          </div>
          <div className="border-t border-border pt-3">
            <div className="mb-2 text-[12px] font-medium tracking-wide text-fg-3 uppercase">Recent invoices</div>
            {[1, 2, 3].map((k) => {
              const d = new Date(now.getFullYear(), now.getMonth() - k + 1, 1).toISOString()
              return (
                <div key={k} className="flex items-center justify-between py-1 text-[12.5px]">
                  <span className="text-fg-2">{formatDateLong(d)}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular">$299.00</span>
                    <Badge tone="success">Paid</Badge>
                  </span>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="lg"
          title="Change plan"
          description="Plan changes are simulated in the demo. No payment is taken."
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={choice === settings.plan}
                onClick={() => {
                  update({ plan: choice })
                  setOpen(false)
                  toast.success(choice === 'enterprise' ? 'Enterprise request sent.' : 'Plan updated.', { description: choice === 'enterprise' ? 'Our team would contact you to scope a custom plan (demo).' : `You're now on the ${PLANS.find((p) => p.id === choice)?.name} plan (demo).` })
                }}
              >
                {choice === 'enterprise' ? 'Contact sales' : 'Confirm change'}
              </Button>
            </>
          }
        >
          <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => (
              <button key={p.id} role="radio" aria-checked={choice === p.id} onClick={() => setChoice(p.id)} className={cn('rounded-[12px] border p-4 text-left transition-colors', choice === p.id ? 'border-primary bg-primary-soft/40 ring-1 ring-primary' : 'border-border hover:bg-hover')}>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-fg">{p.name}</span>
                  {settings.plan === p.id && <Badge tone="neutral">Current</Badge>}
                </div>
                <div className="mt-1 text-[20px] font-semibold text-fg">
                  {p.price}
                  {p.price !== 'Custom' && <span className="text-[12px] font-normal text-fg-3">/mo</span>}
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-fg-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-1.5">
                      <Check className="mt-0.5 size-3 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NotificationsTab() {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)
  const items: { key: keyof WorkspaceSettings['notifications']; label: string; desc: string }[] = [
    { key: 'scanCompleted', label: 'QA scan completed', desc: 'When an AI QA scan finishes, with the score and issue count.' },
    { key: 'criticalIssue', label: 'Critical issue detected', desc: 'Immediately when a scan finds critical issues.' },
    { key: 'deadline', label: 'Project deadline', desc: 'When a project is due within 3 days and below its threshold.' },
    { key: 'reviewerActivity', label: 'Reviewer activity', desc: 'Assignments and submitted reviews on your projects.' },
    { key: 'weeklyReport', label: 'Weekly report', desc: 'A Monday summary of quality trends and resolved issues.' },
  ]
  return (
    <Card>
      <CardHeader title="Notifications" description="Choose which events create in-app notifications. Changes save automatically." />
      <ul className="divide-y divide-border border-t border-border">
        {items.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <label htmlFor={`n-${i.key}`} className="cursor-pointer">
              <span className="block text-[13px] font-medium text-fg">{i.label}</span>
              <span className="block text-[12px] text-fg-3">{i.desc}</span>
            </label>
            <Switch
              id={`n-${i.key}`}
              checked={settings.notifications[i.key]}
              onCheckedChange={(v) => {
                update({ notifications: { ...settings.notifications, [i.key]: v } })
                toast.success('Notification preferences saved.')
              }}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function DemoTab() {
  const reset = useAppStore((s) => s.resetDemo)
  const counts = useAppStore(useShallow((s) => ({ p: s.projects.length, i: s.issues.length, t: s.glossary.length, tm: s.tm.length, sc: s.scans.filter(isLiveScan).length })))
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardHeader title="Demo data" description="This workspace runs entirely in your browser with seeded sample data." icon={<Database className="size-4 text-fg-3" />} />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ['Projects', counts.p],
            ['Issues', counts.i],
            ['Glossary terms', counts.t],
            ['TM units', counts.tm],
            ['Scans run this session', counts.sc],
          ].map(([l, v]) => (
            <div key={l} className="rounded-[10px] border border-border px-3 py-2.5">
              <div className="text-[11.5px] text-fg-3">{l}</div>
              <div className="text-[17px] font-semibold text-fg tabular">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-fg-2">
          Storage: {storageIsPersistent ? 'changes are saved in this browser’s local storage and survive reloads.' : 'local storage is unavailable here, so changes last until the page is closed.'} No data leaves your browser and no AI provider is called.
        </p>
        <div className="flex flex-col gap-3 rounded-[12px] border border-error-dot/30 bg-error-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] font-semibold text-fg">Reset demo data</div>
            <div className="text-[12.5px] text-fg-2">Restore the original seeded dataset and clear all local modifications (projects, scans, resolved issues, settings).</div>
          </div>
          <Button variant="danger" onClick={() => setOpen(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      </CardBody>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        danger
        title="Reset demo data?"
        description="All changes made in this browser will be discarded and the original sample workspace restored. This cannot be undone."
        confirmLabel="Reset demo"
        confirmText="reset"
        onConfirm={() => {
          reset()
          toast.success('Demo data restored.', { description: 'The workspace is back to its original state.' })
          navigate('/dashboard')
        }}
      />
    </Card>
  )
}
