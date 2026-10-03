export const STEP_GOAL_BONUS_XP = 15
export const SCORE_STREAK_THRESHOLD = 70
export const XP_PER_LEVEL = 1000

export interface ScoreInputs {
  isRunDay: boolean
  totalExercises: number // 0 on a rest day
  workoutStatus: 'yes' | 'no' | 'partial' | null
  completedExerciseCount: number // used when status === 'partial'
  ranToday: boolean
  ateClean: boolean | null
  noOutsideFood: boolean | null
}

export interface ScoreBreakdown {
  workoutPts: number
  runPts: number
  dietCleanPts: number
  noOutsidePts: number
}

export interface ScoreResult {
  score: number
  breakdown: ScoreBreakdown
}

const WORKOUT_MAX = 40
const RUN_MAX = 20
const DIET_MAX = 20
const OUTSIDE_MAX = 20

/**
 * Computes the 0-100 daily score, counting only categories applicable that
 * day (e.g. a rest day has no workout/run categories, so it's rescaled from
 * just diet) per the product spec.
 */
export function computeDailyScore(inputs: ScoreInputs): ScoreResult {
  const isWorkoutDay = inputs.totalExercises > 0

  let applicableMax = DIET_MAX + OUTSIDE_MAX
  if (isWorkoutDay) applicableMax += WORKOUT_MAX
  if (inputs.isRunDay) applicableMax += RUN_MAX

  let workoutPts = 0
  if (isWorkoutDay) {
    if (inputs.workoutStatus === 'yes') workoutPts = WORKOUT_MAX
    else if (inputs.workoutStatus === 'partial') {
      workoutPts = Math.round((inputs.completedExerciseCount / inputs.totalExercises) * WORKOUT_MAX)
    }
  }

  const runPts = inputs.isRunDay && inputs.ranToday ? RUN_MAX : 0
  const dietCleanPts = inputs.ateClean ? DIET_MAX : 0
  const noOutsidePts = inputs.noOutsideFood ? OUTSIDE_MAX : 0

  const earned = workoutPts + runPts + dietCleanPts + noOutsidePts
  const score = applicableMax > 0 ? Math.round((earned / applicableMax) * 100) : 0

  return { score, breakdown: { workoutPts, runPts, dietCleanPts, noOutsidePts } }
}

export function xpForDay(score: number, stepGoalHit: boolean): number {
  return score + (stepGoalHit ? STEP_GOAL_BONUS_XP : 0)
}

export function levelForXp(totalXp: number): { level: number; xpIntoLevel: number; xpToNext: number } {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpIntoLevel = totalXp % XP_PER_LEVEL
  return { level, xpIntoLevel, xpToNext: XP_PER_LEVEL - xpIntoLevel }
}

export const LEVEL_TITLES = [
  'Rookie',
  'Grinder',
  'Contender',
  'Athlete',
  'Warrior',
  'Beast',
  'Champion',
  'Elite',
  'Legend',
  'Icon',
]

export function titleForLevel(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}
