# DoneRight

An active trainer app, not a logging app. It tells you what to do each day —
workout weights/reps, when to run, what to eat toward your targets — and you
confirm yes/no. Built with Capacitor + React + Vite + Tailwind, local-first
on-device (Dexie/IndexedDB), no login, no general backend.

## Stack

- React + TypeScript + Vite, Tailwind v4
- Capacitor (Android now, iOS addable later with a Mac + Xcode)
- Dexie (IndexedDB) for all local data — profile, splits, sessions, runs,
  steps, food logs, weigh-ins, badges, XP/streaks
- `capacitor-health` for Health Connect (Android) / HealthKit (iOS) steps
- `@capacitor/geolocation` + Leaflet for the run tracker
- `@capacitor-mlkit/barcode-scanning` for barcode food lookup
- Open Food Facts (free, keyless) for barcode nutrition data
- A small serverless function (see `serverless/photo-estimate`) for photo
  calorie estimation — optional, the app works without it
- Recharts (dashboard), Framer Motion (animation), Zustand (toast/confetti UI
  state only — all real data lives in Dexie)

## Develop

```
npm install
npm run dev
```

Runs as a normal web app in the browser for fast iteration. Native-only
features (step sync, haptics, native camera/barcode scanner) no-op
gracefully on web — see "Known limitations" below.

## Build the Android app

```
npm run build
npx cap sync android
npx cap open android   # opens Android Studio
```

From Android Studio: connect a device or start an emulator, then Run. This
sandbox has no Android SDK, so the native build was not compiled here —
Android Studio will fetch the SDK/build tools on first open if needed.

iOS needs a Mac with Xcode: `npx cap add ios`, then `npx cap open ios`.

On first launch, Android/iOS will prompt for motion/activity and location
permissions per the onboarding screen's explanations.

## Optional: photo calorie estimation

Food logging works fully without this (photo logging falls back straight to
manual entry). To enable AI photo estimation, deploy the reference worker in
`serverless/photo-estimate/` (keeps the vision-model API key server-side, out
of the app bundle) and set:

```
VITE_PHOTO_ESTIMATE_URL=https://your-worker-url
```

in a `.env` file before building.

## Known limitations & tradeoffs

- **Background GPS during a run**: Android/iOS can suspend or kill GPS
  tracking if the app is backgrounded for a long time, since this build uses
  the foreground `@capacitor/geolocation` watch rather than a dedicated
  background-geolocation plugin (which needs extra native config/foreground
  service setup). For an MVP this is an acceptable tradeoff — keep the app
  open during a run. If background tracking becomes a priority, swap in
  `@capacitor-community/background-geolocation` and wire a foreground
  notification.
- **Health Connect**: requires the Health Connect app installed on the
  device (Android 13 included it by default; older devices install it from
  Play Store). If unavailable, the steps ring simply stays at the manual
  fallback — there's no step data, not a crash.
- **HealthifyMe / third-party nutrition sync**: there is no confirmed public
  API for HealthifyMe, and no confirmed Health Connect nutrition sync path.
  The in-app tracker (photo/favorite/barcode/manual) is the real, working
  nutrition path; nothing here depends on HealthifyMe.
- **Open Food Facts coverage**: Indian packaged-food coverage can be
  partial. Barcode lookups that fail route straight to manual entry.
- **Native build untested in this sandbox**: no Android SDK is available
  here, so `npx cap sync android` was run and the generated project was
  inspected, but `./gradlew assembleDebug` was not. Build it in Android
  Studio before shipping.
