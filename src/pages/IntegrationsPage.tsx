import { Check, CheckCircle2, Clock, Loader2, MoreHorizontal, Plug, RefreshCw, ShieldCheck, Unplug } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DemoTag, EmptyState, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox, ProgressBar } from '@/components/ui/controls'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui/dropdown'
import { Field, Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/tabs'
import { useCan } from '@/hooks/useData'
import { useAppStore } from '@/store/useAppStore'
import type { Integration, IntegrationCategory } from '@/types'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/dates'

const CATEGORIES: (IntegrationCategory | 'All')[] = ['All', 'CAT Tools', 'Translation Management', 'Project Management', 'File Import / Export', 'AI Providers', 'Storage']
const STATUS = { connected: { label: 'Connected', tone: 'success' }, available: { label: 'Available', tone: 'outline' }, coming_soon: { label: 'Coming Soon', tone: 'neutral' } } as const

function Monogram({ i, size = 40 }: { i: Integration; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[10px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" style={{ width: size, height: size, background: i.color, fontSize: size * 0.34 }} aria-hidden>
      {i.monogram}
    </span>
  )
}

export default function IntegrationsPage() {
  const integrations = useAppStore((s) => s.integrations)
  const disconnect = useAppStore((s) => s.disconnectIntegration)
  const toggleWaitlist = useAppStore((s) => s.toggleWaitlist)
  const can = useCan()
  const [cat, setCat] = useState<IntegrationCategory | 'All'>('All')
  const [q, setQ] = useState('')
  const [connecting, setConnecting] = useState<Integration | null>(null)
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null)

  const list = useMemo(() => integrations.filter((i) => (cat === 'All' || i.category === cat) && (!q.trim() || `${i.name} ${i.description}`.toLowerCase().includes(q.trim().toLowerCase()))), [integrations, cat, q])
  const connected = integrations.filter((i) => i.status === 'connected').length

  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect your localization workflow." eyebrow={<DemoTag>Simulated connections — no real accounts are linked</DemoTag>} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={cat} onChange={setCat} aria-label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c, count: c === 'All' ? integrations.length : integrations.filter((i) => i.category === c).length }))} />
        <SearchBar value={q} onChange={setQ} placeholder="Search integrations…" className="w-full lg:w-64" />
      </div>
      <p className="mb-3 text-[12.5px] text-fg-2">
        <b className="text-fg">{connected}</b> connected · {integrations.filter((i) => i.status === 'available').length} available · {integrations.filter((i) => i.status === 'coming_soon').length} coming soon
      </p>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Plug />} title="No integrations found" description="Try another category or search term." />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <Card key={i.id} className={cn('flex flex-col p-4', i.status === 'connected' && 'border-success-dot/30')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Monogram i={i} />
                  <div>
                    <div className="text-[14px] font-semibold text-fg">{i.name}</div>
                    <div className="text-[12px] text-fg-3">{i.category}</div>
                  </div>
                </div>
                <Badge tone={STATUS[i.status].tone}>
                  {i.status === 'connected' && <CheckCircle2 />}
                  {i.status === 'coming_soon' && <Clock />}
                  {STATUS[i.status].label}
                </Badge>
              </div>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-fg-2">{i.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {i.capabilities.map((c) => (
                  <span key={c} className="rounded bg-subtle px-1.5 py-0.5 text-[11.5px] text-fg-2">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-[12px] text-fg-3">{i.status === 'connected' && i.connectedAt ? `Connected ${formatRelative(i.connectedAt)}` : i.status === 'coming_soon' ? (i.waitlisted ? 'You’re on the waitlist' : 'In development') : 'Not connected'}</span>
                {i.status === 'available' && (
                  <Button size="sm" variant="primary" onClick={() => setConnecting(i)} disabled={!can('integration.manage')}>
                    <Plug /> Connect
                  </Button>
                )}
                {i.status === 'coming_soon' && (
                  <Button
                    size="sm"
                    variant={i.waitlisted ? 'ghost' : 'secondary'}
                    onClick={() => {
                      toggleWaitlist(i.id)
                      toast.success(i.waitlisted ? 'Removed from waitlist.' : 'Added to waitlist.', { description: i.waitlisted ? undefined : `We'll notify you when ${i.name} is available.` })
                    }}
                  >
                    {i.waitlisted ? (
                      <>
                        <Check /> On waitlist
                      </>
                    ) : (
                      'Join waitlist'
                    )}
                  </Button>
                )}
                {i.status === 'connected' && (
                  <DropdownMenu>
                    <DropdownTrigger asChild>
                      <Button size="sm">
                        Manage <MoreHorizontal />
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownItem icon={<RefreshCw />} onSelect={() => toast.success(`${i.name} sync complete.`, { description: 'Demo sync — no external data was transferred.' })}>
                        Sync now
                      </DropdownItem>
                      <DropdownItem icon={<Unplug />} danger disabled={!can('integration.manage')} onSelect={() => setDisconnecting(i)}>
                        Disconnect
                      </DropdownItem>
                    </DropdownContent>
                  </DropdownMenu>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ConnectDialog integration={connecting} onClose={() => setConnecting(null)} />
      <ConfirmDialog
        open={!!disconnecting}
        onOpenChange={(o) => !o && setDisconnecting(null)}
        danger
        title={`Disconnect ${disconnecting?.name}?`}
        description="Automatic syncs and QA triggers from this integration will stop. Existing projects and findings are kept."
        confirmLabel="Disconnect"
        onConfirm={() => {
          if (disconnecting) {
            disconnect(disconnecting.id)
            toast.success(`${disconnecting.name} disconnected.`)
          }
        }}
      />
    </div>
  )
}

function ConnectDialog({ integration, onClose }: { integration: Integration | null; onClose: () => void }) {
  const connect = useAppStore((s) => s.connectIntegration)
  const [step, setStep] = useState<'permissions' | 'authorizing' | 'done'>('permissions')
  const [account, setAccount] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (integration) {
      setStep('permissions')
      setAccount(`northstar-l10n.${integration.name.toLowerCase().replace(/\s+/g, '')}.example`)
      setScopes(integration.capabilities)
      setProgress(0)
    }
  }, [integration])
  if (!integration) return <Dialog open={false} onOpenChange={() => onClose()}>{null}</Dialog>
  const authorize = () => {
    setStep('authorizing')
    let p = 0
    const t = setInterval(() => {
      p += 9 + Math.random() * 10
      setProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(t)
        connect(integration.id)
        setStep('done')
        toast.success(`${integration.name} connected.`, { description: 'Demo connection — no real account was linked.' })
      }
    }, 140)
  }
  return (
    <Dialog open onOpenChange={(o) => !o && step !== 'authorizing' && onClose()}>
      <DialogContent
        size="sm"
        hideClose={step === 'authorizing'}
        title={
          <span className="flex items-center gap-2.5">
            <Monogram i={integration} size={28} /> Connect {integration.name}
          </span>
        }
        description={<DemoTag>Simulated connection flow</DemoTag>}
        footer={
          step === 'permissions' ? (
            <>
              <Button onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={authorize} disabled={!account.trim() || scopes.length === 0}>
                Authorize
              </Button>
            </>
          ) : step === 'done' ? (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          ) : undefined
        }
      >
        {step === 'permissions' && (
          <div className="space-y-4">
            <Field label={`${integration.name} workspace`} htmlFor="int-account" hint="In production you would be redirected to sign in with OAuth.">
              <Input id="int-account" value={account} onChange={(e) => setAccount(e.target.value)} />
            </Field>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-fg">
                <ShieldCheck className="size-3.5 text-accent" /> LingoPilot will be able to
              </div>
              <div className="space-y-2">
                {integration.capabilities.map((c) => (
                  <Checkbox key={c} id={`scope-${c}`} checked={scopes.includes(c)} onCheckedChange={(v) => setScopes((s) => (v ? [...s, c] : s.filter((x) => x !== c)))} label={c} />
                ))}
              </div>
            </div>
          </div>
        )}
        {step === 'authorizing' && (
          <div className="py-4">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-fg">
              <Loader2 className="size-4 animate-spin text-primary" /> Authorizing and verifying access… <span className="ml-auto tabular text-fg-2">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} label="Connection progress" />
          </div>
        )}
        {step === 'done' && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-6" />
            </span>
            <div className="text-[14px] font-semibold text-fg">{integration.name} is connected</div>
            <p className="mt-1 text-[12.5px] text-fg-2">New jobs from {account} will be scanned automatically. This is a simulated connection for the demo.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
