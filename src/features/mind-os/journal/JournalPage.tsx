import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useCreateJournalEntry, useJournalEntries } from '../api/useJournal'
import JournalDateModal from './JournalDateModal'
import {
  buildMonthGrid,
  formatIndiaDateTime,
  getMonthLabel,
  shiftMonth,
  toIndiaDateKey,
  toIndiaTimeParts,
} from '../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const moodOptions = [
  { value: 1, emoji: '\u{1F62D}', label: 'Very Low' },
  { value: 2, emoji: '\u{1F614}', label: 'Low' },
  { value: 3, emoji: '\u{1F610}', label: 'Stable' },
  { value: 4, emoji: '\u{1F60E}', label: 'Good' },
  { value: 5, emoji: '\u{1F525}', label: 'Excellent' },
] as const

const greenReplicaButtonClass =
  'border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2'

function moodToEmoji(mood: number) {
  return moodOptions.find((option) => option.value === mood)?.emoji ?? '\u{1F642}'
}

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

function AnalogClockWidget() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const { hour, minute, second } = toIndiaTimeParts(now)
  const hourDegrees = (hour % 12) * 30 + minute * 0.5
  const minuteDegrees = minute * 6 + second * 0.1
  const secondDegrees = second * 6

  return (
    <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
      <h2 className="text-lg font-semibold text-slate-100">IST Clock</h2>
      <p className="mt-1 text-xs text-slate-400">Asia/Kolkata</p>

      <div className="mx-auto mt-4 h-40 w-40 rounded-full border border-[#222222] bg-black p-2">
        <div className="relative h-full w-full rounded-full border border-[#222222]">
          {[...Array(12)].map((_, index) => (
            <span
              key={index}
              className="absolute left-1/2 top-1/2 block h-1 w-1 rounded-full bg-slate-400"
              style={{
                transform: `rotate(${index * 30}deg) translateY(-64px)`,
                transformOrigin: 'center',
              }}
            />
          ))}

          <span
            className="absolute left-1/2 top-1/2 block h-10 w-1 -translate-x-1/2 -translate-y-full rounded bg-slate-100"
            style={{ transform: `translate(-50%, -100%) rotate(${hourDegrees}deg)`, transformOrigin: 'bottom center' }}
          />
          <span
            className="absolute left-1/2 top-1/2 block h-14 w-1 -translate-x-1/2 -translate-y-full rounded bg-slate-300"
            style={{ transform: `translate(-50%, -100%) rotate(${minuteDegrees}deg)`, transformOrigin: 'bottom center' }}
          />
          <span
            className="absolute left-1/2 top-1/2 block h-16 w-[2px] -translate-x-1/2 -translate-y-full rounded bg-emerald-400"
            style={{ transform: `translate(-50%, -100%) rotate(${secondDegrees}deg)`, transformOrigin: 'bottom center' }}
          />
          <span className="absolute left-1/2 top-1/2 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100" />
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-slate-200">{formatIndiaDateTime(now)}</p>
    </article>
  )
}

function PenIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 20l4.5-1 9-9a1.8 1.8 0 000-2.5l-1-1a1.8 1.8 0 00-2.5 0l-9 9L4 20z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 7l4 4" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function JournalPage() {
  const { data: entries = [], isLoading, isError } = useJournalEntries()
  const { mutate: createEntry, isPending, error: createError } = useCreateJournalEntry()

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
    <section className="space-y-4 bg-black pb-24">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article
          className="cursor-pointer rounded-xl border border-[#222222] bg-[#0a0a0a] p-4"
          onClick={() => {
            setCalendarMonth(new Date())
            setIsCalendarOpen(true)
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Journal Calendar</h2>
            <span className="rounded-md border border-[#222222] px-2 py-1 text-xs text-slate-300">Open</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Logged days are green with mood emoji.</p>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
            {weekdayHeaders.map((weekday) => (
              <p key={weekday}>{weekday}</p>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {miniMonthCells.map((day) => {
              const summary = dateMoodSummary.get(day.dateKey)
              const isLogged = Boolean(summary)
              const entryCount = summary?.count ?? 0

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedDate(day.dateKey)
                  }}
                  className={`rounded border p-1 text-center text-xs ${
                    isLogged
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-[#222222] bg-[#0a0a0a] text-slate-400'
                  } cursor-pointer transition-colors hover:bg-[#222222] ${day.inCurrentMonth ? '' : 'opacity-40'}`}
                >
                  <p>{day.day}</p>
                  <p className="leading-none">{summary ? moodToEmoji(summary.averageMood) : ''}</p>
                  {entryCount > 1 ? (
                    <span className="absolute right-0.5 top-0.5 rounded-full border border-[#222222] bg-black px-1 text-[9px] leading-4 text-slate-300">
                      x{entryCount}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </article>

        <AnalogClockWidget />
      </div>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Journal Entries</h2>

        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading entries...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">Failed to load entries.</p> : null}

        {!isLoading && !isError && entries.length === 0 ? <p className="mt-3 text-sm text-slate-400">No journal entries yet.</p> : null}

        <ul className="mt-3 space-y-3">
          {entries.slice(0, 10).map((entry) => (
            <li key={entry.id} className="rounded-lg border border-[#222222] bg-black p-3">
              <p className="text-sm text-slate-300">
                {moodToEmoji(entry.mood)} {formatIndiaDateTime(entry.created_at)}
              </p>
              <p className="mt-1 text-sm text-slate-200">{entry.what_went_good || 'No note added.'}</p>
            </li>
          ))}
        </ul>
      </article>

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#222222] bg-[#0a0a0a] text-slate-100 shadow-xl shadow-black/60 transition hover:bg-[#222222]"
        aria-label="Create journal entry"
      >
        <PenIcon />
      </button>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-black/85"
            aria-label="Close journal entry modal"
          />

          <article className="relative z-10 h-[88vh] w-[96vw] max-w-4xl overflow-auto rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">New Journal Entry</h2>
                <p className="text-sm text-slate-400">Capture what went good, your mood, learnings, and day summary.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#222222] bg-black text-slate-100 hover:bg-[#222222]"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm text-slate-300">Mood Selector</p>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMood(option.value)}
                      style={{
                        fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
                      }}
                      className={`rounded-md border px-3 py-1 text-lg ${
                        mood === option.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[#222222] bg-black hover:bg-[#222222]'
                      }`}
                      title={option.label}
                    >
                      {option.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm text-slate-300">
                What went good
                <textarea
                  value={whatWentGood}
                  onChange={(event) => setWhatWentGood(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-slate-100"
                />
              </label>

              <label className="block text-sm text-slate-300">
                What you've learned
                <textarea
                  value={whatYouLearned}
                  onChange={(event) => setWhatYouLearned(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-slate-100"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Brief about day
                <textarea
                  value={briefAboutDay}
                  onChange={(event) => setBriefAboutDay(event.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-slate-100"
                />
              </label>

              {createError ? (
                <p className="text-sm text-red-400">Failed to save journal entry: {getReadableErrorMessage(createError)}</p>
              ) : null}

              <button type="submit" disabled={isPending || !hasContent} className={`w-full ${greenReplicaButtonClass} disabled:opacity-60`}>
                {isPending ? 'Saving...' : 'Save Entry'}
              </button>
            </form>
          </article>
        </div>
      ) : null}

      {isCalendarOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
          <section className="h-[92vh] w-[96vw] max-w-6xl overflow-auto rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Journal Calendar View</h3>
                <p className="text-xs text-slate-400">Click any date to open timeline and add retroactive entries.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-md border border-[#222222] px-3 py-1 text-sm text-slate-100 hover:bg-[#222222]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded-md border border-[#222222] px-3 py-1 text-sm text-slate-100 hover:bg-[#222222]"
              >
                Previous
              </button>
              <p className="text-base font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-md border border-[#222222] px-3 py-1 text-sm text-slate-100 hover:bg-[#222222]"
              >
                Next
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
              {weekdayHeaders.map((weekday) => (
                <p key={weekday}>{weekday}</p>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthCells.map((day) => {
                const summary = dateMoodSummary.get(day.dateKey)
                const isLogged = Boolean(summary)
                const entryCount = summary?.count ?? 0

                return (
                  <div key={day.dateKey} className="group relative">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(day.dateKey)}
                      className={`w-full rounded-md border p-2 text-left transition ${
                        isLogged
                          ? 'cursor-pointer border-emerald-500/70 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                          : 'cursor-pointer border-[#222222] bg-[#0a0a0a] text-slate-400 hover:bg-[#222222]'
                      } ${day.inCurrentMonth ? '' : 'opacity-40'} cursor-pointer hover:bg-[#222222] transition-colors`}
                    >
                      <p className="text-sm font-semibold">{day.day}</p>
                      <p className="mt-2 text-lg leading-none">{summary ? moodToEmoji(summary.averageMood) : ''}</p>
                      {entryCount > 1 ? (
                        <span className="absolute right-1 top-1 rounded-full border border-[#222222] bg-black px-1.5 text-[10px] leading-4 text-slate-300">
                          x{entryCount}
                        </span>
                      ) : null}
                    </button>

                    {summary ? (
                      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#222222] bg-black px-2 py-1 text-[11px] text-slate-100 group-hover:block">
                        Avg mood: {moodToEmoji(summary.averageMood)} ({entryCount} entries)
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}

      {selectedDate ? (
        <JournalDateModal
          selectedDate={selectedDate}
          entries={entries}
          isSaving={isPending}
          saveError={createError}
          onCreateEntry={createEntry}
          onClose={() => setSelectedDate(null)}
        />
      ) : null}
    </section>
  )
}

export default JournalPage
