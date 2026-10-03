import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

async function safeRun(fn: () => Promise<void>) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await fn()
  } catch {
    // Haptics unsupported on this device; ignore.
  }
}

export const haptics = {
  tap: () => safeRun(() => Haptics.impact({ style: ImpactStyle.Light })),
  confirm: () => safeRun(() => Haptics.impact({ style: ImpactStyle.Medium })),
  success: () => safeRun(() => Haptics.notification({ type: NotificationType.Success })),
  celebrate: () =>
    safeRun(async () => {
      await Haptics.impact({ style: ImpactStyle.Heavy })
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 120)
    }),
}
