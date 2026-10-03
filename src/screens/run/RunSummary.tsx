import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import { db } from '../../db/db'
import { formatClock, formatDisplayDate, formatPace } from '../../lib/date'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    const bounds = new LatLngBounds(positions)
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [positions, map])
  return null
}

export default function RunSummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  const run = useLiveQuery(() => (id ? db.runs.get(id) : undefined), [id])

  if (!run) return <div className="min-h-screen safe-top" />

  const positions: [number, number][] = run.route.map((p) => [p.lat, p.lng])

  return (
    <div className="px-5 pt-6 pb-10 safe-top safe-bottom">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">Run complete 🎉</h1>
      <p className="text-sm text-[var(--color-ink-dim)] mb-5">{formatDisplayDate(run.date)}</p>

      {positions.length > 1 && (
        <div className="h-48 rounded-3xl overflow-hidden mb-5 border border-[var(--color-border)]">
          <MapContainer zoomControl={false} attributionControl={false} center={positions[0]} zoom={15} className="w-full h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={positions} pathOptions={{ color: 'var(--color-run)', weight: 5 }} />
            <FitRoute positions={positions} />
          </MapContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="text-center py-5">
          <p className="font-display text-3xl font-bold text-[var(--color-ink)]">{(run.distanceM / 1000).toFixed(2)}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">kilometers</p>
        </Card>
        <Card className="text-center py-5">
          <p className="font-display text-3xl font-bold text-[var(--color-ink)]">{formatClock(run.durationS)}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">duration</p>
        </Card>
        <Card className="text-center py-5">
          <p className="font-display text-3xl font-bold text-[var(--color-ink)]">{formatPace(run.avgPaceSecPerKm)}</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">avg pace /km</p>
        </Card>
        <Card className="text-center py-5">
          <p className="font-display text-3xl font-bold text-[var(--color-ink)]">{Math.round(run.elevationGainM ?? 0)}m</p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-1">elevation gain</p>
        </Card>
      </div>

      <Button fullWidth size="lg" onClick={() => navigate('/', { replace: true })}>
        Done
      </Button>
    </div>
  )
}
