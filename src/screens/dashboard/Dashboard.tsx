import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from 'recharts'
import { db } from '../../db/db'
import { useProfile } from '../../state/useProfile'
import { Card } from '../../components/ui/Card'
import { ScoreHeatmap } from '../../components/dashboard/ScoreHeatmap'
import { RunIcon } from '../../components/ui/Icons'
import { addDays, formatClock, formatDisplayDate, formatPace, todayStr } from '../../lib/date'

const AXIS_STYLE = { fontSize: 11, fill: 'var(--color-ink-faint)' }

export default function Dashboard() {
  const profile = useProfile()
  const weighIns = useLiveQuery(() => db.weighIns.orderBy('date').toArray(), []) ?? []
  const checkIns = useLiveQuery(() => db.checkIns.toArray(), []) ?? []
  const runs = useLiveQuery(() => db.runs.orderBy('date').reverse().toArray(), []) ?? []
  const exerciseProgress = useLiveQuery(() => db.exerciseProgress.toArray(), []) ?? []

  const last14 = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(todayStr(), -(13 - i))), [])
  const steps = useLiveQuery(() => db.steps.where('date').anyOf(last14).toArray(), [last14]) ?? []
  const foodLogs = useLiveQuery(() => db.foodLogs.where('date').anyOf(last14).toArray(), [last14]) ?? []

  const weightData = weighIns.map((w) => ({ date: formatDisplayDate(w.date), weight: w.weightKg }))
  const latestBodyFat = [...weighIns].reverse().find((w) => w.bodyFatPct != null)?.bodyFatPct

  const stepsByDate = new Map(steps.map((s) => [s.date, s.steps]))
  const stepsData = last14.map((d) => ({ date: formatDisplayDate(d).slice(0, 6), steps: stepsByDate.get(d) ?? 0 }))

  const caloriesByDate = new Map<string, number>()
  foodLogs.forEach((f) => caloriesByDate.set(f.date, (caloriesByDate.get(f.date) ?? 0) + f.calories))
  const calorieData = last14.map((d) => ({ date: formatDisplayDate(d).slice(0, 6), calories: caloriesByDate.get(d) ?? 0 }))

  const liftOptions = exerciseProgress.filter((e) => e.history.length >= 2)
  const [selectedLift, setSelectedLift] = useState<string | null>(null)
  const activeLift = liftOptions.find((e) => e.exerciseId === selectedLift) ?? liftOptions[0]
  const liftData = activeLift?.history.map((h) => ({ date: formatDisplayDate(h.date).slice(0, 6), weight: h.weightKg })) ?? []

  const totalRunDistanceKm = runs.reduce((s, r) => s + r.distanceM, 0) / 1000

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-5">Progress</h1>

      <SectionCard title="Weight trend">
        {weightData.length >= 2 && profile ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={AXIS_STYLE} />
              <YAxis tick={AXIS_STYLE} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 12 }} />
              <ReferenceLine y={profile.goalWeightKg} stroke="var(--color-nutrition)" strokeDasharray="4 4" label={{ value: 'Goal', fill: 'var(--color-nutrition)', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Log a few weekly weigh-ins to see your trend." />
        )}
        {latestBodyFat != null && profile && (
          <p className="text-xs text-[var(--color-ink-dim)] mt-2 text-center">
            Body fat: <span className="font-semibold text-[var(--color-ink)]">{latestBodyFat}%</span> → goal {profile.goalBodyFatPct}%
          </p>
        )}
      </SectionCard>

      <SectionCard title="Strength trend">
        {liftOptions.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
              {liftOptions.map((e) => (
                <button
                  key={e.exerciseId}
                  onClick={() => setSelectedLift(e.exerciseId)}
                  className={
                    (activeLift?.exerciseId === e.exerciseId
                      ? 'bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-ink-dim)]') + ' shrink-0 px-3 py-1.5 rounded-full text-xs font-medium'
                  }
                >
                  {e.name}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={liftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={AXIS_STYLE} />
                <YAxis tick={AXIS_STYLE} />
                <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="var(--color-workout)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <EmptyState text="Complete a couple of workouts to see lift progress." />
        )}
      </SectionCard>

      <SectionCard title="Score heatmap">
        <ScoreHeatmap checkIns={checkIns} />
      </SectionCard>

      <SectionCard title="Steps (14 days)">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stepsData}>
            <XAxis dataKey="date" tick={AXIS_STYLE} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 12 }} />
            <Bar dataKey="steps" fill="var(--color-steps)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Calories vs target (14 days)">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={calorieData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={AXIS_STYLE} />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 12 }} />
            <Line type="monotone" dataKey="calories" stroke="var(--color-nutrition)" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title={`Run history — ${totalRunDistanceKm.toFixed(1)}km total`}>
        {runs.length === 0 ? (
          <EmptyState text="No runs logged yet." />
        ) : (
          <div className="space-y-2">
            {runs.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-run-dim)] flex items-center justify-center text-[var(--color-run)]">
                  <RunIcon width={16} height={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--color-ink)]">{(r.distanceM / 1000).toFixed(2)} km</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{formatDisplayDate(r.date)}</p>
                </div>
                <p className="text-xs text-[var(--color-ink-dim)]">
                  {formatClock(r.durationS)} · {formatPace(r.avgPaceSecPerKm)}/km
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-5">
      <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-3">{title}</p>
      {children}
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-[var(--color-ink-dim)] py-6 text-center">{text}</p>
}
