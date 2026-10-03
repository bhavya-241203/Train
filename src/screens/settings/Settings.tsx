import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { useProfile } from '../../state/useProfile'
import { useLatestWeight } from '../../state/useMacroTargets'
import { scheduleCheckInReminder } from '../../lib/notifications'
import { todayStr } from '../../lib/date'
import { Card } from '../../components/ui/Card'
import { Stepper } from '../../components/ui/Stepper'
import { Button } from '../../components/ui/Button'

export default function Settings() {
  const navigate = useNavigate()
  const profile = useProfile()
  const currentWeight = useLatestWeight(profile)
  const [bodyFat, setBodyFat] = useState(profile?.goalBodyFatPct ?? 15)

  if (!profile) return null

  const update = (patch: Partial<typeof profile>) => db.profile.update(1, patch)

  const logBodyFat = async () => {
    const existing = await db.weighIns.get(todayStr())
    await db.weighIns.put({ date: todayStr(), weightKg: existing?.weightKg ?? currentWeight, bodyFatPct: bodyFat })
  }

  return (
    <div className="px-5 pt-6 pb-10 safe-top">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">Settings</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[var(--color-ink-dim)]">
          Close
        </button>
      </div>

      <Card className="mb-4">
        <Label>Daily step goal</Label>
        <Stepper value={profile.stepGoal} onChange={(v) => update({ stepGoal: v })} step={500} min={3000} max={20000} unit="steps" size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Calorie deficit</Label>
        <Stepper value={profile.deficitKcal} onChange={(v) => update({ deficitKcal: v })} step={50} min={200} max={1000} unit="kcal/day" size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Protein target</Label>
        <Stepper value={profile.proteinPerKg} onChange={(v) => update({ proteinPerKg: v })} step={0.1} min={1.2} max={3} unit="g/kg" decimals={1} size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Fat % of calories</Label>
        <Stepper value={Math.round(profile.fatPct * 100)} onChange={(v) => update({ fatPct: v / 100 })} step={5} min={15} max={40} unit="%" size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Upper body increment</Label>
        <Stepper value={profile.upperIncrementKg} onChange={(v) => update({ upperIncrementKg: v })} step={0.5} min={0.5} max={10} unit="kg" decimals={1} size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Lower body increment</Label>
        <Stepper value={profile.lowerIncrementKg} onChange={(v) => update({ lowerIncrementKg: v })} step={0.5} min={0.5} max={10} unit="kg" decimals={1} size="md" />
      </Card>

      <Card className="mb-4">
        <Label>Check-in reminder</Label>
        <select
          value={profile.checkInReminderTime}
          onChange={async (e) => {
            await update({ checkInReminderTime: e.target.value })
            await scheduleCheckInReminder(e.target.value)
          }}
          className="w-full bg-[var(--color-surface-2)] text-[var(--color-ink)] rounded-xl px-3 py-2.5 text-sm mt-1"
        >
          <option value="19:00">7:00 PM</option>
          <option value="20:30">8:30 PM</option>
          <option value="21:30">9:30 PM</option>
        </select>
      </Card>

      <Card className="mb-6">
        <Label>Body fat % (manual)</Label>
        <Stepper value={bodyFat} onChange={setBodyFat} step={1} min={5} max={45} unit="%" size="md" />
        <Button fullWidth size="md" className="mt-3" onClick={logBodyFat}>
          Save today's body fat %
        </Button>
      </Card>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">{children}</p>
}
