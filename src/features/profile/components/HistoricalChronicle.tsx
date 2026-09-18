import { useState, useMemo } from 'react'
import type { ChronicleEvent, DossierDomain } from '../types'

interface HistoricalChronicleProps {
  chronicle: ChronicleEvent[]
  totalChronicleCount: number
}

const DOMAIN_TABS: { id: DossierDomain; label: string }[] = [
  { id: 'all', label: 'All Domains' },
  { id: 'mind', label: 'Mind' },
  { id: 'work', label: 'Work & Focus' },
  { id: 'body', label: 'Body' },
  { id: 'intellect', label: 'Intellect' },
  { id: 'system', label: 'System' },
]

const INITIAL_PAGE_SIZE = 20

function formatLedgerDate(isoString: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) {
      return { dateStr: '—', timeStr: '—' }
    }
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return { dateStr, timeStr }
  } catch {
    return { dateStr: '—', timeStr: '—' }
  }
}

export function HistoricalChronicle({
  chronicle,
  totalChronicleCount,
}: HistoricalChronicleProps) {
  const [selectedDomain, setSelectedDomain] = useState<DossierDomain>('all')
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_PAGE_SIZE)

  // Compute counts per domain for tabs
  const domainCounts = useMemo(() => {
    const counts: Record<DossierDomain, number> = {
      all: chronicle.length,
      mind: 0,
      work: 0,
      body: 0,
      intellect: 0,
      system: 0,
    }
    for (const e of chronicle) {
      if (counts[e.domain] !== undefined) {
        counts[e.domain]++
      }
    }
    return counts
  }, [chronicle])

  // Filter events by domain
  const filteredEvents = useMemo(() => {
    if (selectedDomain === 'all') return chronicle
    return chronicle.filter((e) => e.domain === selectedDomain)
  }, [chronicle, selectedDomain])

  const visibleEvents = filteredEvents.slice(0, displayLimit)
  const hasMore = visibleEvents.length < filteredEvents.length

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + INITIAL_PAGE_SIZE)
  }

  return (
    <section className="space-y-8" aria-label="Historical Chronicle and Biographical Ledger">
      {/* Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Historical Chronicle • Biographical Ledger
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-text-secondary">
          {filteredEvents.length} OF {totalChronicleCount} TOTAL TRANSCRIBED RECORDS
        </span>
      </div>

      {/* Domain Navigation Tabs: Architectural Swiss Bar, zero cards */}
      <nav
        className="flex flex-wrap gap-1 sm:gap-2 border-b border-border-subtle pb-4"
        aria-label="Filter ledger by domain"
      >
        {DOMAIN_TABS.map((tab) => {
          const isActive = selectedDomain === tab.id
          const count = domainCounts[tab.id]

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedDomain(tab.id)
                setDisplayLimit(INITIAL_PAGE_SIZE)
              }}
              className={`px-3 py-1.5 font-mono text-xs transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-surface text-text-primary font-medium border-b-2 border-accent-primary'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface/40'
              }`}
            >
              <span>{tab.label}</span>
              <span className="tabular-nums text-[10px] text-text-tertiary opacity-80">
                ({count})
              </span>
            </button>
          )
        })}
      </nav>

      {/* Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center sm:text-left space-y-3">
          <p className="font-serif text-2xl font-light text-text-secondary italic">
            The ledger holds no records under this domain yet.
          </p>
          <p className="font-sans text-xs text-text-tertiary max-w-md">
            As you log focus sessions, execute tasks, practice rituals, or track training,
            canonical events will automatically be transcribed into this permanent archive.
          </p>
        </div>
      ) : (
        /* The Ledger Primitive: Horizontal Rows with Asymmetric Swiss Anchoring */
        <div className="divide-y divide-border-subtle">
          {visibleEvents.map((item) => {
            const { dateStr, timeStr } = formatLedgerDate(item.timestamp)

            return (
              <article
                key={item.id}
                className="py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline transition-colors hover:bg-surface/20"
              >
                {/* Temporal Anchor & Domain Indicator */}
                <div className="sm:col-span-4 flex sm:flex-col justify-between sm:justify-start items-baseline gap-1 sm:gap-1.5">
                  <time className="font-mono text-xs tabular-nums text-text-secondary font-medium">
                    {dateStr}
                    <span className="text-text-tertiary font-normal ml-2">{timeStr} IST</span>
                  </time>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    {item.domain}
                  </span>
                </div>

                {/* Human-Readable Editorial Narrative */}
                <div className="sm:col-span-8 space-y-1.5">
                  <h3 className="font-serif text-base sm:text-lg text-text-primary leading-snug font-normal">
                    {item.headline}
                  </h3>

                  {item.detail && (
                    <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {item.detail}
                    </p>
                  )}

                  {item.metadataSummary && (
                    <p className="font-mono text-[11px] tabular-nums text-text-tertiary">
                      {item.metadataSummary}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Progressive Disclosure Pagination */}
      {hasMore && (
        <div className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-subtle">
          <span className="font-mono text-xs tabular-nums text-text-tertiary">
            DISPLAYING {visibleEvents.length} OF {filteredEvents.length} RECORDS
          </span>

          <button
            type="button"
            onClick={handleLoadMore}
            className="px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-text-primary border border-border hover:bg-surface transition-colors"
          >
            Inspect Earlier Ledger Records
          </button>
        </div>
      )}
    </section>
  )
}
