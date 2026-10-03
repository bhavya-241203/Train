import { motion } from 'framer-motion'
import { levelForXp, titleForLevel } from '../../lib/scoring'

export function XpBar({ totalXp }: { totalXp: number }) {
  const { level, xpIntoLevel, xpToNext } = levelForXp(totalXp)
  const pct = xpIntoLevel / (xpIntoLevel + xpToNext)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-display font-bold text-sm text-[var(--color-ink)]">
          Lv.{level} <span className="text-[var(--color-ink-dim)] font-medium">{titleForLevel(level)}</span>
        </span>
        <span className="text-xs text-[var(--color-ink-faint)]">
          {xpIntoLevel} / {xpIntoLevel + xpToNext} XP
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
