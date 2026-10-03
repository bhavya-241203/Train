import type { MuscleGroup, PlannedExercise, SplitDayPlan, SplitType, WorkoutSplit } from './types'

export interface ExerciseDef {
  id: string
  name: string
  muscleGroup: MuscleGroup
  defaultSets: number
  defaultReps: number
}

// A small curated library covering the default splits. Users aren't expected
// to add arbitrary new exercises in the MVP, but each planned exercise stores
// its own name/muscleGroup so swapping is cheap later.
export const EXERCISE_LIBRARY: ExerciseDef[] = [
  { id: 'bench-press', name: 'Barbell Bench Press', muscleGroup: 'upper', defaultSets: 4, defaultReps: 8 },
  { id: 'ohp', name: 'Overhead Press', muscleGroup: 'upper', defaultSets: 3, defaultReps: 8 },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', muscleGroup: 'upper', defaultSets: 3, defaultReps: 10 },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'upper', defaultSets: 3, defaultReps: 12 },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'upper', defaultSets: 3, defaultReps: 15 },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'lower', defaultSets: 3, defaultReps: 5 },
  { id: 'pull-up', name: 'Pull-Up', muscleGroup: 'upper', defaultSets: 4, defaultReps: 8 },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'upper', defaultSets: 4, defaultReps: 8 },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'upper', defaultSets: 3, defaultReps: 10 },
  { id: 'bicep-curl', name: 'Bicep Curl', muscleGroup: 'upper', defaultSets: 3, defaultReps: 12 },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'upper', defaultSets: 3, defaultReps: 15 },
  { id: 'squat', name: 'Back Squat', muscleGroup: 'lower', defaultSets: 4, defaultReps: 6 },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'lower', defaultSets: 3, defaultReps: 10 },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'lower', defaultSets: 3, defaultReps: 10 },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'lower', defaultSets: 3, defaultReps: 12 },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'lower', defaultSets: 4, defaultReps: 15 },
  { id: 'plank', name: 'Plank', muscleGroup: 'core', defaultSets: 3, defaultReps: 1 },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'core', defaultSets: 3, defaultReps: 12 },
]

const lib = (id: string): ExerciseDef => {
  const found = EXERCISE_LIBRARY.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown exercise id: ${id}`)
  return found
}

const toPlanned = (ids: string[]): PlannedExercise[] =>
  ids.map((id) => {
    const e = lib(id)
    return {
      exerciseId: e.id,
      name: e.name,
      muscleGroup: e.muscleGroup,
      targetSets: e.defaultSets,
      targetReps: e.defaultReps,
    }
  })

/**
 * Builds a default WorkoutSplit for the chosen type and training frequency.
 * dayOfWeek 0 = Sunday .. 6 = Saturday. A run day and rest day are placed
 * automatically to fill out the week.
 */
export function buildDefaultSplit(type: SplitType, daysPerWeek: number): WorkoutSplit {
  const days: SplitDayPlan[] = []

  const pplRotation: { label: string; ids: string[] }[] = [
    { label: 'Push', ids: ['bench-press', 'ohp', 'incline-db-press', 'tricep-pushdown', 'lateral-raise'] },
    { label: 'Pull', ids: ['deadlift', 'pull-up', 'barbell-row', 'bicep-curl', 'face-pull'] },
    { label: 'Legs', ids: ['squat', 'leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'] },
  ]

  const upperLowerRotation: { label: string; ids: string[] }[] = [
    { label: 'Upper', ids: ['bench-press', 'barbell-row', 'ohp', 'lat-pulldown', 'bicep-curl'] },
    { label: 'Lower', ids: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] },
  ]

  const fullBodyIds = ['squat', 'bench-press', 'barbell-row', 'romanian-deadlift', 'ohp', 'plank']

  // Weekly layout: training days spread Mon/Tue/Wed/Thu/Fri/Sat, one run day,
  // rest of the week is rest. 1 = Monday .. 7 handled via index into [1..6,0].
  const weekOrder = [1, 2, 3, 4, 5, 6, 0] as const // Mon..Sun
  const runDaySlot = daysPerWeek >= 6 ? 6 : daysPerWeek + 1 // a dedicated run day right after training days when possible

  let rotationIndex = 0
  for (let slot = 0; slot < 7; slot++) {
    const dayOfWeek = weekOrder[slot]
    const isTrainingDay = slot < daysPerWeek
    const isRunSlot = slot === runDaySlot && !isTrainingDay

    if (!isTrainingDay) {
      days.push({
        dayOfWeek,
        label: isRunSlot ? 'Run' : 'Rest',
        isRestDay: !isRunSlot,
        isRunDay: isRunSlot,
        exercises: [],
      })
      continue
    }

    if (type === 'ppl') {
      const d = pplRotation[rotationIndex % pplRotation.length]
      rotationIndex++
      days.push({ dayOfWeek, label: d.label, isRestDay: false, isRunDay: false, exercises: toPlanned(d.ids) })
    } else if (type === 'upper_lower') {
      const d = upperLowerRotation[rotationIndex % upperLowerRotation.length]
      rotationIndex++
      days.push({ dayOfWeek, label: d.label, isRestDay: false, isRunDay: false, exercises: toPlanned(d.ids) })
    } else {
      days.push({ dayOfWeek, label: 'Full Body', isRestDay: false, isRunDay: false, exercises: toPlanned(fullBodyIds) })
    }
  }

  return {
    id: crypto.randomUUID(),
    type,
    name:
      type === 'ppl'
        ? 'Push / Pull / Legs'
        : type === 'upper_lower'
          ? 'Upper / Lower'
          : type === 'full_body'
            ? 'Full Body'
            : 'Custom Split',
    days,
  }
}
