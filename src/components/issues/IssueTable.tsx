import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type RowSelectionState, type SortingState } from '@tanstack/react-table'
import { CheckCheck, SearchX, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/common/Avatar'
import { ConfidenceMeter, IssueStatusBadge, SeverityBadge } from '@/components/common/badges'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState, LangChip } from '@/components/common/misc'
import { Pagination, SortHeader, Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { useCan, useLookups } from '@/hooks/useData'
import { useAppStore } from '@/store/useAppStore'
import type { Issue } from '@/types'
import { formatRelative } from '@/utils/dates'
import { CATEGORY_LABELS, SEVERITY_ORDER } from '@/utils/quality'
import { AssignMenu } from './AssignMenu'

const col = createColumnHelper<Issue>()

export function IssueTable({ issues, onOpen, showProject = true, bulk = true, emptyAction, pageSize = 12 }: { issues: Issue[]; onOpen: (id: string) => void; showProject?: boolean; bulk?: boolean; emptyAction?: ReactNode; pageSize?: number }) {
  const projects = useAppStore((s) => s.projects)
  const { memberById } = useLookups()
  const can = useCan()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'severity', desc: false }])
  const [selection, setSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  useEffect(() => setSelection({}), [issues.length])

  const columns = useMemo(
    () => [
      ...(bulk
        ? [
            col.display({
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  aria-label="Select all on page"
                  checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false}
                  onCheckedChange={(v) => table.toggleAllPageRowsSelected(v)}
                />
              ),
              cell: ({ row }) => <Checkbox aria-label={`Select ${row.original.id}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onCheckedChange={(v) => row.toggleSelected(v)} />,
            }),
          ]
        : []),
      col.accessor((i) => SEVERITY_ORDER.indexOf(i.severity), { id: 'severity', header: 'Severity', cell: ({ row }) => <SeverityBadge severity={row.original.severity} /> }),
      col.accessor('source', {
        id: 'issue',
        header: 'Issue',
        enableSorting: false,
        cell: ({ row: { original: i } }) => (
          <div className="max-w-[340px] min-w-[220px]">
            <div className="truncate text-fg" title={i.source}>
              {i.source}
            </div>
            <div className="truncate text-[12px] text-fg-3" title={i.explanation}>
              <span className="font-medium text-fg-2">{i.id}</span> · {i.explanation}
            </div>
          </div>
        ),
      }),
      col.accessor((i) => CATEGORY_LABELS[i.category], { id: 'category', header: 'Category', cell: (c) => <span className="whitespace-nowrap text-fg-2">{c.getValue()}</span> }),
      ...(showProject ? [col.accessor((i) => projectName.get(i.projectId) ?? '', { id: 'project', header: 'Project', cell: (c) => <span className="block max-w-[160px] truncate text-fg-2">{c.getValue()}</span> })] : []),
      col.accessor('lang', { header: 'Language', cell: (c) => <LangChip lang={c.getValue()} /> }),
      col.accessor('segmentId', { header: 'Segment', cell: (c) => <span className="text-fg-2 tabular">#{c.getValue().split('-').pop()}</span> }),
      col.accessor((i) => memberById.get(i.assigneeId ?? '')?.name ?? '', {
        id: 'assignee',
        header: 'Assigned To',
        cell: ({ row: { original: i } }) => {
          const m = i.assigneeId ? memberById.get(i.assigneeId) : undefined
          return m ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-fg-2">
              <Avatar name={m.name} color={m.color} size={20} /> {m.name.split(' ')[0]}
            </span>
          ) : (
            <span className="text-fg-3">—</span>
          )
        },
      }),
      col.accessor('confidence', { header: 'Confidence', cell: (c) => <ConfidenceMeter value={c.getValue()} /> }),
      col.accessor('status', { header: 'Status', cell: (c) => <IssueStatusBadge status={c.getValue()} /> }),
      col.accessor('createdAt', { header: 'Created', cell: (c) => <span className="whitespace-nowrap text-fg-3">{formatRelative(c.getValue())}</span> }),
    ],
    [bulk, showProject, projectName, memberById],
  )

  const table = useReactTable({
    data: issues,
    columns,
    state: { sorting, rowSelection: selection, pagination },
    getRowId: (r) => r.id,
    enableRowSelection: (r) => r.original.status === 'open' || r.original.status === 'in_review',
    onRowSelectionChange: setSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  useEffect(() => {
    if (pagination.pageIndex > 0 && pagination.pageIndex >= table.getPageCount()) setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [issues, pagination.pageIndex, table])

  const selectedIds = Object.keys(selection).filter((k) => selection[k])

  if (!issues.length) return <EmptyState icon={<SearchX />} title="No issues match these filters" description="Adjust the filters, or run an AI QA scan to surface new findings." action={emptyAction} />

  const rows = table.getRowModel().rows
  return (
    <div className="relative">
      {bulk && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft/60 px-5 py-2 text-[12.5px]">
          <span className="font-medium text-fg">{selectedIds.length} selected</span>
          <Button size="sm" variant="primary" onClick={() => setConfirmOpen(true)} disabled={!can('issue.resolve')}>
            <CheckCheck /> Resolve selected
          </Button>
          <AssignMenu
            disabled={!can('issue.assign')}
            onAssign={(id) => {
              useAppStore.getState().bulkAssign(selectedIds, id)
              toast.success('Reviewer assigned.', { description: `${selectedIds.length} issues assigned to ${memberById.get(id)?.name}.` })
              setSelection({})
            }}
            trigger={
              <Button size="sm" disabled={!can('issue.assign')}>
                <UserPlus /> Assign
              </Button>
            }
          />
          <Button size="sm" variant="ghost" onClick={() => setSelection({})}>
            <X /> Clear
          </Button>
        </div>
      )}
      <TableWrap className="hidden md:block">
        <Table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <Th key={h.id} className={h.id === 'select' ? 'w-8' : undefined} aria-sort={h.column.getIsSorted() === 'asc' ? 'ascending' : h.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
                    {h.column.getCanSort() ? <SortHeader label={flexRender(h.column.columnDef.header, h.getContext())} dir={h.column.getIsSorted()} onClick={h.column.getToggleSortingHandler()} /> : flexRender(h.column.columnDef.header, h.getContext())}
                  </Th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.id} onClick={() => onOpen(row.original.id)} aria-label={`Open issue ${row.original.id}`} className={row.getIsSelected() ? 'bg-primary-soft/40' : undefined}>
                {row.getVisibleCells().map((c) => (
                  <Td key={c.id} onClick={c.column.id === 'select' ? (e) => e.stopPropagation() : undefined}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
      <ul className="divide-y divide-border md:hidden">
        {rows.map(({ original: i }) => (
          <li key={i.id}>
            <button onClick={() => onOpen(i.id)} className="w-full px-4 py-3 text-left hover:bg-hover">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={i.severity} />
                <span className="text-[12px] text-fg-3">{CATEGORY_LABELS[i.category]}</span>
                <span className="ml-auto">
                  <IssueStatusBadge status={i.status} />
                </span>
              </div>
              <div className="mt-1.5 line-clamp-2 text-[13px] text-fg">{i.source}</div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-fg-3">
                <span>{i.id}</span>
                <LangChip lang={i.lang} />
                {showProject && <span className="truncate">{projectName.get(i.projectId)}</span>}
                <span className="ml-auto shrink-0">{i.confidence}%</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={pagination.pageIndex} pageCount={table.getPageCount()} total={issues.length} pageSize={pagination.pageSize} onPage={(p) => table.setPageIndex(p)} label="issues" />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Resolve ${selectedIds.length} issues?`}
        description="Selected issues will be marked resolved without changing the translations. Quality scores and counters update immediately. You can reopen issues individually."
        confirmLabel="Resolve issues"
        onConfirm={() => {
          useAppStore.getState().bulkResolve(selectedIds)
          toast.success(`${selectedIds.length} issues resolved.`)
          setSelection({})
        }}
      />
    </div>
  )
}
