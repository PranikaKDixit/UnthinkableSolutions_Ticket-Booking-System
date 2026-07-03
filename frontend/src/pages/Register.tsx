import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { User2, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'
import { AuthShell } from './Login'
import { roleHome } from '../lib/roleHome'
import type { Role } from '../types'

// Admins are seeded server-side, so self-registration is customer/organiser only.
const roles: { value: Role; label: string; desc: string; icon: typeof User2 }[] = [
  { value: 'CUSTOMER', label: 'Customer', desc: 'Book seats & join waitlists', icon: User2 },
  { value: 'ORGANISER', label: 'Organiser', desc: 'List events & sell tickets', icon: Briefcase },
]

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('CUSTOMER')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register({ name, email, password, role })
      toast.success(`Account created — welcome, ${user.name}!`)
      navigate(roleHome(user.role), { replace: true })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join CineSeat in a few seconds.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {roles.map((r) => {
            const active = role === r.value
            return (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? 'border-neon bg-neon/10 shadow-glow'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <r.icon className={`h-5 w-5 ${active ? 'text-neon' : 'text-slate-400'}`} />
                <p className="mt-2 text-sm font-semibold text-white">{r.label}</p>
                <p className="text-xs text-slate-400">{r.desc}</p>
              </button>
            )
          })}
        </div>

        <Input
          label="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <Button variant="gold" type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-neon-soft hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
