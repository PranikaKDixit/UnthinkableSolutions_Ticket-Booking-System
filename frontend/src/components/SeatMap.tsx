import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ShowSeat } from '../types'

interface Props {
  seats: ShowSeat[]
  selected: Set<string> // showSeat ids the user is picking
  onToggle: (seat: ShowSeat) => void
}

/**
 * Visual seat grid for one show.
 *  - AVAILABLE  → dark, clickable
 *  - SELECTED   → neon (this user's current picks)
 *  - HELD       → amber, locked (someone holds it; unless heldByMe)
 *  - BOOKED     → grey, locked
 * Rows are grouped by rowLabel and sorted; seat numbers ascending.
 */
export function SeatMap({ seats, selected, onToggle }: Props) {
  const rows = useMemo(() => {
    const map = new Map<string, ShowSeat[]>()
    for (const s of seats) {
      if (!map.has(s.rowLabel)) map.set(s.rowLabel, [])
      map.get(s.rowLabel)!.push(s)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, list]) => ({
        label,
        list: list.sort((a, b) => a.seatNumber - b.seatNumber),
      }))
  }, [seats])

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto min-w-max px-4">
        {/* Screen */}
        <div className="mb-8 flex flex-col items-center">
          <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-transparent via-neon to-transparent shadow-glow" />
          <div
            className="mt-2 h-10 w-2/3 rounded-b-[50%] border-t-2 border-neon/40"
            style={{ background: 'radial-gradient(60% 120% at 50% 0%, rgba(139,92,246,0.18), transparent 70%)' }}
          />
          <span className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">Screen / Stage</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2">
          {rows.map(({ label, list }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-500">
                {label}
              </span>
              <div className="flex gap-1.5">
                {list.map((seat) => (
                  <SeatCell
                    key={seat.id}
                    seat={seat}
                    isSelected={selected.has(seat.id)}
                    onToggle={onToggle}
                  />
                ))}
              </div>
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-500">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SeatCell({
  seat,
  isSelected,
  onToggle,
}: {
  seat: ShowSeat
  isSelected: boolean
  onToggle: (s: ShowSeat) => void
}) {
  const mine = seat.heldByMe
  const locked = (seat.status === 'HELD' && !mine) || seat.status === 'BOOKED'

  let cls = 'bg-seat-available hover:ring-2 hover:ring-neon/50 cursor-pointer'
  if (isSelected) cls = 'bg-seat-selected text-white shadow-glow cursor-pointer'
  else if (seat.status === 'BOOKED') cls = 'bg-seat-booked text-slate-600 cursor-not-allowed'
  else if (seat.status === 'HELD' && !mine)
    cls = 'bg-seat-held/80 text-ink-950 cursor-not-allowed animate-pulse'
  else if (mine) cls = 'bg-neon/40 text-white ring-2 ring-neon cursor-pointer'

  return (
    <motion.button
      whileTap={locked ? undefined : { scale: 0.85 }}
      disabled={locked}
      onClick={() => !locked && onToggle(seat)}
      title={`${seat.rowLabel}${seat.seatNumber} · ${seat.category.name} · ₹${seat.price}`}
      style={{ borderColor: seat.category.color }}
      className={`grid h-7 w-7 place-items-center rounded-md border-b-2 text-[10px] font-semibold transition ${cls}`}
    >
      {seat.seatNumber}
    </motion.button>
  )
}
