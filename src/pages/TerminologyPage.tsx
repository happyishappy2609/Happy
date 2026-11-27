import { BookText, CheckCircle2, Clock3, Edit3, FileUp, Globe2, MoreHorizontal, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ExportMenu } from '@/components/common/ExportMenu'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { ClientBadge, EmptyState, FilterBar, LangChip, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination, Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { Field, Input, NativeSelect, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCan, useLookups } from '@/hooks/useData'
import { exportRows } from '@/services/exportService'
import { parseCSVRows } from '@/services/importService'
import { useAppStore } from '@/store/useAppStore'
import type { GlossaryTerm, LangCode } from '@/types'
import { formatRelative } from '@/utils/dates'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'
import { isOpen } from '@/utils/quality'

const STATUS_TONE = { approved: 'success', pending: 'warning', deprecated: 'neutral' } as const
const PAGE = 15

type Draft = Omit<GlossaryTerm, 'id' | 'updatedAt' | 'updatedBy'>

const emptyDraft = (): Draft => ({ source: '', target: '', sourceLang: 'en', targetLang: 'fr', clientId: null, domain: 'General UI', definition: '', usageNotes: '', status: 'pending', forbidden: [] })

export default function TerminologyPage() {
  const [params] = useSearchParams()
  const glossary = useAppStore((s) => s.glossary)
  const issues = useAppStore((s) => s.issues)
  const updateTerm = useAppStore((s) => s.updateTerm)
  const deleteTerm = useAppStore((s) => s.deleteTerm)
  const importTerms = useAppStore((s) => s.importTerms)
  const { clients, clientById } = useLookups()
  const can = useCan()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [lang, setLang] = useState('all')
  const [client, setClient] = useState(params.get('client') ?? 'all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<GlossaryTerm | 'new' | null>(null)
  const [deleting, setDeleting] = useState<GlossaryTerm | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const c = params.get('client')
    if (c) setClient(c)
  }, [params])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return glossary.filter((t) => {
      if (lang !== 'all' && t.targetLang !== lang) return false
      if (client !== 'all' && (client === 'global' ? t.clientId !== null : t.clientId !== client)) return false
      if (status !== 'all' && t.status !== status) return false
      if (term && !`${t.source} ${t.target} ${t.domain}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [glossary, q, lang, client, status])
  useEffect(() => setPage(0), [q, lang, client, status])

  const termViolations = issues.filter((i) => isOpen(i) && i.category === 'terminology').length
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE)

  const onImport = async (file: File) => {
    try {
      const rows = parseCSVRows(await file.text())
      const header = rows[0]?.map((h) => h.trim().toLowerCase()) ?? []
      const idx = (k: string) => header.indexOf(k)
      if (idx('source') < 0 || idx('target') < 0) throw new Error('CSV must include "source" and "target" columns.')
      const terms: Draft[] = rows
        .slice(1)
        .filter((r) => r[idx('source')]?.trim() && r[idx('target')]?.trim())
        .map((r) => {
          const l = (r[idx('language')] ?? r[idx('target_lang')] ?? 'fr').trim().toLowerCase() as LangCode
          const cName = (r[idx('client')] ?? '').trim().toLowerCase()
          return {
            ...emptyDraft(),
            source: r[idx('source')]!.trim(),
            target: r[idx('target')]!.trim(),
            targetLang: LANGUAGES[l] ? l : 'fr',
            clientId: clients.find((c) => c.name.toLowerCase() === cName)?.id ?? null,
            domain: r[idx('domain')]?.trim() || 'Imported',
            status: 'pending',
          }
        })
      if (!terms.length) throw new Error('No valid rows found.')
      const n = importTerms(terms)
      toast.success('Glossary imported.', { description: `${n} terms added as Pending review.` })
    } catch (e) {
      toast.error('Import failed.', { description: (e as Error).message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Terminology"
        subtitle="Maintain consistent terminology across clients, projects, and languages."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="sr-only"
              aria-label="Import glossary CSV"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onImport(f)
                e.target.value = ''
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={!can('glossary.edit')} title="CSV with columns: source, target, language, client, domain">
              <FileUp /> Import glossary
            </Button>
            <ExportMenu
              label="Export glossary"
              formats={['csv', 'xlsx', 'json']}
              onExport={(f) =>
                exportRows(
                  filtered.map((t) => ({ source: t.source, target: t.target, source_language: t.sourceLang, language: t.targetLang, client: t.clientId ? clientById.get(t.clientId)?.name : 'All clients', domain: t.domain, status: t.status, definition: t.definition, usage_notes: t.usageNotes, forbidden: (t.forbidden ?? []).join('; ') })),
                  f as 'csv' | 'xlsx' | 'json',
                  'lingopilot-glossary',
                  'Glossary',
                )
              }
            />
            <Button variant="primary" onClick={() => setEditing('new')} disabled={!can('glossary.edit')}>
              <Plus /> Add term
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIStatCard label="Total Terms" icon={<BookText />} value={glossary.length} footer={`${glossary.filter((t) => t.clientId).length} client-specific`} />
        <KPIStatCard label="Approved Terms" icon={<CheckCircle2 />} value={glossary.filter((t) => t.status === 'approved').length} footer="Enforced during QA" onClick={() => setStatus('approved')} />
        <KPIStatCard label="Pending Review" icon={<Clock3 />} value={glossary.filter((t) => t.status === 'pending').length} footer="Awaiting approval" onClick={() => setStatus('pending')} />
        <KPIStatCard label="Languages" icon={<Globe2 />} value={new Set(glossary.map((t) => t.targetLang)).size} footer="Target languages covered" />
      </div>

      <div className="mb-4 flex flex-col gap-2 rounded-[12px] border border-primary/20 bg-primary-soft/50 px-4 py-3 text-[13px] text-fg sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <b>Terminology enforcement is on.</b> Approved terms and forbidden variants are checked in every AI QA scan; deviations are flagged with the preferred term and a recommended correction.
          </span>
        </span>
        <Link to="/issues?category=terminology" className="shrink-0 text-[12.5px] font-medium text-primary hover:underline">
          {termViolations} open terminology issues →
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar>
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Language" value={lang} onValueChange={setLang} options={[{ value: 'all', label: 'All languages' }, ...TARGET_LANGS.map((l) => ({ value: l, label: LANGUAGES[l].name }))]} />
            <Select size="sm" className="w-auto min-w-[160px]" aria-label="Client" value={client} onValueChange={setClient} options={[{ value: 'all', label: 'All clients' }, { value: 'global', label: 'Global (all clients)' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select size="sm" className="w-auto min-w-[130px]" aria-label="Status" value={status} onValueChange={setStatus} options={[{ value: 'all', label: 'Any status' }, { value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending review' }, { value: 'deprecated', label: 'Deprecated' }]} />
            <span className="text-[12px] text-fg-3 tabular">{filtered.length} terms</span>
          </FilterBar>
          <SearchBar value={q} onChange={setQ} placeholder="Search terms…" className="w-full lg:w-72" />
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={<BookText />} title="No terms found" description="Adjust the filters or add a new approved term." action={<Button variant="primary" onClick={() => setEditing('new')} disabled={!can('glossary.edit')}><Plus /> Add term</Button>} />
        ) : (
          <>
            <TableWrap>
              <Table className="min-w-[860px]">
                <thead>
                  <tr>
                    <Th>Source Term</Th>
                    <Th>Target Term</Th>
                    <Th>Language</Th>
                    <Th>Client</Th>
                    <Th>Domain</Th>
                    <Th>Status</Th>
                    <Th>Last Updated</Th>
                    <Th className="w-10">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <Tr key={t.id} onClick={() => can('glossary.edit') && setEditing(t)}>
                      <Td>
                        <div className="font-medium text-fg">{t.source}</div>
                        {t.definition && <div className="max-w-[240px] truncate text-[12px] text-fg-3">{t.definition}</div>}
                      </Td>
                      <Td>
                        <div className="font-medium text-fg">{t.target}</div>
                        {t.forbidden?.length ? <div className="text-[11.5px] text-fg-3">Avoid: {t.forbidden.join(', ')}</div> : null}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1">
                          <LangChip lang={t.sourceLang} />→<LangChip lang={t.targetLang} />
                        </span>
                      </Td>
                      <Td>{t.clientId ? <ClientBadge client={clientById.get(t.clientId)} /> : <span className="text-fg-3">All clients</span>}</Td>
                      <Td className="text-fg-2">{t.domain}</Td>
                      <Td>
                        <Badge tone={STATUS_TONE[t.status]}>{t.status === 'pending' ? 'Pending review' : t.status[0]!.toUpperCase() + t.status.slice(1)}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-fg-3">{formatRelative(t.updatedAt)}</Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownTrigger asChild>
                            <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${t.source}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownTrigger>
                          <DropdownContent>
                            <DropdownItem icon={<Edit3 />} disabled={!can('glossary.edit')} onSelect={() => setEditing(t)}>
                              Edit term
                            </DropdownItem>
                            {t.status !== 'approved' && (
                              <DropdownItem
                                icon={<CheckCircle2 />}
                                disabled={!can('glossary.approve')}
                                onSelect={() => {
                                  updateTerm(t.id, { status: 'approved' })
                                  toast.success('Term approved.', { description: `"${t.target}" will be enforced in future QA scans.` })
                                }}
                              >
                                Approve term
                              </DropdownItem>
                            )}
                            <DropdownSeparator />
                            <DropdownItem icon={<Trash2 />} danger disabled={!can('glossary.edit')} onSelect={() => setDeleting(t)}>
                              Delete term
                            </DropdownItem>
                          </DropdownContent>
                        </DropdownMenu>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            <Pagination page={page} pageCount={Math.ceil(filtered.length / PAGE)} total={filtered.length} pageSize={PAGE} onPage={setPage} label="terms" />
          </>
        )}
      </Card>

      <TermDialog term={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        danger
        title="Delete glossary term?"
        description={deleting ? `"${deleting.source} → ${deleting.target}" will no longer be enforced during QA. This cannot be undone.` : ''}
        confirmLabel="Delete term"
        onConfirm={() => {
          if (deleting) deleteTerm(deleting.id)
          toast.success('Glossary term deleted.')
        }}
      />
    </div>
  )
}

function TermDialog({ term, onClose }: { term: GlossaryTerm | 'new' | null; onClose: () => void }) {
  const addTerm = useAppStore((s) => s.addTerm)
  const updateTerm = useAppStore((s) => s.updateTerm)
  const { clients } = useLookups()
  const can = useCan()
  const [d, setD] = useState<Draft>(emptyDraft)
  const [forbidden, setForbidden] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (term === 'new') {
      setD(emptyDraft())
      setForbidden('')
    } else if (term) {
      const { id: _i, updatedAt: _u, updatedBy: _b, ...rest } = term
      void _i
      void _u
      void _b
      setD(rest)
      setForbidden((term.forbidden ?? []).join(', '))
    }
    setTouched(false)
  }, [term])
  const errors = { source: !d.source.trim() ? 'Source term is required.' : undefined, target: !d.target.trim() ? 'Target term is required.' : undefined }
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const save = () => {
    setTouched(true)
    if (errors.source || errors.target) return
    const payload = { ...d, source: d.source.trim(), target: d.target.trim(), forbidden: forbidden.split(',').map((s) => s.trim()).filter(Boolean) }
    if (term === 'new') addTerm(payload)
    else if (term) updateTerm(term.id, payload)
    toast.success('Glossary term saved.', { description: payload.status === 'approved' ? 'Approved terms are enforced in AI QA scans.' : 'Approve the term to enforce it during QA.' })
    onClose()
  }
  return (
    <Dialog open={!!term} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="lg"
        title={term === 'new' ? 'Add term' : 'Edit term'}
        description="Approved terms are enforced in every AI QA scan for the selected client and language."
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              Save term
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Source term" htmlFor="t-src" error={touched ? errors.source : undefined}>
            <Input id="t-src" value={d.source} onChange={(e) => set('source', e.target.value)} autoFocus />
          </Field>
          <Field label="Target term" htmlFor="t-tgt" error={touched ? errors.target : undefined}>
            <Input id="t-tgt" value={d.target} onChange={(e) => set('target', e.target.value)} />
          </Field>
          <Field label="Source language" htmlFor="t-sl">
            <NativeSelect id="t-sl" value={d.sourceLang} onChange={(e) => set('sourceLang', e.target.value as LangCode)}>
              <option value="en">English</option>
            </NativeSelect>
          </Field>
          <Field label="Target language" htmlFor="t-tl">
            <NativeSelect id="t-tl" value={d.targetLang} onChange={(e) => set('targetLang', e.target.value as LangCode)}>
              {TARGET_LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGES[l].name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Client" htmlFor="t-client">
            <NativeSelect id="t-client" value={d.clientId ?? ''} onChange={(e) => set('clientId', e.target.value || null)}>
              <option value="">All clients (global)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Domain" htmlFor="t-domain">
            <Input id="t-domain" value={d.domain} onChange={(e) => set('domain', e.target.value)} />
          </Field>
          <Field label="Definition" htmlFor="t-def" className="sm:col-span-2" optional>
            <Textarea id="t-def" value={d.definition} onChange={(e) => set('definition', e.target.value)} className="min-h-[56px]" />
          </Field>
          <Field label="Usage notes" htmlFor="t-notes" className="sm:col-span-2" optional>
            <Textarea id="t-notes" value={d.usageNotes} onChange={(e) => set('usageNotes', e.target.value)} className="min-h-[56px]" />
          </Field>
          <Field label="Forbidden variants" htmlFor="t-forbidden" hint="Comma-separated. Flagged as violations during QA." optional>
            <Input id="t-forbidden" value={forbidden} onChange={(e) => setForbidden(e.target.value)} placeholder="e.g. Caisse, Caddie" />
          </Field>
          <Field label="Status" htmlFor="t-status">
            <NativeSelect id="t-status" value={d.status} onChange={(e) => set('status', e.target.value as GlossaryTerm['status'])}>
              <option value="pending">Pending review</option>
              <option value="approved" disabled={!can('glossary.approve')}>
                Approved
              </option>
              <option value="deprecated">Deprecated</option>
            </NativeSelect>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}
