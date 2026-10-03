import Dexie, { type EntityTable } from 'dexie'
import type {
  Badge,
  DailyCheckIn,
  ExerciseProgress,
  FavoriteMeal,
  FoodLog,
  Profile,
  Run,
  StepEntry,
  StreakState,
  WeighIn,
  WorkoutSession,
  WorkoutSplit,
  XpState,
} from './types'

class DoneRightDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  splits!: EntityTable<WorkoutSplit, 'id'>
  sessions!: EntityTable<WorkoutSession, 'id'>
  exerciseProgress!: EntityTable<ExerciseProgress, 'exerciseId'>
  runs!: EntityTable<Run, 'id'>
  steps!: EntityTable<StepEntry, 'date'>
  foodLogs!: EntityTable<FoodLog, 'id'>
  favorites!: EntityTable<FavoriteMeal, 'id'>
  weighIns!: EntityTable<WeighIn, 'date'>
  checkIns!: EntityTable<DailyCheckIn, 'date'>
  badges!: EntityTable<Badge, 'id'>
  xp!: EntityTable<XpState, 'id'>
  streak!: EntityTable<StreakState, 'id'>

  constructor() {
    super('doneright')
    this.version(1).stores({
      profile: 'id',
      splits: 'id',
      sessions: 'id, date',
      exerciseProgress: 'exerciseId',
      runs: 'id, date',
      steps: 'date',
      foodLogs: 'id, date',
      favorites: 'id, useCount',
      weighIns: 'date',
      checkIns: 'date',
      badges: 'id, type',
      xp: 'id',
      streak: 'id',
    })
  }
}

export const db = new DoneRightDB()
