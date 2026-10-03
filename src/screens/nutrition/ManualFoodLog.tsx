import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logMeal, saveAsFavorite } from '../../lib/nutrition'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Stepper } from '../../components/ui/Stepper'

export default function ManualFoodLog() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [calories, setCalories] = useState(400)
  const [proteinG, setProteinG] = useState(20)
  const [carbsG, setCarbsG] = useState(40)
  const [fatG, setFatG] = useState(15)
  const [saveFav, setSaveFav] = useState(false)

  const confirm = async () => {
    const meal = { name: name.trim() || 'Meal', calories, proteinG, carbsG, fatG }
    await logMeal(meal, 'manual')
    if (saveFav) await saveAsFavorite(meal)
    navigate('/nutrition', { replace: true })
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-1">Manual entry</h1>
      <p className="text-sm text-[var(--color-ink-dim)] mb-5">Last resort — photo and barcode are faster next time.</p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What did you eat?"
        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-[var(--color-ink)] mb-5 outline-none focus:border-[var(--color-accent)]"
      />

      <Card className="space-y-5">
        <Row label="Calories" value={calories} onChange={setCalories} step={10} unit="kcal" />
        <Row label="Protein" value={proteinG} onChange={setProteinG} step={1} unit="g" />
        <Row label="Carbs" value={carbsG} onChange={setCarbsG} step={1} unit="g" />
        <Row label="Fat" value={fatG} onChange={setFatG} step={1} unit="g" />
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

function Row({ label, value, onChange, step, unit }: { label: string; value: number; onChange: (v: number) => void; step: number; unit: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)] text-center mb-1">{label}</p>
      <Stepper value={value} onChange={onChange} step={step} min={0} max={5000} unit={unit} size="md" />
    </div>
  )
}
