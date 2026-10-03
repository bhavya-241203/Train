import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import type { Run } from '../../db/types'
import { todayStr } from '../../lib/date'
import { Stepper } from '../../components/ui/Stepper'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function ManualRun() {
  const navigate = useNavigate()
  const [distanceKm, setDistanceKm] = useState(5)
  const [durationMin, setDurationMin] = useState(30)

  const avgPaceSecPerKm = distanceKm > 0 ? (durationMin * 60) / distanceKm : 0

  const save = async () => {
    const now = Date.now()
    const run: Run = {
      id: crypto.randomUUID(),
      date: todayStr(),
      startedAt: now - durationMin * 60_000,
      endedAt: now,
      distanceM: distanceKm * 1000,
      durationS: durationMin * 60,
      avgPaceSecPerKm,
      route: [],
      source: 'manual',
    }
    await db.runs.put(run)
    navigate(`/run/summary/${run.id}`, { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top safe-bottom min-h-screen flex flex-col">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">Manual run</h1>
      <p className="text-sm text-[var(--color-ink-dim)] mb-6">For treadmill runs with no GPS signal.</p>

      <Card className="mb-4">
        <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Distance</p>
        <Stepper value={distanceKm} onChange={setDistanceKm} step={0.1} min={0.1} max={50} unit="km" decimals={1} />
      </Card>

      <Card className="mb-6">
        <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Duration</p>
        <Stepper value={durationMin} onChange={setDurationMin} step={1} min={1} max={240} unit="min" size="md" />
      </Card>

      <p className="text-center text-sm text-[var(--color-ink-dim)] mb-6">
        Average pace: <span className="font-semibold text-[var(--color-ink)]">{(avgPaceSecPerKm / 60).toFixed(1)} min/km</span>
      </p>

      <Button fullWidth size="xl" onClick={save}>
        Save Run
      </Button>
    </div>
  )
}
