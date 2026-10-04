import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfile } from '../../state/useProfile'
import { Card } from '../../components/ui/Card'
import { RunIcon } from '../../components/ui/Icons'
import clsx from 'clsx'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun, matches how splits are built
const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export default function MySplit() {
  const navigate = useNavigate()
  const profile = useProfile()
  const split = useLiveQuery(() => (profile?.activeSplitId ? db.splits.get(profile.activeSplitId) : undefined), [profile?.activeSplitId])
  const exerciseProgress = useLiveQuery(() => db.exerciseProgress.toArray(), []) ?? []
  const progressById = new Map(exerciseProgress.map((p) => [p.exerciseId, p]))

  const today = new Date().getDay()

  if (!profile || !split) return null

  const orderedDays = WEEK_ORDER.map((dow) => split.days.find((d) => d.dayOfWeek === dow)).filter(Boolean)

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">My Split</h1>
        <button onClick={() => navigate(-1)} className="text-sm text-[var(--color-ink-dim)]">
          Close
        </button>
      </div>
      <p className="text-sm text-[var(--color-ink-dim)] mb-5">{split.name} · {profile.daysPerWeek} days/week</p>

      <div className="space-y-3">
        {orderedDays.map((day) => {
          if (!day) return null
          const isToday = day.dayOfWeek === today
          return (
            <Card
              key={day.dayOfWeek}
              className={clsx(isToday && 'border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-brand-start)]/10 to-[var(--color-brand-end)]/10')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-[var(--color-ink)]">{DAY_LABELS[day.dayOfWeek]}</p>
                  {isToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-white font-semibold">TODAY</span>
                  )}
                </div>
                {day.isRunDay && <RunIcon width={18} height={18} className="text-[var(--color-run)]" />}
              </div>

              {day.isRestDay ? (
                <p className="text-sm text-[var(--color-ink-faint)]">Rest day</p>
              ) : day.isRunDay ? (
                <p className="text-sm text-[var(--color-run)]">Run day</p>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--color-ink-faint)] mb-1">{day.label}</p>
                  {day.exercises.map((e) => {
                    const weight = progressById.get(e.exerciseId)?.currentWeightKg
                    return (
                      <div key={e.exerciseId} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-ink)]">{e.name}</span>
                        <span className="text-[var(--color-ink-dim)]">
                          {e.targetSets}×{e.targetReps}
                          {weight != null && <span className="text-[var(--color-ink-faint)]"> @ {weight}kg</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
