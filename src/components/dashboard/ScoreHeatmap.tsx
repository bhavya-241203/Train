import type { DailyCheckIn } from '../../db/types'
import { addDays, todayStr } from '../../lib/date'
import { scoreToSolidColor } from '../../lib/colorScale'

const DAYS = 35

export function ScoreHeatmap({ checkIns }: { checkIns: DailyCheckIn[] }) {
  const byDate = new Map(checkIns.map((c) => [c.date, c]))
  const today = todayStr()
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -(DAYS - 1 - i)))

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const c = byDate.get(d)
        return (
          <div
            key={d}
            title={`${d}${c ? `: ${c.score}` : ''}`}
            className="aspect-square rounded-md"
            style={{ backgroundColor: c ? scoreToSolidColor(c.score) : 'var(--color-surface-3)' }}
          />
        )
      })}
    </div>
  )
}
