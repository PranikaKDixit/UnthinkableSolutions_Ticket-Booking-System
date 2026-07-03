import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Ticket, CalendarDays, MapPin, ChevronRight } from 'lucide-react'
import { bookingsApi } from '../api'
import { Badge, Button, EmptyState, Spinner } from '../components/ui'
import { dateTime, rupees } from '../lib/format'

export function MyBookings() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list(),
  })

  if (isLoading) return <Spinner label="Loading your tickets…" />

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl">My tickets</h1>
      <p className="mt-1 text-sm text-slate-400">Your bookings and QR tickets</p>

      {!bookings || bookings.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Ticket className="h-10 w-10" />}
            title="No bookings yet"
            hint="Browse events and grab your seats — they'll show up here."
            action={
              <Link to="/events" className="mt-2">
                <Button variant="gold">Browse events</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/bookings/${b.id}`}>
                <div className="card flex items-center justify-between p-4 transition-shadow hover:shadow-glow">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-white">
                        {b.show?.event?.title ?? 'Booking'}
                      </h3>
                      <Badge tone={b.status === 'CONFIRMED' ? 'green' : 'red'}>{b.status}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {dateTime(b.show?.startsAt)}
                      </span>
                      {b.show?.event?.venue?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {b.show.event.venue.name}
                        </span>
                      )}
                      <span className="font-mono text-slate-500">{b.reference}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="hidden text-sm font-bold gold-text sm:block">
                      {rupees(b.totalAmount)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
