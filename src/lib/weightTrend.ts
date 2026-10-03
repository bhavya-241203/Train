import { db } from '../db/db'
import { daysBetween } from './date'
import { kcalDeficitToKgPerWeek } from './calculations'

export interface WeightTrendResult {
  actualKgPerWeek: number | null
  targetKgPerWeek: number
  suggestion: 'increase_deficit' | 'decrease_deficit' | 'none'
}

const RATE_TOLERANCE_KG_PER_WEEK = 0.2

/**
 * Compares actual rate of loss over the last ~3 weigh-ins against the target
 * rate implied by the current deficit. Only suggests a change — never
 * applies one automatically, per the product spec.
 */
export async function computeWeightTrend(deficitKcal: number): Promise<WeightTrendResult> {
  const targetKgPerWeek = kcalDeficitToKgPerWeek(deficitKcal)
  const recent = await db.weighIns.orderBy('date').reverse().limit(4).toArray()

  if (recent.length < 2) {
    return { actualKgPerWeek: null, targetKgPerWeek, suggestion: 'none' }
  }

  const newest = recent[0]
  const oldest = recent[recent.length - 1]
  const days = daysBetween(oldest.date, newest.date)
  if (days < 7) {
    return { actualKgPerWeek: null, targetKgPerWeek, suggestion: 'none' }
  }

  const actualKgPerWeek = ((oldest.weightKg - newest.weightKg) / days) * 7
  const delta = actualKgPerWeek - targetKgPerWeek

  let suggestion: WeightTrendResult['suggestion'] = 'none'
  if (delta < -RATE_TOLERANCE_KG_PER_WEEK) suggestion = 'increase_deficit' // losing slower than target
  else if (delta > RATE_TOLERANCE_KG_PER_WEEK) suggestion = 'decrease_deficit' // losing faster than target

  return { actualKgPerWeek, targetKgPerWeek, suggestion }
}
