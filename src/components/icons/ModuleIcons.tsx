export interface IconProps {
  className?: string
  size?: number
}

/**
 * Life OS Master Brand Sigil
 * An interlocking celestial sphere enclosing a singular crystalline diamond.
 * Represents the unification of mind, body, time, and ambition into one living operating environment.
 */
export function LifeOsLogo({ className = 'h-6 w-6', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Outer Horizon Ring */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Dynamic Orbital Ellipse */}
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-30 12 12)" strokeDasharray="1 1.5" />
      {/* Singular Core Diamond */}
      <polygon points="12,6.5 16,12 12,17.5 8,12" />
      {/* Focal Singularity */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

/**
 * Full Brand Lockup with Master Logo and Editorial Wordmark
 */
export function LifeOsBrandLockup({
  compact = false,
  className = '',
  seasonalLabel,
}: {
  compact?: boolean
  className?: string
  seasonalLabel?: string
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="flex items-center justify-center rounded-lg bg-surface border border-border/80 p-1.5 shadow-sm text-text-primary shrink-0">
        <LifeOsLogo className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="flex flex-col min-w-0">
          <span className="font-serif font-medium tracking-tight text-text-primary text-base leading-none">
            Life OS
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-text-tertiary mt-1">
            {seasonalLabel ?? 'Life OS Arc'}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Home / Solar Presence Sigil
 * Architectural sanctuary portal with celestial zenith aperture.
 */
export function HomeIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Sacred Sanctuary Arch */}
      <path d="M4 20V10a8 8 0 0 1 16 0v10" />
      {/* Ground Horizon Datum */}
      <line x1="2" y1="20" x2="22" y2="20" />
      {/* Inner Zenith Radiant Aperture */}
      <circle cx="12" cy="11" r="3" />
      <line x1="12" y1="5" x2="12" y2="6.5" />
      <line x1="12" y1="15.5" x2="12" y2="17" />
    </svg>
  )
}

/**
 * System / Mission Control Sigil
 * Precision command telemetry hexagon with reactive central nexus.
 */
export function SystemIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Outer Telemetry Hexagon */}
      <polygon points="12,2.5 20.5,7.4 20.5,16.6 12,21.5 3.5,16.6 3.5,7.4" />
      {/* Nexus Coordinate Struts */}
      <line x1="12" y1="2.5" x2="12" y2="9.5" />
      <line x1="20.5" y1="16.6" x2="14.5" y2="13.2" />
      <line x1="3.5" y1="16.6" x2="9.5" y2="13.2" />
      {/* Central Instrument Core */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" />
    </svg>
  )
}

/**
 * Winter Arc Sigil
 * Sharp crystalline monolith and ice hexagram with directional velocity vector.
 */
export function WinterArcIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Crystalline Cardinal Axes */}
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.34" y1="7" x2="20.66" y2="17" />
      <line x1="3.34" y1="17" x2="20.66" y2="7" />
      {/* Faceted Frost Chevron Accents */}
      <path d="M10 4.5 L12 2 L14 4.5" />
      <path d="M10 19.5 L12 22 L14 19.5" />
      {/* Inner Concentric Diamond */}
      <polygon points="12,8 16,12 12,16 8,12" />
    </svg>
  )
}

/**
 * Mind OS Sigil
 * Cerebral resonance waves enclosing a serene focal equilibrium point.
 */
export function MindOsIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Dual Cerebral Resonance Arcs */}
      <path d="M7 6.5 A 7 7 0 0 1 17 6.5" />
      <path d="M5 12 A 8.5 8.5 0 0 1 19 12" />
      <path d="M7 17.5 A 7 7 0 0 0 17 17.5" />
      {/* Vertical Axis of Introspection */}
      <line x1="12" y1="4" x2="12" y2="20" strokeDasharray="1.5 2" />
      {/* Equilibrium Singularity */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

/**
 * Productivity Hub Sigil
 * Interlocking kinetic execution chevrons forming a forward velocity vector.
 */
export function ProductivityIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Primary Execution Chevron */}
      <path d="M5 6 L12 12 L5 18" />
      {/* Secondary Momentum Forward Vector */}
      <path d="M12 6 L19 12 L12 18" />
      {/* Terminal Precision Guide */}
      <line x1="19" y1="6" x2="19" y2="18" strokeDasharray="1 2" />
    </svg>
  )
}

/**
 * Time OS Sigil
 * Astronomical chronos dial with 24-hour arc quadrant and temporal gnomon.
 */
export function TimeOsIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Chronos Instrument Perimeter */}
      <circle cx="12" cy="12" r="9" />
      {/* Quad Degree Ticks */}
      <line x1="12" y1="3" x2="12" y2="5" />
      <line x1="21" y1="12" x2="19" y2="12" />
      <line x1="12" y1="21" x2="12" y2="19" />
      <line x1="3" y1="12" x2="5" y2="12" />
      {/* Deep Work Gnomon Vector */}
      <path d="M12 7 V12 L15.5 15.5" />
      {/* Center Pivot */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

/**
 * Finance OS Sigil
 * Sovereign capital vault prism with ascending ledger strata.
 */
export function FinanceIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Vault Diamond Matrix */}
      <polygon points="12,2.5 21,12 12,21.5 3,12" />
      {/* Ascending Capital Runway Strata */}
      <line x1="7.5" y1="14" x2="16.5" y2="14" />
      <line x1="9" y1="10" x2="15" y2="10" />
      {/* Sovereign Metric Pillar */}
      <line x1="12" y1="6.5" x2="12" y2="17.5" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

/**
 * Fitness OS Sigil
 * Kinetic isometric tetrahedron and biomechanical force triad.
 */
export function FitnessIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Somatic Power Delta */}
      <polygon points="12,3 21,19 3,19" />
      {/* Internal Force Triad Vectors */}
      <line x1="12" y1="3" x2="12" y2="13.5" />
      <line x1="21" y1="19" x2="12" y2="13.5" />
      <line x1="3" y1="19" x2="12" y2="13.5" />
      {/* Center Biomechanical Nucleus */}
      <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Learning OS Sigil
 * Infinite scholarly codex prism with radiating knowledge rays.
 */
export function LearningIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Open Scholarly Codex Spine & Leaves */}
      <path d="M12 20 V6" />
      <path d="M12 6 C8 4 4 5 2 6 V20 C4 19 8 18 12 20 C16 18 20 19 22 20 V6 C20 5 16 4 12 6 Z" />
      {/* Knowledge Zenith Pip */}
      <circle cx="12" cy="2.5" r="1" fill="currentColor" />
    </svg>
  )
}

/**
 * Data Lab Sigil
 * Empirical coordinate interferometer and signal synthesis constellation.
 */
export function DataLabIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Coordinate Matrix Frame */}
      <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" />
      {/* Diagonal Signal Axis */}
      <line x1="4" y1="20" x2="20" y2="4" />
      {/* Synthesis Constellation Nodes */}
      <circle cx="8" cy="16" r="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="16" cy="8" r="2" fill="currentColor" fillOpacity="0.2" />
    </svg>
  )
}

/**
 * Reports / Chronicle Sigil
 * Archival folio seal with engraved tabular telemetry strata.
 */
export function ReportsIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Archival Folio Tablet */}
      <rect x="4" y="3" width="16" height="18" rx="2" />
      {/* Tabular Telemetry Strata */}
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
      {/* Verified Seal Marker */}
      <circle cx="15.5" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Sign Out / Departure Sigil
 */
export function SignOutIcon({ className = 'h-5 w-5', size }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M14 7l5 5-5 5" />
      <line x1="19" y1="12" x2="8" y2="12" />
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    </svg>
  )
}

/**
 * Rail Expand / Collapse Toggle Sigil
 */
export function RailToggleIcon({
  className = 'h-5 w-5',
  size,
  expanded = false,
}: IconProps & { expanded?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {/* Architectural Swiss Strata */}
      <line x1="7" y1="6" x2="19" y2="6" />
      <line x1="7" y1="12" x2="19" y2="12" />
      <line x1="7" y1="18" x2="19" y2="18" />
      {/* Spatial Indicator */}
      {expanded ? (
        <path d="M4 9l-2 3 2 3" />
      ) : (
        <path d="M2 9l2 3-2 3" />
      )}
    </svg>
  )
}
