import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Logo } from './Logo'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-8">
        <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CineSeat · Real-time seat holds · QR tickets · Waitlists
          </p>
        </div>
      </footer>
    </div>
  )
}
