import { useEffect, useState } from 'react'

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'midnight'

// In a real app this would use actual local time, but for the prototype we can simulate or use real time.
export function useEnvironmentSystem() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 9) {
        setTimeOfDay('dawn')
      } else if (hour >= 9 && hour < 17) {
        setTimeOfDay('day')
      } else if (hour >= 17 && hour < 21) {
        setTimeOfDay('dusk')
      } else {
        setTimeOfDay('midnight')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // check every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement
    root.classList.remove('theme-dawn', 'theme-dusk', 'theme-midnight', 'theme-recovery')
    
    // Recovery can be a manual override, but here we just apply time of day
    if (timeOfDay !== 'day') {
      root.classList.add(`theme-${timeOfDay}`)
    }
  }, [timeOfDay])

  return { timeOfDay }
}
