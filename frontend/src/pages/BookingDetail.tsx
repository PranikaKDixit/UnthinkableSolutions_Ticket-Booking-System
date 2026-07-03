import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, XCircle } from 'lucide-react'
import { bookingsApi } from '../api'
import { QRTicket } from '../components/QRTicket'
import { Modal } from '../components/Modal'
import { Button, Spinner } from '../components/ui'

export function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.get(bookingId!),
    enabled: !!bookingId,
  })

  if (isLoading) return <Spinner label="Loading ticket…" />
  if (!booking)
    return <div className="container-page py-16 text-center text-slate-400">Booking not found.</div>

  const cancel = async () => {
    setCancelling(true)
    try {
      await bookingsApi.cancel(booking.id)
      toast.success('Booking cancelled — seat released to the waitlist')
      qc.invalidateQueries({ queryKey: ['booking', bookingId] })
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      setConfirmOpen(false)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="container-page max-w-xl py-10">
      <button
        onClick={() => navigate('/my-bookings')}
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All tickets
      </button>

      <QRTicket booking={booking} />

      {booking.status === 'CONFIRMED' && (
        <div className="mt-6 text-center">
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <XCircle className="h-4 w-4" /> Cancel booking
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            Cancelling frees your seats and offers them to the next person on the waitlist.
          </p>
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cancel this booking?">
        <p className="text-sm text-slate-400">
          This will permanently cancel booking{' '}
          <span className="font-mono text-white">{booking.reference}</span> and release your seats.
          This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Keep booking
          </Button>
          <Button variant="danger" loading={cancelling} onClick={cancel}>
            Yes, cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
