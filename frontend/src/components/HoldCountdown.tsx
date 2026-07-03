import { Timer } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { mmss } from '../lib/format'

/**
 * Live countdown for a seat hold. Turns red under 60s and calls
 * `onExpire` when the hold TTL elapses so the UI can release seats.
 */
export function HoldCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string
  onExpire: () => void
}) {
  const secs = useCountdown(expiresAt, onExpire)
  const urgent = secs <= 60

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums transition ${
        urgent
          ? 'border-red-500/50 bg-red-500/10 text-red-300'
          : 'border-neon/40 bg-neon/10 text-neon-soft'
      }`}
    >
      <Timer className="h-4 w-4" />
      Seats held · {mmss(secs)}
    </div>
  )
}
