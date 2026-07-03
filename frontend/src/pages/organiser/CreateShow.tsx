import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, IndianRupee } from 'lucide-react'
import { eventsApi, showsApi, venuesApi } from '../../api'
import { Button, Input, Select, Spinner } from '../../components/ui'

export function CreateShow() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectEvent = params.get('eventId') ?? ''

  const { data: events } = useQuery({ queryKey: ['events', 'mine'], queryFn: () => eventsApi.mine() })
  const [eventId, setEventId] = useState(preselectEvent)
  const [startsAt, setStartsAt] = useState('')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  const selectedEvent = useMemo(() => events?.find((e) => e.id === eventId), [events, eventId])
  const venueId = selectedEvent?.venueId

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['venue-categories', venueId],
    queryFn: () => venuesApi.categories(venueId!),
    enabled: !!venueId,
  })

  useEffect(() => {
    setPrices({})
  }, [venueId])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!eventId) return toast.error('Choose an event')
    if (!startsAt) return toast.error('Pick a date & time')
    const pricing = (categories ?? [])
      .map((c) => ({ categoryId: c.id, price: Number(prices[c.id] ?? 0) }))
      .filter((p) => p.price > 0)
    if (pricing.length === 0) return toast.error('Set a price for at least one category')

    setSaving(true)
    try {
      const show = await showsApi.create({
        eventId,
        startsAt: new Date(startsAt).toISOString(),
        pricing,
      })
      toast.success('Show scheduled — seat map generated')
      navigate(`/shows/${show.id}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <button
        onClick={() => navigate('/organiser')}
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>
      <h1 className="text-3xl">Schedule a show</h1>
      <p className="mt-1 text-sm text-slate-400">
        Set the date, time, and per-category pricing. Seats are generated automatically.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {events && events.length === 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            You haven't created any events yet — a show needs an event to belong to.
            <button
              type="button"
              onClick={() => navigate('/organiser/events/new')}
              className="mt-1 block font-semibold text-amber-100 underline hover:text-white"
            >
              Create your first event →
            </button>
          </div>
        ) : (
          <Select label="Event" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
            <option value="">Select an event…</option>
            {events?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.type})
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Starts at"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />

        {venueId && (
          <div>
            <span className="label">Per-category pricing</span>
            {loadingCats ? (
              <Spinner />
            ) : categories && categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-3"
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: c.color }} />
                    <span className="flex-1 text-sm text-white">{c.name}</span>
                    <div className="relative w-32">
                      <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={prices[c.id] ?? ''}
                        onChange={(e) =>
                          setPrices((p) => ({ ...p, [c.id]: Number(e.target.value) }))
                        }
                        className="field pl-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300">
                This venue has no seat categories. Ask an admin to add categories &amp; seats first.
              </p>
            )}
          </div>
        )}

        <Button variant="gold" type="submit" loading={saving} className="w-full">
          Schedule show
        </Button>
      </form>
    </div>
  )
}
