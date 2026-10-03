// Core domain types for the DoneRight trainer app.
// Everything is local-first and stored in IndexedDB via Dexie (see db.ts).

export type Sex = 'male' | 'female'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type MuscleGroup = 'upper' | 'lower' | 'core' | 'full'

export type SplitType = 'ppl' | 'upper_lower' | 'full_body' | 'custom'

/** Day-of-week index, 0 = Sunday .. 6 = Saturday (matches Date#getDay). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DateStr = string // 'YYYY-MM-DD'

export interface Profile {
  id: 1 // singleton row
  name?: string
  heightCm: number
  startWeightKg: number
  goalWeightKg: number
  goalBodyFatPct: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  activeSplitId: string
  daysPerWeek: number
  stepGoal: number
  deficitKcal: number // editable, default 550
  proteinPerKg: number // default 2.0
  fatPct: number // fraction of total calories, default 0.25
  upperIncrementKg: number // default 2.5
  lowerIncrementKg: number // default 5
  checkInReminderTime: string // 'HH:MM'
  onboardingComplete: boolean
  createdAt: string
}

export interface PlannedExercise {
  exerciseId: string
  name: string
  muscleGroup: MuscleGroup
  targetSets: number
  targetReps: number
  startingWeightKg?: number // used once, then the overload engine takes over
}

export interface SplitDayPlan {
  dayOfWeek: DayOfWeek
  label: string // 'Push', 'Upper', 'Legs', 'Rest', 'Run', ...
  isRestDay: boolean
  isRunDay: boolean
  exercises: PlannedExercise[]
}

export interface WorkoutSplit {
  id: string
  type: SplitType
  name: string
  days: SplitDayPlan[]
}

export interface LoggedSet {
  setIndex: number
  weightKg: number
  targetReps: number
  actualReps: number
}

export interface LoggedExercise {
  exerciseId: string
  name: string
  muscleGroup: MuscleGroup
  targetSets: number
  targetReps: number
  sets: LoggedSet[]
  completed: boolean // hit all prescribed sets/reps
}

export type WorkoutStatus = 'complete' | 'partial' | 'missed' | 'rest'

export interface WorkoutSession {
  id: string
  date: DateStr
  dayLabel: string
  status: WorkoutStatus
  exercises: LoggedExercise[]
}

export type OverloadResult = 'hit' | 'missed' | 'deload'

export interface ExerciseProgress {
  exerciseId: string
  name: string
  muscleGroup: MuscleGroup
  currentWeightKg: number
  lastResult: OverloadResult | null
  consecutiveMisses: number
  lastSessionDate: DateStr | null
  history: { date: DateStr; weightKg: number; result: OverloadResult }[]
}

export interface RoutePoint {
  lat: number
  lng: number
  ts: number // epoch ms
  alt?: number
}

export interface Run {
  id: string
  date: DateStr
  startedAt: number
  endedAt: number
  distanceM: number
  durationS: number
  avgPaceSecPerKm: number
  route: RoutePoint[]
  elevationGainM?: number
  source: 'gps' | 'manual'
}

export interface StepEntry {
  date: DateStr
  steps: number
  source: 'health-connect' | 'manual'
}

export type FoodSource = 'photo' | 'favorite' | 'barcode' | 'manual'

export interface FoodLog {
  id: string
  date: DateStr
  time: string // 'HH:MM'
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  source: FoodSource
}

export interface FavoriteMeal {
  id: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  useCount: number
}

export interface WeighIn {
  date: DateStr
  weightKg: number
  bodyFatPct?: number
}

export interface DailyCheckIn {
  date: DateStr
  workoutStatus: 'yes' | 'no' | 'partial' | null
  partialExerciseIds?: string[]
  ateClean: boolean | null
  noOutsideFood: boolean | null
  ranToday: boolean
  stepGoalHit: boolean
  score: number
  breakdown: {
    workoutPts: number
    runPts: number
    dietCleanPts: number
    noOutsidePts: number
  }
  xpEarned: number
}

export type BadgeType =
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'weight_milestone'
  | 'pr'
  | 'run_milestone'
  | 'macros_week'

export interface Badge {
  id: string
  type: BadgeType
  label: string
  description: string
  earnedAt: string
  meta?: Record<string, unknown>
}

export interface XpState {
  id: 1
  totalXp: number
  level: number
}

export interface StreakState {
  id: 1
  currentStreak: number
  longestStreak: number
  lastScoreDate: DateStr | null
}

export interface MacroTargets {
  bmr: number
  tdee: number
  calorieTarget: number
  proteinG: number
  fatG: number
  carbsG: number
}
