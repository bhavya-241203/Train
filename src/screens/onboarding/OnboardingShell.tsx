import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Button } from '../../components/ui/Button'

interface OnboardingShellProps {
  step: number
  totalSteps: number
  title: string
  subtitle?: string
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  nextDisabled?: boolean
}

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] safe-top safe-bottom">
      <div className="flex items-center gap-2 px-6 pt-6">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)]' : 'bg-[var(--color-surface-3)]',
            )}
          />
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 px-6 pt-8 pb-4 flex flex-col"
      >
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="text-[var(--color-ink-dim)] text-sm mt-1.5">{subtitle}</p>}
        <div className="flex-1 flex flex-col justify-center mt-6">{children}</div>
      </motion.div>

      <div className="px-6 pb-6 flex gap-3">
        {onBack && (
          <Button variant="secondary" size="lg" onClick={onBack}>
            Back
          </Button>
        )}
        <Button size="lg" fullWidth onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
