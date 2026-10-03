import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from '@capacitor/camera'
import { estimateMealFromPhoto, isPhotoEstimationConfigured } from '../../lib/photoEstimate'
import { logMeal, saveAsFavorite } from '../../lib/nutrition'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Stepper } from '../../components/ui/Stepper'
import { CameraIcon } from '../../components/ui/Icons'
import { haptics } from '../../lib/haptics'

type Phase = 'capture' | 'estimating' | 'review' | 'failed'

export default function PhotoLog() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('capture')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [name, setName] = useState('Photo meal')
  const [calories, setCalories] = useState(500)
  const [proteinG, setProteinG] = useState(25)
  const [carbsG, setCarbsG] = useState(50)
  const [fatG, setFatG] = useState(18)
  const [saveFav, setSaveFav] = useState(false)

  const takePhoto = async () => {
    try {
      const photo = await Camera.takePhoto({ quality: 70 })
      if (!photo.webPath) throw new Error('no photo')
      setPhotoUrl(photo.webPath)
      setPhase('estimating')

      if (!isPhotoEstimationConfigured()) {
        setPhase('review')
        return
      }

      const blob = await (await fetch(photo.webPath)).blob()
      const estimate = await estimateMealFromPhoto(blob)
      if (estimate) {
        setName(estimate.name)
        setCalories(estimate.calories)
        setProteinG(estimate.proteinG)
        setCarbsG(estimate.carbsG)
        setFatG(estimate.fatG)
      }
      setPhase('review')
    } catch {
      setPhase('failed')
    }
  }

  const confirm = async () => {
    haptics.success()
    const meal = { name, calories, proteinG, carbsG, fatG }
    await logMeal(meal, 'photo')
    if (saveFav) await saveAsFavorite(meal)
    navigate('/nutrition', { replace: true })
  }

  if (phase === 'capture') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--color-nutrition-dim)] flex items-center justify-center text-[var(--color-nutrition)] mb-6">
          <CameraIcon width={40} height={40} />
        </div>
        <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">Snap your plate</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mb-8 max-w-xs">
          One photo, no typing. We'll estimate calories and macros — nudge with steppers if needed.
        </p>
        <Button size="xl" onClick={takePhoto}>
          Open Camera
        </Button>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-[var(--color-ink)] font-medium mb-4">Couldn't access the camera.</p>
        <Button onClick={() => navigate('/nutrition/manual', { replace: true })}>Use manual entry instead</Button>
      </div>
    )
  }

  if (phase === 'estimating') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        {photoUrl && <img src={photoUrl} className="w-48 h-48 object-cover rounded-3xl mb-6" />}
        <p className="text-sm text-[var(--color-ink-dim)] animate-pulse">Estimating your meal…</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      {photoUrl && <img src={photoUrl} className="w-full h-40 object-cover rounded-3xl mb-5" />}
      <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-4">{name}</h1>

      <Card className="space-y-5">
        <EstimateRow label="Calories" value={calories} onChange={setCalories} step={10} unit="kcal" />
        <EstimateRow label="Protein" value={proteinG} onChange={setProteinG} step={1} unit="g" />
        <EstimateRow label="Carbs" value={carbsG} onChange={setCarbsG} step={1} unit="g" />
        <EstimateRow label="Fat" value={fatG} onChange={setFatG} step={1} unit="g" />
      </Card>

      <label className="flex items-center gap-2 mt-4 text-sm text-[var(--color-ink-dim)]">
        <input type="checkbox" checked={saveFav} onChange={(e) => setSaveFav(e.target.checked)} className="accent-[var(--color-accent)]" />
        Save as a quick-add favorite
      </label>

      <Button fullWidth size="xl" className="mt-6" onClick={confirm}>
        Log Meal
      </Button>
    </div>
  )
}

function EstimateRow({
  label,
  value,
  onChange,
  step,
  unit,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
  unit: string
}) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)] text-center mb-1">{label}</p>
      <Stepper value={value} onChange={onChange} step={step} min={0} max={5000} unit={unit} size="md" />
    </div>
  )
}
