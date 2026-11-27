import type { Client, Issue, Project, QAScan } from '@/types'
import { downloadBlob, downloadText, slugify, toCSV } from '@/utils/download'
import { formatDateTime } from '@/utils/dates'
import { langName } from '@/utils/languages'
import { CATEGORY_LABELS } from '@/utils/quality'

export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf'

function issueRows(issues: Issue[]) {
  return issues.map((i) => ({
    'Issue ID': i.id,
    'Segment ID': i.segmentId,
    Language: langName(i.lang),
    Severity: i.severity,
    Category: CATEGORY_LABELS[i.category],
    Confidence: i.confidence,
    Source: i.source,
    Translation: i.target,
    Suggestion: i.suggestion,
    Explanation: i.explanation,
    Status: i.status,
    Detected: i.createdAt,
  }))
}

export async function exportRows(rows: Record<string, unknown>[], format: Exclude<ExportFormat, 'pdf'>, baseName: string, sheetName = 'Data') {
  if (format === 'csv') return downloadText(toCSV(rows), `${baseName}.csv`, 'text/csv;charset=utf-8')
  if (format === 'json') return downloadText(JSON.stringify(rows, null, 2), `${baseName}.json`, 'application/json')
  // XLSX writer is loaded on demand to keep the initial bundle small.
  const { default: writeXlsxFile } = await import('write-excel-file/universal')
  const cols = rows[0] ? Object.keys(rows[0]) : []
  const header = cols.map((c) => ({ value: c, fontWeight: 'bold' as const }))
  const body = rows.map((r) => cols.map((c) => {
    const v = r[c]
    return typeof v === 'number' ? { type: Number, value: v } : { type: String, value: v === undefined || v === null ? '' : String(v) }
  }))
  const blob = await writeXlsxFile([header, ...body] as never, { sheet: sheetName, columns: cols.map((c) => ({ width: Math.min(60, Math.max(12, c.length + 4)) })) } as never).toBlob()
  downloadBlob(blob, `${baseName}.xlsx`)
}

export function buildReportHTML(project: Project, client: Client | undefined, scan: QAScan | undefined, issues: Issue[], score: number) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sev = scan?.summary.severity
  const rows = issues
    .map(
      (i) => `<tr><td>${i.id}</td><td>${esc(i.severity)}</td><td>${esc(CATEGORY_LABELS[i.category])}</td><td>${esc(i.source)}</td><td>${esc(i.target)}</td><td>${esc(i.suggestion || '—')}</td><td>${i.confidence}%</td><td>${i.status}</td></tr>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>QA report — ${esc(project.name)}</title>
<style>body{font:13px/1.5 Inter,system-ui,sans-serif;color:#1D2939;margin:32px}h1{font-size:20px;margin:0}h2{font-size:14px;margin:24px 0 8px}.muted{color:#64748B}
.kpis{display:flex;gap:12px;margin-top:16px}.kpi{border:1px solid #E4E9F0;border-radius:10px;padding:10px 14px;min-width:120px}.kpi b{display:block;font-size:20px}
table{border-collapse:collapse;width:100%;font-size:11.5px}th,td{border-bottom:1px solid #E4E9F0;padding:6px;text-align:left;vertical-align:top}th{background:#F0F4F8}
.note{margin-top:24px;font-size:11px;color:#94A3B8}</style></head><body>
<div class="muted">LingoPilot · Quality report</div><h1>${esc(project.name)}</h1>
<div class="muted">${esc(client?.name ?? '')} · ${project.code} · Generated ${formatDateTime(new Date().toISOString())}</div>
<div class="kpis"><div class="kpi">Quality score<b>${score.toFixed(1)}</b><span class="muted">Threshold ${project.qualityThreshold}%</span></div>
${scan ? `<div class="kpi">Segments<b>${scan.summary.totalSegments}</b></div><div class="kpi">Issues<b>${scan.summary.issuesDetected}</b></div><div class="kpi">Critical / Major<b>${sev?.critical} / ${sev?.major}</b></div><div class="kpi">Rating<b style="font-size:14px">${esc(scan.summary.rating)}</b></div>` : ''}</div>
<h2>Findings (${issues.length})</h2><table><thead><tr><th>ID</th><th>Severity</th><th>Category</th><th>Source</th><th>Translation</th><th>Suggestion</th><th>Conf.</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
<p class="note">Quality Score is an estimated quality indicator based on detected issues and severity. It should not replace professional linguistic review. Findings produced by the LingoPilot AI QA simulation (demo engine).</p>
</body></html>`
}

export async function exportProjectReport(format: ExportFormat, project: Project, client: Client | undefined, issues: Issue[], scan: QAScan | undefined, score: number) {
  const base = `lingopilot-qa-${slugify(project.name)}`
  if (format !== 'pdf') return exportRows(issueRows(issues), format, base, 'QA findings')
  const html = buildReportHTML(project, client, scan, issues, score)
  const w = (() => {
    try {
      return window.open('', '_blank')
    } catch {
      return null
    }
  })()
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 300)
  } else {
    // Pop-ups blocked (e.g. sandboxed preview): download a printable HTML file instead.
    downloadText(html, `${base}.html`, 'text/html;charset=utf-8')
  }
}

export { issueRows }
