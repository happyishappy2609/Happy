import { CalendarClock, Database, Edit3, Globe2, MoreHorizontal, Plus, Recycle, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ExportMenu } from '@/components/common/ExportMenu'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { ClientBadge, EmptyState, FilterBar, SearchBar, SectionTitle } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination, Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui/dropdown'
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCan, useLookups } from '@/hooks/useData'
import { exportRows } from '@/services/exportService'
import { lookupTM } from '@/services/tmService'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode, TMUnit } from '@/types'
import { cn } from '@/utils/cn'
import { formatRelative } from '@/utils/dates'
import { LANGUAGES, pairLabel, TARGET_LANGS } from '@/utils/languages'

const PAGE = 12
const STATUS = { approved: { label: 'Approved', tone: 'success' }, draft: { label: 'Draft', tone: 'neutral' }, needs_review: { label: 'Needs review', tone: 'warning' } } as const

function MatchPill({ score }: { score: number }) {
  return (
    <span className={cn('inline-flex rounded-md px-1.5 py-[1px] text-[12px] font-semibold tabular', score === 100 ? 'bg-success-soft text-success' : score >= 95 ? 'bg-primary-soft text-primary' : score >= 85 ? 'bg-info-soft text-info' : 'bg-subtle text-fg-2')}>
      {score}%
    </span>
  )
}

export default function TranslationMemoryPage() {
  const tm = useAppStore((s) => s.tm)
  const deleteTM = useAppStore((s) => s.deleteTM)
  const { clients, clientById } = useLookups()
  const can = useCan()
  const [q, setQ] = useState('')
  const [pair, setPair] = useState('all')
  const [client, setClient] = useState('all')
  const [match, setMatch] = useState('all')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<TMUnit | 'new' | null>(null)
  const [deleting, setDeleting] = useState<TMUnit | null>(null)
  const [lookup, setLookup] = useState('Your subscription renews automatically unless cancelled.')
  const [lookupLang, setLookupLang] = useState<LangCode>('fr')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return tm.filter((u) => {
      if (pair !== 'all' && u.targetLang !== pair) return false
      if (client !== 'all' && u.clientId !== client) return false
      if (match === 'exact' && u.lastMatch !== 100) return false
      if (match === 'fuzzy' && u.lastMatch === 100) return false
      if (match === 'approved' && u.status !== 'approved') return false
      if (term && !`${u.source} ${u.target}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [tm, q, pair, client, match])
  useEffect(() => setPage(0), [q, pair, client, match])

  const monthAgo = Date.now() - 30 * 86_400_000
  const reuse = Math.round((tm.reduce((s, u) => s + (u.usageCount > 0 ? 1 : 0), 0) / Math.max(1, tm.length)) * 100 * 0.62)
  const lookupResults = useMemo(() => (lookup.trim().length > 2 ? lookupTM(lookup, 'en', lookupLang, tm, undefined, 4) : []), [lookup, lookupLang, tm])
  const best = lookupResults[0]

  return (
    <div>
      <PageHeader
        title="Translation Memory"
        subtitle="Reuse approved translations and improve consistency."
        actions={
          <>
            <ExportMenu label="Export TMX-ready" formats={['csv', 'xlsx', 'json']} onExport={(f) => exportRows(filtered.map((u) => ({ source: u.source, target: u.target, pair: pairLabel(u.sourceLang, u.targetLang), client: u.clientId ? clientById.get(u.clientId)?.name : 'Shared', match: u.lastMatch, status: u.status, uses: u.usageCount, updated: u.updatedAt })), f as 'csv' | 'xlsx' | 'json', 'lingopilot-tm', 'Translation memory')} />
            <Button variant="primary" onClick={() => setEditing('new')} disabled={!can('tm.edit')}>
              <Plus /> Add entry
            </Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIStatCard label="Total Translation Units" icon={<Database />} value={tm.length} footer={`${tm.filter((u) => u.status === 'approved').length} approved`} />
        <KPIStatCard label="Reuse Rate" icon={<Recycle />} value={`${reuse}%`} footer="Segments leveraged from TM, last 30 days" tooltip="Share of new segments pre-filled from exact or high fuzzy matches. Demo estimate." />
        <KPIStatCard label="Languages" icon={<Globe2 />} value={new Set(tm.map((u) => u.targetLang)).size} footer="Target languages" />
        <KPIStatCard label="Updated This Month" icon={<CalendarClock />} value={tm.filter((u) => new Date(u.updatedAt).getTime() >= monthAgo).length} footer="New or edited units" />
      </div>

      <Card className="mb-4">
        <CardHeader title="TM lookup" description="Type a source segment to see how LingoPilot leverages existing translations." icon={<Search className="size-4 text-fg-3" />} />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <Input value={lookup} onChange={(e) => setLookup(e.target.value)} aria-label="Source text to look up" placeholder="Enter English source text…" />
            <NativeSelect value={lookupLang} onChange={(e) => setLookupLang(e.target.value as LangCode)} aria-label="Target language">
              {TARGET_LANGS.map((l) => (
                <option key={l} value={l}>
                  {pairLabel('en', l)} · {LANGUAGES[l].name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="mt-3">
            {lookup.trim().length <= 2 ? null : !best ? (
              <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-border-strong px-3 py-3 text-[13px] text-fg-2">
                <Badge tone="neutral">No match</Badge> No translation unit above 70% similarity. The segment will be translated from scratch.
              </div>
            ) : (
              <ul className="space-y-2">
                {lookupResults.map((m) => (
                  <li key={m.unit.id} className="grid gap-2 rounded-[10px] border border-border px-3 py-2.5 sm:grid-cols-[110px_1fr_1fr] sm:items-center">
                    <span className="flex items-center gap-2">
                      <MatchPill score={m.score} />
                      <span className="text-[12px] text-fg-3">{m.score === 100 ? 'Exact' : m.score >= 95 ? 'High fuzzy' : m.score >= 85 ? 'Fuzzy' : 'Low fuzzy'}</span>
                    </span>
                    <span className="text-[13px] text-fg-2">{m.unit.source}</span>
                    <span className="text-[13px] font-medium text-fg">{m.unit.target}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar>
            <Select size="sm" className="w-auto min-w-[130px]" aria-label="Language pair" value={pair} onValueChange={setPair} options={[{ value: 'all', label: 'All pairs' }, ...TARGET_LANGS.map((l) => ({ value: l, label: pairLabel('en', l), hint: LANGUAGES[l].name }))]} />
            <Select size="sm" className="w-auto min-w-[150px]" aria-label="Client" value={client} onValueChange={setClient} options={[{ value: 'all', label: 'All clients' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Match type" value={match} onValueChange={setMatch} options={[{ value: 'all', label: 'Any match' }, { value: 'exact', label: 'Exact match' }, { value: 'fuzzy', label: 'Fuzzy match' }, { value: 'approved', label: 'Approved only' }]} />
            <span className="text-[12px] text-fg-3 tabular">{filtered.length} units</span>
          </FilterBar>
          <SearchBar value={q} onChange={setQ} placeholder="Search source or target…" className="w-full lg:w-72" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<Database />} title="No translation units found" description="Adjust filters or add a new approved translation." action={<Button variant="primary" onClick={() => setEditing('new')} disabled={!can('tm.edit')}><Plus /> Add entry</Button>} />
        ) : (
          <>
            <TableWrap>
              <Table className="min-w-[900px]">
                <thead>
                  <tr>
                    <Th>Source</Th>
                    <Th>Target</Th>
                    <Th>Language Pair</Th>
                    <Th>Client</Th>
                    <Th>Match %</Th>
                    <Th>Status</Th>
                    <Th>Updated</Th>
                    <Th className="w-10">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(page * PAGE, page * PAGE + PAGE).map((u) => (
                    <Tr key={u.id} onClick={() => can('tm.edit') && setEditing(u)}>
                      <Td className="max-w-[280px] text-fg">{u.source}</Td>
                      <Td className="max-w-[280px] text-fg">{u.target}</Td>
                      <Td className="whitespace-nowrap text-fg-2">{pairLabel(u.sourceLang, u.targetLang)}</Td>
                      <Td>{u.clientId ? <ClientBadge client={clientById.get(u.clientId)} /> : <span className="text-fg-3">Shared</span>}</Td>
                      <Td>
                        <MatchPill score={u.lastMatch} />
                      </Td>
                      <Td>
                        <Badge tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-fg-3">
                        {formatRelative(u.updatedAt)}
                        <span className="block text-[11.5px]">{u.usageCount} uses</span>
                      </Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownTrigger asChild>
                            <Button size="icon-sm" variant="ghost" aria-label="Unit actions">
                              <MoreHorizontal />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent>
                            <DropdownItem icon={<Edit3 />} disabled={!can('tm.edit')} onSelect={() => setEditing(u)}>
                              Edit entry
                            </DropdownItem>
                            <DropdownItem icon={<Trash2 />} danger disabled={!can('tm.edit')} onSelect={() => setDeleting(u)}>
                              Delete entry
                            </DropdownItem>
                          </DropdownContent>
                        </DropdownMenu>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <Pagination page={page} pageCount={Math.ceil(filtered.length / PAGE)} total={filtered.length} pageSize={PAGE} onPage={setPage} label="units" />
          </>
        )}
      </Card>

      <TMDialog unit={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title="Delete translation unit?"
        description="This unit will no longer be offered as a match. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) deleteTM(deleting.id)
          toast.success('Translation unit deleted.')
        }}
      />
    </div>
  )
}

function TMDialog({ unit, onClose }: { unit: TMUnit | 'new' | null; onClose: () => void }) {
  const addTM = useAppStore((s) => s.addTM)
  const updateTM = useAppStore((s) => s.updateTM)
  const tm = useAppStore((s) => s.tm)
  const { clients } = useLookups()
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [lang, setLang] = useState<LangCode>('fr')
  const [clientId, setClientId] = useState<string>('')
  const [status, setStatus] = useState<TMUnit['status']>('approved')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (unit === 'new') {
      setSource('')
      setTarget('')
      setLang('fr')
      setClientId('')
      setStatus('approved')
    } else if (unit) {
      setSource(unit.source)
      setTarget(unit.target)
      setLang(unit.targetLang)
      setClientId(unit.clientId ?? '')
      setStatus(unit.status)
    }
    setTouched(false)
  }, [unit])
  const similar = useMemo(() => (source.trim().length > 3 ? lookupTM(source, 'en', lang, tm.filter((u) => unit === 'new' || !unit || u.id !== unit.id), undefined, 1)[0] : undefined), [source, lang, tm, unit])
  const err = { source: !source.trim() ? 'Source is required.' : undefined, target: !target.trim() ? 'Target is required.' : undefined }
  return (
    <Dialog open={!!unit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title={unit === 'new' ? 'Add translation unit' : 'Edit translation unit'}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setTouched(true)
                if (err.source || err.target) return
                const payload = { source: source.trim(), target: target.trim(), sourceLang: 'en' as LangCode, targetLang: lang, clientId: clientId || null, status, lastMatch: 100 }
                if (unit === 'new') addTM(payload)
                else if (unit) updateTM(unit.id, payload)
                toast.success('Translation unit saved.')
                onClose()
              }}
            >
              Save entry
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Source (English)" htmlFor="tm-src" className="sm:col-span-2" error={touched ? err.source : undefined}>
            <Textarea id="tm-src" value={source} onChange={(e) => setSource(e.target.value)} className="min-h-[60px]" autoFocus />
          </Field>
          <Field label="Target" htmlFor="tm-tgt" className="sm:col-span-2" error={touched ? err.target : undefined}>
            <Textarea id="tm-tgt" value={target} onChange={(e) => setTarget(e.target.value)} className="min-h-[60px]" />
          </Field>
          <Field label="Target language" htmlFor="tm-lang">
            <NativeSelect id="tm-lang" value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
              {TARGET_LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGES[l].name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Client" htmlFor="tm-client">
            <NativeSelect id="tm-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Shared (all clients)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Status" htmlFor="tm-status">
            <NativeSelect id="tm-status" value={status} onChange={(e) => setStatus(e.target.value as TMUnit['status'])}>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="needs_review">Needs review</option>
            </NativeSelect>
          </Field>
        </div>
        {similar && (
          <div className="mt-4">
            <SectionTitle>Closest existing unit</SectionTitle>
            <div className="flex items-start gap-2 rounded-[10px] border border-border px-3 py-2 text-[12.5px]">
              <MatchPill score={similar.score} />
              <div>
                <div className="text-fg-2">{similar.unit.source}</div>
                <div className="text-fg">{similar.unit.target}</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
