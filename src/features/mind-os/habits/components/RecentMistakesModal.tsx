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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/85"
        aria-label="Close missed habits modal"
      />

      <article className="relative z-10 max-h-[85vh] w-[96vw] max-w-3xl overflow-auto rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Missed Habits (Last 5 Days)</h3>
            <p className="text-xs text-slate-400">Full list of streak losses recorded in the past 5 days.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#333333] px-2 py-1 text-sm text-slate-100 hover:bg-[#222222]"
          >
            Close
          </button>
        </div>

        {mistakes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No missed habits in the last 5 days.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mistakes.map((mistake) => (
              <li key={`recent-${mistake.id}`} className="rounded-md border border-border bg-[#111111] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{mistake.habitTitle}</p>
                  <span className="text-xs text-slate-400">{formatIndiaDate(mistake.break_date)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{mistake.reason || 'No reason added.'}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  )
}
