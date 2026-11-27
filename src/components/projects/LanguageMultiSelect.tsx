import { Check } from 'lucide-react'
import type { LangCode } from '@/types'
import { cn } from '@/utils/cn'
import { LANGUAGES, TARGET_LANGS } from '@/utils/languages'

export function LanguageMultiSelect({ value, onChange, exclude, invalid, id }: { value: LangCode[]; onChange: (v: LangCode[]) => void; exclude?: LangCode; invalid?: boolean; id?: string }) {
  const options = (['en', ...TARGET_LANGS] as LangCode[]).filter((l) => l !== exclude)
  return (
    <div id={id} role="group" aria-invalid={invalid} className={cn('flex flex-wrap gap-1.5 rounded-lg', invalid && 'ring-2 ring-error-dot/30')}>
      {options.map((l) => {
        const on = value.includes(l)
        return (
          <button
            type="button"
            key={l}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== l) : [...value, l])}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12.5px] font-medium transition-colors',
              on ? 'border-primary bg-primary-soft text-primary' : 'border-border-strong bg-card text-fg-2 hover:bg-hover hover:text-fg',
            )}
          >
            {on && <Check className="size-3" />}
            {LANGUAGES[l].name}
          </button>
        )
      })}
    </div>
  )
}
