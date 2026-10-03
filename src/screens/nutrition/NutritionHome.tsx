import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useToday } from '../../state/useToday'
import { useMacroTargets } from '../../state/useMacroTargets'
import { logFavorite, deleteFoodLog } from '../../lib/nutrition'
import { ProgressRing } from '../../components/rings/ProgressRing'
import { MacroBar } from '../../components/ui/MacroBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { CameraIcon, BarcodeIcon, StarIcon, XIcon } from '../../components/ui/Icons'
import { haptics } from '../../lib/haptics'

export default function NutritionHome() {
  const navigate = useNavigate()
  const { profile, foodLogs, nutritionTotals } = useToday()
  const targets = useMacroTargets(profile)
  const favorites = useLiveQuery(() => db.favorites.orderBy('useCount').reverse().limit(8).toArray(), []) ?? []

  const calorieTarget = targets?.calorieTarget ?? 0

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-5">Nutrition</h1>

      <Card className="flex items-center gap-5 mb-5">
        <ProgressRing progress={calorieTarget > 0 ? nutritionTotals.calories / calorieTarget : 0} size={110} strokeWidth={10} color="var(--color-nutrition)">
          <div className="text-center">
            <p className="font-display text-xl font-bold text-[var(--color-ink)]">{nutritionTotals.calories}</p>
            <p className="text-[10px] text-[var(--color-ink-faint)]">/ {calorieTarget} kcal</p>
          </div>
        </ProgressRing>
        <div className="flex-1 space-y-2.5">
          <MacroBar label="Protein" color="var(--color-protein)" current={nutritionTotals.proteinG} target={targets?.proteinG ?? 0} />
          <MacroBar label="Carbs" color="var(--color-carbs)" current={nutritionTotals.carbsG} target={targets?.carbsG ?? 0} />
          <MacroBar label="Fat" color="var(--color-fat)" current={nutritionTotals.fatG} target={targets?.fatG ?? 0} />
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <LogButton icon={CameraIcon} label="Photo" onClick={() => navigate('/nutrition/photo')} />
        <LogButton icon={BarcodeIcon} label="Barcode" onClick={() => navigate('/nutrition/barcode')} />
        <LogButton icon={StarIcon} label="Manual" onClick={() => navigate('/nutrition/manual')} />
      </div>

      {favorites.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Quick add</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {favorites.map((f) => (
              <button
                key={f.id}
                onClick={async () => {
                  haptics.confirm()
                  await logFavorite(f)
                }}
                className="shrink-0 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-left min-w-[140px]"
              >
                <p className="text-sm font-medium text-[var(--color-ink)] truncate">{f.name}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">{f.calories} kcal</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Today</p>
        {foodLogs.length === 0 && <p className="text-sm text-[var(--color-ink-dim)]">Nothing logged yet today.</p>}
        <div className="space-y-2">
          {foodLogs.map((f) => (
            <Card key={f.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">{f.name}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">
                  {f.time} · {f.calories} kcal · P{f.proteinG} C{f.carbsG} F{f.fatG}
                </p>
              </div>
              <button onClick={() => deleteFoodLog(f.id)} className="text-[var(--color-ink-faint)] p-1">
                <XIcon width={16} height={16} />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function LogButton({ icon: Icon, label, onClick }: { icon: typeof CameraIcon; label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" size="lg" onClick={onClick} className="flex flex-col items-center gap-1.5 !py-4">
      <Icon width={22} height={22} />
      <span className="text-xs">{label}</span>
    </Button>
  )
}
