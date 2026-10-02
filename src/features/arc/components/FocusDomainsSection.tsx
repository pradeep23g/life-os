import type { ArcFocusDomain } from '../types'
import type { DataLabDailyActivity } from '../../data-lab/api/useDataLab'
import { resolveBinding } from '../utils/telemetryRegistry'
import { TELEMETRY_BINDING_REGISTRY, type TelemetryBindingKey } from '../constants'
import { Activity, Target } from 'lucide-react'

interface FocusDomainsSectionProps {
  focusDomains: ArcFocusDomain[]
  dailyActivity: DataLabDailyActivity[]
  accentColor?: string
}

export function FocusDomainsSection({
  focusDomains,
  dailyActivity,
  accentColor = '#22d3ee',
}: FocusDomainsSectionProps) {
  if (!focusDomains || focusDomains.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 my-8 sm:my-10" aria-label="Seasonal Focus Domains">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            Focus Domains • Thematic Axioms & Telemetry Bindings
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase text-text-tertiary">
          {focusDomains.length} ACTIVE {focusDomains.length === 1 ? 'DOMAIN' : 'DOMAINS'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {focusDomains.map((domain) => {
          const hasBinding = Boolean(domain.binding?.source && domain.binding?.metric)
          const bindingKey = hasBinding
            ? (`${domain.binding!.source}.${domain.binding!.metric}` as TelemetryBindingKey)
            : null
          const registryEntry = bindingKey ? TELEMETRY_BINDING_REGISTRY[bindingKey] : null
          const resolvedValue = hasBinding ? resolveBinding(domain.binding, dailyActivity) : null

          return (
            <div
              key={domain.id}
              className="group relative flex flex-col justify-between p-3.5 rounded-lg bg-surface/60 border border-border-subtle hover:border-border transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="font-serif font-medium text-sm text-text-primary tracking-tight">
                      {domain.name}
                    </span>
                  </div>
                  {registryEntry && (
                    <p className="font-sans text-[11px] text-text-tertiary line-clamp-1">
                      {registryEntry.description}
                    </p>
                  )}
                </div>

                {hasBinding && (
                  <Activity className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5 group-hover:text-text-secondary transition-colors" />
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-subtle/50 flex items-center justify-between text-xs font-mono">
                {hasBinding && resolvedValue !== null ? (
                  <>
                    <span className="text-text-tertiary text-[10px] uppercase tracking-wider">
                      {domain.binding!.source}
                    </span>
                    <span className="tabular-nums font-semibold text-text-primary">
                      {resolvedValue}{' '}
                      <span className="text-text-tertiary text-[10px] font-normal">
                        {registryEntry?.unit ?? ''}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-sans">
                    Qualitative Directive
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
