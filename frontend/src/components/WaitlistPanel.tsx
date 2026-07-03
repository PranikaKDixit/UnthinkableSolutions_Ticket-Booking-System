import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { showsApi } from '../api'
import type { ShowSeat } from '../types'
import { useAuth } from '../context/AuthContext'
import { Button, Select } from './ui'

/**
 * Join / view a per-category waitlist for a sold-out show.
 * Backend auto-assigns freed seats and emails a time-limited offer link.
 */
export function WaitlistPanel({ showId, seats }: { showId: string; seats: ShowSeat[] }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [categoryId, setCategoryId] = useState('')
  const [joining, setJoining] = useState(false)

  const categories = useMemo(() => {
    const m = new Map<string, string>()
    seats.forEach((s) => m.set(s.categoryId, s.category.name))
    return [...m.entries()].map(([id, name]) => ({ id, name }))
  }, [seats])

  const { data: entry } = useQuery({
    queryKey: ['waitlist-me', showId],
    queryFn: () => showsApi.myWaitlist(showId),
    enabled: !!user,
  })

  const join = async () => {
    const cat = categoryId || categories[0]?.id
    if (!cat) return
    if (!user) {
      toast.error('Please log in to join the waitlist')
      return
    }
    setJoining(true)
    try {
      await showsApi.joinWaitlist(showId, cat)
      toast.success("You're on the waitlist — we'll email you if a seat frees up")
      qc.invalidateQueries({ queryKey: ['waitlist-me', showId] })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setJoining(false)
    }
  }

  if (entry && (entry.status === 'WAITING' || entry.status === 'OFFERED')) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-white">
            You're #{entry.position} on the {entry.category?.name} waitlist
          </p>
          <p className="text-xs text-slate-400">
            {entry.status === 'OFFERED'
              ? 'A seat has been offered to you — check your email for the link.'
              : 'We’ll auto-offer you the next freed seat via email.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button variant="gold" loading={joining} onClick={join}>
        <BellRing className="h-4 w-4" /> Join waitlist
      </Button>
    </div>
  )
}
