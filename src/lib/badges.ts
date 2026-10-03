import { db } from '../db/db'
import type { Badge, BadgeType, DateStr } from '../db/types'
import { addDays } from './date'

async function award(id: string, type: BadgeType, label: string, description: string, meta?: Record<string, unknown>): Promise<Badge | null> {
  const existing = await db.badges.get(id)
  if (existing) return null
  const badge: Badge = { id, type, label, description, earnedAt: new Date().toISOString(), meta }
  await db.badges.put(badge)
  return badge
}

const STREAK_MILESTONES = [3, 7, 14, 30]

export async function checkStreakBadges(currentStreak: number): Promise<Badge[]> {
  const awarded: Badge[] = []
  for (const m of STREAK_MILESTONES) {
    if (currentStreak === m) {
      const type = (`streak_${m}` as BadgeType)
      const b = await award(`streak_${m}`, type, `${m}-Day Streak`, `Scored 70+ for ${m} days in a row.`)
      if (b) awarded.push(b)
    }
  }
  return awarded
}

const WEIGHT_MILESTONE_STEP_KG = 2

export async function checkWeightMilestoneBadges(
  startWeightKg: number,
  goalWeightKg: number,
  currentWeightKg: number,
): Promise<Badge[]> {
  const awarded: Badge[] = []
  const totalToLose = startWeightKg - goalWeightKg
  if (totalToLose <= 0) return awarded
  const lostSoFar = startWeightKg - currentWeightKg
  const milestonesHit = Math.floor(lostSoFar / WEIGHT_MILESTONE_STEP_KG)
  for (let m = 1; m <= milestonesHit; m++) {
    const kg = m * WEIGHT_MILESTONE_STEP_KG
    const b = await award(
      `weight_milestone_${kg}`,
      'weight_milestone',
      `-${kg}kg`,
      `Lost ${kg}kg toward your goal.`,
      { kg },
    )
    if (b) awarded.push(b)
  }
  return awarded
}

export async function checkPRBadge(exerciseId: string, exerciseName: string, newWeightKg: number): Promise<Badge | null> {
  return award(
    `pr_${exerciseId}_${newWeightKg}`,
    'pr',
    `${exerciseName} PR`,
    `New working weight: ${newWeightKg}kg on ${exerciseName}.`,
    { exerciseId, weightKg: newWeightKg },
  )
}

const RUN_DISTANCE_MILESTONES_KM = [5, 10, 25, 50, 100, 250, 500]

export async function checkRunMilestoneBadges(totalDistanceKmBefore: number, totalDistanceKmAfter: number): Promise<Badge[]> {
  const awarded: Badge[] = []
  for (const km of RUN_DISTANCE_MILESTONES_KM) {
    if (totalDistanceKmBefore < km && totalDistanceKmAfter >= km) {
      const b = await award(`run_milestone_${km}`, 'run_milestone', `${km}km Club`, `Logged ${km}km total running.`, { km })
      if (b) awarded.push(b)
    }
  }
  return awarded
}

/** Awards a "macros on target 7 days straight" badge, checked after each check-in. */
export async function checkMacrosWeekBadge(today: DateStr): Promise<Badge | null> {
  let date = today
  for (let i = 0; i < 7; i++) {
    const checkIn = await db.checkIns.get(date)
    if (!checkIn || !checkIn.ateClean) return null
    date = addDays(date, -1)
  }
  return award(`macros_week_${today}`, 'macros_week', 'Macros On Target', 'Hit your calorie/macro budget 7 days straight.', {
    endDate: today,
  })
}

export async function allBadges(): Promise<Badge[]> {
  return db.badges.orderBy('earnedAt').reverse().toArray()
}
