import { useNavigate } from 'react-router-dom'
import type { BrainState, ThreatSeverity } from '../../mission-control/types/snapshot'
import DailyBriefing from './DailyBriefing'
import { Brain, Clock, Zap } from 'lucide-react'

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
 return 'border-l-border'
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
      <div className="rounded-xl border border-border-subtle bg-background overflow-hidden flex flex-col md:flex-row">
        
        {/* Main Panel (Mission & Reasoning) */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <div>
            <header className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-sm text-text-secondary font-medium">Brain Engine</h1>
                <p className="text-[11px] text-text-tertiary mt-0.5">Operational command center</p>
              </div>
            </header>

            {brain.mission ? (
              <div className="max-w-2xl">
                <p className="text-[11px] text-accent-primary font-medium mb-1.5 uppercase tracking-wide">Primary Mission</p>
                <h2 className="text-2xl font-medium text-text-primary leading-tight mb-2">{brain.mission.mission}</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">{brain.mission.reason}</p>
                
                <div className="flex flex-wrap items-center gap-3 text-xs mb-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-secondary">
                    <span className="text-text-tertiary"><Clock className="h-4 w-4" /></span> {brain.mission.estimatedTime}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-accent-primary">
                    <span className="text-accent-primary"><Zap className="h-4 w-4 fill-current" /></span> {brain.mission.expectedMomentumGain}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-text-secondary">
                    <span className="text-text-tertiary"><Brain className="h-4 w-4" /></span> {brain.mission.recommendationSource}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-text-tertiary text-sm mb-8">No immediate mission identified.</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t border-border-subtle">
            <div className="flex-1">
              {brain.reasoning.length > 0 && (
                <div>
                  <div className="text-[10px] text-text-tertiary mb-2 uppercase tracking-wide flex justify-between max-w-sm">
                    <span>Analysis</span>
                    <span>{brain.confidence}% Confidence</span>
                  </div>
                  <ul className="space-y-1 text-[13px] text-text-secondary max-w-sm">
                    {brain.reasoning.map((reason, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="text-text-tertiary mt-0.5">•</span> 
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
                className="shrink-0 inline-flex items-center justify-center rounded-lg bg-accent-primary/15 border border-accent-primary/30 px-8 py-3 text-sm font-medium text-accent-primary hover:bg-accent-primary/25 transition-all"
              >
                Continue Mission
              </button>
            )}
          </div>
        </div>

        {/* Side Panel (Momentum & Daily Briefing) */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border-subtle bg-surface flex flex-col">
          <div className="p-6 md:p-8 flex-1">
            <div className="text-[11px] text-text-tertiary mb-1">Momentum</div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-light text-text-primary">{brain.momentumScore}</span>
              <span className={`text-sm ${brain.momentumTrend === 'rising' ? 'text-accent-primary' : brain.momentumTrend === 'falling' ? 'text-threat-critical' : 'text-text-tertiary'}`}>
                {brain.momentumTrend === 'rising' ? '↗' : brain.momentumTrend === 'falling' ? '↘' : '→'}
              </span>
            </div>
            
            {brain.sparkline.length > 0 ? (
              <div className="flex items-end gap-[2px] h-6 opacity-60 mb-8" title="14-Day Historical Momentum Trend (EMA)">
                {brain.sparkline.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent-primary rounded-t-[1px]"
                    style={{ height: `${Math.max(6, Math.min(100, val))}%` }}
                    title={`Day ${i + 1}: ${val} EMA`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center h-6 mb-8 opacity-40" title="Insufficient history for momentum trend">
                <div className="w-full h-px bg-border-subtle" />
              </div>
            )}

            <div className="pt-6 border-t border-border-subtle">
              <div className="text-[11px] text-text-tertiary mb-3">Daily Briefing</div>
              <div className="scale-95 origin-left">
                <DailyBriefing momentum={brain.momentumScore} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Areas & Friction */}
      <div>
        <h3 className="text-xs font-medium text-text-secondary mb-3">System Attention Areas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {brain.threats.map((threat) => (
            <div key={threat.id} className={`rounded-lg border border-border-subtle border-l-2 bg-background p-4 flex flex-col justify-between ${getThreatLeftBorder(threat.severity)}`}>
              <div className="text-[10px] font-medium text-text-tertiary mb-2 flex items-center gap-1.5 capitalize">
                <span className={`w-1.5 h-1.5 rounded-full ${getThreatDotColor(threat.severity)}`} />
                {threat.severity}
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary mb-0.5">{threat.label}</div>
                <div className="text-[11px] text-text-tertiary">{threat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

 </section>
 )
}
