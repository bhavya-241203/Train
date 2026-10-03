import { db } from '../db/db'
import { buildDefaultSplit } from '../db/defaults'
import type { ActivityLevel, ExerciseProgress, Profile, Sex, SplitType } from '../db/types'

export interface OnboardingInput {
  heightCm: number
  weightKg: number
  age: number
  sex: Sex
  goalWeightKg: number
  goalBodyFatPct: number
  activityLevel: ActivityLevel
  splitType: SplitType
  daysPerWeek: number
  stepGoal: number
  checkInReminderTime: string
  startingWeights: Record<string, number> // exerciseId -> kg, optional big-lift anchors
}

export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const split = buildDefaultSplit(input.splitType, input.daysPerWeek)
  await db.splits.put(split)

  const profile: Profile = {
    id: 1,
    heightCm: input.heightCm,
    startWeightKg: input.weightKg,
    goalWeightKg: input.goalWeightKg,
    goalBodyFatPct: input.goalBodyFatPct,
    age: input.age,
    sex: input.sex,
    activityLevel: input.activityLevel,
    activeSplitId: split.id,
    daysPerWeek: input.daysPerWeek,
    stepGoal: input.stepGoal,
    deficitKcal: 550,
    proteinPerKg: 2.0,
    fatPct: 0.25,
    upperIncrementKg: 2.5,
    lowerIncrementKg: 5,
    checkInReminderTime: input.checkInReminderTime,
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  }
  await db.profile.put(profile)

  await db.weighIns.put({ date: new Date().toISOString().slice(0, 10), weightKg: input.weightKg })

  const allExercises = split.days.flatMap((d) => d.exercises)
  for (const [exerciseId, weightKg] of Object.entries(input.startingWeights)) {
    const ex = allExercises.find((e) => e.exerciseId === exerciseId)
    if (!ex || !weightKg) continue
    const progress: ExerciseProgress = {
      exerciseId,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      currentWeightKg: weightKg,
      lastResult: null,
      consecutiveMisses: 0,
      lastSessionDate: null,
      history: [],
    }
    await db.exerciseProgress.put(progress)
  }

  await db.xp.put({ id: 1, totalXp: 0, level: 1 })
  await db.streak.put({ id: 1, currentStreak: 0, longestStreak: 0, lastScoreDate: null })
}
