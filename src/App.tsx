import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useProfile } from './state/useProfile'
import { BottomNav } from './components/nav/BottomNav'
import { ToastHost } from './components/ui/ToastHost'
import { Confetti } from './components/ui/Confetti'
import Onboarding from './screens/onboarding/Onboarding'
import Home from './screens/home/Home'
import WorkoutSession from './screens/home/WorkoutSession'
import RunHome from './screens/run/RunHome'
import ActiveRun from './screens/run/ActiveRun'
import RunSummary from './screens/run/RunSummary'
import ManualRun from './screens/run/ManualRun'
import NutritionHome from './screens/nutrition/NutritionHome'
import PhotoLog from './screens/nutrition/PhotoLog'
import BarcodeLog from './screens/nutrition/BarcodeLog'
import ManualFoodLog from './screens/nutrition/ManualFoodLog'
import CheckIn from './screens/checkin/CheckIn'
import Dashboard from './screens/dashboard/Dashboard'
import Badges from './screens/badges/Badges'
import Settings from './screens/settings/Settings'

const NAV_HIDDEN_PREFIXES = ['/onboarding', '/run/active', '/workout']

function AppShell() {
  const profile = useProfile()
  const location = useLocation()

  if (profile === undefined) {
    return <div className="min-h-screen bg-[var(--color-bg)]" />
  }

  if (!profile || !profile.onboardingComplete) {
    if (location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  }

  const hideNav = NAV_HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ToastHost />
      <Confetti />
      <div className={hideNav ? '' : 'pb-20'}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<WorkoutSession />} />
          <Route path="/run" element={<RunHome />} />
          <Route path="/run/active" element={<ActiveRun />} />
          <Route path="/run/summary/:id" element={<RunSummary />} />
          <Route path="/run/manual" element={<ManualRun />} />
          <Route path="/nutrition" element={<NutritionHome />} />
          <Route path="/nutrition/photo" element={<PhotoLog />} />
          <Route path="/nutrition/barcode" element={<BarcodeLog />} />
          <Route path="/nutrition/manual" element={<ManualFoodLog />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
