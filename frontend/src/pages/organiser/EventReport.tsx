import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, IndianRupee, Ticket, Percent } from 'lucide-react'
import { eventsApi } from '../../api'
import { StatCard } from '../../components/StatCard'
import { RevenueChart } from '../../components/RevenueChart'
import { Spinner, EmptyState, Badge } from '../../components/ui'
import { dateTime, rupees } from '../../lib/format'

export function EventReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['event-summary', id],
    queryFn: () => eventsApi.summary(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spinner label="Crunching numbers…" />
  if (!data)
    return (
      <div className="container-page py-16">
        <EmptyState title="No report available" />
      </div>
    )

  const chart = data.shows.map((s) => ({
    label: new Date(s.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    revenue: s.summary.revenue,
  }))

  return (
    <div className="container-page py-10">
      <button
        onClick={() => navigate('/organiser')}
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      <h1 className="text-3xl">{data.event.title}</h1>
      <p className="mt-1 text-sm text-slate-400">Revenue &amp; booking summary</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<IndianRupee className="h-5 w-5" />} tone="gold" label="Total revenue" value={rupees(data.totalRevenue)} />
        <StatCard icon={<Ticket className="h-5 w-5" />} tone="neon" label="Seats sold" value={data.totalBooked} />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          tone="green"
          label="Shows"
          value={data.shows.length}
        />
      </div>

      <div className="mt-6 card p-5">
        <h2 className="mb-3 text-lg">Revenue per show</h2>
        <RevenueChart data={chart} />
      </div>

      <div className="mt-6 card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Show</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Capacity</th>
              <th className="px-4 py-3 text-right">Occupancy</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.shows.map((s) => (
              <tr key={s.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">{dateTime(s.startsAt)}</td>
                <td className="px-4 py-3 text-right">{s.summary.seatsSold}</td>
                <td className="px-4 py-3 text-right text-slate-400">{s.summary.capacity}</td>
                <td className="px-4 py-3 text-right">
                  <Badge tone={s.summary.occupancy > 0.7 ? 'green' : 'neutral'}>
                    {Math.round(s.summary.occupancy * 100)}%
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-semibold gold-text">
                  {rupees(s.summary.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
