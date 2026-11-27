import { useState } from 'react'
import { toast } from 'sonner'
import { LanguageMultiSelect } from '@/components/projects/LanguageMultiSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Field, Input, NativeSelect } from '@/components/ui/input'
import { useAppStore } from '@/store/useAppStore'
import type { AccessRole, LangCode, MemberRole } from '@/types'

export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const invite = useAppStore((s) => s.inviteMember)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('Translator')
  const [langs, setLangs] = useState<LangCode[]>(['en'])
  const [touched, setTouched] = useState(false)
  const errors = {
    name: !name.trim() ? 'Name is required.' : undefined,
    email: !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email.' : undefined,
  }
  const accessFor: Record<MemberRole, AccessRole> = { Translator: 'translator', Reviewer: 'reviewer', 'Senior Reviewer': 'reviewer', 'Project Manager': 'pm', 'Vendor Manager': 'pm' }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setName('')
          setEmail('')
          setTouched(false)
          setLangs(['en'])
        }
        onOpenChange(o)
      }}
    >
      <DialogContent
        title="Invite team member"
        description="Invitations are simulated in the demo — no email is sent."
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setTouched(true)
                if (errors.name || errors.email) return
                invite({ name: name.trim(), email: email.trim(), role, accessRole: accessFor[role], languages: langs })
                toast.success('Invitation sent.', { description: `${name.trim()} was invited as ${role}.` })
                onOpenChange(false)
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="inv-name" error={touched ? errors.name : undefined}>
            <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="inv-email" error={touched ? errors.email : undefined}>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role" htmlFor="inv-role" className="sm:col-span-2">
            <NativeSelect id="inv-role" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
              {(['Translator', 'Reviewer', 'Senior Reviewer', 'Project Manager', 'Vendor Manager'] as MemberRole[]).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Languages" htmlFor="inv-langs" className="sm:col-span-2">
            <LanguageMultiSelect id="inv-langs" value={langs} onChange={setLangs} />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  )
}
