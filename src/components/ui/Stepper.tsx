import { haptics } from '../../lib/haptics'

interface StepperProps {
  value: number
  onChange: (v: number) => void
  step: number
  min: number
  max: number
  unit?: string
  decimals?: number
  size?: 'md' | 'lg'
}

export function Stepper({ value, onChange, step, min, max, unit, decimals = 0, size = 'lg' }: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step))

  const bump = (dir: 1 | -1) => {
    haptics.tap()
    onChange(clamp(value + dir * step))
  }

  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={() => bump(-1)}
        className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-2xl font-display text-[var(--color-ink)] active:scale-95 transition-transform"
      >
        −
      </button>
      <div className={size === 'lg' ? 'min-w-[120px] text-center' : 'min-w-[80px] text-center'}>
        <span className={size === 'lg' ? 'font-display text-5xl font-bold text-[var(--color-ink)]' : 'font-display text-3xl font-bold text-[var(--color-ink)]'}>
          {value.toFixed(decimals)}
        </span>
        {unit && <span className="ml-1 text-[var(--color-ink-dim)] text-lg">{unit}</span>}
      </div>
      <button
        onClick={() => bump(1)}
        className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-2xl font-display text-[var(--color-ink)] active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  )
}
