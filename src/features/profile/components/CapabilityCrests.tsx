import type { CapabilityCrest } from '../types'

interface CapabilityCrestsProps {
  crests: CapabilityCrest[]
}

function CrestInsignia({ id, isEarned }: { id: string; isEarned: boolean }) {
  const strokeClass = isEarned ? 'text-accent-primary' : 'text-text-tertiary/40'
  const fillClass = isEarned ? 'text-accent-primary/10' : 'text-transparent'

  switch (id) {
    case 'cadence-keeper':
      // Concentric circles representing daily habit cadence
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="9" className={fillClass} fill="currentColor" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'centurion-execution':
      // Diamond quadrant representing completed task volume
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <polygon points="12,2 22,12 12,22 2,12" className={fillClass} fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      )
    case 'iron-foundation':
      // Triangle of physical conditioning
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <polygon points="12,3 22,20 2,20" className={fillClass} fill="currentColor" />
          <circle cx="12" cy="14" r="2.5" />
        </svg>
      )
    case 'scholar-arc':
      // Open book / scroll geometry
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" className={fillClass} fill="currentColor" />
        </svg>
      )
    case 'velocity-invariant':
      // Vector arrow / momentum node
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="12" cy="12" r="8" className={fillClass} fill="currentColor" />
          <path d="M12 7v10M8 11l4-4 4 4" />
        </svg>
      )
    default:
      // Archival seal / hexagram
      return (
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${strokeClass}`} fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="4" y="4" width="16" height="16" className={fillClass} fill="currentColor" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
  }
}

export function CapabilityCrests({ crests }: CapabilityCrestsProps) {
  const earnedCount = crests.filter((c) => c.isEarned).length

  return (
    <section className="space-y-6 sm:space-y-8" aria-label="Earned Capability Markers and Crests">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Earned Identity Markers • Capability Crests
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-text-secondary">
          {earnedCount} OF {crests.length} CRESTS AFFIRMED BY TELEMETRY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {crests.map((crest) => (
          <article
            key={crest.id}
            className={`space-y-3 pb-4 border-b border-border-subtle transition-opacity ${
              crest.isEarned ? 'opacity-100' : 'opacity-60 hover:opacity-85'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CrestInsignia id={crest.id} isEarned={crest.isEarned} />
                <h3 className="font-serif text-base font-normal text-text-primary">
                  {crest.title}
                </h3>
              </div>

              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
                  crest.isEarned
                    ? 'border-accent-primary/40 text-accent-primary bg-accent-primary/5'
                    : 'border-border-subtle text-text-tertiary bg-surface'
                }`}
              >
                {crest.isEarned ? 'AFFIRMED' : 'IN FORMATION'}
              </span>
            </div>

            <p className="font-sans text-xs text-text-secondary leading-relaxed">
              {crest.description}
            </p>

            <div className="flex items-baseline justify-between pt-1 text-[11px] font-mono">
              <span className="text-text-tertiary">{crest.criteria}</span>
              <span className="tabular-nums text-text-primary text-right font-medium">
                {crest.earnedProvenance}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
