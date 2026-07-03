import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clapperboard, Music4, MapPin } from 'lucide-react'
import type { EventItem } from '../types'
import { Badge } from './ui'

/** Deterministic gradient poster fallback when no image is provided. */
function posterGradient(id: string) {
  const hues = [
    'from-violet-600/40 to-fuchsia-700/30',
    'from-amber-500/40 to-rose-600/30',
    'from-cyan-500/40 to-blue-700/30',
    'from-emerald-500/40 to-teal-700/30',
    'from-rose-500/40 to-purple-700/30',
  ]
  const i = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length
  return hues[i]
}

export function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  const isMovie = event.type === 'MOVIE'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
    >
      <Link to={`/events/${event.id}`} className="group block">
        <div className="card overflow-hidden p-0 transition-shadow hover:shadow-glow">
          <div className={`relative h-44 overflow-hidden bg-gradient-to-br ${posterGradient(event.id)}`}>
            {event.posterUrl ? (
              <img
                src={event.posterUrl}
                alt={event.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-white/30">
                {isMovie ? <Clapperboard className="h-14 w-14" /> : <Music4 className="h-14 w-14" />}
              </div>
            )}
            <div className="absolute left-3 top-3">
              <Badge tone={isMovie ? 'neon' : 'gold'}>{event.type}</Badge>
            </div>
          </div>
          <div className="p-4">
            <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-neon-soft">
              {event.title}
            </h3>
            {event.venue?.name && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" /> {event.venue.name}
              </p>
            )}
            {event.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{event.description}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
