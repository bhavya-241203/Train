import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Hides the native splash screen and styles the status bar for our dark theme. Native only. */
export async function bootNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0b0e14' })
  } catch {
    // status bar APIs aren't available on all platforms (e.g. edge-to-edge Android)
  }
  try {
    await SplashScreen.hide()
  } catch {
    // ignore
  }
}
