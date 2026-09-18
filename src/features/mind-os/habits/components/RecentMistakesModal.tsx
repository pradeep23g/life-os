import { formatIndiaDate } from '../../utils/date'

type MistakeItem = {
  id: string
  habitTitle: string
  break_date: string
  reason?: string | null
}

type RecentMistakesModalProps = {
  isOpen: boolean
  onClose: () => void
  mistakes: MistakeItem[]
}

export function RecentMistakesModal({ isOpen, onClose, mistakes }: RecentMistakesModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close missed habits modal"
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-auto rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl text-text-primary">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-xl font-serif font-normal text-text-primary">Missed Habits (Last 5 Days)</h3>
            <p className="text-xs font-mono text-text-tertiary">Historical streak interruptions requiring reconciliation.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            Close
          </button>
        </div>

        {mistakes.length === 0 ? (
          <p className="py-8 text-center text-sm font-serif italic text-text-tertiary">
            No streak interruptions recorded in the past 5 days.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle/50" role="list">
            {mistakes.map((mistake) => (
              <li key={`recent-${mistake.id}`} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-serif font-medium text-text-primary">{mistake.habitTitle}</p>
                  <span className="font-mono tabular-nums text-xs text-text-tertiary">
                    {formatIndiaDate(mistake.break_date)}
                  </span>
                </div>
                <p className="text-xs font-sans text-text-secondary">
                  {mistake.reason ? `Break reason: "${mistake.reason}"` : 'No break reason recorded.'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

