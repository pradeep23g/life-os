import type { WeeklyPlanItem } from '../../api/usePlanning'

interface ExecutionSprintContextProps {
  currentWeekStart: string
  focusText?: string | null
  weeklyItems: WeeklyPlanItem[]
}

const statusColors: Record<WeeklyPlanItem['status'], string> = {
  Planned: 'text-text-tertiary',
  Doing: 'text-accent-primary font-medium',
  Done: 'text-threat-healthy line-through opacity-70',
  Dropped: 'text-text-tertiary/40 line-through',
}

const priorityBadges: Record<WeeklyPlanItem['priority'], string> = {
  High: 'border-threat-critical/40 text-threat-critical bg-threat-critical/10',
  Medium: 'border-threat-warning/40 text-threat-warning bg-threat-warning/10',
  Low: 'border-border text-text-tertiary bg-surface',
}

export function ExecutionSprintContext({
  currentWeekStart,
  focusText,
  weeklyItems,
}: ExecutionSprintContextProps) {
  const activeItems = weeklyItems.filter((i) => i.status !== 'Dropped')
  const completedCount = weeklyItems.filter((i) => i.status === 'Done').length

  return (
    <section className="space-y-4 pt-8" aria-label="Active sprint context">
      {/* Hairline datum separator */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/30 pb-3">
        <div className="space-y-0.5">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Sprint Alignment • Week of {currentWeekStart}
          </p>
          <h2 className="font-sans text-lg font-semibold text-text-primary">
            Active Weekly Objectives
          </h2>
        </div>

        <div className="font-mono text-xs tabular-nums text-text-tertiary">
          <span>{completedCount} of {activeItems.length} Objectives Completed</span>
        </div>
      </div>

      {/* Declared Weekly Focus Statement */}
      {focusText ? (
        <div className="rounded border-l-2 border-accent-primary bg-surface/50 px-3 py-2">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Weekly Focus
          </p>
          <p className="mt-0.5 font-sans text-sm text-text-primary">
            {focusText}
          </p>
        </div>
      ) : null}

      {/* Weekly Plan Items Ledger */}
      {activeItems.length > 0 ? (
        <ul className="divide-y divide-border/20 border-b border-border/20 font-sans text-sm">
          {activeItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-2.5 px-1 transition-colors hover:bg-surface/30"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className={`rounded border px-1.5 py-0.2 font-mono text-[10px] uppercase tabular-nums shrink-0 ${priorityBadges[item.priority]}`}>
                  {item.priority}
                </span>
                <span className={`truncate text-sm ${item.status === 'Done' ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                  {item.title}
                </span>
              </div>

              <span className={`font-mono text-xs shrink-0 tabular-nums ${statusColors[item.status]}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-6 text-center text-text-tertiary font-mono text-xs">
          No active sprint objectives declared for this week.
        </div>
      )}
    </section>
  )
}
