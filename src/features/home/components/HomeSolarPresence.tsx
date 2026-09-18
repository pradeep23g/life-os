import { Avatar } from '../../../components/Avatar'
import type { SolarContextInfo } from '../hooks/useHomeTelemetry'
import type { LifeState } from '../../mission-control/types/snapshot'

interface HomeSolarPresenceProps {
  solarContext: SolarContextInfo
  lifeState: LifeState
  momentumScore: number
}

export function HomeSolarPresence({
  solarContext,
  lifeState,
  momentumScore,
}: HomeSolarPresenceProps) {
  const avatarState =
    lifeState === 'Recovering'
      ? 'recovering'
      : lifeState === 'Overloaded'
      ? 'overloaded'
      : lifeState === 'Drifting'
      ? 'drifting'
      : lifeState === 'Accelerating' || lifeState === 'Building' || momentumScore > 60
      ? 'active'
      : 'idle'

  return (
    <header className="flex items-center gap-4 sm:gap-5 select-none" aria-label="Current solar and system presence">
      <div className="shrink-0 transition-transform duration-300">
        <Avatar
          size="md"
          state={avatarState}
          momentumScore={momentumScore}
          className="border-border-subtle"
        />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
          {solarContext.solarLabel}
        </span>
        <span className="font-sans text-xs text-text-tertiary truncate">
          System {lifeState} • Momentum {momentumScore}
        </span>
      </div>
    </header>
  )
}
