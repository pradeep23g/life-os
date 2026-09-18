import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCreateJournalEntry, useDeleteJournalEntry, useJournalEntries } from '../api/useJournal'
import JournalDateModal from './JournalDateModal'
import { DeleteButton } from '../../../components/DeleteButton'
import { LoadingView } from '../../../components/LoadingView'
import {
  buildMonthGrid,
  formatIndiaDateTime,
  getMonthLabel,
  shiftMonth,
  toIndiaDateKey,
  CLINICAL_MOOD_SCALE,
  getMoodLabel,
} from '../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

function PenIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 20l4.5-1 9-9a1.8 1.8 0 000-2.5l-1-1a1.8 1.8 0 00-2.5 0l-9 9L4 20z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7l4 4" strokeLinecap="round" />
    </svg>
  )
}

function JournalPage() {
  const { data: entries = [], isLoading, isError } = useJournalEntries()
  const { mutate: createEntry, isPending, error: createError } = useCreateJournalEntry()
  const { mutate: deleteEntry } = useDeleteJournalEntry()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [mood, setMood] = useState<number>(3)
  const [whatWentGood, setWhatWentGood] = useState('')
  const [whatYouLearned, setWhatYouLearned] = useState('')
  const [briefAboutDay, setBriefAboutDay] = useState('')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])
  const miniMonthCells = useMemo(() => buildMonthGrid(new Date()), [])

  const entriesByDate = useMemo(() => {
    const map = new Map<string, typeof entries>()

    for (const entry of entries) {
      const dateKey = toIndiaDateKey(entry.created_at)
      const existing = map.get(dateKey) ?? []
      existing.push(entry)
      map.set(dateKey, existing)
    }

    for (const [dateKey, dayEntries] of map) {
      map.set(
        dateKey,
        dayEntries.sort((left, right) => (left.created_at < right.created_at ? -1 : 1)),
      )
    }

    return map
  }, [entries])

  const dateMoodSummary = useMemo(() => {
    const map = new Map<string, { averageMood: number; count: number }>()
    for (const [dateKey, dayEntries] of entriesByDate) {
      const count = dayEntries.length
      if (count === 0) {
        continue
      }
      const totalMood = dayEntries.reduce((sum, entry) => sum + entry.mood, 0)
      map.set(dateKey, {
        averageMood: Math.round(totalMood / count),
        count,
      })
    }
    return map
  }, [entriesByDate])

  const hasContent = useMemo(() => {
    return [whatWentGood, whatYouLearned, briefAboutDay].some((value) => value.trim().length > 0)
  }, [whatWentGood, whatYouLearned, briefAboutDay])

  useEffect(() => {
    if (!isCreateModalOpen && !isCalendarOpen && !selectedDate) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (selectedDate) {
        setSelectedDate(null)
        return
      }

      if (isCalendarOpen) {
        setIsCalendarOpen(false)
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isCalendarOpen, isCreateModalOpen, selectedDate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    createEntry(
      {
        entryDate: toIndiaDateKey(new Date()),
        mood,
        whatWentGood: whatWentGood.trim(),
        whatYouLearned: whatYouLearned.trim(),
        briefAboutDay: briefAboutDay.trim(),
      },
      {
        onSuccess: () => {
          setMood(3)
          setWhatWentGood('')
          setWhatYouLearned('')
          setBriefAboutDay('')
          setIsCreateModalOpen(false)
        },
      },
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-10 text-text-primary">
      {/* Editorial Header */}
      <header className="border-b border-border-subtle pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Mind OS &bull; Chronicle Archive
            </span>
            <span className="text-text-tertiary font-mono text-xs">&bull;</span>
            <Link
              to="/mind-os"
              className="text-xs font-mono text-text-secondary hover:text-text-primary transition-colors underline-offset-4 hover:underline"
            >
              &larr; Back to The Study
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-text-primary mt-1">
            Chronicle
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary max-w-lg mt-0.5">
            The literary archive of internal reflections, distilled observations, and daily psychological state.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCalendarMonth(new Date())
              setIsCalendarOpen(true)
            }}
            className="px-3 py-1.5 text-xs font-sans rounded-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            Monthly Ledger
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium flex items-center gap-1.5"
          >
            <PenIcon />
            <span>Write Entry</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Entries Stream (Left) & Mini Month Navigator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 items-start">
        {/* Left Column: Reflections Stream */}
        <section className="space-y-6" aria-labelledby="reflections-heading">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h2 id="reflections-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Archived Reflections ({entries.length})
            </h2>
            <span className="font-mono text-xs text-text-tertiary tabular-nums">
              Tabular Index
            </span>
          </div>

          {isLoading && (
            <div className="py-6">
              <LoadingView
                variant="inline"
                label="Indexing Chronicle"
                sublabel="Loading archived psychological reflections..."
              />
            </div>
          )}

          {isError && (
            <p className="text-sm font-sans text-threat-critical">Failed to load journal reflections.</p>
          )}

          {!isLoading && !isError && entries.length === 0 && (
            <div className="py-12 text-center text-text-tertiary font-serif italic text-base border-b border-border-subtle">
              The archive is currently unwritten. Record your first reflection above.
            </div>
          )}

          {!isLoading && entries.length > 0 && (
            <div className="divide-y divide-border-subtle/50" role="feed" aria-label="Journal entries feed">
              {entries.map((entry) => (
                <article key={entry.id} className="py-5 space-y-3 group" role="article">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-xs text-text-tertiary">
                        {formatIndiaDateTime(entry.updated_at || entry.created_at)}
                      </span>
                      <span className="font-mono text-xs text-text-secondary border border-border-subtle px-1.5 py-0.5 rounded-sm bg-elevated/40">
                        {getMoodLabel(entry.mood)} [0{entry.mood}]
                      </span>
                    </div>

                    <DeleteButton
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const confirmed = window.confirm('Delete this journal reflection?')
                        if (!confirmed) return
                        deleteEntry(entry.id)
                      }}
                      aria-label="Delete reflection"
                    />
                  </div>

                  {entry.brief_about_day && (
                    <blockquote className="text-lg sm:text-xl font-serif font-light text-text-primary leading-relaxed text-balance">
                      &ldquo;{entry.brief_about_day}&rdquo;
                    </blockquote>
                  )}

                  {(entry.what_went_good || entry.what_you_learned) && (
                    <div className="space-y-1.5 pt-1 text-xs font-sans text-text-secondary border-t border-border-subtle/40">
                      {entry.what_went_good && (
                        <p className="leading-relaxed">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mr-2">
                            Clarity:
                          </span>
                          {entry.what_went_good}
                        </p>
                      )}
                      {entry.what_you_learned && (
                        <p className="leading-relaxed">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mr-2">
                            Distilled:
                          </span>
                          {entry.what_you_learned}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Month Navigator Strip */}
        <aside className="space-y-4 border border-border-subtle rounded-sm p-4 bg-elevated/20">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
              Month Horizon
            </h3>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date())
                setIsCalendarOpen(true)
              }}
              className="text-xs font-sans text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4"
            >
              Expand
            </button>
          </div>

          <p className="text-xs font-sans text-text-secondary">
            Select any day to inspect or add retroactive entries.
          </p>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-text-tertiary">
            {weekdayHeaders.map((weekday) => (
              <span key={weekday}>{weekday[0]}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {miniMonthCells.map((day) => {
              const summary = dateMoodSummary.get(day.dateKey)
              const isLogged = Boolean(summary)
              const entryCount = summary?.count ?? 0

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDate(day.dateKey)}
                  className={`py-1.5 px-0.5 text-center text-xs font-mono tabular-nums rounded-sm border transition-colors flex flex-col items-center justify-center gap-0.5 ${
                    isLogged
                      ? 'border-accent-primary/60 bg-accent-primary/10 text-accent-primary'
                      : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                  } ${day.inCurrentMonth ? '' : 'opacity-30'}`}
                  title={`${day.dateKey}: ${isLogged ? `${entryCount} entries (${getMoodLabel(summary?.averageMood ?? 3)})` : 'No entries'}`}
                >
                  <span>{day.day}</span>
                  <span
                    className={`h-1 w-1 rounded-full ${isLogged ? 'bg-accent-primary' : 'bg-transparent'}`}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        </aside>
      </div>

      {/* New Entry Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0"
            aria-label="Close modal"
          />

          <div className="relative z-10 w-full max-w-xl rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-xl font-serif font-normal text-text-primary">
                  New Journal Reflection
                </h3>
                <p className="text-xs font-mono text-text-tertiary">
                  Record self-honest thought &bull; <span className="tabular-nums">{toIndiaDateKey(new Date())}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary hover:border-border transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  Clinical Mood Scale
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {CLINICAL_MOOD_SCALE.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMood(option.value)}
                      className={`py-1.5 px-1 text-center rounded-sm border transition-colors ${
                        mood === option.value
                          ? 'border-accent-primary bg-accent-primary/15 text-text-primary font-medium'
                          : 'border-border-subtle text-text-secondary hover:border-border'
                      }`}
                    >
                      <div className="font-mono tabular-nums text-[10px] text-text-tertiary">0{option.value}</div>
                      <div className="truncate text-xs font-sans">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-text-secondary mb-1">
                  Brief about day / Core Reflection
                </label>
                <textarea
                  value={briefAboutDay}
                  onChange={(event) => setBriefAboutDay(event.target.value)}
                  rows={3}
                  placeholder="What was the dominant rhythm or weather today?"
                  className="w-full rounded-sm border border-border-subtle bg-background p-2.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans text-text-secondary mb-1">
                    What went well / Clarity
                  </label>
                  <input
                    type="text"
                    value={whatWentGood}
                    onChange={(event) => setWhatWentGood(event.target.value)}
                    placeholder="Small victory..."
                    className="w-full rounded-sm border border-border-subtle bg-background px-3 py-1.5 text-xs font-sans text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-text-secondary mb-1">
                    What did you learn?
                  </label>
                  <input
                    type="text"
                    value={whatYouLearned}
                    onChange={(event) => setWhatYouLearned(event.target.value)}
                    placeholder="Distilled insight..."
                    className="w-full rounded-sm border border-border-subtle bg-background px-3 py-1.5 text-xs font-sans text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-xs font-sans text-threat-critical">
                  Failed to save journal entry: {getReadableErrorMessage(createError)}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-sm border border-border-subtle px-3 py-1.5 text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !hasContent}
                  className="px-4 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monthly Horizon Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(false)}
            className="absolute inset-0"
            aria-label="Close monthly view"
          />

          <div className="relative z-10 w-full max-w-4xl rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-xl font-serif font-normal text-text-primary">
                  Chronicle Calendar &bull; {getMonthLabel(calendarMonth)}
                </h3>
                <p className="text-xs font-mono text-text-tertiary">
                  Click any date to inspect entries or record retroactive reflections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary hover:border-border transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-border transition-colors"
              >
                &larr; Previous Month
              </button>
              <span className="font-mono text-sm text-text-primary font-medium">
                {getMonthLabel(calendarMonth)}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-border transition-colors"
              >
                Next Month &rarr;
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs text-text-tertiary">
              {weekdayHeaders.map((weekday) => (
                <div key={weekday} className="py-1">{weekday}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((day) => {
                const summary = dateMoodSummary.get(day.dateKey)
                const isLogged = Boolean(summary)
                const entryCount = summary?.count ?? 0

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(day.dateKey)}
                    className={`h-20 p-2 text-left rounded-sm border transition-colors flex flex-col justify-between ${
                      isLogged
                        ? 'border-accent-primary/60 bg-accent-primary/10 text-text-primary hover:bg-accent-primary/20'
                        : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                    } ${day.inCurrentMonth ? '' : 'opacity-30'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono tabular-nums text-xs font-medium">{day.day}</span>
                      {entryCount > 1 && (
                        <span className="font-mono text-[10px] text-text-tertiary">
                          x{entryCount}
                        </span>
                      )}
                    </div>
                    {isLogged && (
                      <div className="font-mono text-[11px] text-accent-primary truncate">
                        {getMoodLabel(summary?.averageMood ?? 3)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Date detail modal */}
      {selectedDate && (
        <JournalDateModal
          selectedDate={selectedDate}
          entries={entries}
          isSaving={isPending}
          saveError={createError}
          onCreateEntry={createEntry}
          onDeleteEntry={(id) => deleteEntry(id)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

export default JournalPage

