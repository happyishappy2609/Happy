import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState } from '@tanstack/react-table'
import { FolderSearch, Pin } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import { QualityScoreBadge, RiskBadge, StatusBadge } from '@/components/common/badges'
import { EmptyState, LangChip } from '@/components/common/misc'
import { Pagination, SortHeader, Table, TableWrap, Td, Th, Tr } from '@/components/common/Table'
import { ProgressBar } from '@/components/ui/controls'
import { useLookups } from '@/hooks/useData'
import type { Project } from '@/types'
import { cn } from '@/utils/cn'
import { daysUntil, deadlineLabel, formatDate } from '@/utils/dates'
import { formatCompact, formatNumber } from '@/utils/format'
import { langShort } from '@/utils/languages'
import type { ProjectStats } from '@/utils/quality'

interface Row {
  p: Project
  st: ProjectStats
}

const col = createColumnHelper<Row>()

export function ProjectTable({ projects, statsMap, emptyAction, pageSize = 10 }: { projects: Project[]; statsMap: Map<string, ProjectStats>; emptyAction?: ReactNode; pageSize?: number }) {
  const navigate = useNavigate()
  const { clientById, memberById } = useLookups()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'deadline', desc: false }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })
  const data = useMemo(() => projects.map((p) => ({ p, st: statsMap.get(p.id)! })).filter((r) => r.st), [projects, statsMap])

  const columns = useMemo(
    () => [
      col.accessor((r) => r.p.name, {
        id: 'project',
        header: 'Project',
        cell: ({ row: { original: r } }) => (
          <div className="min-w-[190px]">
            <div className="flex items-center gap-1.5 font-medium text-fg">
              {r.p.name}
              {r.p.pinned && <Pin className="size-3 text-fg-3" aria-label="Pinned" />}
            </div>
            <div className="text-[12px] text-fg-3">
              {r.p.code} · {r.p.type}
            </div>
          </div>
        ),
      }),
      col.accessor((r) => clientById.get(r.p.clientId)?.name ?? '', { id: 'client', header: 'Client', cell: (i) => <span className="whitespace-nowrap text-fg-2">{i.getValue()}</span> }),
      col.accessor((r) => r.p.sourceLang, { id: 'source', header: 'Source', enableSorting: false, cell: (i) => <LangChip lang={i.getValue()} /> }),
      col.accessor((r) => r.p.targetLangs.length, {
        id: 'targets',
        header: 'Target Languages',
        cell: ({ row: { original: r } }) => (
          <div className="flex max-w-[150px] flex-wrap gap-1" title={r.p.targetLangs.map(langShort).join(', ')}>
            {r.p.targetLangs.slice(0, 3).map((l) => (
              <LangChip key={l} lang={l} />
            ))}
            {r.p.targetLangs.length > 3 && <span className="text-[11.5px] text-fg-3">+{r.p.targetLangs.length - 3}</span>}
          </div>
        ),
      }),
      col.accessor((r) => r.p.words, { id: 'words', header: 'Words', cell: (i) => <span className="text-fg tabular" title={formatNumber(i.getValue())}>{formatCompact(i.getValue())}</span> }),
      col.accessor((r) => r.st.progress, {
        id: 'progress',
        header: 'Progress',
        cell: (i) => (
          <div className="flex w-28 items-center gap-2">
            <ProgressBar value={i.getValue()} size="sm" tone={i.getValue() === 100 ? 'success' : 'primary'} label="Progress" />
            <span className="w-8 text-right text-[12px] text-fg-2 tabular">{i.getValue()}%</span>
          </div>
        ),
      }),
      col.accessor((r) => r.st.score, { id: 'quality', header: 'Quality Score', cell: (i) => <QualityScoreBadge score={i.getValue()} /> }),
      col.accessor((r) => r.st.open, {
        id: 'issues',
        header: 'Issues',
        cell: ({ row: { original: r } }) => (
          <span className="flex items-center gap-1.5 whitespace-nowrap tabular">
            <span className="text-fg">{r.st.open}</span>
            {r.st.openBySeverity.critical > 0 && <span className="rounded bg-error-soft px-1 text-[11px] font-medium text-error">{r.st.openBySeverity.critical} crit</span>}
          </span>
        ),
      }),
      col.accessor((r) => r.p.deadline, {
        id: 'deadline',
        header: 'Deadline',
        cell: ({ row: { original: r } }) => {
          const d = daysUntil(r.p.deadline)
          return (
            <div className="whitespace-nowrap">
              <div className="text-fg tabular">{formatDate(r.p.deadline)}</div>
              <div className={cn('text-[11.5px]', r.p.status === 'completed' ? 'text-fg-3' : d <= 4 ? 'text-error' : 'text-fg-3')}>{r.p.status === 'completed' ? 'Delivered' : deadlineLabel(r.p.deadline)}</div>
            </div>
          )
        },
      }),
      col.accessor((r) => r.p.status, {
        id: 'status',
        header: 'Status',
        cell: ({ row: { original: r } }) => (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={r.p.status} />
            {r.p.status !== 'completed' && r.st.risk !== 'low' && <RiskBadge risk={r.st.risk} reasons={r.st.riskReasons} />}
          </div>
        ),
      }),
      col.accessor((r) => memberById.get(r.p.pmId)?.name ?? 'Alex Morgan', {
        id: 'owner',
        header: 'Owner',
        cell: ({ row: { original: r } }) => {
          const m = memberById.get(r.p.pmId)
          return <Avatar name={m?.name ?? 'Alex Morgan'} color={m?.color ?? '#14233B'} size={26} title />
        },
      }),
    ],
    [clientById, memberById],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  })

  if (!data.length) return <EmptyState icon={<FolderSearch />} title="No projects match your filters" description="Try a different status, clear filters, or create a new project." action={emptyAction} />

  const rows = table.getRowModel().rows
  return (
    <>
      <TableWrap className="hidden md:block">
        <Table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <Th key={h.id} aria-sort={h.column.getIsSorted() === 'asc' ? 'ascending' : h.column.getIsSorted() === 'desc' ? 'descending' : undefined}>
                    {h.column.getCanSort() ? <SortHeader label={flexRender(h.column.columnDef.header, h.getContext())} dir={h.column.getIsSorted()} onClick={h.column.getToggleSortingHandler()} /> : flexRender(h.column.columnDef.header, h.getContext())}
                  </Th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.id} onClick={() => navigate(`/projects/${row.original.p.id}`)} aria-label={`Open ${row.original.p.name}`}>
                {row.getVisibleCells().map((c) => (
                  <Td key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <ul className="divide-y divide-border md:hidden">
        {rows.map(({ original: r }) => (
          <li key={r.p.id}>
            <button onClick={() => navigate(`/projects/${r.p.id}`)} className="w-full px-4 py-3.5 text-left hover:bg-hover">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-fg">{r.p.name}</div>
                  <div className="truncate text-[12px] text-fg-3">
                    {clientById.get(r.p.clientId)?.name} · {r.p.targetLangs.map(langShort).join(', ')}
                  </div>
                </div>
                <QualityScoreBadge score={r.st.score} tooltip={false} />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <ProgressBar value={r.st.progress} size="sm" label="Progress" />
                <span className="text-[12px] text-fg-2 tabular">{r.st.progress}%</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-fg-2">
                <StatusBadge status={r.p.status} />
                {r.p.status !== 'completed' && <RiskBadge risk={r.st.risk} />}
                <span>{r.st.open} issues</span>
                <span className="ml-auto">{r.p.status === 'completed' ? 'Delivered' : deadlineLabel(r.p.deadline)}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Pagination page={table.getState().pagination.pageIndex} pageCount={table.getPageCount()} total={data.length} pageSize={pagination.pageSize} onPage={(p) => table.setPageIndex(p)} label="projects" />
    </>
  )
}
