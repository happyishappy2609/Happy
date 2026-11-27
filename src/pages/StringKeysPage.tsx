import { AlertTriangle, Check, CheckCircle2, CircleDashed, Download, FileUp, KeyRound, ListChecks, Plus, ScanSearch, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { KPIStatCard } from '@/components/common/KPIStatCard'
import { EmptyState, FilterBar, LangChip, SearchBar } from '@/components/common/misc'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Table'
import { AddKeyDialog, ImportKeysDialog, KeyDrawer } from '@/components/keys/KeyDialogs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Segmented } from '@/components/ui/tabs'
import { useCan } from '@/hooks/useData'
import { buildKeyRows, hasValue, keyCompletion, toFlatJSON, toNestedJSON } from '@/services/stringKeyService'
import { useAppStore } from '@/store/useAppStore'
import type { LangCode, Project, StringKeyRow } from '@/types'
import { cn } from '@/utils/cn'
import { downloadText, slugify, toCSV } from '@/utils/download'
import { LANGUAGES } from '@/utils/languages'
import { isOpen } from '@/utils/quality'

type Filter = 'all' | 'missing' | 'complete' | 'issues'
const PAGE = 25

function ValueCell({ project, row, lang, openIssues, editing, onEdit, onDone }: { project: Project; row: StringKeyRow; lang: LangCode; openIssues: number; editing: boolean; onEdit: () => void; onDone: () => void }) {
  const setKeyValue = useAppStore((s) => s.setKeyValue)
  const can = useCan()
  const seg = row.values[lang]
  const [draft, setDraft] = useState(seg?.target ?? '')
  useEffect(() => {
    if (editing) setDraft(seg?.target ?? '')
  }, [editing, seg?.target])
  const over = !!row.maxLength && !!seg && seg.target.length > row.maxLength

  const save = () => {
    if (draft.trim() !== (seg?.target ?? '')) {
      setKeyValue(project.id, row.key, lang, draft)
      toast.success(draft.trim() ? 'Value saved.' : 'Value cleared.', { description: `${row.key} · ${LANGUAGES[lang].name}` })
    }
    onDone()
  }

  if (editing) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              save()
            }
            if (e.key === 'Escape') onDone()
          }}
          className="min-h-[54px] text-[13px]"
          aria-label={`${LANGUAGES[lang].name} value for ${row.key}`}
        />
        <div className="mt-1 flex items-center gap-1">
          <Button size="icon-sm" variant="primary" onClick={save} aria-label="Save value">
            <Check />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onDone} aria-label="Cancel">
            <X />
          </Button>
          {row.maxLength && <span className={cn('ml-auto text-[11px] tabular', draft.length > row.maxLength ? 'text-error' : 'text-fg-3')}>{draft.length}/{row.maxLength}</span>}
        </div>
      </div>
    )
  }

  if (!hasValue(seg)) {
    return (
      <button
        type="button"
        disabled={!can('segment.edit')}
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-warning-dot/50 bg-warning-soft/50 px-2 py-1 text-[12px] font-medium text-warning hover:bg-warning-soft disabled:opacity-60"
      >
        <Plus className="size-3" /> Add value
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (can('segment.edit')) onEdit()
      }}
      className="group block w-full rounded text-left"
      title={can('segment.edit') ? 'Click to edit' : seg!.target}
    >
      <span className="line-clamp-2 text-[13px] text-fg">{seg!.target}</span>
      {(openIssues > 0 || over) && (
        <span className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
          {openIssues > 0 && (
            <span className="inline-flex items-center gap-0.5 text-error">
              <AlertTriangle className="size-3" /> {openIssues} issue{openIssues > 1 ? 's' : ''}
            </span>
          )}
          {over && <span className="text-warning">over {row.maxLength} chars</span>}
        </span>
      )}
    </button>
  )
}

export default function StringKeysPage() {
  const [params, setParams] = useSearchParams()
  const projects = useAppStore((s) => s.projects)
  const segments = useAppStore((s) => s.segments)
  const issues = useAppStore((s) => s.issues)
  const openScan = useAppStore((s) => s.openScanDialog)
  const can = useCan()
  const selectable = projects.filter((p) => p.status !== 'completed')
  const projectId = params.get('project') && projects.some((p) => p.id === params.get('project')) ? params.get('project')! : (selectable.find((p) => p.id === 'p-nova-ecom') ?? selectable[0])?.id
  const project = projects.find((p) => p.id === projectId)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [ns, setNs] = useState('all')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const openKey = params.get('key')

  const setParam = (k: string, v: string | null) => {
    const n = new URLSearchParams(params)
    if (v) n.set(k, v)
    else n.delete(k)
    setParams(n, { replace: true })
  }

  const rows = useMemo(() => (project ? buildKeyRows(project, segments) : []), [project, segments])
  const keySet = useMemo(() => new Set(rows.map((r) => r.key)), [rows])
  const issuesBySeg = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of issues) if (i.projectId === projectId && isOpen(i)) m.set(i.segmentId, (m.get(i.segmentId) ?? 0) + 1)
    return m
  }, [issues, projectId])
  const rowIssues = (r: StringKeyRow) => Object.values(r.values).reduce((s, seg) => s + (seg ? (issuesBySeg.get(seg.id) ?? 0) : 0), 0)

  const langs = project?.targetLangs ?? []
  const namespaces = useMemo(() => [...new Set(rows.map((r) => r.namespace))].sort(), [rows])
  const stats = useMemo(() => {
    const complete = rows.filter((r) => keyCompletion(r, langs).complete).length
    const missing = rows.reduce((s, r) => s + (langs.length - keyCompletion(r, langs).done), 0)
    const withIssues = rows.filter((r) => rowIssues(r) > 0).length
    return { complete, missing, withIssues }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, langs, issuesBySeg])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (ns !== 'all' && r.namespace !== ns) return false
      const c = keyCompletion(r, langs)
      if (filter === 'missing' && c.complete) return false
      if (filter === 'complete' && !c.complete) return false
      if (filter === 'issues' && rowIssues(r) === 0) return false
      if (term && !`${r.key} ${r.source} ${Object.values(r.values).map((s) => s?.target ?? '').join(' ')}`.toLowerCase().includes(term)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filter, ns, langs, issuesBySeg])

  useEffect(() => setPage(0), [q, filter, ns, projectId])

  if (!project) {
    return <EmptyState icon={<KeyRound />} title="No active projects" description="Create a project to start managing string keys." />
  }

  const selectedRow = openKey ? (rows.find((r) => r.key === openKey) ?? null) : null
  const base = `${slugify(project.name)}`
  const exportLang = (lang: LangCode | 'source', nested: boolean) => {
    const flat = toFlatJSON(rows, lang)
    downloadText(JSON.stringify(nested ? toNestedJSON(flat) : flat, null, 2), `${base}.${lang === 'source' ? 'en' : lang}.json`, 'application/json')
    toast.success('Export ready.', { description: `${Object.keys(flat).length} keys · ${lang === 'source' ? 'English (source)' : LANGUAGES[lang].name}${nested ? ' · nested JSON' : ''}.` })
  }
  const exportCSV = () => {
    downloadText(
      toCSV(rows.map((r) => ({ key: r.key, source: r.source, note: r.note ?? '', max_length: r.maxLength ?? '', ...Object.fromEntries(langs.map((l) => [l, r.values[l]?.target ?? ''])) }))),
      `${base}-string-keys.csv`,
      'text/csv;charset=utf-8',
    )
    toast.success('Export ready.', { description: `${rows.length} keys × ${langs.length} languages as CSV.` })
  }

  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE)
  const totalValues = rows.length * langs.length
  const coverage = totalValues ? Math.round(((totalValues - stats.missing) / totalValues) * 100) : 0

  return (
    <div>
      <PageHeader
        title="String Keys"
        subtitle="Create resource keys and add their value in every target language."
        actions={
          <>
            <Button onClick={() => setImportOpen(true)} disabled={!can('project.edit')}>
              <FileUp /> Import keys
            </Button>
            <DropdownMenu>
              <DropdownTrigger asChild>
                <Button>
                  <Download /> Export
                </Button>
              </DropdownTrigger>
              <DropdownContent className="w-64">
                <DropdownLabel>Flat JSON · key → value</DropdownLabel>
                <DropdownItem onSelect={() => exportLang('source', false)}>English (source)</DropdownItem>
                {langs.map((l) => (
                  <DropdownItem key={l} onSelect={() => exportLang(l, false)}>
                    {LANGUAGES[l].name}
                  </DropdownItem>
                ))}
                <DropdownSeparator />
                <DropdownLabel>Nested JSON</DropdownLabel>
                {langs.map((l) => (
                  <DropdownItem key={`n-${l}`} onSelect={() => exportLang(l, true)}>
                    {LANGUAGES[l].name}
                  </DropdownItem>
                ))}
                <DropdownSeparator />
                <DropdownItem onSelect={exportCSV}>All languages (CSV)</DropdownItem>
              </DropdownContent>
            </DropdownMenu>
            <Button variant="primary" onClick={() => setAddOpen(true)} disabled={!can('project.edit')}>
              <Plus /> Add key
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-fg-2">
        Project
        <Select
          className="w-auto min-w-[220px]"
          aria-label="Project"
          value={project.id}
          onValueChange={(v) => {
            const n = new URLSearchParams()
            n.set('project', v)
            setParams(n, { replace: true })
            setNs('all')
          }}
          options={selectable.map((p) => ({ value: p.id, label: p.name, hint: p.targetLangs.map((l) => l.toUpperCase()).join(' ') }))}
        />
        <span className="flex items-center gap-1">
          EN →
          {langs.map((l) => (
            <LangChip key={l} lang={l} />
          ))}
        </span>
      </div>

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="String key summary">
        <KPIStatCard label="Keys" icon={<KeyRound />} value={rows.length} footer={`${namespaces.length} namespaces`} onClick={() => setFilter('all')} />
        <KPIStatCard label="Fully translated" icon={<CheckCircle2 />} value={stats.complete} footer={`${coverage}% of all values filled`} onClick={() => setFilter('complete')} />
        <KPIStatCard label="Missing values" icon={<CircleDashed />} value={stats.missing} footer={`Across ${langs.length} ${langs.length === 1 ? 'language' : 'languages'}`} onClick={() => setFilter('missing')} />
        <KPIStatCard label="Keys with open issues" icon={<ListChecks />} value={stats.withIssues} footer="From AI QA findings" onClick={() => setFilter('issues')} />
      </section>

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
          <FilterBar>
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              aria-label="Key status"
              options={[
                { value: 'all', label: 'All', count: rows.length },
                { value: 'missing', label: 'Missing values', count: rows.length - stats.complete },
                { value: 'complete', label: 'Complete', count: stats.complete },
                { value: 'issues', label: 'With issues', count: stats.withIssues },
              ]}
            />
            <Select size="sm" className="w-auto min-w-[140px]" aria-label="Namespace" value={ns} onValueChange={setNs} options={[{ value: 'all', label: 'All namespaces' }, ...namespaces.map((n) => ({ value: n, label: n, hint: String(rows.filter((r) => r.namespace === n).length) }))]} />
          </FilterBar>
          <div className="flex items-center gap-2">
            <SearchBar value={q} onChange={setQ} placeholder="Search keys or values…" className="w-full xl:w-72" />
            <Button size="icon" variant="ghost" onClick={() => openScan({ projectId: project.id })} disabled={!can('qa.run')} aria-label="Run AI QA on this project" title="Run AI QA on this project">
              <ScanSearch />
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<KeyRound />}
            title={rows.length ? 'No keys match' : 'No string keys yet'}
            description={rows.length ? 'Try another filter, namespace or search term.' : 'Add your first key or import a JSON resource file.'}
            action={
              <Button variant="primary" onClick={() => setAddOpen(true)} disabled={!can('project.edit')}>
                <Plus /> Add key
              </Button>
            }
          />
        ) : (
          <>
            <div className="relative overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left text-[13px]" style={{ minWidth: 420 + langs.length * 200 }}>
                <thead>
                  <tr className="bg-subtle/60 text-[11.5px] text-fg-2">
                    <th className="sticky left-0 z-10 h-9 w-[240px] border-b border-border bg-subtle px-3 pl-5 font-medium">Key</th>
                    <th className="h-9 w-[220px] border-b border-border px-3 font-medium">Source · EN</th>
                    {langs.map((l) => {
                      const filled = rows.filter((r) => hasValue(r.values[l])).length
                      return (
                        <th key={l} className="h-9 border-b border-border px-3 font-medium">
                          <span className="flex items-center gap-1.5">
                            <LangChip lang={l} /> {LANGUAGES[l].name}
                            <span className="ml-auto text-[11px] font-normal text-fg-3 tabular">
                              {filled}/{rows.length}
                            </span>
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => {
                    const c = keyCompletion(r, langs)
                    return (
                      <tr key={r.key} className="group cursor-pointer align-top transition-colors hover:bg-hover" onClick={() => setParam('key', r.key)}>
                        <td className="sticky left-0 z-[1] border-b border-border bg-card px-3 py-2.5 pl-5 group-hover:bg-hover">
                          <button type="button" className="block max-w-[220px] text-left" onClick={(e) => { e.stopPropagation(); setParam('key', r.key) }}>
                            <span className="block font-mono text-[12px] break-all text-fg">
                              <span className="text-fg-3">{r.key.includes('.') ? `${r.namespace}.` : ''}</span>
                              {r.key.includes('.') ? r.key.slice(r.namespace.length + 1) : r.key}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-[11px] text-fg-3">
                              <span className={cn('inline-block size-1.5 rounded-full', c.complete ? 'bg-success-dot' : 'bg-warning-dot')} />
                              {c.done}/{c.total} languages
                              {r.maxLength && <span>· max {r.maxLength}</span>}
                            </span>
                          </button>
                        </td>
                        <td className="border-b border-border px-3 py-2.5">
                          <span className="line-clamp-2 text-fg">{r.source}</span>
                          {r.note && <span className="mt-0.5 block truncate text-[11.5px] text-fg-3" title={r.note}>{r.note}</span>}
                        </td>
                        {langs.map((l) => (
                          <td key={l} className="border-b border-border px-3 py-2.5">
                            <ValueCell
                              project={project}
                              row={r}
                              lang={l}
                              openIssues={r.values[l] ? (issuesBySeg.get(r.values[l]!.id) ?? 0) : 0}
                              editing={editing === `${r.key}|${l}`}
                              onEdit={() => setEditing(`${r.key}|${l}`)}
                              onDone={() => setEditing(null)}
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={Math.ceil(filtered.length / PAGE)} total={filtered.length} pageSize={PAGE} onPage={setPage} label="keys" />
          </>
        )}
      </Card>

      <AddKeyDialog project={project} open={addOpen} onOpenChange={setAddOpen} existingKeys={keySet} onCreated={(k) => setParam('key', k)} />
      <ImportKeysDialog project={project} open={importOpen} onOpenChange={setImportOpen} existingKeys={keySet} />
      <KeyDrawer project={project} row={selectedRow} onClose={() => setParam('key', null)} existingKeys={keySet} onRenamed={(k) => setParam('key', k)} />
    </div>
  )
}
