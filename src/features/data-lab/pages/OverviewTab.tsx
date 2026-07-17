import { useMemo } from 'react'

import { useOverviewMetrics } from '../hooks/useDataLabMetrics'
import { toBehaviorTimelineRows, toContributionCalendarCells } from '../transforms/overview'
import DataLabEmptyState from '../components/shared/DataLabEmptyState'
import WeeklyScoreSummary from '../components/cards/WeeklyScoreSummary'
import BehaviorInsightsPanel from '../components/cards/BehaviorInsightsPanel'
import BehaviorTimeline from '../components/charts/BehaviorTimeline'
import ModuleConsistencyCard from '../components/cards/ModuleConsistencyCard'
import ContributionCalendar from '../components/charts/ContributionCalendar'

function OverviewTab() {
  const { weeklyScoreMetrics, consistencyMetrics, insights, filteredDaily, isLoading, isError } =
    useOverviewMetrics()

  const timelineRows = useMemo(
    () => toBehaviorTimelineRows(filteredDaily),
    [filteredDaily],
  )

  const calendarCells = useMemo(
    () => toContributionCalendarCells(filteredDaily),
    [filteredDaily],
  )

  if (isLoading) return <DataLabEmptyState isLoading />
  if (isError) return <DataLabEmptyState isError errorMessage="Failed to load overview data." />

  return (
    <div className="space-y-4">
      <WeeklyScoreSummary metrics={weeklyScoreMetrics} />
      <BehaviorInsightsPanel insights={insights} />
      <BehaviorTimeline rows={timelineRows} />
      <ModuleConsistencyCard metrics={consistencyMetrics} />
      <ContributionCalendar cells={calendarCells} />
    </div>
  )
}

export default OverviewTab
