import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Segmented } from '@/components/ui/tabs'
import type { DateRange, RangePreset } from '@/hooks/useMetrics'
import { dayKey, formatDate } from '@/utils/dates'

export function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false)
  const today = dayKey(new Date())
  const [from, setFrom] = useState(value.from ?? dayKey(new Date(Date.now() - 13 * 86_400_000)))
  const [to, setTo] = useState(value.to ?? today)
  const invalid = !from || !to || from > to
  return (
    <div className="flex items-center gap-2">
      <Segmented<RangePreset>
        value={value.preset}
        onChange={(v) => {
          if (v === 'custom') setOpen(true)
          else onChange({ preset: v })
        }}
        options={[
          { value: '7', label: '7d' },
          { value: '30', label: '30d' },
          { value: '90', label: '90d' },
          { value: 'custom', label: value.preset === 'custom' && value.from && value.to ? `${formatDate(value.from)} – ${formatDate(value.to)}` : 'Custom' },
        ]}
        aria-label="Date range"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Choose custom date range">
            <CalendarDays />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4">
          <div className="mb-3 text-[13px] font-semibold text-fg">Custom range</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[12px] text-fg-2">
              From
              <Input type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
            </label>
            <label className="text-[12px] text-fg-2">
              To
              <Input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} className="mt-1" />
            </label>
          </div>
          {invalid && <p className="mt-2 text-[12px] text-error">“From” must be before “To”.</p>}
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={invalid}
              onClick={() => {
                onChange({ preset: 'custom', from, to })
                setOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
