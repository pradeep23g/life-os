export * from '../../../lib/date'
import { getPast30DayKeys } from '../../../lib/date'


export const CLINICAL_MOOD_SCALE = [
  { value: 1, label: 'Depleted', description: 'Exhausted, low vitality' },
  { value: 2, label: 'Low', description: 'Subdued energy, friction' },
  { value: 3, label: 'Stable', description: 'Equilibrium, clear focus' },
  { value: 4, label: 'Energized', description: 'Elevated momentum' },
  { value: 5, label: 'Peak', description: 'High vitality, flow state' },
] as const

export function getMoodLabel(mood: number): string {
  const match = CLINICAL_MOOD_SCALE.find((item) => item.value === mood)
  return match ? match.label : 'Stable'
}

export function getPast7DayKeys(referenceTodayKey?: string): string[] {
  const today = referenceTodayKey ?? getTodayIndiaDateKey()
  const days: string[] = []
  for (let i = 6; i >= 0; i -= 1) {
    days.push(addDays(today, -i))
  }
  return days
}

export function getPast30DayKeys(referenceTodayKey?: string): string[] {
  const today = referenceTodayKey ?? getTodayIndiaDateKey()
  const days: string[] = []
  for (let i = 29; i >= 0; i -= 1) {
    days.push(addDays(today, -i))
  }
  return days
}

export function calculateHabit30DayConsistency(
  habitId: string,
  habitType: 'binary' | 'target',
  targetValue: number,
  logValueByHabitDate: Record<string, number>,
): number {
  const past30Days = getPast30DayKeys()
  let completedCount = 0

  for (const dayKey of past30Days) {
    const val = logValueByHabitDate[`${habitId}:${dayKey}`] ?? 0
    const isDone = habitType === 'target' ? val >= targetValue : val >= 1
    if (isDone) {
      completedCount += 1
    }
  }

  return Math.round((completedCount / 30) * 100)
}

