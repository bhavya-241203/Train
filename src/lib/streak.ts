import { db } from '../db/db'
import type { DateStr, StreakState } from '../db/types'
import { addDays } from './date'
import { SCORE_STREAK_THRESHOLD } from './scoring'

export async function getStreakState(): Promise<StreakState> {
  const existing = await db.streak.get(1)
  if (existing) return existing
  const fresh: StreakState = { id: 1, currentStreak: 0, longestStreak: 0, lastScoreDate: null }
  await db.streak.put(fresh)
  return fresh
}

/**
 * Updates the streak after a day's score is recorded. A streak continues
 * only when the new day is exactly one day after the last scored day and
 * the score clears the 70pt threshold; any gap or sub-70 score breaks it.
 */
export async function updateStreakForDay(date: DateStr, score: number): Promise<StreakState> {
  const state = await getStreakState()
  const isConsecutive = state.lastScoreDate ? addDays(state.lastScoreDate, 1) === date : true
  const qualifies = score >= SCORE_STREAK_THRESHOLD

  let currentStreak: number
  if (qualifies && isConsecutive) {
    currentStreak = state.currentStreak + 1
  } else if (qualifies && !isConsecutive) {
    currentStreak = 1
  } else {
    currentStreak = 0
  }

  const next: StreakState = {
    id: 1,
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastScoreDate: date,
  }
  await db.streak.put(next)
  return next
}
