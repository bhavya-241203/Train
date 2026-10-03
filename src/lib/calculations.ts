import type { ActivityLevel, MacroTargets, Sex } from '../db/types'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little or no exercise)',
  light: 'Light (1-3 days/week)',
  moderate: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very active (hard daily training)',
}

/** Mifflin-St Jeor equation. */
export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

// Never recommend below this, regardless of deficit settings, for safety.
const MIN_CALORIE_FLOOR = 1300

export interface MacroInputs {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  deficitKcal: number
  proteinPerKg: number
  fatPct: number
}

export function calculateMacroTargets(inputs: MacroInputs): MacroTargets {
  const bmr = calculateBMR(inputs.weightKg, inputs.heightCm, inputs.age, inputs.sex)
  const tdee = calculateTDEE(bmr, inputs.activityLevel)
  const calorieTarget = Math.max(MIN_CALORIE_FLOOR, Math.round(tdee - inputs.deficitKcal))

  const proteinG = Math.round(inputs.proteinPerKg * inputs.weightKg)
  const proteinKcal = proteinG * 4
  const fatKcal = calorieTarget * inputs.fatPct
  const fatG = Math.round(fatKcal / 9)
  const carbsKcal = Math.max(0, calorieTarget - proteinKcal - fatKcal)
  const carbsG = Math.round(carbsKcal / 4)

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget,
    proteinG,
    fatG,
    carbsG,
  }
}

/** ~7700 kcal per kg of body fat lost, used to project weekly rate of loss. */
export function kcalDeficitToKgPerWeek(deficitKcalPerDay: number): number {
  return (deficitKcalPerDay * 7) / 7700
}
