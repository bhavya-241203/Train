import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { calculateMacroTargets } from '../lib/calculations'
import type { Profile } from '../db/types'

export function useLatestWeight(profile: Profile | null | undefined) {
  const latest = useLiveQuery(() => db.weighIns.orderBy('date').last(), [])
  return latest?.weightKg ?? profile?.startWeightKg ?? 0
}

export function useMacroTargets(profile: Profile | null | undefined) {
  const weightKg = useLatestWeight(profile)
  return useMemo(() => {
    if (!profile || !weightKg) return undefined
    return calculateMacroTargets({
      weightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      deficitKcal: profile.deficitKcal,
      proteinPerKg: profile.proteinPerKg,
      fatPct: profile.fatPct,
    })
  }, [profile, weightKg])
}
