import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles, Clock } from 'lucide-react'
import { bookingsApi } from '../api'
import { Button } from '../components/ui'

/**
 * Target of the time-limited waitlist offer link emailed to the customer.
 * Accepting converts the offer into a confirmed booking (backend handles the
 * seat assignment + QR email); if the token has expired the backend rejects it.
 */
export function WaitlistOffer() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const accept = async () => {
    if (!token) return
    setLoading(true)
    try {
      const booking = await bookingsApi.acceptOffer(token)
      toast.success('Seat claimed! Your QR ticket is on its way.')
      navigate(`/confirmation/${booking.id}`, { replace: true, state: { booking } })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-page flex min-h-[75svh] items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md p-8 text-center"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/15">
          <Sparkles className="h-8 w-8 text-gold" />
        </span>
        <h1 className="mt-5 text-2xl">A seat opened up for you!</h1>
        <p className="mt-2 text-sm text-slate-400">
          You're next on the waitlist and a seat has been reserved in your name. Claim it before the
          offer expires — otherwise it passes to the next person in line.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
          <Clock className="h-3.5 w-3.5" /> This offer is time-limited
        </div>

        <Button variant="gold" className="mt-6 w-full" loading={loading} onClick={accept}>
          Claim my seat
        </Button>
        <button
          onClick={() => navigate('/events')}
          className="mt-3 text-xs text-slate-500 hover:text-slate-300"
        >
          No thanks, browse other events
        </button>
      </motion.div>
    </div>
  )
}
