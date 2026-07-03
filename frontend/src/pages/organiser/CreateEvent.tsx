import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { eventsApi, venuesApi } from '../../api'
import { Button, Input, Select, Textarea, Spinner } from '../../components/ui'
import type { EventType } from '../../types'

export function CreateEvent() {
  const navigate = useNavigate()
  const { data: venues, isLoading } = useQuery({ queryKey: ['venues'], queryFn: venuesApi.list })

  const [venueId, setVenueId] = useState('')
  const [type, setType] = useState<EventType>('MOVIE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!venueId) return toast.error('Please choose a venue')
    setSaving(true)
    try {
      const event = await eventsApi.create({ venueId, type, title, description })
      toast.success('Event created')
      navigate(`/organiser/shows/new?eventId=${event.id}`)
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
      <h1 className="text-3xl">Create event</h1>
      <p className="mt-1 text-sm text-slate-400">List a movie or concert at one of your venues.</p>

      {isLoading ? (
        <Spinner />
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Select label="Venue" value={venueId} onChange={(e) => setVenueId(e.target.value)} required>
            <option value="">Select a venue…</option>
            {venues?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.address}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            {(['MOVIE', 'CONCERT'] as EventType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`rounded-xl border p-3 text-sm font-medium transition ${
                  type === t
                    ? 'border-neon bg-neon/10 text-white shadow-glow'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t === 'MOVIE' ? '🎬 Movie' : '🎵 Concert'}
              </button>
            ))}
          </div>

          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Interstellar — IMAX"
          />
          <Textarea
            label="Description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short synopsis or line-up…"
          />

          {venues && venues.length === 0 && (
            <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300">
              No venues exist yet. An admin must create a venue with seats before you can list events.
            </p>
          )}

          <Button variant="gold" type="submit" loading={saving} className="w-full">
            Create &amp; add a show
          </Button>
        </form>
      )}
    </div>
  )
}
