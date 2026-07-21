import { useDataLabStore } from '../../store/useDataLabStore'
import type { AnalyticsPeriod } from '../../types/types'

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
]

function PeriodSelector() {
  const period = useDataLabStore((s) => s.period)
  const setPeriod = useDataLabStore((s) => s.setPeriod)

  return (
    <div className="flex items-center border border-border bg-black" role="radiogroup" aria-label="Analytics period">
      {PERIODS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={period === option.value}
          onClick={() => setPeriod(option.value)}
          className={`px-3 py-1.5 text-xs font-mono transition-colors ${
            period === option.value
              ? 'bg-[#222222] text-slate-100'
              : 'text-slate-500 hover:text-slate-300 hover:bg-[#111111]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default PeriodSelector
