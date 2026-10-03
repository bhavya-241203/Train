import { Capacitor } from '@capacitor/core'
import { Health } from 'capacitor-health'
import { db } from '../db/db'
import type { DateStr } from '../db/types'
import { todayStr } from './date'

/**
 * Wraps Health Connect (Android) / HealthKit (iOS) step reads via
 * `capacitor-health`. On web, or when the native health API/app isn't
 * available, callers should fall back to the manual stepper entry — this
 * module never throws, it just reports unavailability.
 */

let permissionsRequested = false

export async function isHealthAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { available } = await Health.isHealthAvailable()
    return available
  } catch {
    return false
  }
}

export async function ensureStepPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    if (permissionsRequested) {
      const check = await Health.checkHealthPermissions({ permissions: ['READ_STEPS'] })
      return Object.values(check.permissions[0] ?? {}).some(Boolean)
    }
    const res = await Health.requestHealthPermissions({ permissions: ['READ_STEPS'] })
    permissionsRequested = true
    return Object.values(res.permissions[0] ?? {}).some(Boolean)
  } catch {
    return false
  }
}

/** Pulls today's step count from the platform health API and caches it locally. */
export async function syncTodaySteps(): Promise<number | null> {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const available = await isHealthAvailable()
    if (!available) return null
    const granted = await ensureStepPermission()
    if (!granted) return null

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()

    const res = await Health.queryAggregated({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dataType: 'steps',
      bucket: 'day',
    })
    const steps = res.aggregatedData.reduce((sum, s) => sum + s.value, 0)
    await db.steps.put({ date: todayStr(), steps: Math.round(steps), source: 'health-connect' })
    return Math.round(steps)
  } catch {
    return null
  }
}

export async function setManualSteps(date: DateStr, steps: number): Promise<void> {
  await db.steps.put({ date, steps, source: 'manual' })
}

export async function getStepsForDate(date: DateStr) {
  return db.steps.get(date)
}
