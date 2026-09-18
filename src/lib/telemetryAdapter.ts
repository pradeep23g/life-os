export interface AvatarTelemetry {
  momentumScore: number // 0-100
  solarPhase: 'dawn' | 'zenith' | 'dusk' | 'midnight'
  activeSeason: string | null
  lifeState: 'idle' | 'active' | 'recovering' | 'drifting' | 'overloaded'
}

/**
 * Telemetry adapter for the Avatar component.
 * In the future, this will connect to the real telemetry pipeline (e.g., Supabase Realtime).
 * For now, it returns deterministic mock data based on the current time and local state.
 */
export function useAvatarTelemetry(
  overrideState?: 'idle' | 'active' | 'recovering' | 'drifting' | 'overloaded',
  overrideMomentum?: number
): AvatarTelemetry {
  // Deterministic solar phase based on current time (aligned with useEnvironmentSystem)
  const hour = new Date().getHours()
  let phase: AvatarTelemetry['solarPhase'] = 'midnight'
  if (hour >= 5 && hour < 9) phase = 'dawn'
  else if (hour >= 9 && hour < 17) phase = 'zenith'
  else if (hour >= 17 && hour < 21) phase = 'dusk'

  return {
    momentumScore: typeof overrideMomentum === 'number' ? Math.max(0, Math.min(100, overrideMomentum)) : 0,
    solarPhase: phase,
    activeSeason: 'WINTER_ARC',
    lifeState: overrideState || 'idle',
  }
}
