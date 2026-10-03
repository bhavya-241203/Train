import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import type { LoggedExercise, LoggedSet, PlannedExercise, WorkoutSession as WorkoutSessionType } from '../../db/types'
import { useToday } from '../../state/useToday'
import { applyOverloadUpdate, didHitTargets } from '../../lib/overload'
import { checkPRBadge } from '../../lib/badges'
import { useUiStore } from '../../state/uiStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Stepper } from '../../components/ui/Stepper'
import { CheckIcon, XIcon } from '../../components/ui/Icons'
import { haptics } from '../../lib/haptics'

interface ExerciseDraft {
  plan: PlannedExercise
  weightKg: number
  isNew: boolean
  reps: number[] // length = targetSets
}

export default function WorkoutSession() {
  const { date, dayPlan, profile } = useToday()
  const navigate = useNavigate()
  const pushBadgeToasts = useUiStore((s) => s.pushBadgeToasts)
  const fireConfetti = useUiStore((s) => s.fireConfetti)
  const [drafts, setDrafts] = useState<ExerciseDraft[] | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dayPlan) return
    ;(async () => {
      const built: ExerciseDraft[] = []
      for (const plan of dayPlan.exercises) {
        const existing = await db.exerciseProgress.get(plan.exerciseId)
        const weightKg = existing?.currentWeightKg ?? plan.startingWeightKg ?? 20
        built.push({ plan, weightKg, isNew: !existing, reps: Array(plan.targetSets).fill(plan.targetReps) })
      }
      setDrafts(built)
    })()
  }, [dayPlan])

  if (!dayPlan || !drafts || !profile) {
    return <div className="min-h-screen safe-top" />
  }

  const updateWeight = (idx: number, weightKg: number) =>
    setDrafts((d) => d!.map((ex, i) => (i === idx ? { ...ex, weightKg } : ex)))

  const updateRep = (idx: number, setIdx: number, reps: number) =>
    setDrafts((d) => d!.map((ex, i) => (i === idx ? { ...ex, reps: ex.reps.map((r, si) => (si === setIdx ? reps : r)) } : ex)))

  const finish = async () => {
    setSaving(true)
    const loggedExercises: LoggedExercise[] = drafts.map((d) => {
      const sets: LoggedSet[] = d.reps.map((actualReps, setIndex) => ({
        setIndex,
        weightKg: d.weightKg,
        targetReps: d.plan.targetReps,
        actualReps,
      }))
      const exercise: LoggedExercise = {
        exerciseId: d.plan.exerciseId,
        name: d.plan.name,
        muscleGroup: d.plan.muscleGroup,
        targetSets: d.plan.targetSets,
        targetReps: d.plan.targetReps,
        sets,
        completed: false,
      }
      exercise.completed = didHitTargets(exercise)
      return exercise
    })

    const allDone = loggedExercises.every((e) => e.completed)
    const anyDone = loggedExercises.some((e) => e.completed)

    const session: WorkoutSessionType = {
      id: crypto.randomUUID(),
      date,
      dayLabel: dayPlan.label,
      status: allDone ? 'complete' : anyDone ? 'partial' : 'missed',
      exercises: loggedExercises,
    }
    await db.sessions.put(session)

    const newBadges = []
    for (const ex of loggedExercises) {
      const prior = await db.exerciseProgress.get(ex.exerciseId)
      await applyOverloadUpdate(ex, profile, date)
      if (ex.completed) {
        const updated = await db.exerciseProgress.get(ex.exerciseId)
        if (updated && (!prior || updated.currentWeightKg > prior.currentWeightKg)) {
          const badge = await checkPRBadge(ex.exerciseId, ex.name, updated.currentWeightKg)
          if (badge) newBadges.push(badge)
        }
      }
    }

    if (newBadges.length > 0) pushBadgeToasts(newBadges)
    if (allDone) {
      haptics.success()
      fireConfetti()
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-28 safe-top">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">{dayPlan.label}</h1>
      <p className="text-sm text-[var(--color-ink-dim)] mb-5">Log what you actually did — the app adjusts next time.</p>

      <div className="space-y-4">
        {drafts.map((d, idx) => (
          <Card key={d.plan.exerciseId}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-semibold text-[var(--color-ink)]">{d.plan.name}</p>
              <span className="text-xs text-[var(--color-ink-faint)]">
                {d.plan.targetSets}×{d.plan.targetReps}
              </span>
            </div>

            {d.isNew && (
              <p className="text-xs text-[var(--color-accent)] mb-2">New exercise — set your starting weight, then DoneRight takes over.</p>
            )}

            <div className="mb-4">
              <p className="text-xs text-[var(--color-ink-faint)] text-center mb-1">Weight</p>
              <Stepper value={d.weightKg} onChange={(v) => updateWeight(idx, v)} step={2.5} min={0} max={400} unit="kg" size="md" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {d.reps.map((reps, setIdx) => (
                <div key={setIdx} className="flex items-center justify-between bg-[var(--color-surface-2)] rounded-xl px-3 py-2">
                  <span className="text-xs text-[var(--color-ink-dim)]">Set {setIdx + 1}</span>
                  <div className="flex items-center gap-3">
                    <button
                      className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] text-[var(--color-ink)] text-sm"
                      onClick={() => updateRep(idx, setIdx, Math.max(0, reps - 1))}
                    >
                      −
                    </button>
                    <span className="font-display font-semibold text-sm text-[var(--color-ink)] w-10 text-center">{reps} reps</span>
                    <button
                      className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] text-[var(--color-ink)] text-sm"
                      onClick={() => updateRep(idx, setIdx, reps + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {didHitTargets({
                exerciseId: d.plan.exerciseId,
                name: d.plan.name,
                muscleGroup: d.plan.muscleGroup,
                targetSets: d.plan.targetSets,
                targetReps: d.plan.targetReps,
                sets: d.reps.map((r, i) => ({ setIndex: i, weightKg: d.weightKg, targetReps: d.plan.targetReps, actualReps: r })),
                completed: false,
              }) ? (
                <>
                  <CheckIcon width={14} height={14} className="text-[var(--color-nutrition)]" />
                  <span className="text-[var(--color-nutrition)]">Target hit</span>
                </>
              ) : (
                <>
                  <XIcon width={14} height={14} className="text-[var(--color-ink-faint)]" />
                  <span className="text-[var(--color-ink-faint)]">Below target — same weight next time</span>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Button fullWidth size="xl" className="mt-6" onClick={finish} disabled={saving}>
        {saving ? 'Saving…' : 'Finish Workout'}
      </Button>
    </div>
  )
}
