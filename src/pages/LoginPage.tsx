import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Logo } from '@/components/layout/Logo'
import { CURRENT_USER } from '@/data/seed/team'
import { useAppStore } from '@/store/useAppStore'

export function LoginPage() {
  const signedIn = useAppStore((s) => s.signedIn)
  const signIn = useAppStore((s) => s.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(CURRENT_USER.email)
  const [password, setPassword] = useState('demo-password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (signedIn) return <Navigate to={from} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid work email.')
    if (password.length < 4) return setError('Enter your password.')
    setError('')
    setLoading(true)
    setTimeout(() => {
      signIn()
      navigate(from, { replace: true })
    }, 650)
  }

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[1fr_520px]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[22px] font-semibold tracking-tight text-fg">Sign in to LingoPilot</h1>
          <p className="mt-1 text-[13.5px] text-fg-2">Quality intelligence for localization teams.</p>
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            <Field label="Work email" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-3" />
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 pl-8" />
              </div>
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-3" />
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 pl-8" />
              </div>
            </Field>
            {error && (
              <p className="text-[12.5px] text-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Sign in <ArrowRight />
            </Button>
            <div className="relative py-1 text-center text-[11.5px] text-fg-3">
              <span className="relative z-10 bg-bg px-2">or</span>
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>
            <Button size="lg" className="w-full" onClick={() => { setLoading(true); setTimeout(() => { signIn(); navigate(from, { replace: true }) }, 500) }}>
              <ShieldCheck /> Continue with SSO
            </Button>
          </form>
          <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-card px-3 py-2.5 text-[12px] leading-relaxed text-fg-2">
            <b className="text-fg">Demo workspace.</b> Credentials are pre-filled — no real account is needed. All data is sample data stored in your browser.
          </div>
        </div>
        <p className="text-[11.5px] text-fg-3">© LingoPilot · Product demo</p>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-[#14233B] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="text-[12px] font-medium tracking-wide text-[#8FA3C2] uppercase">AI Localization Quality & Operations</div>
        <div>
          <p className="text-[26px] leading-tight font-semibold tracking-tight text-white">Ship better translations. Scale with confidence.</p>
          <p className="mt-3 max-w-[380px] text-[14px] leading-relaxed text-[#B8C5DA]">Measure, manage and improve translation quality across every client, language and vendor — before delivery.</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['94.2%', 'Avg. quality score'],
              ['146h', 'Review hours saved / mo'],
              ['78%', 'QA automation rate'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="text-[20px] font-semibold text-white tabular">{v}</div>
                <div className="mt-0.5 text-[11.5px] text-[#8FA3C2]">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#8FA3C2]">
          <span className="size-2 rounded-full bg-[#17B890]" /> Northstar Localization workspace · sample data
        </div>
      </div>
    </div>
  )
}
