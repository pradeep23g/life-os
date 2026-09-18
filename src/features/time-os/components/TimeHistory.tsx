import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { useTimeHistoryLogs, type CompletedTimeLog } from '../api/useTimeLogs'

// Calculates current streak based on any log per day
function calculateStreak(logs: CompletedTimeLog[]) {
  if (!logs || logs.length === 0) return 0
  
  const dates = [...new Set(logs.map(log => new Date(log.start_time).toLocaleDateString('en-CA')))].sort((a, b) => b.localeCompare(a))
  
  const today = new Date().toLocaleDateString('en-CA')
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toLocaleDateString('en-CA')

  if (!dates.includes(today) && !dates.includes(yesterday)) return 0

  let streak = 0
  const currentCheck = dates.includes(today) ? new Date() : yesterdayDate

  for (let i = 0; i < 365; i++) {
    const checkStr = currentCheck.toLocaleDateString('en-CA')
    if (dates.includes(checkStr)) {
      streak++
      currentCheck.setDate(currentCheck.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function getAmbientColor() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return '#f59e0b' // Morning: Amber
  if (hour >= 12 && hour < 17) return '#38bdf8' // Afternoon: Electric Cyan
  if (hour >= 17 && hour < 21) return '#f43f5e' // Evening: Blood/Rose
  return '#a855f7' // Night: Cosmic Alien Purple
}

export function TimeHistory() {
  const { data: completedLogs = [], isLoading } = useTimeHistoryLogs()
  const [ambientColor, setAmbientColor] = useState(getAmbientColor())

  useEffect(() => {
    const interval = setInterval(() => setAmbientColor(getAmbientColor()), 60000)
    return () => clearInterval(interval)
  }, [])

  const streak = useMemo(() => calculateStreak(completedLogs), [completedLogs])
  
  // Prepare heatmap data (last 12 weeks = 84 days)
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    completedLogs.forEach(log => {
      const d = new Date(log.start_time).toLocaleDateString('en-CA')
      map.set(d, (map.get(d) || 0) + (log.duration_minutes || 0))
    })

    const days = []
    const start = new Date()
    start.setDate(start.getDate() - 83) // 12 weeks * 7 days = 84 days including today
    for (let i = 0; i < 84; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dStr = d.toLocaleDateString('en-CA')
      days.push({ date: dStr, minutes: map.get(dStr) || 0 })
    }
    return days
  }, [completedLogs])

  // Max depth capped at 8 (needs ~25+ streak to max out)
  const treeDepth = Math.min(Math.max(Math.floor(streak / 3) + 2, 2), 8)

  // Recursive tree generation based on streak (deterministic harmonic sway for render purity)
  const rootsElements = useMemo(() => {
    const generateRoots = (x: number, y: number, length: number, angle: number, depth: number): ReactNode[] => {
      if (depth === 0) return []
      const x2 = x + length * Math.sin(angle)
      const y2 = y - length * Math.cos(angle)
      
      // Deterministic organic sway based on coordinate harmonics
      const sway = Math.sin(x * 0.05 + y * 0.03 + depth) * 0.1
      
      return [
        <line key={`${x.toFixed(1)}-${y.toFixed(1)}-${depth}-${angle.toFixed(2)}`} x1={x} y1={y} x2={x2} y2={y2} stroke="currentColor" strokeWidth={depth * 0.4} strokeLinecap="round" className="transition-all duration-1000 ease-out animate-fade-in" />,
        ...generateRoots(x2, y2, length * 0.75, angle - 0.4 + sway, depth - 1),
        ...generateRoots(x2, y2, length * 0.75, angle + 0.4 + sway, depth - 1)
      ]
    }
    return generateRoots(200, 380, 80, 0, treeDepth)
  }, [treeDepth])

  if (isLoading) return <div className="animate-pulse text-xs text-text-tertiary">Accessing temporal archives...</div>

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-16 animate-fade-in">
      
      {/* Bioluminescent Root Visualizer */}
      <div className="relative w-full max-w-lg flex flex-col items-center">
        <div className="absolute inset-0 blur-[100px] opacity-10 rounded-full" style={{ backgroundColor: ambientColor }} />
        
        <h3 className="text-[10px] uppercase tracking-[0.3em] text-text-tertiary mb-2">Chronos Cultivation</h3>
        <div className="text-4xl sm:text-5xl tabular-nums font-mono font-black mb-8" style={{ color: ambientColor, textShadow: `0 0 20px ${ambientColor}80` }}>
          {streak} <span className="text-sm font-light text-text-secondary">DAY STREAK</span>
        </div>

        <svg viewBox="0 0 400 400" className="w-full h-80 overflow-visible" style={{ color: ambientColor, filter: `drop-shadow(0 0 8px ${ambientColor}60)` }}>
          {rootsElements}
          <circle cx="200" cy="380" r="4" fill="currentColor" />
        </svg>
      </div>

      {/* Dense GitHub-style Heatmap Grid */}
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-text-tertiary">Temporal Density Grid [12W]</h3>
          <div className="flex items-center gap-2 text-[9px] font-mono text-text-tertiary uppercase">
            <span>Low</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ambientColor, opacity: 0.2 }} />
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ambientColor, opacity: 0.5 }} />
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ambientColor, opacity: 0.8 }} />
              <div className="w-2.5 h-2.5 rounded-sm shadow-[0_0_8px] ring-1 ring-white/60" style={{ backgroundColor: ambientColor, opacity: 1 }} />
            </div>
            <span>8H+ Max</span>
          </div>
        </div>
        
        <div className="flex justify-center gap-1.5 p-4 bg-surface/20 border border-border-subtle overflow-x-auto">
          {/* Group into 12 weekly columns */}
          {Array.from({ length: 12 }).map((_, weekIndex) => (
            <div key={`week-${weekIndex}`} className="flex flex-col gap-1.5 shrink-0">
              {heatmapData.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day) => {
                let opacity = 0.05
                let isMax = false

                if (day.minutes > 0) opacity = 0.25
                if (day.minutes >= 60) opacity = 0.5
                if (day.minutes >= 180) opacity = 0.75
                if (day.minutes >= 300) opacity = 0.95
                if (day.minutes >= 480) {
                  opacity = 1.0
                  isMax = true
                }

                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.minutes} mins (Intensity ${isMax ? 'MAX' : Math.round(opacity * 100) + '%'})`}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border border-black/20 transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer ${
                      isMax ? 'ring-1 ring-white/80 animate-pulse' : ''
                    }`}
                    style={{ 
                      backgroundColor: ambientColor, 
                      opacity,
                      boxShadow: isMax 
                        ? `0 0 16px ${ambientColor}, 0 0 4px #ffffff` 
                        : opacity > 0.5 
                        ? `0 0 8px ${ambientColor}60` 
                        : 'none'
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  )
}
