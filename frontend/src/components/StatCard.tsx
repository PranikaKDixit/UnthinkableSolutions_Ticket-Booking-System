import type { ReactNode } from 'react'

export function StatCard({
  icon,
  label,
  value,
  tone = 'neon',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  tone?: 'neon' | 'gold' | 'green'
}) {
  const ring = {
    neon: 'text-neon bg-neon/15',
    gold: 'text-gold bg-gold/15',
    green: 'text-emerald-400 bg-emerald-500/15',
  }[tone]
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${ring}`}>{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}
