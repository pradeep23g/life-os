import { Avatar } from '../../../components/Avatar'
import type { LifeState } from '../../mission-control/types/snapshot'
import { useActiveArcSeason } from '../../arc'

interface ProfileHeroProps {
  lifeState: LifeState
  momentumScore: number
  momentumTrend: 'rising' | 'falling' | 'stable'
  confidence: number
  consistencyPercent: number
  activeDaysThisWeek: number
}

export function ProfileHero({
  lifeState,
  momentumScore,
  momentumTrend,
  confidence,
  consistencyPercent,
  activeDaysThisWeek,
}: ProfileHeroProps) {
  const { data: activeSeason } = useActiveArcSeason()
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

  const trendSymbol =
    momentumTrend === 'rising' ? '▲ RISING' : momentumTrend === 'falling' ? '▼ FALLING' : '— STABLE'

  return (
    <header className="space-y-10 sm:space-y-12" aria-label="Personal Dossier Chapter and Identity">
      {/* Top Identity Anchor with Living Emblem */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-6 sm:gap-8">
        <div className="space-y-3 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Personal Dossier • {activeSeason?.title ?? 'Arc'}
          </p>
          <h1 className="font-serif font-light text-4xl sm:text-6xl md:text-7xl text-text-primary tracking-tight leading-[1.08] text-balance">
            Chapter: <br className="hidden sm:block" />
            <span className="italic font-light">{lifeState}</span>
          </h1>
          <p className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed pt-1 text-balance">
            The immutable biographical record of personal velocity, daily cadence, and long-horizon discipline.
          </p>
        </div>

        {/* Prominent Living Geometric Avatar */}
        <div className="self-start sm:self-auto shrink-0">
          <Avatar
            size="lg"
            state={avatarState}
            momentumScore={momentumScore}
            className="border-border-subtle bg-surface"
          />
        </div>
      </div>

      {/* Primary Telemetry Anchor: Tabular Numerals, Clean Hairline Boundaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 border-t border-border-subtle pt-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
            Momentum Velocity
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl tabular-nums font-light text-text-primary">
              {Math.round(momentumScore)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              {trendSymbol}
            </span>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
            7-Day Consistency
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl sm:text-4xl tabular-nums font-light text-text-primary">
              {consistencyPercent}
            </span>
            <span className="font-mono text-sm text-text-tertiary">%</span>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
            Active Days
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl sm:text-4xl tabular-nums font-light text-text-primary">
              {activeDaysThisWeek}
            </span>
            <span className="font-mono text-sm text-text-tertiary">/ 7</span>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
            Telemetry Confidence
          </p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl sm:text-4xl tabular-nums font-light text-text-primary">
              {Math.round(confidence)}
            </span>
            <span className="font-mono text-sm text-text-tertiary">%</span>
          </div>
        </div>
      </div>
    </header>
  )
}
