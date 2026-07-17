export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((v) => (v - avg) ** 2)
  return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1))
}

export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 3) return 0

  const meanX = mean(xs.slice(0, n))
  const meanY = mean(ys.slice(0, n))

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  if (denominator === 0) return 0

  return numerator / denominator
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }

  return ((current - previous) / previous) * 100
}

export function clampIntensity(value: number, max: number, levels: number = 4): number {
  if (value <= 0) return 0
  if (value >= max) return levels

  return Math.ceil((value / max) * levels)
}

export type StreakSegmentRaw = {
  start: number
  length: number
  active: boolean
}

export function streakify(booleans: boolean[]): StreakSegmentRaw[] {
  if (booleans.length === 0) return []

  const segments: StreakSegmentRaw[] = []
  let currentActive = booleans[0]
  let start = 0
  let length = 1

  for (let i = 1; i < booleans.length; i++) {
    if (booleans[i] === currentActive) {
      length++
    } else {
      segments.push({ start, length, active: currentActive })
      currentActive = booleans[i]
      start = i
      length = 1
    }
  }

  segments.push({ start, length, active: currentActive })

  return segments
}
