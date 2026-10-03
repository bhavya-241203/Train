import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scanOneBarcode } from '../../lib/barcode'
import { lookupBarcode } from '../../lib/openFoodFacts'
import { logMeal } from '../../lib/nutrition'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Stepper } from '../../components/ui/Stepper'
import { BarcodeIcon } from '../../components/ui/Icons'
import { haptics } from '../../lib/haptics'

type Phase = 'scan' | 'looking-up' | 'review' | 'not-found'

const SERVING_PRESETS = [50, 100, 150, 200, 250, 330]

export default function BarcodeLog() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('scan')
  const [productName, setProductName] = useState('')
  const [per100, setPer100] = useState({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
  const [servingG, setServingG] = useState(100)

  const scan = async () => {
    const code = await scanOneBarcode()
    if (!code) return
    setPhase('looking-up')
    const product = await lookupBarcode(code)
    if (!product.found) {
      setPhase('not-found')
      return
    }
    setProductName(product.name)
    setPer100({ calories: product.calories, proteinG: product.proteinG, carbsG: product.carbsG, fatG: product.fatG })
    setPhase('review')
  }

  const scaled = (per100g: number) => Math.round((per100g * servingG) / 100)

  const confirm = async () => {
    haptics.success()
    await logMeal(
      {
        name: productName || 'Scanned item',
        calories: scaled(per100.calories),
        proteinG: scaled(per100.proteinG),
        carbsG: scaled(per100.carbsG),
        fatG: scaled(per100.fatG),
      },
      'barcode',
    )
    navigate('/nutrition', { replace: true })
  }

  if (phase === 'scan') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--color-nutrition-dim)] flex items-center justify-center text-[var(--color-nutrition)] mb-6">
          <BarcodeIcon width={40} height={40} />
        </div>
        <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-2">Scan a barcode</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mb-8 max-w-xs">
          Pulls calories/macros from Open Food Facts. Coverage for Indian packaged food can be partial — you can always adjust.
        </p>
        <Button size="xl" onClick={scan}>
          Open Scanner
        </Button>
        <button className="mt-6 text-sm text-[var(--color-ink-dim)] underline" onClick={() => navigate('/nutrition/manual', { replace: true })}>
          Enter manually instead
        </button>
      </div>
    )
  }

  if (phase === 'looking-up') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex items-center justify-center">
        <p className="text-sm text-[var(--color-ink-dim)] animate-pulse">Looking up product…</p>
      </div>
    )
  }

  if (phase === 'not-found') {
    return (
      <div className="px-5 pt-6 pb-10 safe-top min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-[var(--color-ink)] font-medium mb-2">Not in the database.</p>
        <p className="text-sm text-[var(--color-ink-dim)] mb-6 max-w-xs">This happens with some Indian packaged foods. Enter it manually once.</p>
        <Button onClick={() => navigate('/nutrition/manual', { replace: true })}>Manual entry</Button>
      </div>
    )
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mb-1">{productName}</h1>
      <p className="text-xs text-[var(--color-ink-faint)] mb-5">Per 100g: {per100.calories} kcal · P{per100.proteinG} C{per100.carbsG} F{per100.fatG}</p>

      <Card className="mb-5">
        <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Serving size</p>
        <Stepper value={servingG} onChange={setServingG} step={10} min={10} max={1000} unit="g" size="md" />
        <div className="flex gap-2 mt-3 justify-center flex-wrap">
          {SERVING_PRESETS.map((g) => (
            <button
              key={g}
              onClick={() => setServingG(g)}
              className="text-xs px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-ink-dim)]"
            >
              {g}g
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <p className="font-display font-semibold text-sm text-[var(--color-ink)] mb-2">This serving</p>
        <div className="grid grid-cols-2 gap-3 text-sm text-[var(--color-ink-dim)]">
          <span>Calories: {scaled(per100.calories)} kcal</span>
          <span>Protein: {scaled(per100.proteinG)}g</span>
          <span>Carbs: {scaled(per100.carbsG)}g</span>
          <span>Fat: {scaled(per100.fatG)}g</span>
        </div>
      </Card>

      <Button fullWidth size="xl" onClick={confirm}>
        Log Item
      </Button>
    </div>
  )
}
