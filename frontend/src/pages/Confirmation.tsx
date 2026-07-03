import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Mail, Ticket } from 'lucide-react'
import { bookingsApi } from '../api'
import { QRTicket } from '../components/QRTicket'
import { Button, Spinner } from '../components/ui'
import type { Booking } from '../types'

export function Confirmation() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const passed = (useLocation().state as { booking?: Booking } | null)?.booking

  const { data: fetched, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.get(bookingId!),
    enabled: !!bookingId && !passed,
    initialData: passed,
  })

  const booking = passed ?? fetched
  if (isLoading && !booking) return <Spinner label="Fetching your ticket…" />
  if (!booking)
    return (
      <div className="container-page py-16 text-center text-slate-400">Booking not found.</div>
    )

  return (
    <div className="container-page max-w-xl py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6 flex flex-col items-center text-center"
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-9 w-9 text-emerald-400" />
        </span>
        <h1 className="mt-4 text-3xl">Booking confirmed!</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
          <Mail className="h-4 w-4" /> A QR ticket has been emailed to you.
        </p>
      </motion.div>

      <QRTicket booking={booking} />

      <div className="mt-6 flex justify-center gap-3">
        <Link to="/my-bookings">
          <Button variant="ghost">
            <Ticket className="h-4 w-4" /> My tickets
          </Button>
        </Link>
        <Link to="/events">
          <Button variant="gold">Book more</Button>
        </Link>
      </div>
    </div>
  )
}
