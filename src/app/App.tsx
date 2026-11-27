import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useApplyTheme } from '@/components/layout/useTheme'
import { useAppStore } from '@/store/useAppStore'
import { AppRouter } from './router'

export function App() {
  useApplyTheme()
  const theme = useAppStore((s) => s.theme)
  return (
    <TooltipProvider delayDuration={250}>
      <AppRouter />
      <Toaster
        position="bottom-left"
        theme={theme}
        closeButton
        toastOptions={{
          classNames: {
            toast: '!rounded-[10px] !border-border !bg-card !text-fg !shadow-pop !text-[13px] !font-sans',
            description: '!text-fg-2 !text-[12.5px]',
            actionButton: '!bg-primary !text-white !text-[12px]',
          },
        }}
      />
    </TooltipProvider>
  )
}
