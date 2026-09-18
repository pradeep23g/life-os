import { useArcTelemetry } from '../hooks/useArcTelemetry'
import { ChapterHero } from '../components/ChapterHero'
import { ArcCountdownLedger } from '../components/ArcCountdownLedger'
import { EpochHorizonRail } from '../components/EpochHorizonRail'
import { SeasonalMilestones } from '../components/SeasonalMilestones'
import { CheckpointLedger } from '../components/CheckpointLedger'

export default function ArcPage() {
  const {
    config,
    progress,
    checkpoints,
    milestones,
    totals,
    lifeState,
    momentumScore,
  } = useArcTelemetry()

  return (
    <main className="w-full max-w-5xl mx-auto py-8 sm:py-12 md:py-16 px-3 sm:px-6 md:px-8 space-y-12 sm:space-y-16">
      {/* Tier 1: Ambient Orientation & Monumental Chapter Opening */}
      <section aria-label="Chapter Overview">
        <ChapterHero
          config={config}
          lifeState={lifeState}
          momentumScore={momentumScore}
        />

        <ArcCountdownLedger progress={progress} />
      </section>

      {/* Tier 2: Structural Horizon, Milestones & Tactical Checkpoints */}
      <section className="space-y-12 sm:space-y-16" aria-label="Seasonal Temporal Structure">
        <EpochHorizonRail
          checkpoints={checkpoints}
          progress={progress}
        />

        <SeasonalMilestones
          milestones={milestones}
          activeDays={totals.activeDays}
        />

        <CheckpointLedger checkpoints={checkpoints} />
      </section>
    </main>
  )
}
