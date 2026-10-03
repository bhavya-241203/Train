import clsx from 'clsx'
import { haptics } from '../../lib/haptics'

interface Option<T extends string> {
  value: T
  label: string
  sublabel?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  columns?: 1 | 2
}

export function SegmentedControl<T extends string>({ options, value, onChange, columns = 1 }: SegmentedControlProps<T>) {
  return (
    <div className={clsx('grid gap-2', columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => {
              haptics.tap()
              onChange(opt.value)
            }}
            className={clsx(
              'text-left rounded-2xl px-4 py-3 border transition-colors',
              active
                ? 'border-[var(--color-accent)] bg-gradient-to-r from-[var(--color-brand-start)]/20 to-[var(--color-brand-end)]/20 text-[var(--color-ink)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink-dim)]',
            )}
          >
            <div className="font-display font-semibold text-sm">{opt.label}</div>
            {opt.sublabel && <div className="text-xs opacity-70 mt-0.5">{opt.sublabel}</div>}
          </button>
        )
      })}
    </div>
  )
}
