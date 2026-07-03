import { motion } from 'framer-motion'
import { QrCode, MapPin, CalendarDays } from 'lucide-react'
import type { Booking } from '../types'
import { dateTime, rupees } from '../lib/format'
import { Badge } from './ui'

/** A stylised, printable ticket stub with the backend-generated QR. */
export function QRTicket({ booking }: { booking: Booking }) {
  const ev = booking.show?.event
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-800/80 shadow-card"
    >
      {/* Header */}
      <div className="bg-gold-sheen px-5 py-4 text-ink-950">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">CineSeat · e-Ticket</span>
          <Badge tone={booking.status === 'CONFIRMED' ? 'green' : 'red'}>{booking.status}</Badge>
        </div>
        <h2 className="mt-1 text-xl font-bold text-ink-950">{ev?.title ?? 'Your booking'}</h2>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center gap-3 border-b border-dashed border-white/15 px-5 py-6">
        {booking.qr ? (
          <img
            src={booking.qr}
            alt="QR ticket"
            className="h-44 w-44 rounded-xl bg-white p-2"
          />
        ) : (
          <div className="grid h-44 w-44 place-items-center rounded-xl bg-white/5 text-slate-500">
            <QrCode className="h-16 w-16" />
          </div>
        )}
        <p className="font-mono text-sm tracking-wider text-slate-300">{booking.reference}</p>
        <p className="text-xs text-slate-500">Show this QR at the entrance</p>
      </div>

      {/* Details */}
      <div className="space-y-2.5 px-5 py-5 text-sm">
        {ev?.venue?.name && (
          <Row icon={<MapPin className="h-4 w-4" />} label="Venue" value={ev.venue.name} />
        )}
        <Row
          icon={<CalendarDays className="h-4 w-4" />}
          label="When"
          value={dateTime(booking.show?.startsAt)}
        />
        {booking.seats && booking.seats.length > 0 && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Seats</span>
            <span className="flex flex-wrap justify-end gap-1">
              {booking.seats.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-ink-950"
                  style={{ background: s.category.color }}
                >
                  {s.rowLabel}
                  {s.seatNumber}
                </span>
              ))}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-slate-400">Total paid</span>
          <span className="text-lg font-bold gold-text">{rupees(booking.totalAmount)}</span>
        </div>
      </div>
    </motion.div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-slate-400">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  )
}
