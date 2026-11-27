const DAY = 86_400_000

export const now = () => new Date()

export function daysFromNow(days: number, hour = 17, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

export function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export function dayKey(d: Date | string) {
  const x = typeof d === 'string' ? new Date(d) : d
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysUntil(iso: string) {
  return Math.ceil((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / DAY)
}

export function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / DAY
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat('en-US', opts).format(new Date(iso))
}

export function formatDateLong(iso: string) {
  return formatDate(iso, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const abs = Math.abs(diff)
  const future = diff < 0
  const m = Math.round(abs / 60_000)
  if (m < 1) return 'just now'
  const wrap = (s: string) => (future ? `in ${s}` : `${s} ago`)
  if (m < 60) return wrap(`${m}m`)
  const h = Math.round(m / 60)
  if (h < 24) return wrap(`${h}h`)
  const d = Math.round(h / 24)
  if (d === 1) return future ? 'tomorrow' : 'yesterday'
  if (d < 7) return wrap(`${d}d`)
  return formatDate(iso)
}

export function deadlineLabel(iso: string) {
  const d = daysUntil(iso)
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'Due today'
  if (d === 1) return 'Due tomorrow'
  return `Due in ${d} days`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function toInputDate(iso: string) {
  return dayKey(iso)
}

export function fromInputDate(value: string, hour = 17) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1, hour).toISOString()
}

export { DAY }
