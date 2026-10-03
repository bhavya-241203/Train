import { db } from '../db/db'
import type { DateStr, ExerciseProgress, LoggedExercise, MuscleGroup, OverloadResult, Profile } from '../db/types'

/** Round to the nearest 2.5kg increment, never below 0. */
function roundToPlate(weightKg: number): number {
  return Math.max(0, Math.round(weightKg / 2.5) * 2.5)
}

export function incrementFor(muscleGroup: MuscleGroup, profile: Profile): number {
  return muscleGroup === 'lower' ? profile.lowerIncrementKg : profile.upperIncrementKg
}

export function didHitTargets(exercise: LoggedExercise): boolean {
  if (exercise.sets.length < exercise.targetSets) return false
  return exercise.sets.every((s) => s.actualReps >= s.targetReps)
}

/**
 * Given the just-logged exercise and the exercise's running progress state,
 * returns the result for this session plus the weight to suggest next time.
 * This is the core "trainer brain": hit targets -> add weight, miss -> repeat,
 * miss twice in a row at the same weight -> deload.
 */
export function computeNextSuggestion(
  exercise: LoggedExercise,
  priorProgress: ExerciseProgress | undefined,
  profile: Profile,
): { result: OverloadResult; nextWeightKg: number; consecutiveMisses: number } {
  const hit = didHitTargets(exercise)
  const usedWeight = exercise.sets[0]?.weightKg ?? priorProgress?.currentWeightKg ?? 0
  const priorMisses = priorProgress?.consecutiveMisses ?? 0

  if (hit) {
    const inc = incrementFor(exercise.muscleGroup, profile)
    return { result: 'hit', nextWeightKg: roundToPlate(usedWeight + inc), consecutiveMisses: 0 }
  }

  const missesSoFar = priorMisses + 1
  if (missesSoFar >= 2) {
    // Missed two sessions in a row at the same weight -> deload ~10%.
    const deloaded = roundToPlate(usedWeight * 0.9)
    return { result: 'deload', nextWeightKg: deloaded, consecutiveMisses: 0 }
  }

  return { result: 'missed', nextWeightKg: usedWeight, consecutiveMisses: missesSoFar }
}

/** Persists the outcome of a logged exercise into the exerciseProgress table. */
export async function applyOverloadUpdate(
  exercise: LoggedExercise,
  profile: Profile,
  date: DateStr,
): Promise<void> {
  const prior = await db.exerciseProgress.get(exercise.exerciseId)
  const { result, nextWeightKg, consecutiveMisses } = computeNextSuggestion(exercise, prior, profile)

  const historyEntry = { date, weightKg: exercise.sets[0]?.weightKg ?? 0, result }
  const history = [...(prior?.history ?? []), historyEntry].slice(-50)

  const next: ExerciseProgress = {
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    currentWeightKg: nextWeightKg,
    lastResult: result,
    consecutiveMisses,
    lastSessionDate: date,
    history,
  }
  await db.exerciseProgress.put(next)
}

/** Returns the suggested working weight for an exercise, falling back to a starting weight if new. */
export async function getSuggestedWeight(exerciseId: string, fallbackStartingWeightKg = 0): Promise<number> {
  const progress = await db.exerciseProgress.get(exerciseId)
  return progress?.currentWeightKg ?? fallbackStartingWeightKg
}
