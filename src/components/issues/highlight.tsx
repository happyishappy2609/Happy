import type { ReactNode } from 'react'

/** Wraps the first occurrence of `span` in `text` with a highlight mark. */
export function highlight(text: string, span: string | undefined, className = 'hl-issue'): ReactNode {
  if (!span || !text) return text
  const idx = text.toLowerCase().indexOf(span.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className={`${className} text-inherit`}>{text.slice(idx, idx + span.length)}</mark>
      {text.slice(idx + span.length)}
    </>
  )
}

/** Highlights words in `next` that are not present in `prev` (simple word diff for suggestions). */
export function diffHighlight(prev: string, next: string): ReactNode {
  const prevWords = new Set(prev.toLowerCase().split(/\s+/))
  const parts = next.split(/(\s+)/)
  return parts.map((w, i) => (w.trim() && !prevWords.has(w.toLowerCase()) ? <mark key={i} className="hl-fix text-inherit">{w}</mark> : <span key={i}>{w}</span>))
}
