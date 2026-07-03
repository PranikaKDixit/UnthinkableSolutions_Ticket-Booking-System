import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MousePointerClick, Timer, ListChecks, QrCode } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../api'
import { EventCard } from '../components/EventCard'
import { Button, SkeletonCard } from '../components/ui'

const features = [
  { icon: MousePointerClick, title: 'Visual seat map', text: 'Pick seats from a live grid with real-time availability.' },
  { icon: Timer, title: 'Instant holds', text: 'Seats are locked for you with a countdown while you check out.' },
  { icon: ListChecks, title: 'Smart waitlists', text: 'Sold out? Join the queue and get auto-offered a freed seat.' },
  { icon: QrCode, title: 'QR e-tickets', text: 'Every booking emails you a scannable QR ticket instantly.' },
]

export function Landing() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: () => eventsApi.list(),
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* Swap /hero.jpg for a cinematic backdrop; gradient shows if absent */}
          <img
            src="/hero.jpg"
            alt=""
            className="h-full w-full object-cover opacity-30"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/70 to-ink-950" />
        </div>

        <div className="container-page py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon" />
              Real-time seat holds · Waitlists · QR tickets
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] sm:text-6xl">
              Book the best seats to <span className="gold-text">movies &amp; concerts</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-400">
              CineSeat locks your seats the moment you tap them — no double bookings, no lost seats.
              Sold out? Join a waitlist and get auto-offered the next cancellation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events">
                <Button variant="gold" className="px-6 py-3 text-base">
                  Browse events <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="ghost" className="px-6 py-3 text-base">
                  Create account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card p-5"
            >
              <f.icon className="h-6 w-6 text-neon" />
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured events */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl">Now showing</h2>
            <p className="text-sm text-slate-400">Fresh events picked for you</p>
          </div>
          <Link to="/events" className="text-sm text-neon-soft hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : events?.slice(0, 8).map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      </section>
    </div>
  )
}
