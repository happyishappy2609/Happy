export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)}K`
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${Math.round(n)}`
}

export function formatPercent(n: number, digits = 0) {
  return `${n.toFixed(digits)}%`
}

export function formatScore(n: number) {
  return n.toFixed(1)
}

export function formatDelta(n: number, digits = 0) {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${Math.abs(n).toFixed(digits)}%`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${formatNumber(n)} ${n === 1 ? word : plural}`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
