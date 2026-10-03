import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { haptics } from '../../lib/haptics'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg' | 'xl'

interface ButtonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  onClick?: () => void
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-[var(--color-brand-start)] to-[var(--color-brand-end)] text-white shadow-lg shadow-purple-900/30',
  secondary: 'bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)]',
  ghost: 'bg-transparent text-[var(--color-ink-dim)]',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const sizeClasses: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
  xl: 'px-8 py-5 text-lg rounded-[28px]',
}

export function Button({ variant = 'primary', size = 'lg', children, className, onClick, fullWidth, disabled, type = 'button' }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.12 }}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        haptics.tap()
        onClick?.()
      }}
      className={clsx(
        'font-display font-semibold tracking-tight select-none active:brightness-95 disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
