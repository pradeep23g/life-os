import { Avatar } from '../../../components/Avatar'
import { WinterArcIcon } from '../../../components/icons'
import type { ArcSeasonConfig } from '../types'
import type { LifeState } from '../../mission-control/types/snapshot'

interface ChapterHeroProps {
  config: ArcSeasonConfig
  lifeState: LifeState
  momentumScore: number
}

export function ChapterHero({ config, lifeState, momentumScore }: ChapterHeroProps) {
  const avatarState =
    lifeState === 'Recovering'
      ? 'recovering'
      : lifeState === 'Overloaded'
      ? 'overloaded'
      : lifeState === 'Drifting'
      ? 'drifting'
      : lifeState === 'Accelerating' || lifeState === 'Building' || momentumScore > 60
      ? 'active'
      : 'idle'

  return (
    <header className="space-y-10 sm:space-y-14" aria-label="Chapter opening and seasonal vow">
      {/* Top Identity Datum */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-border/80 text-accent-primary shadow-sm">
              <WinterArcIcon className="h-3.5 w-3.5" />
            </div>
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              {config.chapter} • ARCHIVE {config.year}
            </p>
          </div>
          <p className="font-sans text-xs text-text-secondary">
            System State: <span className="text-text-primary font-medium">{lifeState}</span> • Momentum <span className="font-mono tabular-nums">{momentumScore}</span>
          </p>
        </div>

        <Avatar
          size="md"
          state={avatarState}
          momentumScore={momentumScore}
          className="border-border-subtle shrink-0"
        />
      </div>

      {/* Monumental Chapter Title */}
      <div className="space-y-3">
        <h1 className="font-serif font-extralight text-5xl sm:text-7xl md:text-8xl text-text-primary tracking-tight leading-none">
          {config.title}
        </h1>
        <p className="font-mono text-xs text-text-tertiary tracking-widest uppercase">
          90-DAY TEMPORAL CAMPAIGN • {config.startDate} — {config.endDate}
        </p>
      </div>

      {/* Seasonal Vow: High visual authority, indented Newsreader serif, datum rule */}
      <blockquote className="border-l-2 border-border-subtle pl-6 sm:pl-8 py-2 my-8 sm:my-12 space-y-4 max-w-3xl">
        <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-text-primary leading-snug tracking-tight text-balance">
          &ldquo;{config.vow.headline}&rdquo;
        </p>
        <p className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed text-balance">
          {config.vow.body}
        </p>
        <footer className="pt-2">
          <cite className="font-mono text-xs uppercase tracking-wider text-text-tertiary not-italic block">
            {config.vow.attribution}
          </cite>
        </footer>
      </blockquote>
    </header>
  )
}
