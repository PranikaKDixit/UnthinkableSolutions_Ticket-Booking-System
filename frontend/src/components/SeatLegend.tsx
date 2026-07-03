import type { ShowSeat } from '../types'

const swatches = [
  { label: 'Available', cls: 'bg-seat-available border-white/20' },
  { label: 'Selected', cls: 'bg-seat-selected border-neon' },
  { label: 'Held', cls: 'bg-seat-held border-amber-300' },
  { label: 'Booked', cls: 'bg-seat-booked border-white/10' },
]

/** Status legend plus a per-category price key derived from the seat data. */
export function SeatLegend({ seats }: { seats: ShowSeat[] }) {
  const cats = new Map<string, { name: string; color: string; price: number }>()
  for (const s of seats) {
    if (!cats.has(s.categoryId))
      cats.set(s.categoryId, { name: s.category.name, color: s.category.color, price: s.price })
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-ink-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-4">
        {swatches.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`h-4 w-4 rounded border-b-2 ${s.cls}`} />
            {s.label}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {[...cats.values()]
          .sort((a, b) => b.price - a.price)
          .map((c) => (
            <div key={c.name} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              {c.name} · ₹{c.price}
            </div>
          ))}
      </div>
    </div>
  )
}
