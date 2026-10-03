import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { Card } from '../../components/ui/Card'
import { RunIcon, PlayIcon } from '../../components/ui/Icons'
import { formatClock, formatDisplayDate, formatPace } from '../../lib/date'

export default function RunHome() {
  const navigate = useNavigate()
  const recentRuns = useLiveQuery(() => db.runs.orderBy('date').reverse().limit(5).toArray(), []) ?? []

  return (
    <div className="px-5 pt-6 safe-top flex flex-col min-h-screen">
      <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">Run</h1>
      <p className="text-sm text-[var(--color-ink-dim)] mb-8">Live GPS tracking, auto-saved to today's plan.</p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={() => navigate('/run/active')}
          className="w-44 h-44 rounded-full bg-gradient-to-br from-[var(--color-run)] to-[var(--color-brand-start)] flex flex-col items-center justify-center shadow-2xl shadow-sky-900/40 active:scale-95 transition-transform"
        >
          <PlayIcon width={40} height={40} className="text-white mb-1" />
          <span className="font-display font-bold text-white text-lg">Start Run</span>
        </button>

        <button className="mt-8 text-sm text-[var(--color-ink-dim)] underline" onClick={() => navigate('/run/manual')}>
          No GPS signal? Log a treadmill run manually
        </button>
      </div>

      {recentRuns.length > 0 && (
        <div className="pb-6">
          <p className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Recent runs</p>
          <div className="space-y-2">
            {recentRuns.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-full bg-[var(--color-run-dim)] flex items-center justify-center text-[var(--color-run)]">
                  <RunIcon width={18} height={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-ink)]">{(r.distanceM / 1000).toFixed(2)} km</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{formatDisplayDate(r.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--color-ink-dim)]">{formatClock(r.durationS)}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{formatPace(r.avgPaceSecPerKm)}/km</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
