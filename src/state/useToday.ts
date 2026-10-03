import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayStr } from '../lib/date'
import { getDayPlan } from '../lib/planToday'

export function useToday() {
  const date = todayStr()

  const profile = useLiveQuery(() => db.profile.get(1), [])
  const split = useLiveQuery(() => (profile?.activeSplitId ? db.splits.get(profile.activeSplitId) : undefined), [profile?.activeSplitId])
  const dayPlan = split ? getDayPlan(split) : undefined

  const checkIn = useLiveQuery(() => db.checkIns.get(date), [date])
  const stepEntry = useLiveQuery(() => db.steps.get(date), [date])
  const run = useLiveQuery(() => db.runs.where('date').equals(date).first(), [date])
  const foodLogs = useLiveQuery(() => db.foodLogs.where('date').equals(date).toArray(), [date]) ?? []
  const session = useLiveQuery(() => db.sessions.where('date').equals(date).first(), [date])
  const xp = useLiveQuery(() => db.xp.get(1), [])
  const streak = useLiveQuery(() => db.streak.get(1), [])

  const nutritionTotals = foodLogs.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      proteinG: acc.proteinG + f.proteinG,
      carbsG: acc.carbsG + f.carbsG,
      fatG: acc.fatG + f.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )

  return {
    date,
    profile,
    split,
    dayPlan,
    checkIn,
    stepEntry,
    run,
    foodLogs,
    nutritionTotals,
    session,
    xp,
    streak,
    loading: profile === undefined,
  }
}
