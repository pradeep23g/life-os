import { useDataLabStore } from '../store/useDataLabStore'
import OverviewTab from './OverviewTab'
import BehaviorTab from './BehaviorTab'
import TelemetryTab from './TelemetryTab'
import PeriodSelector from '../components/shared/PeriodSelector'

function DataLabPage() {
  const activeTab = useDataLabStore((s) => s.activeTab)
  const setActiveTab = useDataLabStore((s) => s.setActiveTab)

  return (
    <section className="space-y-6 bg-black pb-24 px-4 sm:px-6 lg:px-8 pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Life OS</p>
          <h1 className="text-2xl font-semibold text-slate-100">Data Lab</h1>
          <p className="mt-1 text-xs text-slate-400">Read-only behavioral analytics. Discovery over reporting.</p>
        </div>
        <PeriodSelector />
      </header>

      {/* Tab navigation */}
      <nav className="flex gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`relative shrink-0 rounded-md px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border ${
            activeTab === 'overview'
              ? 'bg-[#111111] text-slate-200 border-slate-500'
              : 'bg-black text-slate-500 border-border hover:text-slate-300'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('behavior')}
          className={`relative shrink-0 rounded-md px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border ${
            activeTab === 'behavior'
              ? 'bg-[#111111] text-slate-200 border-slate-500'
              : 'bg-black text-slate-500 border-border hover:text-slate-300'
          }`}
        >
          Behavior
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`relative shrink-0 rounded-md px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border ${
            activeTab === 'telemetry'
              ? 'bg-[#111111] text-slate-200 border-slate-500'
              : 'bg-black text-slate-500 border-border hover:text-slate-300'
          }`}
        >
          Telemetry
        </button>
      </nav>

      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'behavior' && <BehaviorTab />}
        {activeTab === 'telemetry' && <TelemetryTab />}
      </div>
    </section>
  )
}

export default DataLabPage
