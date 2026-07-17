import { useMemo } from 'react'

import { useBehaviorMetrics } from '../hooks/useDataLabMetrics'
import { useDataMaturity } from '../hooks/useDataMaturity'
import { toCorrelationMatrixCells, toStreakLanes, toMomentumBars, toRhythmBars } from '../transforms/behavior'
import DataLabEmptyState from '../components/shared/DataLabEmptyState'
import ExperimentalPlaceholder from '../components/shared/ExperimentalPlaceholder'
import CorrelationMatrix from '../components/charts/CorrelationMatrix'
import HabitStreakRivers from '../components/charts/HabitStreakRivers'
import MomentumDistribution from '../components/charts/MomentumDistribution'
import BehaviorDriftCard from '../components/cards/BehaviorDriftCard'
import ActivityHistogram from '../components/charts/ActivityHistogram'
import CorrelationExplorerCard from '../components/cards/CorrelationExplorerCard'

function BehaviorTab() {
  const {
    correlationMetrics,
    streakMetrics,
    momentumMetrics,
    driftMetrics,
    rhythmMetrics,
    filteredDaily,
    isLoading,
    isError,
  } = useBehaviorMetrics()

  const maturity = useDataMaturity()

  const matrixCells = useMemo(
    () => toCorrelationMatrixCells(correlationMetrics),
    [correlationMetrics],
  )

  const streakLanes = useMemo(
    () => toStreakLanes(streakMetrics),
    [streakMetrics],
  )

  const momentumBars = useMemo(
    () => toMomentumBars(momentumMetrics),
    [momentumMetrics],
  )

  const rhythmBars = useMemo(
    () => toRhythmBars(rhythmMetrics),
    [rhythmMetrics],
  )

  if (isLoading) return <DataLabEmptyState isLoading />
  if (isError) return <DataLabEmptyState isError errorMessage="Failed to load behavior data." />

  const showCorrelations = maturity.level === 'stable'

  return (
    <div className="space-y-4">
      {showCorrelations ? (
        <CorrelationMatrix grid={matrixCells} labels={correlationMetrics.labels} />
      ) : (
        <ExperimentalPlaceholder
          title="Correlation Matrix"
          totalDays={maturity.totalDays}
          daysUntilStable={maturity.daysUntilStable}
        />
      )}

      <HabitStreakRivers lanes={streakLanes} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MomentumDistribution
          bars={momentumBars}
          currentLevel={momentumMetrics.currentLevel}
          totalWeeks={momentumMetrics.totalWeeks}
        />
        <BehaviorDriftCard metrics={driftMetrics} />
      </div>

      <ActivityHistogram bars={rhythmBars} peakHour={rhythmMetrics.peakHour} />

      {showCorrelations ? (
        <CorrelationExplorerCard dailyRows={filteredDaily} />
      ) : (
        <ExperimentalPlaceholder
          title="Correlation Explorer"
          totalDays={maturity.totalDays}
          daysUntilStable={maturity.daysUntilStable}
        />
      )}
    </div>
  )
}

export default BehaviorTab
