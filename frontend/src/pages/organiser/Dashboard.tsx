import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, Clapperboard, IndianRupee, Ticket, BarChart3, PlusCircle } from 'lucide-react'
import { eventsApi } from '../../api'
import { Badge, Button, EmptyState, Spinner } from '../../components/ui'
import { EventCard } from '../../components/EventCard'

export function OrganiserDashboard() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', 'mine'],
    queryFn: () => eventsApi.mine(),
  })

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl">Organiser dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Create events, schedule shows, track revenue.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/organiser/events/new">
            <Button variant="gold">
              <PlusCircle className="h-4 w-4" /> New event
            </Button>
          </Link>
          <Link to="/organiser/shows/new">
            <Button variant="ghost">
              <CalendarPlus className="h-4 w-4" /> New show
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={<Clapperboard className="h-10 w-10" />}
          title="No events yet"
          hint="Create your first movie or concert listing to start selling tickets."
          action={
            <Link to="/organiser/events/new" className="mt-2">
              <Button variant="gold">Create event</Button>
            </Link>
          }
        />
      ) : (
        <>
          <h2 className="mb-4 text-xl">Your events</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <div key={e.id} className="space-y-2">
                <EventCard event={e} index={i} />
                <div className="flex items-center justify-between px-1">
                  <Badge tone="neutral">{e.shows?.length ?? 0} shows</Badge>
                  <Link
                    to={`/organiser/events/${e.id}/report`}
                    className="inline-flex items-center gap-1 text-xs text-neon-soft hover:underline"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Revenue report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick tips */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Tip icon={<Ticket className="h-5 w-5" />} title="1 · Create an event" text="Pick a venue and set movie/concert details." />
        <Tip icon={<CalendarPlus className="h-5 w-5" />} title="2 · Schedule a show" text="Add a date/time and per-category pricing." />
        <Tip icon={<IndianRupee className="h-5 w-5" />} title="3 · Track revenue" text="Watch bookings and revenue per show live." />
      </div>
    </div>
  )
}

function Tip({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon/15 text-neon">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  )
}
