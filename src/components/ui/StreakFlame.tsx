import { motion } from 'framer-motion'
import clsx from 'clsx'
import { FlameIcon } from './Icons'

export function StreakFlame({ streak, size = 'md' }: { streak: number; size?: 'md' | 'lg' }) {
  const intensity = Math.min(1, streak / 30)
  const big = size === 'lg'

  return (
    <motion.div
      className="flex items-center gap-1.5"
      animate={streak > 0 ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <FlameIcon
        width={big ? 28 : 18}
        height={big ? 28 : 18}
        className={clsx(streak > 0 ? 'text-[var(--color-flame)]' : 'text-[var(--color-ink-faint)]')}
        style={{ filter: streak > 0 ? `drop-shadow(0 0 ${4 + intensity * 10}px var(--color-flame))` : undefined }}
      />
      <span className={clsx('font-display font-bold', big ? 'text-2xl' : 'text-sm', 'text-[var(--color-ink)]')}>{streak}</span>
    </motion.div>
  )
}
