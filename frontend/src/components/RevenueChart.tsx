import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'

export interface RevenuePoint {
  label: string
  revenue: number
}

/** Compact revenue-per-show bar chart for the organiser dashboard. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="grid h-56 place-items-center text-sm text-slate-500">
        No revenue data yet
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={224}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => '₹' + v}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: '#12121c',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
          }}
          formatter={(v: number) => ['₹' + v.toLocaleString('en-IN'), 'Revenue']}
        />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="url(#goldGrad)" />
          ))}
        </Bar>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4d58a" />
            <stop offset="100%" stopColor="#b8892a" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
