import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, Lock, Ticket } from 'lucide-react'
import { showsApi } from '../api'
import { useShowSeats } from '../hooks/useShowSeats'
import { useAuth } from '../context/AuthContext'
import type { ShowSeat } from '../types'
import { SeatMap } from '../components/SeatMap'
import { SeatLegend } from '../components/SeatLegend'
import { HoldCountdown } from '../components/HoldCountdown'
import { WaitlistPanel } from '../components/WaitlistPanel'
import { Button, Spinner, EmptyState } from '../components/ui'
import { dateTime, rupees } from '../lib/format'

export function SeatSelection() {
  const { showId } = useParams<{ showId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: show } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => showsApi.get(showId!),
    enabled: !!showId,
  })
  const { data: seats, isLoading, refetch } = useShowSeats(showId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [holding, setHolding] = useState(false)

  const seatById = useMemo(() => {
    const m = new Map<string, ShowSeat>()
    seats?.forEach((s) => m.set(s.id, s))
    return m
  }, [seats])

  const selectedSeats = [...selected].map((id) => seatById.get(id)).filter(Boolean) as ShowSeat[]
  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0)

  const soldOut = !!seats && seats.length > 0 && seats.every((s) => s.status !== 'AVAILABLE')

  // Reset a live hold if seats change underneath us
  useEffect(() => {
    if (!holdExpiresAt) return
    // If any held-by-me seat disappeared from selection, ignore; countdown handles expiry.
  }, [holdExpiresAt])

  const toggle = (seat: ShowSeat) => {
    if (holdExpiresAt) return // locked while holding
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(seat.id)) next.delete(seat.id)
      else {
        if (next.size >= 8) {
          toast.warning('You can select up to 8 seats at once')
          return next
        }
        next.add(seat.id)
      }
      return next
    })
  }

  const placeHold = async () => {
    if (!showId || selected.size === 0) return
    if (!user) {
      navigate('/login', { state: { from: `/shows/${showId}` } })
      return
    }
    setHolding(true)
    try {
      const res = await showsApi.hold(showId, [...selected])
      setHoldExpiresAt(res.holdExpiresAt)
      toast.success('Seats held — complete checkout before the timer runs out')
      refetch()
    } catch (err) {
      toast.error((err as Error).message)
      refetch() // someone likely grabbed a seat; refresh the map
    } finally {
      setHolding(false)
    }
  }

  const releaseHold = async (silent = false) => {
    if (!showId || selected.size === 0) return
    try {
      await showsApi.release(showId, [...selected])
    } catch {
      /* ignore */
    }
    setHoldExpiresAt(null)
    setSelected(new Set())
    refetch()
    if (!silent) toast.info('Hold released')
  }

  const onExpire = () => {
    setHoldExpiresAt(null)
    setSelected(new Set())
    refetch()
    toast.warning('Your seat hold expired')
  }

  const goCheckout = () => {
    navigate(`/checkout/${showId}`, {
      state: { seatIds: [...selected], holdExpiresAt },
    })
  }

  if (isLoading) return <Spinner label="Loading seat map…" />
  if (!seats || seats.length === 0)
    return (
      <div className="container-page py-16">
        <EmptyState icon={<Ticket className="h-10 w-10" />} title="No seats configured for this show" />
      </div>
    )

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl">{show?.event?.title ?? 'Select your seats'}</h1>
        <p className="text-sm text-slate-400">
          {show?.event?.venue?.name} · {dateTime(show?.startsAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Seat map */}
        <div className="space-y-5">
          <div className="card p-6">
            <SeatMap seats={seats} selected={selected} onToggle={toggle} />
          </div>
          <SeatLegend seats={seats} />

          {soldOut && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h3 className="text-amber-300">This show is sold out</h3>
              <p className="mt-1 text-sm text-slate-400">
                Join a waitlist for your preferred category — you'll be auto-offered the next freed
                seat.
              </p>
              <div className="mt-4">
                <WaitlistPanel showId={showId!} seats={seats} />
              </div>
            </div>
          )}
        </div>

        {/* Summary rail */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h3 className="text-lg">Your selection</h3>

            {holdExpiresAt && (
              <div className="mt-3">
                <HoldCountdown expiresAt={holdExpiresAt} onExpire={onExpire} />
              </div>
            )}

            <div className="mt-4 space-y-2">
              {selectedSeats.length === 0 ? (
                <p className="text-sm text-slate-500">Tap seats on the map to select them.</p>
              ) : (
                selectedSeats.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: s.category.color }}
                      />
                      {s.rowLabel}
                      {s.seatNumber}
                      <span className="text-xs text-slate-500">· {s.category.name}</span>
                    </span>
                    <span className="text-slate-300">{rupees(s.price)}</span>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-xl font-bold gold-text">{rupees(total)}</span>
            </div>

            <div className="mt-4 space-y-2">
              {!holdExpiresAt ? (
                <Button
                  variant="gold"
                  className="w-full"
                  loading={holding}
                  disabled={selected.size === 0}
                  onClick={placeHold}
                >
                  <Lock className="h-4 w-4" /> Hold {selected.size > 0 ? `${selected.size} ` : ''}seat
                  {selected.size === 1 ? '' : 's'}
                </Button>
              ) : (
                <>
                  <Button variant="gold" className="w-full" onClick={goCheckout}>
                    Continue to checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => releaseHold()}>
                    Cancel ticket
                  </Button>
                </>
              )}
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              Held seats lock for everyone else until you check out or the timer expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
