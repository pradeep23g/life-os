import { useProfileDossier } from './hooks/useProfileDossier'
import { ProfileHero } from './components/ProfileHero'
import { CoreAttributeHorizon } from './components/CoreAttributeHorizon'
import { CapabilityCrests } from './components/CapabilityCrests'
import { HistoricalChronicle } from './components/HistoricalChronicle'

export default function ProfilePage() {
  const {
    lifeState,
    momentumScore,
    momentumTrend,
    confidence,
    sparkline,
    consistencyPercent,
    activeDaysThisWeek,
    attributes,
    crests,
    chronicle,
    totalChronicleCount,
  } = useProfileDossier()

  return (
    <main className="w-full min-h-screen relative overflow-hidden">
      {/* Background Instrumental Sparkline Projection (Subtle ambient momentum trace) */}
      {sparkline.length > 1 && (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden z-0"
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full scale-125">
            <polyline
              points={sparkline
                .map(
                  (val, i) =>
                    `${(i / Math.max(1, sparkline.length - 1)) * 100},${100 - (val / 100) * 100}`,
                )
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
          </svg>
        </div>
      )}

      {/* Asymmetric Swiss Architectural Stage */}
      <div className="relative z-10 w-full max-w-5xl mx-auto lg:mx-0 py-10 sm:py-16 md:py-24 px-4 sm:px-6 md:px-10 space-y-16 sm:space-y-24">
        {/* Room Section 1: Hero & Living Emblem */}
        <ProfileHero
          lifeState={lifeState}
          momentumScore={momentumScore}
          momentumTrend={momentumTrend}
          confidence={confidence}
          consistencyPercent={consistencyPercent}
          activeDaysThisWeek={activeDaysThisWeek}
        />

        {/* Room Section 2: Core Attribute Horizon */}
        <CoreAttributeHorizon attributes={attributes} />

        {/* Room Section 3: Earned Capability Crests */}
        <CapabilityCrests crests={crests} />

        {/* Room Section 4: Biographical Chronicle & Historical Ledger */}
        <HistoricalChronicle
          chronicle={chronicle}
          totalChronicleCount={totalChronicleCount}
        />
      </div>
    </main>
  )
}
