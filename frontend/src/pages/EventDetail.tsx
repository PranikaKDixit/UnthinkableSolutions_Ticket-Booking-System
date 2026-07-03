import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, ArrowRight, Clapperboard, Music4 } from 'lucide-react'
import { eventsApi } from '../api'
import { dateTime } from '../lib/format'
import { Badge, Button, EmptyState, Spinner } from '../components/ui'

export function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spinner label="Loading event…" />
  if (!event)
    return (
      <div className="container-page py-16">
        <EmptyState title="Event not found" />
      </div>
    )

  const isMovie = event.type === 'MOVIE'
  const shows = [...(event.shows ?? [])].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )

  return (
    <div>
      {/* Banner */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neon/20 via-ink-900 to-ink-950" />
        <div className="container-page flex flex-col gap-6 py-14 sm:flex-row sm:items-end">
          <div className="grid h-48 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-ink-800 text-white/20">
            {event.posterUrl ? (
              <img src={event.posterUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : isMovie ? (
              <Clapperboard className="h-14 w-14" />
            ) : (
              <Music4 className="h-14 w-14" />
            )}
          </div>
          <div>
            <Badge tone={isMovie ? 'neon' : 'gold'}>{event.type}</Badge>
            <h1 className="mt-3 text-4xl">{event.title}</h1>
            {event.venue && (
              <p className="mt-2 flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4" /> {event.venue.name} · {event.venue.address}
              </p>
            )}
            {event.description && (
              <p className="mt-3 max-w-2xl text-slate-300">{event.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Shows */}
      <div className="container-page py-10">
        <h2 className="mb-5 text-2xl">Showtimes</h2>
        {shows.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-10 w-10" />}
            title="No showtimes yet"
            hint="Check back soon — the organiser hasn't scheduled any shows."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shows.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card flex items-center justify-between p-4"
              >
                <div>
                  <p className="flex items-center gap-2 font-medium text-white">
                    <CalendarDays className="h-4 w-4 text-neon" />
                    {dateTime(s.startsAt)}
                  </p>
                  {s.pricing && s.pricing.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400">
                      From ₹{Math.min(...s.pricing.map((p) => p.price))}
                    </p>
                  )}
                </div>
                <Link to={`/shows/${s.id}`}>
                  <Button variant="primary">
                    Select seats <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
