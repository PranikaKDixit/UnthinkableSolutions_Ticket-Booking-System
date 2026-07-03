import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { bookingsApi, showsApi } from '../api'
import { useShowSeats } from '../hooks/useShowSeats'
import { useAuth } from '../context/AuthContext'
import { HoldCountdown } from '../components/HoldCountdown'
import { Button, Spinner } from '../components/ui'
import { dateTime, rupees } from '../lib/format'
import type { ShowSeat } from '../types'

interface CheckoutState {
  seatIds: string[]
  holdExpiresAt: string | null
}

export function Checkout() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const state = (useLocation().state ?? {}) as Partial<CheckoutState>
  const seatIds = state.seatIds ?? []
  const holdExpiresAt = state.holdExpiresAt ?? null

  const { data: show } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.get(showId!),
    enabled: !!showId,
  })
  const { data: seats } = useShowSeats(showId)
  const [paying, setPaying] = useState(false)

  const chosen = useMemo(() => {
    const set = new Set(seatIds)
    return (seats ?? []).filter((s) => set.has(s.id))
  }, [seats, seatIds])

  const total = chosen.reduce((sum: number, s: ShowSeat) => sum + s.price, 0)

  // Guard: arrived without a valid hold
  if (seatIds.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-400">No seats selected.</p>
        <Button variant="gold" className="mt-4" onClick={() => navigate(`/shows/${showId}`)}>
          Back to seat map
        </Button>
      </div>
    )
  }

  const confirm = async () => {
    if (!showId) return
    setPaying(true)
    try {
      const booking = await bookingsApi.create({ showId, seatIds })
      toast.success('Booking confirmed! Your QR ticket is on its way.')
      navigate(`/confirmation/${booking.id}`, { replace: true, state: { booking } })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPaying(false)
    }
  }

  const onExpire = () => {
    toast.warning('Your hold expired before checkout')
    navigate(`/shows/${showId}`, { replace: true })
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-slate-400">Review your seats and confirm your booking.</p>

      {holdExpiresAt && (
        <div className="mt-5">
          <HoldCountdown expiresAt={holdExpiresAt} onExpire={onExpire} />
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Summary */}
        <div className="card p-6">
          <h2 className="text-lg">{show?.event?.title}</h2>
          <p className="text-sm text-slate-400">
            {show?.event?.venue?.name} · {dateTime(show?.startsAt)}
          </p>

          {!seats ? (
            <Spinner />
          ) : (
            <div className="mt-5 space-y-2">
              {chosen.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: s.category.color }} />
                    Seat {s.rowLabel}
                    {s.seatNumber}
                    <span className="text-xs text-slate-500">· {s.category.name}</span>
                  </span>
                  <span>{rupees(s.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pay panel */}
        <div className="md:sticky md:top-20 md:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {chosen.length} seat{chosen.length === 1 ? '' : 's'}
              </span>
              <span className="text-xl font-bold gold-text">{rupees(total)}</span>
            </div>

            <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-slate-400">
              Logged in as <span className="text-white">{user?.name}</span>
              <br />
              {user?.email}
            </div>

            <Button variant="gold" className="mt-4 w-full" loading={paying} onClick={confirm}>
              <ShieldCheck className="h-4 w-4" /> Pay {rupees(total)}
            </Button>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Demo checkout — no real payment is charged. A QR ticket is emailed on confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
