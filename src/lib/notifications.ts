import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const CHECKIN_NOTIFICATION_ID = 1001

/** Schedules (or reschedules) the daily end-of-day check-in reminder at the given HH:MM local time. */
export async function scheduleCheckInReminder(hhmm: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return false

    const [hour, minute] = hhmm.split(':').map(Number)
    await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: CHECKIN_NOTIFICATION_ID,
          title: 'Check in with DoneRight',
          body: "Quick tap: how'd today go?",
          schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

export async function cancelCheckInReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: CHECKIN_NOTIFICATION_ID }] })
  } catch {
    // ignore
  }
}
