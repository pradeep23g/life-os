import { useMemo } from 'react'
import { useTimeAnalytics } from '../api/useTimeAnalytics'
import { TIME_BUCKET_COLORS, type TimeBucket } from '../api/useTimeLogs'

function formatHoursMins(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
}

function TimeInsights() {
  const { data, isLoading, isError } = useTimeAnalytics()

  const maxTrendMinutes = useMemo(() => {
    if (!data) return 1
    return Math.max(...data.sevenDayTrend.map((item) => item.minutes), 1)
  }, [data])

  if (isLoading) return <p className="font-mono text-xs text-text-tertiary animate-pulse">Establishing chronos telemetry...</p>
  if (isError) return <p className="font-mono text-xs text-threat-warning">Telemetry decoupled.</p>

  const totalMinutes = data?.todayTotalMinutes ?? 0

  return (
    <section className="font-mono text-xs sm:text-sm text-text-secondary w-full max-w-5xl selection:bg-primary/30 space-y-16 animate-fade-in">
      {/* Hero Metric: Massive Bucket Distribution */}
      <div>
        <div className="flex justify-between items-baseline border-b border-border-subtle pb-4 mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-text-tertiary block mb-1">HERO TELEMETRY // 24-HOUR ALLOCATION</span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-primary">Bucket Distribution</h3>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] uppercase tracking-widest text-text-tertiary block">Cumulative Epoch</span>
            <span className="text-lg sm:text-xl font-bold text-text-primary tabular-nums">{formatHoursMins(totalMinutes)}</span>
          </div>
        </div>
        
        {/* Massive Hero Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {(data?.todayDistribution ?? []).map((segment) => {
            const color = TIME_BUCKET_COLORS[segment.bucket as TimeBucket] || '#f59e0b'
            return (
              <div 
                key={segment.bucket} 
                className="bg-surface/30 border border-border-subtle p-6 flex flex-col justify-between hover:border-text-secondary/50 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
                
                <div className="flex justify-between items-start mb-6 pl-2">
                  <span className="text-xs uppercase tracking-widest font-bold" style={{ color }}>
                    {segment.bucket}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest">
                    {formatHoursMins(segment.minutes)}
                  </span>
                </div>

                <div className="pl-2">
                  <div className="text-4xl sm:text-6xl font-black text-text-primary tabular-nums tracking-tighter mb-4 group-hover:scale-105 transition-transform origin-left">
                    {Math.round(segment.percentage)}<span className="text-xl text-text-tertiary font-light">%</span>
                  </div>

                  {/* Monospace ASCII Progress Bar */}
                  <div className="text-[10px] tracking-[0.15em] text-text-tertiary overflow-hidden whitespace-nowrap">
                    <span style={{ color }}>
                      {'█'.repeat(Math.round((segment.percentage / 100) * 16))}
                    </span>
                    <span className="opacity-30">
                      {'·'.repeat(Math.max(0, 16 - Math.round((segment.percentage / 100) * 16)))}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {(!data?.todayDistribution || data.todayDistribution.length === 0) && (
            <div className="col-span-full py-12 text-center border border-dashed border-border-subtle text-text-tertiary italic">
              No active time vectors registered for today.
            </div>
          )}
        </div>
      </div>

      {/* Stark Borderless Monospace 7-Day Trend Ledger */}
      <div>
        <div className="flex justify-between items-baseline border-b border-border-subtle pb-3 mb-6">
          <span className="text-[10px] uppercase tracking-[0.3em] text-text-tertiary">Historical Delta // 7-Day Horizon</span>
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary">Peak: {formatHoursMins(maxTrendMinutes)}</span>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border-subtle/50 text-[10px] text-text-tertiary tracking-widest uppercase">
                <th className="py-2 pr-4 font-normal">EPOCH</th>
                <th className="py-2 px-4 font-normal">INTENSITY</th>
                <th className="py-2 px-4 font-normal text-right">MAGNITUDE</th>
              </tr>
            </thead>
            <tbody>
              {(data?.sevenDayTrend ?? []).map((day) => {
                const fillPercent = Math.max(0, Math.round((day.minutes / maxTrendMinutes) * 100))
                const isPeak = day.minutes === maxTrendMinutes && day.minutes > 0
                return (
                  <tr key={day.dateKey} className="border-b border-border-subtle/30 hover:bg-surface/50 transition-colors group">
                    <td className="py-3 pr-4 text-text-secondary uppercase">
                      {day.label} <span className="text-[10px] text-text-tertiary">[{day.dateKey}]</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 sm:w-48 h-1.5 bg-surface border border-border-subtle overflow-hidden">
                          <div 
                            className={`h-full transition-all ${isPeak ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]' : 'bg-text-secondary group-hover:bg-text-primary'}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-tertiary tabular-nums">{fillPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-text-primary font-bold">
                      {formatHoursMins(day.minutes)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default TimeInsights
