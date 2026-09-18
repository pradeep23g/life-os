import { useAvatarTelemetry } from '../lib/telemetryAdapter'
import { useAuth } from '../lib/AuthContext'

export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
  state?: 'idle' | 'active' | 'recovering' | 'drifting' | 'overloaded'
  momentumScore?: number
}

export function Avatar({ size = 'md', className = '', state, momentumScore }: AvatarProps) {
  const telemetry = useAvatarTelemetry(state, momentumScore)
  const { user } = useAuth()

  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    hero: 'w-48 h-48 sm:w-64 sm:h-64',
  }

  const dimensionClass = sizeMap[size]
  const isHighMomentum = telemetry.momentumScore > 75
  const isSmall = size === 'sm'

  // Dynamic theme-aware color channels
  const accentClass =
    telemetry.lifeState === 'recovering'
      ? 'text-threat-warning'
      : telemetry.lifeState === 'active'
      ? 'text-accent-primary'
      : telemetry.lifeState === 'overloaded'
      ? 'text-threat-critical'
      : 'text-text-secondary'

  const ambientGlowClass =
    telemetry.lifeState === 'recovering'
      ? 'bg-threat-warning/10'
      : telemetry.lifeState === 'active'
      ? 'bg-accent-primary/10'
      : telemetry.lifeState === 'overloaded'
      ? 'bg-threat-critical/10'
      : 'bg-transparent'

  // Core luminosity adapts gently to solar phase
  const coreLuminosity =
    telemetry.solarPhase === 'zenith'
      ? 1
      : telemetry.solarPhase === 'dawn' || telemetry.solarPhase === 'dusk'
      ? 0.95
      : 0.88

  const spinSpeedClass =
    telemetry.lifeState === 'active'
      ? 'animate-[spin_12s_linear_infinite]'
      : telemetry.lifeState === 'recovering'
      ? 'animate-[spin_24s_linear_infinite_reverse]'
      : telemetry.lifeState === 'overloaded'
      ? 'animate-[spin_8s_linear_infinite]'
      : 'animate-[spin_40s_linear_infinite]'

  return (
    <div
      role="img"
      aria-label={`Celestial living emblem: ${telemetry.lifeState} state, momentum ${telemetry.momentumScore}`}
      className={`relative flex items-center justify-center rounded-full bg-surface border border-border/80 overflow-hidden shrink-0 select-none ${dimensionClass} ${className}`}
    >
      {/* Ambient Atmospheric Backdrop Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-sm transition-colors duration-1000 ${ambientGlowClass}`}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 w-full h-full transition-transform duration-700 ${
          telemetry.lifeState === 'active' ? 'scale-105' : 'scale-100'
        }`}
        aria-hidden="true"
      >
        {/* Layer 1: Outer Astronomical Track with Micro-Dashes */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="currentColor"
          strokeWidth={isSmall ? '1.5' : '0.75'}
          className="text-border"
          strokeDasharray="1 3"
        />

        {/* Layer 2: Cardinal Celestial Pips (12, 3, 6, 9 o'clock) */}
        {!isSmall && (
          <g className="text-text-tertiary">
            <circle cx="50" cy="4" r="1.2" fill="currentColor" />
            <circle cx="96" cy="50" r="1.2" fill="currentColor" />
            <circle cx="50" cy="96" r="1.2" fill="currentColor" />
            <circle cx="4" cy="50" r="1.2" fill="currentColor" />
          </g>
        )}

        {/* Layer 3: Kinetic Momentum Orbit Ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth={isSmall ? '2.2' : '1.5'}
          strokeDasharray={
            telemetry.lifeState === 'recovering'
              ? '4 12'
              : isHighMomentum
              ? '16 6 4 6'
              : '8 8'
          }
          strokeLinecap="round"
          className={`${accentClass} transition-colors duration-500 ${spinSpeedClass}`}
        />

        {/* Layer 4: Concentric Astrolabe Dial Ring */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="currentColor"
          strokeWidth={isSmall ? '1' : '0.75'}
          strokeDasharray="2 4"
          className="text-text-tertiary/40"
        />

        {/* Layer 5: Crystalline Discipline Diamond */}
        <polygon
          points="50,18 82,50 50,82 18,50"
          stroke="currentColor"
          strokeWidth={isSmall ? '1.6' : '1.2'}
          className={`${accentClass} transition-all duration-700`}
          fill={
            telemetry.lifeState === 'active'
              ? 'currentColor'
              : telemetry.lifeState === 'recovering'
              ? 'currentColor'
              : 'transparent'
          }
          fillOpacity={
            telemetry.lifeState === 'active'
              ? 0.08
              : telemetry.lifeState === 'recovering'
              ? 0.05
              : 0
          }
        />

        {/* Layer 6: Inner Octagram Nested Coordinate Facets */}
        {!isSmall && (
          <polygon
            points="50,28 72,50 50,72 28,50"
            stroke="currentColor"
            strokeWidth="0.75"
            className="text-text-tertiary/30"
            strokeDasharray="2 2"
          />
        )}

        {/* Layer 7: Celestial Aperture Core Ring */}
        <circle
          cx="50"
          cy="50"
          r={isSmall ? '8' : '10'}
          stroke="currentColor"
          strokeWidth={isSmall ? '1.6' : '1.2'}
          className="text-text-secondary"
        />

        {/* Layer 8 & 9: User Image or Radiant Celestial 4-Point Star */}
        {user?.user_metadata?.avatar_url ? (
          <g>
            <clipPath id={`avatar-clip-${size}`}>
              <circle cx="50" cy="50" r={isSmall ? "8" : "10"} />
            </clipPath>
            <image
              href={user.user_metadata.avatar_url}
              x={isSmall ? "42" : "40"}
              y={isSmall ? "42" : "40"}
              height={isSmall ? "16" : "20"}
              width={isSmall ? "16" : "20"}
              clipPath={`url(#avatar-clip-${size})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        ) : (
          <>
            <path
              d="M 50 42 Q 50 50 58 50 Q 50 50 50 58 Q 50 50 42 50 Q 50 50 50 42 Z"
              fill="currentColor"
              className="text-text-primary transition-opacity duration-700"
              style={{ opacity: coreLuminosity }}
            />
            <circle
              cx="50"
              cy="50"
              r={isSmall ? '1.2' : '1.5'}
              fill="currentColor"
              className="text-surface"
            />
          </>
        )}

        {/* Layer 10: State-Specific Overlays */}
        {telemetry.lifeState === 'recovering' && (
          <circle
            cx="50"
            cy="50"
            r="24"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="2 6"
            strokeLinecap="round"
            className="text-threat-warning animate-pulse"
          />
        )}

        {telemetry.lifeState === 'active' && (
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-accent-primary/30 animate-ping"
            style={{ animationDuration: '3s' }}
          />
        )}

        {telemetry.lifeState === 'overloaded' && (
          <g className="text-threat-critical" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="28" y1="28" x2="33" y2="33" />
            <line x1="72" y1="28" x2="67" y2="33" />
            <line x1="28" y1="72" x2="33" y2="67" />
            <line x1="72" y1="72" x2="67" y2="67" />
          </g>
        )}
      </svg>
    </div>
  )
}
