import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useToday } from '../../state/useToday'
import { useMacroTargets } from '../../state/useMacroTargets'
import { computeDailyScore } from '../../lib/scoring'
import { xpForDay, levelForXp } from '../../lib/scoring'
import { updateStreakForDay } from '../../lib/streak'
import { checkStreakBadges, checkMacrosWeekBadge } from '../../lib/badges'
import { trainerLine } from '../../lib/trainerVoice'
import { daysBetween } from '../../lib/date'
import { useUiStore } from '../../state/uiStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { WeighInCard } from '../../components/weighin/WeighInCard'
import { haptics } from '../../lib/haptics'
import type { DailyCheckIn } from '../../db/types'

export default function CheckIn() {
  const navigate = useNavigate()
  const { date, profile, dayPlan, stepEntry, run, nutritionTotals, session } = useToday()
  const targets = useMacroTargets(profile)
  const lastWeighIn = useLiveQuery(() => db.weighIns.orderBy('date').last(), [])
  const pushBadgeToasts = useUiStore((s) => s.pushBadgeToasts)
  const fireConfetti = useUiStore((s) => s.fireConfetti)

  const [workoutStatus, setWorkoutStatus] = useState<'yes' | 'no' | 'partial' | null>(null)
  const [partialIds, setPartialIds] = useState<string[]>([])
  const [ateClean, setAteClean] = useState<boolean | null>(null)
  const [noOutsideFood, setNoOutsideFood] = useState<boolean | null>(null)
  const [result, setResult] = useState<DailyCheckIn | null>(null)
  const [finalStreak, setFinalStreak] = useState(0)
  const [weighInDone, setWeighInDone] = useState(false)

  const totalExercises = dayPlan?.exercises.length ?? 0
  const workoutAlreadyLogged = Boolean(session)
  const nutritionLogged = nutritionTotals.calories > 0

  const dueForWeighIn = !lastWeighIn || daysBetween(lastWeighIn.date, date) >= 7

  // Workout status/diet answers are auto-filled from already-logged data when
  // available; otherwise they come from the tap-based questions below.
  const effectiveWorkoutStatus = workoutAlreadyLogged && session ? (session.status === 'complete' ? 'yes' : session.status === 'partial' ? 'partial' : 'no') : workoutStatus
  const effectivePartialIds = workoutAlreadyLogged && session ? session.exercises.filter((e) => e.completed).map((e) => e.exerciseId) : partialIds

  const nutritionWithinBudget = nutritionLogged && targets ? nutritionTotals.calories <= targets.calorieTarget * 1.1 : null
  const effectiveAteClean = nutritionLogged ? nutritionWithinBudget : ateClean
  const effectiveNoOutsideFood = nutritionLogged ? nutritionWithinBudget : noOutsideFood

  const canSubmit = useMemo(() => {
    if (totalExercises > 0 && !workoutAlreadyLogged && effectiveWorkoutStatus === null) return false
    if (!nutritionLogged && (effectiveAteClean === null || effectiveNoOutsideFood === null)) return false
    return true
  }, [totalExercises, workoutAlreadyLogged, effectiveWorkoutStatus, nutritionLogged, effectiveAteClean, effectiveNoOutsideFood])

  const stepGoalHit = (stepEntry?.steps ?? 0) >= (profile?.stepGoal ?? 10000)

  const submit = async () => {
    const completedExerciseCount = effectiveWorkoutStatus === 'partial' ? effectivePartialIds.length : session?.exercises.filter((e) => e.completed).length ?? 0

    const { score, breakdown } = computeDailyScore({
      isRunDay: dayPlan?.isRunDay ?? false,
      totalExercises,
      workoutStatus: effectiveWorkoutStatus,
      completedExerciseCount,
      ranToday: Boolean(run),
      ateClean: effectiveAteClean,
      noOutsideFood: effectiveNoOutsideFood,
    })

    const xpEarned = xpForDay(score, stepGoalHit)

    const checkIn: DailyCheckIn = {
      date,
      workoutStatus: effectiveWorkoutStatus,
      partialExerciseIds: effectiveWorkoutStatus === 'partial' ? effectivePartialIds : undefined,
      ateClean: effectiveAteClean,
      noOutsideFood: effectiveNoOutsideFood,
      ranToday: Boolean(run),
      stepGoalHit,
      score,
      breakdown,
      xpEarned,
    }
    await db.checkIns.put(checkIn)

    const xpState = (await db.xp.get(1)) ?? { id: 1 as const, totalXp: 0, level: 1 }
    const newTotalXp = xpState.totalXp + xpEarned
    const { level } = levelForXp(newTotalXp)
    const leveledUp = level > xpState.level
    await db.xp.put({ id: 1, totalXp: newTotalXp, level })

    const streakState = await updateStreakForDay(date, score)
    setFinalStreak(streakState.currentStreak)
    const newBadges = [...(await checkStreakBadges(streakState.currentStreak))]
    const macrosBadge = await checkMacrosWeekBadge(date)
    if (macrosBadge) newBadges.push(macrosBadge)

    if (newBadges.length > 0) pushBadgeToasts(newBadges)
    if (leveledUp) haptics.celebrate()
    if (score >= 80) {
      haptics.success()
      fireConfetti()
    }

    setResult(checkIn)
  }

  if (result) {
    return (
      <div className="px-5 pt-10 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-sm text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Today's score</p>
        <p className="font-display text-6xl font-bold text-[var(--color-ink)] mb-3">{result.score}</p>
        <p className="text-[var(--color-ink-dim)] italic max-w-xs mb-8">"{trainerLine(result.score, finalStreak)}"</p>
        <Button size="xl" onClick={() => navigate('/', { replace: true })}>
          Back to Today
        </Button>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-5">Check-in</h1>

      <Card className="mb-5">
        <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Today's recap</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Recap label="Steps" value={String(stepEntry?.steps ?? 0)} />
          <Recap label="Run" value={run ? `${(run.distanceM / 1000).toFixed(1)}km` : '—'} />
          <Recap label="Calories" value={`${nutritionTotals.calories}/${targets?.calorieTarget ?? 0}`} />
        </div>
      </Card>

      {dueForWeighIn && !weighInDone && profile && <WeighInCard profile={profile} onDone={() => setWeighInDone(true)} />}

      {totalExercises > 0 && !workoutAlreadyLogged && (
        <Question title="Did you complete today's workout?">
          <div className="flex gap-2">
            {(['yes', 'partial', 'no'] as const).map((opt) => (
              <TapOption key={opt} active={workoutStatus === opt} onClick={() => setWorkoutStatus(opt)}>
                {opt === 'yes' ? 'Yes' : opt === 'partial' ? 'Partial' : 'No'}
              </TapOption>
            ))}
          </div>
          {workoutStatus === 'partial' && (
            <div className="mt-3 space-y-1.5">
              {dayPlan!.exercises.map((e) => (
                <label key={e.exerciseId} className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
                  <input
                    type="checkbox"
                    checked={partialIds.includes(e.exerciseId)}
                    onChange={(ev) =>
                      setPartialIds((prev) => (ev.target.checked ? [...prev, e.exerciseId] : prev.filter((id) => id !== e.exerciseId)))
                    }
                    className="accent-[var(--color-accent)]"
                  />
                  {e.name}
                </label>
              ))}
            </div>
          )}
        </Question>
      )}

      {totalExercises > 0 && workoutAlreadyLogged && (
        <Card className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-ink-dim)]">Workout</span>
          <span className="text-sm font-medium text-[var(--color-ink)] capitalize">{session?.status}</span>
        </Card>
      )}

      {nutritionLogged ? (
        <Card className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--color-ink-dim)]">Diet</span>
          <span className="text-sm font-medium text-[var(--color-ink)]">{nutritionWithinBudget ? 'Within budget ✓' : 'Over budget'}</span>
        </Card>
      ) : (
        <>
          <Question title="Did you eat clean today?">
            <YesNo value={ateClean} onChange={setAteClean} />
          </Question>
          <Question title="Did you avoid eating outside food today?">
            <YesNo value={noOutsideFood} onChange={setNoOutsideFood} />
          </Question>
        </>
      )}

      <Button fullWidth size="xl" className="mt-4" disabled={!canSubmit} onClick={submit}>
        Submit Check-in
      </Button>
    </div>
  )
}

function Recap({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display font-bold text-[var(--color-ink)]">{value}</p>
      <p className="text-[10px] text-[var(--color-ink-faint)] mt-0.5">{label}</p>
    </div>
  )
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <p className="text-sm font-medium text-[var(--color-ink)] mb-3">{title}</p>
      {children}
    </Card>
  )
}

function TapOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => {
        haptics.tap()
        onClick()
      }}
      className={
        active
          ? 'flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)] text-white font-medium text-sm'
          : 'flex-1 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink-dim)] text-sm'
      }
    >
      {children}
    </button>
  )
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <TapOption active={value === true} onClick={() => onChange(true)}>
        Yes
      </TapOption>
      <TapOption active={value === false} onClick={() => onChange(false)}>
        No
      </TapOption>
    </div>
  )
}
