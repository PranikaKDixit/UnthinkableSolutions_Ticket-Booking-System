import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Plus, MapPin, ChevronRight } from 'lucide-react'
import { venuesApi } from '../../api'
import { Modal } from '../../components/Modal'
import { Button, Input, EmptyState, Spinner } from '../../components/ui'

export function AdminVenues() {
  const qc = useQueryClient()
  const { data: venues, isLoading } = useQuery({ queryKey: ['venues'], queryFn: venuesApi.list })

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await venuesApi.create({ name, address })
      toast.success('Venue created')
      setOpen(false)
      setName('')
      setAddress('')
      qc.invalidateQueries({ queryKey: ['venues'] })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Venues</h1>
          <p className="mt-1 text-sm text-slate-400">Manage venues, seat categories, and layouts.</p>
        </div>
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New venue
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !venues || venues.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-10 w-10" />}
          title="No venues yet"
          hint="Create a venue, then add seat categories and a seat grid."
          action={
            <Button variant="gold" className="mt-2" onClick={() => setOpen(true)}>
              Create venue
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Link key={v.id} to={`/admin/venues/${v.id}`}>
              <div className="card flex items-center justify-between p-5 transition-shadow hover:shadow-glow">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-white">{v.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" /> {v.address}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New venue">
        <form onSubmit={create} className="space-y-4">
          <Input
            label="Venue name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PVR Icon, Downtown"
          />
          <Input
            label="Address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, City"
          />
          <Button variant="gold" type="submit" loading={saving} className="w-full">
            Create venue
          </Button>
        </form>
      </Modal>
    </div>
  )
}
