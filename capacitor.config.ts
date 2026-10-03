import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.doneright.trainer',
  appName: 'DoneRight',
  webDir: 'dist',
  backgroundColor: '#0b0e14',
  android: {
    backgroundColor: '#0b0e14',
  },
  ios: {
    backgroundColor: '#0b0e14',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: '#0b0e14',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    LocalNotifications: {
      iconColor: '#8b5cf6',
    },
  },
}

export default config
