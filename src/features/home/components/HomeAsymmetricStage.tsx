import { HomeSolarPresence } from './HomeSolarPresence'
import { HomePrimaryAction } from './HomePrimaryAction'
import { AmbientHorizonBar } from './AmbientHorizonBar'
import type { useHomeTelemetry } from '../hooks/useHomeTelemetry'

interface HomeAsymmetricStageProps {
  telemetry: ReturnType<typeof useHomeTelemetry>
}

export function HomeAsymmetricStage({ telemetry }: HomeAsymmetricStageProps) {
  const {
    solarContext,
    directive,
    directiveSupporting,
    momentumScore,
    lifeState,
    hasActiveTimer,
    activeTimer,
    isStartingTimer,
    primaryActionLabel,
    executePrimaryAction,
    pendingTasksCount,
    pendingHabitsCount,
    totalPending,
    focusTimeDisplay,
    dateDisplay,
    hasActiveArc,
    arcTitle,
    arcCurrentDay,
    arcTotalDays,
    arcOverallHealth,
    arcAccentColor,
  } = telemetry

  return (
    <article className="w-full max-w-4xl mx-auto lg:mx-0 py-8 sm:py-12 md:py-16 px-2 sm:px-4 md:px-8 flex flex-col justify-between min-h-[calc(100vh-8rem)]">
      {/* Top Anchor: Solar Context & Living Avatar Presence */}
      <div className="space-y-12 sm:space-y-16">
        <HomeSolarPresence
          solarContext={solarContext}
          lifeState={lifeState}
          momentumScore={momentumScore}
        />

        {/* Editorial Intention: Dominated by monumental Newsreader serif */}
        <section className="space-y-6 max-w-3xl" aria-label="Daily intention and focus">
          <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            {solarContext.greeting}
          </p>

          <h1 className="font-serif font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-text-primary tracking-tight leading-[1.15] text-balance">
            {directive}
          </h1>

          <p className="font-sans text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed text-balance">
            {directiveSupporting}
          </p>

          {/* Focal Action: Direct tactile execution, no dead CTA, no arrows */}
          <HomePrimaryAction
            label={primaryActionLabel}
            hasActiveTimer={hasActiveTimer}
            activeTimer={activeTimer}
            isStarting={isStartingTimer}
            onExecute={executePrimaryAction}
          />
        </section>
      </div>

      {/* Ambient Horizon: Quiet hairline datum rule spanning the floor */}
      <AmbientHorizonBar
        dateDisplay={dateDisplay}
        solarPhase={solarContext.phase}
        focusTimeDisplay={focusTimeDisplay}
        momentumScore={momentumScore}
        pendingTasksCount={pendingTasksCount}
        pendingHabitsCount={pendingHabitsCount}
        totalPending={totalPending}
        hasActiveArc={hasActiveArc}
        arcTitle={arcTitle}
        arcCurrentDay={arcCurrentDay}
        arcTotalDays={arcTotalDays}
        arcOverallHealth={arcOverallHealth}
        arcAccentColor={arcAccentColor}
      />
    </article>
  )
}
