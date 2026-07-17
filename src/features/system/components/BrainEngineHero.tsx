import { useNavigate } from 'react-router-dom'
import type { BrainState, ThreatSeverity } from '../../mission-control/types/snapshot'
import DailyBriefing from './DailyBriefing'

interface BrainEngineHeroProps {
  brain: BrainState
}

function getThreatLeftBorder(severity: ThreatSeverity): string {
  switch (severity) {
    case 'critical':
      return 'border-l-rose-500/70'
    case 'warning':
      return 'border-l-amber-500/70'
    case 'healthy':
      return 'border-l-emerald-500/70'
    default:
      return 'border-l-[#333333]'
  }
}

function getThreatDotColor(severity: ThreatSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-rose-500/80'
    case 'warning':
      return 'bg-amber-500/80'
    case 'healthy':
      return 'bg-emerald-500/80'
    default:
      return 'bg-slate-500/80'
  }
}

export default function BrainEngineHero({ brain }: BrainEngineHeroProps) {
  const navigate = useNavigate()

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[#1a1a1a] bg-black overflow-hidden flex flex-col md:flex-row">
        
        {/* Main Panel (Mission & Reasoning) */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <div>
            <header className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-sm text-slate-500 font-medium">Brain Engine</h1>
                <p className="text-[11px] text-slate-600 mt-0.5">Operational command center</p>
              </div>
            </header>

            {brain.mission ? (
              <div className="max-w-2xl">
                <p className="text-[11px] text-emerald-500/80 font-medium mb-1.5 uppercase tracking-wide">Primary Mission</p>
                <h2 className="text-2xl font-medium text-slate-100 leading-tight mb-2">{brain.mission.mission}</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{brain.mission.reason}</p>
                
                <div className="flex flex-wrap items-center gap-3 text-xs mb-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-slate-300">
                    <span className="text-slate-500">🕒</span> {brain.mission.estimatedTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-emerald-400">
                    <span className="text-emerald-500/70">⚡</span> {brain.mission.expectedMomentumGain}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1.5 text-slate-400">
                    <span className="text-slate-500">🧠</span> {brain.mission.recommendationSource}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm mb-8">No immediate mission identified.</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t border-[#111111]">
            <div className="flex-1">
              {brain.reasoning.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-600 mb-2 uppercase tracking-wide flex justify-between max-w-sm">
                    <span>Analysis</span>
                    <span>{brain.confidence}% Confidence</span>
                  </div>
                  <ul className="space-y-1 text-[13px] text-slate-400 max-w-sm">
                    {brain.reasoning.map((reason, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-slate-700 mt-0.5">•</span> 
                        <span className="leading-snug">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {brain.mission && (
              <button
                type="button"
                onClick={() => navigate(brain.mission!.actionRoute)}
                className="shrink-0 inline-flex items-center justify-center rounded-lg bg-emerald-900/20 border border-emerald-500/20 px-8 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
              >
                Continue Mission →
              </button>
            )}
          </div>
        </div>

        {/* Side Panel (Momentum & Daily Briefing) */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#1a1a1a] bg-[#030303] flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            <div className="text-[11px] text-slate-500 mb-1">Momentum</div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-light text-slate-100">{brain.momentumScore}</span>
              <span className={`text-sm ${brain.momentumTrend === 'rising' ? 'text-emerald-500/80' : brain.momentumTrend === 'falling' ? 'text-rose-500/80' : 'text-slate-500'}`}>
                {brain.momentumTrend === 'rising' ? '↗' : brain.momentumTrend === 'falling' ? '↘' : '→'}
              </span>
            </div>
            
            <div className="flex items-end gap-[2px] h-6 opacity-40 mb-8">
              {brain.sparkline.map((val, i) => (
                <div key={i} className="flex-1 bg-emerald-500 rounded-t-[1px]" style={{ height: `${Math.max(15, (val / 100) * 100)}%` }} />
              ))}
            </div>

            <div className="pt-6 border-t border-[#111111]">
              <div className="text-[11px] text-slate-500 mb-3">Daily Briefing</div>
              <div className="scale-95 origin-left">
                <DailyBriefing momentum={brain.momentumScore} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Assessment */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 mb-3">System Threats</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {brain.threats.map((threat) => (
            <div key={threat.id} className={`rounded-lg border border-[#1a1a1a] border-l-2 bg-black p-4 flex flex-col justify-between ${getThreatLeftBorder(threat.severity)}`}>
              <div className="text-[10px] font-medium text-slate-500 mb-2 flex items-center gap-1.5 capitalize">
                <span className={`w-1.5 h-1.5 rounded-full ${getThreatDotColor(threat.severity)}`} />
                {threat.severity}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200 mb-0.5">{threat.label}</div>
                <div className="text-[11px] text-slate-500">{threat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
