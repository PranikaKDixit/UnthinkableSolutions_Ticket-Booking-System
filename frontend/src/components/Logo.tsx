import { Link } from 'react-router-dom'
import { Clapperboard } from 'lucide-react'

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-sheen shadow-glow-gold">
        <Clapperboard className="h-5 w-5 text-ink-950" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Cine<span className="gold-text">Seat</span>
      </span>
    </Link>
  )
}
