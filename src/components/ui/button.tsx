import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-auto [&_svg]:size-4 [&_svg]:shrink-0 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-[0_1px_2px_rgba(20,35,59,0.12)] disabled:hover:bg-primary',
        secondary: 'bg-card text-fg border border-border-strong hover:bg-hover shadow-card',
        ghost: 'text-fg-2 hover:bg-hover hover:text-fg',
        subtle: 'bg-subtle text-fg hover:bg-border',
        danger: 'bg-error-dot text-white hover:opacity-90',
        'danger-ghost': 'text-error hover:bg-error-soft',
        success: 'bg-accent text-white hover:opacity-90',
        link: 'text-primary hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs [&_svg]:size-3.5',
        md: 'h-8 px-3',
        lg: 'h-9 px-4 text-sm',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, loading, children, disabled, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="animate-spin" />}
    {children}
  </button>
))
Button.displayName = 'Button'

export { buttonVariants }
