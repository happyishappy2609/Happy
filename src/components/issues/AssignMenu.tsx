import { UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown'
import { useLookups } from '@/hooks/useData'
import type { LangCode } from '@/types'
import { langShort } from '@/utils/languages'

export function AssignMenu({ lang, currentId, onAssign, trigger, disabled }: { lang?: LangCode; currentId?: string; onAssign: (memberId: string) => void; trigger?: ReactNode; disabled?: boolean }) {
  const { team } = useLookups()
  const linguists = team.filter((m) => m.role !== 'Project Manager' && m.role !== 'Vendor Manager' && m.status !== 'invited')
  const matching = lang ? linguists.filter((m) => m.languages.includes(lang)) : linguists
  const others = lang ? linguists.filter((m) => !m.languages.includes(lang)) : []
  const item = (m: (typeof team)[number]) => (
    <DropdownItem key={m.id} onSelect={() => onAssign(m.id)} icon={<Avatar name={m.name} color={m.color} size={18} />}>
      <span className="flex items-center justify-between gap-3">
        <span>
          {m.name} {m.id === currentId && <span className="text-fg-3">(current)</span>}
        </span>
        <span className="text-[11px] text-fg-3">
          {m.role.replace('Senior ', 'Sr. ')} · {m.workload}%
        </span>
      </span>
    </DropdownItem>
  )
  return (
    <DropdownMenu>
      <DropdownTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button size="sm" disabled={disabled}>
            <UserPlus /> Assign reviewer
          </Button>
        )}
      </DropdownTrigger>
      <DropdownContent className="w-[300px]">
        <DropdownLabel>{lang ? `Linguists for ${langShort(lang)}` : 'Linguists'}</DropdownLabel>
        {matching.map(item)}
        {others.length > 0 && (
          <>
            <DropdownSeparator />
            <DropdownLabel>Other team members</DropdownLabel>
            {others.slice(0, 6).map(item)}
          </>
        )}
      </DropdownContent>
    </DropdownMenu>
  )
}
