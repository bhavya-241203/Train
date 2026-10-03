import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ActivityLevel, Sex, SplitType } from '../../db/types'
import { ACTIVITY_LABELS } from '../../lib/calculations'
import { completeOnboarding } from '../../lib/onboarding'
import { requestLocationPermission } from '../../lib/geo'
import { ensureStepPermission } from '../../lib/health'
import { scheduleCheckInReminder } from '../../lib/notifications'
import { Button } from '../../components/ui/Button'
import { Stepper } from '../../components/ui/Stepper'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { haptics } from '../../lib/haptics'
import { OnboardingShell } from './OnboardingShell'

interface FormData {
  heightCm: number
  weightKg: number
  age: number
  sex: Sex
  goalWeightKg: number
  goalBodyFatPct: number
  activityLevel: ActivityLevel
  splitType: SplitType
  daysPerWeek: number
  stepGoal: number
  checkInReminderTime: string
  squatKg: number
  benchKg: number
  deadliftKg: number
  skipLifts: boolean
}

const DEFAULTS: FormData = {
  heightCm: 175,
  weightKg: 80,
  age: 28,
  sex: 'male',
  goalWeightKg: 70,
  goalBodyFatPct: 15,
  activityLevel: 'moderate',
  splitType: 'ppl',
  daysPerWeek: 4,
  stepGoal: 10000,
  checkInReminderTime: '20:30',
  squatKg: 40,
  benchKg: 30,
  deadliftKg: 50,
  skipLifts: true,
}

const TOTAL_STEPS = 9

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(DEFAULTS)
  const [finishing, setFinishing] = useState(false)
  const navigate = useNavigate()

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setData((d) => ({ ...d, [key]: value }))

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const finish = async () => {
    setFinishing(true)
    const liftIdsForSplit = (type: SplitType) =>
      type === 'ppl'
        ? { squat: 'squat', bench: 'bench-press', deadlift: 'deadlift' }
        : { squat: 'squat', bench: 'bench-press', deadlift: 'romanian-deadlift' }

    const ids = liftIdsForSplit(data.splitType)
    const startingWeights: Record<string, number> = data.skipLifts
      ? {}
      : { [ids.squat]: data.squatKg, [ids.bench]: data.benchKg, [ids.deadlift]: data.deadliftKg }

    await completeOnboarding({
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      age: data.age,
      sex: data.sex,
      goalWeightKg: data.goalWeightKg,
      goalBodyFatPct: data.goalBodyFatPct,
      activityLevel: data.activityLevel,
      splitType: data.splitType,
      daysPerWeek: data.daysPerWeek,
      stepGoal: data.stepGoal,
      checkInReminderTime: data.checkInReminderTime,
      startingWeights,
    })

    await Promise.all([requestLocationPermission(), ensureStepPermission(), scheduleCheckInReminder(data.checkInReminderTime)])
    haptics.success()
    navigate('/', { replace: true })
  }

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-[var(--color-bg)] safe-top safe-bottom">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-brand-start)] to-[var(--color-brand-end)] flex items-center justify-center mb-6 shadow-xl shadow-purple-900/40">
          <span className="font-display text-3xl font-bold text-white">DR</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-ink)]">DoneRight</h1>
        <p className="text-[var(--color-ink-dim)] mt-3 max-w-xs">
          Your active trainer. It tells you what to do — you just tap yes or no. Let's set you up, takes about a minute.
        </p>
        <Button size="xl" className="mt-10 w-full max-w-xs" onClick={next}>
          Get Started
        </Button>
      </div>
    )
  }

  const nav = { step, totalSteps: TOTAL_STEPS, onBack: back }

  if (step === 1) {
    return (
      <OnboardingShell {...nav} title="Your height" subtitle="Used to calculate your calorie targets." onNext={next}>
        <Stepper value={data.heightCm} onChange={(v) => set('heightCm', v)} step={1} min={120} max={220} unit="cm" />
      </OnboardingShell>
    )
  }

  if (step === 2) {
    return (
      <OnboardingShell {...nav} title="Current weight" subtitle="We'll track this weekly to chart progress." onNext={next}>
        <Stepper value={data.weightKg} onChange={(v) => set('weightKg', v)} step={0.5} min={40} max={200} unit="kg" decimals={1} />
      </OnboardingShell>
    )
  }

  if (step === 3) {
    return (
      <OnboardingShell {...nav} title="Age & sex" subtitle="Needed for an accurate BMR calculation." onNext={next}>
        <div className="space-y-6">
          <Stepper value={data.age} onChange={(v) => set('age', v)} step={1} min={13} max={90} unit="yrs" size="md" />
          <SegmentedControl
            columns={2}
            value={data.sex}
            onChange={(v) => set('sex', v)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />
        </div>
      </OnboardingShell>
    )
  }

  if (step === 4) {
    return (
      <OnboardingShell {...nav} title="Your goal" subtitle="Where you're headed." onNext={next}>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Goal weight</p>
            <Stepper value={data.goalWeightKg} onChange={(v) => set('goalWeightKg', v)} step={0.5} min={40} max={200} unit="kg" decimals={1} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Goal body fat %</p>
            <Stepper value={data.goalBodyFatPct} onChange={(v) => set('goalBodyFatPct', v)} step={1} min={5} max={40} unit="%" size="md" />
          </div>
        </div>
      </OnboardingShell>
    )
  }

  if (step === 5) {
    return (
      <OnboardingShell {...nav} title="Activity level" subtitle="Outside of training, how active is your day?" onNext={next}>
        <SegmentedControl
          value={data.activityLevel}
          onChange={(v) => set('activityLevel', v)}
          options={(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => ({ value: k, label: ACTIVITY_LABELS[k] }))}
        />
      </OnboardingShell>
    )
  }

  if (step === 6) {
    return (
      <OnboardingShell {...nav} title="Workout split" subtitle="Pick a weekly structure — fully editable later." onNext={next}>
        <div className="space-y-6">
          <SegmentedControl
            value={data.splitType}
            onChange={(v) => set('splitType', v)}
            options={[
              { value: 'ppl', label: 'Push / Pull / Legs', sublabel: 'Best for 5-6 days/week' },
              { value: 'upper_lower', label: 'Upper / Lower', sublabel: 'Best for 3-4 days/week' },
              { value: 'full_body', label: 'Full Body', sublabel: 'Best for 2-3 days/week' },
            ]}
          />
          <div>
            <p className="text-xs text-[var(--color-ink-faint)] text-center mb-2">Training days / week</p>
            <Stepper value={data.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} step={1} min={2} max={6} size="md" />
          </div>
        </div>
      </OnboardingShell>
    )
  }

  if (step === 7) {
    return (
      <OnboardingShell {...nav} title="Daily step goal" subtitle="Synced automatically once you grant motion permission." onNext={next}>
        <Stepper value={data.stepGoal} onChange={(v) => set('stepGoal', v)} step={500} min={3000} max={20000} unit="steps" size="md" />
      </OnboardingShell>
    )
  }

  // step 8: permissions + reminder time + finish
  return (
    <OnboardingShell
      {...nav}
      title="One last thing"
      subtitle="DoneRight needs these to auto-track steps and runs — no manual logging."
      onNext={finish}
      nextLabel={finishing ? 'Setting up…' : "Let's go"}
      nextDisabled={finishing}
    >
      <div className="space-y-4">
        <PermissionCard
          title="Motion & activity"
          body="Reads your daily step count from Health Connect / Apple Health. You'll be prompted by the OS next."
        />
        <PermissionCard
          title="Location"
          body="Powers the live map and distance tracking during runs. Only used while a run is active."
        />
        <label className="flex items-center justify-between bg-[var(--color-surface-2)] rounded-2xl px-4 py-3 border border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-ink-dim)]">Daily check-in reminder</span>
          <select
            value={data.checkInReminderTime}
            onChange={(e) => set('checkInReminderTime', e.target.value)}
            className="bg-[var(--color-surface-3)] text-[var(--color-ink)] rounded-lg px-2 py-1 text-sm"
          >
            <option value="19:00">7:00 PM</option>
            <option value="20:30">8:30 PM</option>
            <option value="21:30">9:30 PM</option>
          </select>
        </label>
      </div>
    </OnboardingShell>
  )
}

function PermissionCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[var(--color-surface-2)] rounded-2xl px-4 py-3.5 border border-[var(--color-border)]">
      <p className="font-display font-semibold text-sm text-[var(--color-ink)]">{title}</p>
      <p className="text-xs text-[var(--color-ink-dim)] mt-1">{body}</p>
    </div>
  )
}
