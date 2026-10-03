import { useState } from 'react'
import { db } from '../../db/db'
import { useLatestWeight } from '../../state/useMacroTargets'
import type { Profile } from '../../db/types'
import { todayStr } from '../../lib/date'
import { checkWeightMilestoneBadges } from '../../lib/badges'
import { computeWeightTrend } from '../../lib/weightTrend'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Stepper } from '../ui/Stepper'
import { useUiStore } from '../../state/uiStore'

export function WeighInCard({ profile, onDone }: { profile: Profile; onDone?: () => void }) {
  const currentWeight = useLatestWeight(profile)
  const [weightKg, setWeightKg] = useState(currentWeight)
  const [saved, setSaved] = useState(false)
  const [suggestion, setSuggestion] = useState<Awaited<ReturnType<typeof computeWeightTrend>> | null>(null)
  const pushToast = useUiStore((s) => s.pushToast)

  const submit = async () => {
    await db.weighIns.put({ date: todayStr(), weightKg })
    const badges = await checkWeightMilestoneBadges(profile.startWeightKg, profile.goalWeightKg, weightKg)
    badges.forEach((b) => pushToast({ title: `Badge unlocked: ${b.label}`, body: b.description, kind: 'badge' }))
    const trend = await computeWeightTrend(profile.deficitKcal)
    setSuggestion(trend)
    setSaved(true)
  }

  const applySuggestion = async (delta: number) => {
    await db.profile.update(1, { deficitKcal: Math.max(200, profile.deficitKcal + delta) })
    setSuggestion(null)
    onDone?.()
  }

  if (saved) {
    return (
      <Card className="mb-4">
        <p className="font-display font-semibold text-sm text-[var(--color-ink)] mb-1">Weigh-in logged: {weightKg.toFixed(1)}kg</p>
        {suggestion?.suggestion === 'none' || !suggestion ? (
          <p className="text-xs text-[var(--color-ink-dim)]">Your targets have been recalculated.</p>
        ) : (
          <div className="mt-2">
            <p className="text-xs text-[var(--color-ink-dim)] mb-2">
              {suggestion.suggestion === 'increase_deficit'
                ? "You're losing slower than your target rate. Increase the deficit a bit?"
                : "You're losing faster than your target rate. Ease the deficit a bit?"}
            </p>
            <div className="flex gap-2">
              <Button
                size="md"
                variant="secondary"
                onClick={() => applySuggestion(suggestion.suggestion === 'increase_deficit' ? 100 : -100)}
              >
                Adjust by 100 kcal
              </Button>
              <Button size="md" variant="ghost" onClick={() => onDone?.()}>
                Keep as is
              </Button>
            </div>
          </div>
        )}
        {!suggestion || suggestion.suggestion === 'none' ? (
          <Button size="md" variant="ghost" className="mt-2" onClick={() => onDone?.()}>
            Done
          </Button>
        ) : null}
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <p className="font-display font-semibold text-sm text-[var(--color-ink)] mb-3">Weekly weigh-in</p>
      <Stepper value={weightKg} onChange={setWeightKg} step={0.1} min={30} max={250} unit="kg" decimals={1} size="md" />
      <Button fullWidth size="md" className="mt-4" onClick={submit}>
        Log Weight
      </Button>
    </Card>
  )
}
