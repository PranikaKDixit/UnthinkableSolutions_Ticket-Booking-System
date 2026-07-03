import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Grid3x3, Tag } from 'lucide-react'
import { venuesApi } from '../../api'
import { Button, Input, Select, Spinner, Badge } from '../../components/ui'
import type { Seat } from '../../types'

const swatchColors = ['#e7b53c', '#8b5cf6', '#22d3ee', '#34d399', '#f472b6', '#f97316']

export function ManageVenue() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: venues } = useQuery({ queryKey: ['venues'], queryFn: venuesApi.list })
  const venue = venues?.find((v) => v.id === id)

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['venue-categories', id],
    queryFn: () => venuesApi.categories(id!),
    enabled: !!id,
  })
  const { data: seats } = useQuery({
    queryKey: ['venue-seats', id],
    queryFn: () => venuesApi.seats(id!),
    enabled: !!id,
  })

  /* ---- add category ---- */
  const [catName, setCatName] = useState('')
  const [catRank, setCatRank] = useState(1)
  const [catColor, setCatColor] = useState(swatchColors[0])
  const [addingCat, setAddingCat] = useState(false)

  const addCategory = async (e: FormEvent) => {
    e.preventDefault()
    setAddingCat(true)
    try {
      await venuesApi.addCategory(id!, { name: catName, rank: catRank, color: catColor })
      toast.success('Category added')
      setCatName('')
      qc.invalidateQueries({ queryKey: ['venue-categories', id] })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingCat(false)
    }
  }

  /* ---- add seat rows ---- */
  const [seatCat, setSeatCat] = useState('')
  const [rowsText, setRowsText] = useState('A,B,C,D')
  const [perRow, setPerRow] = useState(10)
  const [addingSeats, setAddingSeats] = useState(false)

  const rows = useMemo(
    () => rowsText.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean),
    [rowsText],
  )

  const addSeats = async (e: FormEvent) => {
    e.preventDefault()
    const categoryId = seatCat || categories?.[0]?.id
    if (!categoryId) return toast.error('Add a category first')
    setAddingSeats(true)
    try {
      const res = await venuesApi.addSeats(id!, { categoryId, rows, seatsPerRow: perRow })
      toast.success(`Added ${res.created} seats`)
      qc.invalidateQueries({ queryKey: ['venue-seats', id] })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingSeats(false)
    }
  }

  if (!venue) return <Spinner label="Loading venue…" />

  return (
    <div className="container-page py-10">
      <button
        onClick={() => navigate('/admin/venues')}
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Venues
      </button>
      <h1 className="text-3xl">{venue.name}</h1>
      <p className="mt-1 text-sm text-slate-400">{venue.address}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Categories */}
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-neon" /> Seat categories
          </h2>
          {loadingCats ? (
            <Spinner />
          ) : categories && categories.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm"
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  {c.name}
                  <Badge tone="neutral">rank {c.rank}</Badge>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No categories yet.</p>
          )}

          <form onSubmit={addCategory} className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <Input
              label="Category name"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Premium"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Rank"
                type="number"
                min={1}
                value={catRank}
                onChange={(e) => setCatRank(Number(e.target.value))}
              />
              <div>
                <span className="label">Colour</span>
                <div className="flex gap-2 pt-1.5">
                  {swatchColors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCatColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        catColor === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button variant="ghost" type="submit" loading={addingCat} className="w-full">
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </form>
        </div>

        {/* Seat layout builder */}
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <Grid3x3 className="h-5 w-5 text-gold" /> Seat layout
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {seats?.length ?? 0} seats configured.
          </p>

          {rows.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/60 p-4">
              <SeatPreview rows={rows} perRow={perRow} color={
                categories?.find((c) => c.id === (seatCat || categories?.[0]?.id))?.color ?? '#8b5cf6'
              } />
            </div>
          )}

          <form onSubmit={addSeats} className="mt-5 space-y-3 border-t border-white/10 pt-5">
            <Select label="Category" value={seatCat} onChange={(e) => setSeatCat(e.target.value)}>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              label="Rows (comma-separated)"
              value={rowsText}
              onChange={(e) => setRowsText(e.target.value)}
              placeholder="A,B,C,D"
            />
            <Input
              label="Seats per row"
              type="number"
              min={1}
              max={100}
              value={perRow}
              onChange={(e) => setPerRow(Number(e.target.value))}
            />
            <Button
              variant="gold"
              type="submit"
              loading={addingSeats}
              className="w-full"
              disabled={!categories || categories.length === 0}
            >
              <Plus className="h-4 w-4" /> Generate {rows.length * perRow} seats
            </Button>
            {(!categories || categories.length === 0) && (
              <p className="text-xs text-amber-300">Add a category before generating seats.</p>
            )}
          </form>

          {seats && seats.length > 0 && <ExistingLayout seats={seats} />}
        </div>
      </div>
    </div>
  )
}

function SeatPreview({ rows, perRow, color }: { rows: string[]; perRow: number; color: string }) {
  const cols = Math.min(perRow, 16)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="mb-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">Screen</span>
      {rows.slice(0, 8).map((r) => (
        <div key={r} className="flex items-center gap-1.5">
          <span className="w-4 text-[9px] text-slate-500">{r}</span>
          <div className="flex gap-1">
            {Array.from({ length: cols }).map((_, i) => (
              <span key={i} className="h-3.5 w-3.5 rounded-sm" style={{ background: color, opacity: 0.7 }} />
            ))}
            {perRow > cols && <span className="text-[9px] text-slate-500">+{perRow - cols}</span>}
          </div>
        </div>
      ))}
      {rows.length > 8 && <span className="text-[9px] text-slate-500">+{rows.length - 8} more rows</span>}
    </div>
  )
}

function ExistingLayout({ seats }: { seats: Seat[] }) {
  const byRow = useMemo(() => {
    const m = new Map<string, Seat[]>()
    seats.forEach((s) => {
      if (!m.has(s.rowLabel)) m.set(s.rowLabel, [])
      m.get(s.rowLabel)!.push(s)
    })
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [seats])

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Current layout</p>
      <div className="flex flex-col gap-1 overflow-x-auto">
        {byRow.map(([label, list]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-4 text-[9px] text-slate-500">{label}</span>
            <div className="flex gap-1">
              {list
                .sort((a, b) => a.seatNumber - b.seatNumber)
                .map((s) => (
                  <span
                    key={s.id}
                    className="h-3.5 w-3.5 rounded-sm"
                    style={{ background: s.category?.color ?? '#33334d', opacity: 0.8 }}
                    title={`${s.rowLabel}${s.seatNumber}`}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
