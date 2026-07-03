import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Film } from 'lucide-react'
import { eventsApi } from '../api'
import type { EventType } from '../types'
import { EventCard } from '../components/EventCard'
import { EmptyState, SkeletonCard } from '../components/ui'

const filters: { label: string; value?: EventType }[] = [
  { label: 'All' },
  { label: 'Movies', value: 'MOVIE' },
  { label: 'Concerts', value: 'CONCERT' },
]

export function Events() {
  const [type, setType] = useState<EventType | undefined>(undefined)
  const [q, setQ] = useState('')

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', type ?? 'all'],
    queryFn: () => eventsApi.list(type),
  })

  const filtered = (events ?? []).filter(
    (e) =>
      e.title.toLowerCase().includes(q.toLowerCase()) ||
      e.venue?.name?.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Browse events</h1>
          <p className="mt-1 text-sm text-slate-400">Find movies and concerts near you</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or venue…"
            className="field pl-9"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {filters.map((f) => {
          const active = f.value === type
          return (
            <button
              key={f.label}
              onClick={() => setType(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-gold-sheen text-ink-950 shadow-glow-gold'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Film className="h-10 w-10" />}
          title="No events found"
          hint="Try a different filter or search term."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((e, i) => (
            <EventCard key={e.id} event={e} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
