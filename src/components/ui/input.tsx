import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const base =
  'w-full rounded-lg border border-border-strong bg-card px-2.5 text-[13px] text-fg placeholder:text-fg-3 transition-colors hover:border-fg-3/60 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 disabled:bg-subtle disabled:text-fg-3 aria-[invalid=true]:border-error-dot aria-[invalid=true]:focus:ring-error-dot/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, 'h-8', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, 'min-h-[72px] py-2 leading-relaxed', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-[12.5px] font-medium text-fg', className)} {...props} />
}

export function Field({ label, htmlFor, hint, error, children, className, optional }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string; optional?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-fg-3">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-fg-3">{hint}</p>
      ) : null}
    </div>
  )
}

export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        base,
        'h-8 appearance-none bg-[length:14px] bg-[right_8px_center] bg-no-repeat pr-7',
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
