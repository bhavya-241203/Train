import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfile } from '../../state/useProfile'
import { Card } from '../../components/ui/Card'
import { StreakFlame } from '../../components/ui/StreakFlame'
import { XpBar } from '../../components/ui/XpBar'
import { TrophyIcon } from '../../components/ui/Icons'
import clsx from 'clsx'

const STREAK_MILESTONES = [3, 7, 14, 30]
const RUN_MILESTONES_KM = [5, 10, 25, 50, 100, 250, 500]
const WEIGHT_STEP_KG = 2

export default function Badges() {
  const profile = useProfile()
  const earned = useLiveQuery(() => db.badges.toArray(), []) ?? []
  const xp = useLiveQuery(() => db.xp.get(1), [])
  const streak = useLiveQuery(() => db.streak.get(1), [])
  const prBadges = earned.filter((b) => b.type === 'pr')

  const earnedIds = new Set(earned.map((b) => b.id))
  const totalToLose = profile ? Math.max(0, profile.startWeightKg - profile.goalWeightKg) : 0
  const weightMilestones = Math.floor(totalToLose / WEIGHT_STEP_KG)

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-5">Badges</h1>

      <Card className="mb-5 flex items-center justify-between">
        <StreakFlame streak={streak?.currentStreak ?? 0} size="lg" />
        <div className="w-40">
          <XpBar totalXp={xp?.totalXp ?? 0} />
        </div>
      </Card>

      <Section title="Streaks">
        <Grid>
          {STREAK_MILESTONES.map((m) => (
            <BadgeTile key={m} label={`${m}-Day Streak`} locked={!earnedIds.has(`streak_${m}`)} />
          ))}
        </Grid>
      </Section>

      <Section title="Weight milestones">
        <Grid>
          {Array.from({ length: Math.max(weightMilestones, 1) }).map((_, i) => {
            const kg = (i + 1) * WEIGHT_STEP_KG
            return <BadgeTile key={kg} label={`-${kg}kg`} locked={!earnedIds.has(`weight_milestone_${kg}`)} />
          })}
        </Grid>
      </Section>

      <Section title="Run milestones">
        <Grid>
          {RUN_MILESTONES_KM.map((km) => (
            <BadgeTile key={km} label={`${km}km Club`} locked={!earnedIds.has(`run_milestone_${km}`)} />
          ))}
        </Grid>
      </Section>

      <Section title="Nutrition">
        <Grid>
          <BadgeTile label="Macros On Target" locked={!earned.some((b) => b.type === 'macros_week')} />
        </Grid>
      </Section>

      {prBadges.length > 0 && (
        <Section title="Personal records">
          <div className="space-y-2">
            {prBadges.map((b) => (
              <Card key={b.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand-start)] to-[var(--color-brand-end)] flex items-center justify-center text-white">
                  <TrophyIcon width={18} height={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{b.label}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{b.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>
}

function BadgeTile({ label, locked }: { label: string; locked: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={clsx(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-1.5',
          locked ? 'bg-[var(--color-surface-2)] text-[var(--color-ink-faint)]' : 'bg-gradient-to-br from-[var(--color-brand-start)] to-[var(--color-brand-end)] text-white shadow-lg shadow-purple-900/30',
        )}
      >
        <TrophyIcon width={26} height={26} className={locked ? 'opacity-30' : ''} />
      </div>
      <span className={clsx('text-[11px]', locked ? 'text-[var(--color-ink-faint)]' : 'text-[var(--color-ink)] font-medium')}>{label}</span>
    </div>
  )
}
