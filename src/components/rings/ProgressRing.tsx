import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ProgressRingProps {
  progress: number // 0-1, can exceed 1 (clamped visually)
  size?: number
  strokeWidth?: number
  color: string // CSS color or gradient id reference
  trackColor?: string
  children?: ReactNode
  gradientStops?: [string, string] // overrides `color` with a linear gradient
}

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 12,
  color,
  trackColor = 'var(--color-surface-3)',
  children,
  gradientStops,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const gradientId = `ring-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {gradientStops && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStops[0]} />
              <stop offset="100%" stopColor={gradientStops[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientStops ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
