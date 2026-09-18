import type { CoreAttribute } from '../types'

interface CoreAttributeHorizonProps {
  attributes: CoreAttribute[]
}

export function CoreAttributeHorizon({ attributes }: CoreAttributeHorizonProps) {
  return (
    <section className="space-y-6 sm:space-y-8" aria-label="Core Attribute Horizon">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Core Attribute Horizon • Deterministic Ledger
        </h2>
        <span className="font-mono text-[11px] text-text-tertiary">
          Zero Fabricated Signals • Verified Telemetry Basis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {attributes.map((attr) => (
          <article key={attr.id} className="space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                {attr.label}
              </p>
              <h3 className="font-serif text-lg text-text-primary font-normal">
                {attr.dimension}
              </h3>
            </div>

            {/* Monumental Tabular Numerals: No Progress Bars */}
            <div className="py-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono tabular-nums text-4xl sm:text-5xl font-light text-text-primary tracking-tight">
                  {typeof attr.value === 'number' ? attr.value.toLocaleString('en-US') : attr.value}
                </span>
                {attr.unit && (
                  <span className="font-mono text-xs text-text-tertiary uppercase">
                    {attr.unit}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-border-subtle">
              <p className="font-sans text-xs text-text-secondary leading-snug">
                {attr.supportingText}
              </p>
              <p className="font-mono text-[10px] text-text-tertiary leading-tight">
                {attr.provenance}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
