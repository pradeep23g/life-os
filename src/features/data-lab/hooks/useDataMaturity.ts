import { useMemo } from 'react'

import { useDataLabDailyActivity } from '../api/useDataLab'
import type { DataMaturityLevel } from '../types/types'

export function useDataMaturity(): {
  level: DataMaturityLevel
  totalDays: number
  daysUntilStable: number
} {
  const { data = [] } = useDataLabDailyActivity()

  return useMemo(() => {
    const activeDays = data.filter((row) => row.active_system_count > 0).length

    let level: DataMaturityLevel = 'insufficient'
    if (activeDays >= 90) level = 'stable'
    else if (activeDays >= 30) level = 'experimental'

    return {
      level,
      totalDays: activeDays,
      daysUntilStable: Math.max(0, 90 - activeDays),
    }
  }, [data])
}
