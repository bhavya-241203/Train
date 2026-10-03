import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { ChartIcon, HomeIcon, NutritionIcon, RunIcon, TrophyIcon } from '../ui/Icons'

const tabs = [
  { to: '/', label: 'Plan', icon: HomeIcon },
  { to: '/run', label: 'Run', icon: RunIcon },
  { to: '/nutrition', label: 'Food', icon: NutritionIcon },
  { to: '/dashboard', label: 'Progress', icon: ChartIcon },
  { to: '/badges', label: 'Badges', icon: TrophyIcon },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)]">
      <div className="flex items-stretch justify-between max-w-md mx-auto px-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-faint)]',
              )
            }
          >
            <Icon width={22} height={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
