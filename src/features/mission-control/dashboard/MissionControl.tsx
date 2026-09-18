import { useMissionControlSnapshot } from '../api/useMissionControlSnapshot'
import BrainEngineHero from '../../system/components/BrainEngineHero'
import EndOfDayCard from '../components/EndOfDayCard'
import { toIndiaDateKey } from '../../../lib/events'
import { Avatar } from '../../../components/Avatar'
import { Activity, Clock, Target } from 'lucide-react'
import { LoadingView } from '../../../components/LoadingView'

function MissionControl() {
  const { isLoading, isError, snapshotDate, brain, systems, metrics, recentEvents } = useMissionControlSnapshot()

  if (isLoading) {
    return (
      <LoadingView
        variant="page"
        label="Initializing Mission Control"
        sublabel="Calibrating telemetry and subsystem snapshots..."
      />
    )
  }

 if (isError) {
 return (
 <section className="rounded-xl border border-border bg-surface p-4">
 <p className="text-sm font-semibold text-threat-critical">Failed to load system snapshot.</p>
 </section>
 )
 }

 const todayDateKey = toIndiaDateKey(new Date())
 const displayDate = snapshotDate ?? todayDateKey

 const getLifeStateColor = (state: string) => {
 switch (state) {
 case 'Accelerating': return 'text-accent-primary bg-accent-primary/10 border-accent-primary/20'
 case 'Building': return 'text-accent-primary bg-accent-primary/5 border-accent-primary/10'
 case 'Recovering': return 'text-threat-warning bg-threat-warning/10 border-threat-warning/20'
 case 'Drifting': return 'text-text-secondary bg-surface/50 border-border'
 case 'Overloaded': return 'text-threat-critical bg-threat-critical/10 border-threat-critical/20'
 default: return 'text-text-secondary bg-surface border-border'
 }
 }

 const avatarState =
   brain.lifeState === 'Recovering'
     ? 'recovering'
     : brain.lifeState === 'Overloaded'
     ? 'overloaded'
     : brain.lifeState === 'Drifting'
     ? 'drifting'
     : brain.lifeState === 'Accelerating' || brain.lifeState === 'Building' || brain.momentumScore > 60
     ? 'active'
     : 'idle'

 return (
 <section className="space-y-6 sm:space-y-8 bg-background pb-28 sm:pb-24">
 {/* Identity & Context Header */}
 <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border">
 <div className="flex items-center gap-5">
 <Avatar 
 size="lg" 
 state={avatarState} 
 momentumScore={brain.momentumScore}
 className="shrink-0"
 />
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Agent</h1>
 <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${getLifeStateColor(brain.lifeState)}`}>
 {brain.lifeState}
 </span>
 </div>
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary font-mono">
 <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {displayDate}</span>
 <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Winter Arc</span>
 </div>
 </div>
 </div>
 </header>

 {/* Brain Engine Hero (Mission focus) */}
 <BrainEngineHero brain={brain} />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Key Metrics */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Vitals</h3>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {metrics.map((stat) => (
 <div key={stat.id} className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-elevated">
 <p className="text-xs text-text-tertiary mb-2">{stat.label}</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl font-medium text-text-primary">{stat.value}</p>
 {stat.trendDirection === 'up' && <span className="text-accent-primary text-xs">↑</span>}
 {stat.trendDirection === 'down' && <span className="text-threat-warning text-xs">↓</span>}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Subsystems Status */}
 <div>
 <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Subsystems</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {systems.map((sys) => (
 <div key={sys.id} className="rounded-xl border border-border bg-surface p-3 flex flex-col gap-2 transition-colors hover:bg-elevated">
 <div className="flex items-center gap-2">
 <span
 className={`h-2 w-2 shrink-0 rounded-full ${
 sys.status === 'Healthy'
 ? 'bg-threat-healthy'
 : sys.status === 'Needs Input'
 ? 'bg-blue-500'
 : sys.status === 'Warning'
 ? 'bg-threat-warning'
 : 'bg-threat-critical'
 }`}
 />
 <p className="text-xs font-medium text-text-primary truncate">{sys.name}</p>
 </div>
 <p className="truncate text-xs text-text-tertiary">{sys.activity}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right Sidebar: Context & Activity */}
 <div className="space-y-6">
 <div>
 <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Recent Protocol</h3>
 <div className="rounded-xl border border-border bg-surface p-4">
 {recentEvents.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-6 text-center text-text-tertiary">
 <Activity className="w-6 h-6 mb-2 opacity-50" />
 <p className="text-xs">No recent activity detected.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {recentEvents.map((evt) => (
 <div key={evt.id} className="flex flex-col gap-1">
 <div className="flex items-center justify-between gap-3 text-xs">
 <span className="font-medium text-text-secondary truncate">{evt.description}</span>
 <span className="font-mono text-[10px] text-text-tertiary shrink-0">
 {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{evt.domain}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="border-t border-border pt-8 mt-12">
 <div className="mb-4">
 <h2 className="text-sm font-semibold text-text-primary">End of Day Sequence</h2>
 <p className="text-xs text-text-tertiary">Conclude today and prepare the system for tomorrow.</p>
 </div>
 <EndOfDayCard />
 </div>
 </section>
 )
}

export default MissionControl
