import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToday } from '../../state/useToday'
import { useMacroTargets } from '../../state/useMacroTargets'
import { ProgressRing } from '../../components/rings/ProgressRing'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StreakFlame } from '../../components/ui/StreakFlame'
import { XpBar } from '../../components/ui/XpBar'
import { computeDailyScore } from '../../lib/scoring'
import { trainerLine } from '../../lib/trainerVoice'
import { syncTodaySteps } from '../../lib/health'
import { formatClock, formatPace } from '../../lib/date'
import { RunIcon, CheckIcon, SettingsIcon } from '../../components/ui/Icons'

function scoreColor(score: number): [string, string] {
  if (score >= 70) return ['#facc15', 'var(--color-score-high)']
  if (score >= 40) return ['var(--color-score-low)', 'var(--color-score-mid)']
  return ['#7f1d1d', 'var(--color-score-low)']
}

export default function Home() {
  const { profile, dayPlan, checkIn, stepEntry, run, nutritionTotals, session, xp, streak, loading } = useToday()
  const macroTargets = useMacroTargets(profile)
  const navigate = useNavigate()

  useEffect(() => {
    syncTodaySteps()
  }, [])

  const steps = stepEntry?.steps ?? 0
  const stepGoal = profile?.stepGoal ?? 10000

  const preview = useMemo(() => {
    const totalExercises = dayPlan?.exercises.length ?? 0
    return computeDailyScore({
      isRunDay: dayPlan?.isRunDay ?? false,
      totalExercises,
      workoutStatus: checkIn?.workoutStatus ?? (session?.status === 'complete' ? 'yes' : session?.status === 'partial' ? 'partial' : null),
      completedExerciseCount: checkIn?.partialExerciseIds?.length ?? session?.exercises.filter((e) => e.completed).length ?? 0,
      ranToday: Boolean(run),
      ateClean: checkIn?.ateClean ?? null,
      noOutsideFood: checkIn?.noOutsideFood ?? null,
    })
  }, [dayPlan, checkIn, session, run])

  const todayLabel = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), [])

  if (loading || !profile) return null

  const [scoreStart, scoreEnd] = scoreColor(preview.score)
  const calTarget = macroTargets?.calorieTarget ?? 1
  const hasCheckedIn = Boolean(checkIn)

  return (
    <div className="px-5 pt-6 safe-top">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[var(--color-ink-faint)] text-xs">{todayLabel}</p>
          <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mt-0.5">
            {dayPlan?.isRestDay ? 'Rest day' : dayPlan?.label ?? 'Today'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StreakFlame streak={streak?.currentStreak ?? 0} size="lg" />
          <button onClick={() => navigate('/settings')} className="text-[var(--color-ink-faint)] p-1">
            <SettingsIcon width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <RingTile
          color="var(--color-score-high)"
          gradient={[scoreStart, scoreEnd]}
          progress={preview.score / 100}
          value={hasCheckedIn ? checkIn!.score : preview.score}
          label="Score"
        />
        <RingTile
          color="var(--color-steps)"
          progress={steps / stepGoal}
          value={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps}
          label="Steps"
        />
        <RingTile
          color="var(--color-nutrition)"
          progress={nutritionTotals.calories / calTarget}
          value={nutritionTotals.calories}
          label="kcal"
        />
      </div>

      <Card className="mb-4 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)]">
        <p className="text-sm text-[var(--color-ink-dim)] italic">"{trainerLine(preview.score, streak?.currentStreak ?? 0)}"</p>
      </Card>

      <Card className="mb-4">
        <XpBar totalXp={xp?.totalXp ?? 0} />
      </Card>

      <PlanCard dayPlan={dayPlan} session={session} run={run} onStartWorkout={() => navigate('/workout')} onStartRun={() => navigate('/run')} />

      <button
        onClick={() => navigate('/settings/split')}
        className="w-full text-center text-xs text-[var(--color-ink-faint)] underline mt-3"
      >
        View my full week's split
      </button>

      {!hasCheckedIn && (
        <Button fullWidth size="xl" className="mt-5" onClick={() => navigate('/checkin')}>
          End-of-day check-in
        </Button>
      )}
      {hasCheckedIn && (
        <Card className="mt-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-nutrition)]/20 flex items-center justify-center text-[var(--color-nutrition)]">
            <CheckIcon width={18} height={18} />
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-[var(--color-ink)]">Checked in — scored {checkIn!.score}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">See your trends on the Progress tab.</p>
          </div>
        </Card>
      )}
    </div>
  )
}

function RingTile({
  color,
  gradient,
  progress,
  value,
  label,
}: {
  color: string
  gradient?: [string, string]
  progress: number
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center">
      <ProgressRing progress={progress} size={88} strokeWidth={9} color={color} gradientStops={gradient}>
        <span className="font-display font-bold text-base text-[var(--color-ink)]">{value}</span>
      </ProgressRing>
      <span className="text-[11px] text-[var(--color-ink-faint)] mt-1.5">{label}</span>
    </div>
  )
}

function PlanCard({ dayPlan, session, run, onStartWorkout, onStartRun }: any) {
  if (!dayPlan) return null

  if (dayPlan.isRestDay) {
    return (
      <Card className="text-center py-8">
        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Rest day 😌</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Recovery is part of the plan. Back at it tomorrow.</p>
      </Card>
    )
  }

  if (dayPlan.isRunDay) {
    return (
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-run-dim)] flex items-center justify-center text-[var(--color-run)]">
            <RunIcon width={22} height={22} />
          </div>
          <div>
            <p className="font-display font-semibold text-[var(--color-ink)]">Run day</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Get your distance in today.</p>
          </div>
        </div>
        {run ? (
          <div className="flex gap-4 text-sm text-[var(--color-ink-dim)]">
            <span>{(run.distanceM / 1000).toFixed(2)} km</span>
            <span>{formatClock(run.durationS)}</span>
            <span>{formatPace(run.avgPaceSecPerKm)}/km</span>
          </div>
        ) : (
          <Button fullWidth onClick={onStartRun}>
            Start Run
          </Button>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-semibold text-[var(--color-ink)]">{dayPlan.label} day</p>
        <span className="text-xs text-[var(--color-ink-faint)]">{dayPlan.exercises.length} exercises</span>
      </div>
      <ul className="space-y-2 mb-4">
        {dayPlan.exercises.map((e: any) => (
          <li key={e.exerciseId} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-ink)]">{e.name}</span>
            <span className="text-[var(--color-ink-dim)]">
              {e.targetSets}×{e.targetReps}
            </span>
          </li>
        ))}
      </ul>
      {session?.status === 'complete' ? (
        <div className="flex items-center gap-2 text-[var(--color-nutrition)] text-sm font-medium">
          <CheckIcon width={16} height={16} /> Workout complete
        </div>
      ) : (
        <Button fullWidth onClick={onStartWorkout}>
          {session ? 'Continue Workout' : 'Start Workout'}
        </Button>
      )}
    </Card>
  )
}
