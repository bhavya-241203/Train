import { motion } from 'framer-motion'

export function MacroBar({ label, color, current, target }: { label: string; color: string; current: number; target: number }) {
  const pct = target > 0 ? Math.min(1, current / target) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-medium text-[var(--color-ink-dim)]">{label}</span>
        <span className="text-xs text-[var(--color-ink-faint)]">
          {Math.round(current)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
