import { useState, useMemo } from 'react'
import { useDataLabDailyActivity } from '../api/useDataLab'
import { DataLabIcon } from '../../../components/icons'
import { LoadingView } from '../../../components/LoadingView'

export default function DataLabPage() {
  const { data: dailyActivity = [], isLoading, isError } = useDataLabDailyActivity()
  
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const timeline30 = useMemo(() => {
    return [...dailyActivity].slice(0, 30).reverse()
  }, [dailyActivity])

  if (isLoading) {
    return (
      <LoadingView
        variant="page"
        label="Calibrating Data Lab"
        sublabel="Aggregating 30-day activity telemetry..."
      />
    )
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-threat-critical font-mono text-sm">
        Failed to load Data Lab telemetry.
      </div>
    )
  }

  return (
    <section className="space-y-16 pb-28 sm:pb-24 pt-12 max-w-6xl mx-auto px-4">
      <header className="flex flex-col items-start gap-4 border-b border-border-subtle pb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-surface border border-border/80 text-text-primary shadow-sm">
              <DataLabIcon className="h-4 w-4" />
            </div>
            <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase">Life OS • Observatory</p>
          </div>
          <h1 className="text-4xl font-serif font-normal tracking-tight text-text-primary">Data Lab (30-Day Canvas)</h1>
        </div>
      </header>

      {/* Spatial Horizontal Timeline */}
      <div className="relative overflow-x-auto pb-12 hide-scrollbar">
        <div className="min-w-[800px] flex flex-col gap-12">
          
          {/* Axis Labels */}
          <div className="flex justify-between border-b border-border-subtle pb-4">
            <div className="w-32 shrink-0"></div>
            <div className="flex-1 flex justify-between">
              {timeline30.map(d => (
                <div key={d.activity_date} className="flex-1 text-center">
                  <span className={`text-[10px] font-mono tracking-widest transition-colors ${hoveredDate === d.activity_date ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {new Date(d.activity_date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Time: Deep Work Layer */}
          <div className="flex justify-between relative group">
            <div className="w-32 shrink-0 text-xs font-mono uppercase tracking-widest text-text-secondary pt-2">
              Deep Work
            </div>
            <div className="flex-1 flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-subtle/50 -z-10" />
              {timeline30.map(d => (
                <div 
                  key={d.activity_date} 
                  className="flex-1 flex justify-center items-center"
                  onMouseEnter={() => setHoveredDate(d.activity_date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${d.deep_work_minutes > 0 ? 'bg-accent-primary ' : 'bg-surface border border-border-subtle'} ${hoveredDate === d.activity_date ? 'scale-150 ring-2 ring-accent-primary/20' : ''}`}
                    title={`${d.deep_work_minutes} mins`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Habits Layer */}
          <div className="flex justify-between relative group">
            <div className="w-32 shrink-0 text-xs font-mono uppercase tracking-widest text-text-secondary pt-2">
              Habits Met
            </div>
            <div className="flex-1 flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-subtle/50 -z-10" />
              {timeline30.map(d => (
                <div 
                  key={d.activity_date} 
                  className="flex-1 flex justify-center items-center"
                  onMouseEnter={() => setHoveredDate(d.activity_date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <span className={`text-xs font-mono transition-colors ${hoveredDate === d.activity_date ? 'text-text-primary font-bold' : 'text-text-tertiary'}`}>
                    {d.habits_completed}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mind: Mood Layer */}
          <div className="flex justify-between relative group">
            <div className="w-32 shrink-0 text-xs font-mono uppercase tracking-widest text-text-secondary pt-2">
              Mood Index
            </div>
            <div className="flex-1 flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-subtle/50 -z-10" />
              {timeline30.map(d => (
                <div 
                  key={d.activity_date} 
                  className="flex-1 flex justify-center items-center"
                  onMouseEnter={() => setHoveredDate(d.activity_date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <span className={`text-xs font-mono transition-colors ${d.avg_mood > 0 ? 'text-accent-secondary' : 'text-text-tertiary/50'} ${hoveredDate === d.activity_date ? 'scale-110 font-bold' : ''}`}>
                    {d.avg_mood > 0 ? d.avg_mood.toFixed(1) : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical: Workouts Layer */}
          <div className="flex justify-between relative group">
            <div className="w-32 shrink-0 text-xs font-mono uppercase tracking-widest text-text-secondary pt-2">
              Kinetic
            </div>
            <div className="flex-1 flex justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border-subtle/50 -z-10" />
              {timeline30.map(d => (
                <div 
                  key={d.activity_date} 
                  className="flex-1 flex justify-center items-center"
                  onMouseEnter={() => setHoveredDate(d.activity_date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <div 
                    className={`w-1.5 h-6 rounded-sm transition-all duration-300 ${d.workouts_logged > 0 ? 'bg-threat-healthy' : 'bg-surface border border-border-subtle'}`}
                    title={`${d.workouts_logged} workouts`}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
