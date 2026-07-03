import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogOut, Menu, Ticket, LayoutDashboard, Building2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { Button } from './ui'
import { initials } from '../lib/format'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
  }`

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const doLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/')
  }

  const roleLinks = (
    <>
      <NavLink to="/events" className={linkClass}>
        Events
      </NavLink>
      {user?.role === 'CUSTOMER' && (
        <NavLink to="/my-bookings" className={linkClass}>
          <span className="inline-flex items-center gap-1.5">
            <Ticket className="h-4 w-4" /> My Tickets
          </span>
        </NavLink>
      )}
      {user?.role === 'ORGANISER' && (
        <NavLink to="/organiser" className={linkClass}>
          <span className="inline-flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </span>
        </NavLink>
      )}
      {user?.role === 'ADMIN' && (
        <NavLink to="/admin/venues" className={linkClass}>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" /> Venues
          </span>
        </NavLink>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">{roleLinks}</nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-neon/20 text-sm font-semibold text-neon-soft">
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{user.role}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={doLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="gold">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-ink-900/95 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
            {roleLinks}
            <div className="mt-2 border-t border-white/5 pt-2">
              {user ? (
                <button
                  onClick={doLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out ({user.name})
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1">
                    <Button variant="ghost" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button variant="gold" className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
