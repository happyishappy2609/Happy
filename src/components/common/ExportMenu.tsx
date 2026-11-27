import { Download, FileJson, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownTrigger } from '@/components/ui/dropdown'
import type { ExportFormat } from '@/services/exportService'

export function ExportMenu({ onExport, label = 'Export report', formats = ['csv', 'xlsx', 'json', 'pdf'], size = 'md' }: { onExport: (f: ExportFormat) => void | Promise<void>; label?: string; formats?: ExportFormat[]; size?: 'sm' | 'md' }) {
  const items: { f: ExportFormat; label: string; icon: typeof FileText }[] = [
    { f: 'csv', label: 'CSV (.csv)', icon: FileText },
    { f: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { f: 'json', label: 'JSON (.json)', icon: FileJson },
    { f: 'pdf', label: 'Print / Save as PDF', icon: Printer },
  ]
  const run = async (f: ExportFormat) => {
    try {
      await onExport(f)
      toast.success(f === 'pdf' ? 'Printable report opened.' : 'Export ready.', { description: f === 'pdf' ? 'Use your browser’s print dialog to save as PDF.' : `Downloaded as ${f.toUpperCase()}.` })
    } catch {
      toast.error('Export failed.', { description: 'Please try again or choose another format.' })
    }
  }
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <Button size={size}>
          <Download /> {label}
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-52">
        <DropdownLabel>Format</DropdownLabel>
        {items
          .filter((i) => formats.includes(i.f))
          .map((i) => (
            <DropdownItem key={i.f} icon={<i.icon />} onSelect={() => void run(i.f)}>
              {i.label}
            </DropdownItem>
          ))}
      </DropdownContent>
    </DropdownMenu>
  )
}
