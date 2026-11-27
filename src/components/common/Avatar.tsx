import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { initials as toInitials } from '@/utils/format'

export function Avatar({ name, color = '#64748B', size = 28, className, title, src }: { name: string; color?: string; size?: number; className?: string; title?: boolean; src?: string }) {
  const el = (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-card select-none', className)}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.38), background: src ? undefined : color }}
      aria-label={title ? undefined : name}
      role="img"
    >
      {src ? <img src={src} alt="" className="size-full rounded-full object-cover" /> : toInitials(name)}
    </span>
  )
  return title ? <Tooltip content={name}>{el}</Tooltip> : el
}

export function AvatarStack({ people, max = 4, size = 24 }: { people: { name: string; color: string }[]; max?: number; size?: number }) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.name} name={p.name} color={p.color} size={size} title />
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-subtle text-[10px] font-medium text-fg-2 ring-2 ring-card" style={{ width: size, height: size }}>
          +{rest}
        </span>
      )}
    </div>
  )
}
