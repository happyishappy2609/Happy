import { cn } from '@/utils/cn'

export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#14233B" />
      <path d="M10 8v13.2c0 1.5 1.2 2.8 2.8 2.8H23" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="21.5" cy="11" r="3.3" fill="#17B890" />
    </svg>
  )
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark />
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.01em] text-navy">LingoPilot</span>}
    </span>
  )
}
