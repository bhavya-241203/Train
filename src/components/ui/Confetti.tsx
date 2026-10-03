import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useUiStore } from '../../state/uiStore'

const COLORS = ['#8b5cf6', '#ec4899', '#34d399', '#fbbf24', '#38bdf8', '#fb7a3c']

export function Confetti() {
  const burstId = useUiStore((s) => s.confettiBurstId)

  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.6 + Math.random() * 0.8,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 120,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstId],
  )

  if (burstId === 0) return null

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" key={burstId}>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: '-5%', left: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ top: '105%', left: `calc(${p.x}% + ${p.drift}px)`, opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}
