import { db } from '../db/db'
import type { FavoriteMeal, FoodLog, FoodSource } from '../db/types'
import { todayStr } from './date'

export interface MealMacros {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

function nowHHMM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function logMeal(meal: MealMacros, source: FoodSource): Promise<FoodLog> {
  const entry: FoodLog = {
    id: crypto.randomUUID(),
    date: todayStr(),
    time: nowHHMM(),
    name: meal.name,
    calories: meal.calories,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
    source,
  }
  await db.foodLogs.put(entry)
  return entry
}

export async function logFavorite(favorite: FavoriteMeal): Promise<FoodLog> {
  await db.favorites.update(favorite.id, { useCount: favorite.useCount + 1 })
  return logMeal(favorite, 'favorite')
}

export async function saveAsFavorite(meal: MealMacros): Promise<FavoriteMeal> {
  const favorite: FavoriteMeal = {
    id: crypto.randomUUID(),
    name: meal.name,
    calories: meal.calories,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
    useCount: 1,
  }
  await db.favorites.put(favorite)
  return favorite
}

export async function deleteFoodLog(id: string): Promise<void> {
  await db.foodLogs.delete(id)
}
