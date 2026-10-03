import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { db } from '../../db/db'
import type { Run } from '../../db/types'
import { useRunTracker } from './useRunTracker'
import { todayStr, formatClock, formatPace } from '../../lib/date'
import { Button } from '../../components/ui/Button'
import { PauseIcon, PlayIcon, StopIcon } from '../../components/ui/Icons'
import { haptics } from '../../lib/haptics'

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629] // India centroid fallback before first fix

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() < 15 ? 16 : map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function ActiveRun() {
  const navigate = useNavigate()
  const tracker = useRunTracker()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    tracker.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStop = async () => {
    haptics.success()
    await tracker.stop()

    const run: Run = {
      id: crypto.randomUUID(),
      date: todayStr(),
      startedAt: tracker.getStartedAt() ?? Date.now(),
      endedAt: Date.now(),
      distanceM: tracker.distanceM,
      durationS: tracker.elapsedS,
      avgPaceSecPerKm: tracker.avgPaceSecPerKm,
      route: tracker.route,
      elevationGainM: tracker.elevationGainM,
      source: 'gps',
    }
    await db.runs.put(run)
    navigate(`/run/summary/${run.id}`, { replace: true })
  }

  const last = tracker.route[tracker.route.length - 1]
  const positions: [number, number][] = tracker.route.map((p) => [p.lat, p.lng])

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <div className="flex-1 relative">
        <MapContainer
          center={last ? [last.lat, last.lng] : DEFAULT_CENTER}
          zoom={16}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: 'var(--color-run)', weight: 5 }} />}
          {last && <CircleMarker center={[last.lat, last.lng]} radius={8} pathOptions={{ color: '#fff', fillColor: 'var(--color-run)', fillOpacity: 1, weight: 3 }} />}
          {last && <Recenter lat={last.lat} lng={last.lng} />}
        </MapContainer>

        {tracker.state === 'paused' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--color-surface-2)]/95 px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--color-ink-dim)] safe-top">
            PAUSED
          </div>
        )}
      </div>

      <div className="safe-bottom bg-[var(--color-surface)] border-t border-[var(--color-border)] px-6 py-6 rounded-t-3xl -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 text-center mb-6">
          <Stat label="Distance" value={(tracker.distanceM / 1000).toFixed(2)} unit="km" />
          <Stat label="Time" value={formatClock(tracker.elapsedS)} />
          <Stat label="Pace" value={formatPace(tracker.avgPaceSecPerKm)} unit="/km" />
        </div>

        <div className="flex items-center justify-center gap-4">
          {tracker.state === 'running' ? (
            <button
              onClick={() => {
                haptics.tap()
                tracker.pause()
              }}
              className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink)]"
            >
              <PauseIcon width={26} height={26} />
            </button>
          ) : (
            <button
              onClick={() => {
                haptics.tap()
                tracker.resume()
              }}
              className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink)]"
            >
              <PlayIcon width={26} height={26} />
            </button>
          )}

          <Button size="xl" onClick={handleStop} className="flex items-center gap-2">
            <StopIcon width={20} height={20} /> Stop & Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-[var(--color-ink)]">
        {value}
        {unit && <span className="text-sm text-[var(--color-ink-dim)] ml-1">{unit}</span>}
      </p>
      <p className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{label}</p>
    </div>
  )
}
