import type { SplitDayPlan, WorkoutSplit } from '../db/types'

export function getDayPlan(split: WorkoutSplit, date: Date = new Date()): SplitDayPlan | undefined {
  const dow = date.getDay()
  return split.days.find((d) => d.dayOfWeek === dow)
}
