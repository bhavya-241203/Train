import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUiStore } from '../../state/uiStore'
import { TrophyIcon, StarIcon } from './Icons'

export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  useEffect(() => {
    if (toasts.length === 0) return
    const id = toasts[0].id
    const t = setTimeout(() => dismiss(id), 3800)
    return () => clearTimeout(t)
  }, [toasts, dismiss])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] safe-top pt-3 px-4 flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.slice(0, 3).map((t) => (
          <motion.div
            key={t.id}
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            className="max-w-sm w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 pointer-events-auto"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand-start)] to-[var(--color-brand-end)] flex items-center justify-center text-white">
              {t.kind === 'badge' ? <TrophyIcon width={18} height={18} /> : <StarIcon width={18} height={18} />}
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm text-[var(--color-ink)] truncate">{t.title}</p>
              {t.body && <p className="text-xs text-[var(--color-ink-dim)] truncate">{t.body}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
