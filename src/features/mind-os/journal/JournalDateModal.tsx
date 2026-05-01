import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { JournalEntry } from '../api/useJournal'
import { formatIndiaDateTime, toIndiaDateKey } from '../utils/date'

const moodOptions = [
  { value: 1, emoji: '\u{1F61E}', label: 'Very Low' },
  { value: 2, emoji: '\u{1F610}', label: 'Low' },
  { value: 3, emoji: '\u{1F642}', label: 'Stable' },
  { value: 4, emoji: '\u{1F604}', label: 'Good' },
  { value: 5, emoji: '\u{1F525}', label: 'Excellent' },
] as const

const greenReplicaButtonClass =
  'border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2'

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

function moodToEmoji(mood: number) {
  return moodOptions.find((option) => option.value === mood)?.emoji ?? '\u{1F642}'
}

function formatSelectedDateLabel(selectedDate: string): string {
  const [year, month, day] = selectedDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

type CreatePayload = {
  entryDate: string
  mood: number
  whatWentGood: string
  whatYouLearned: string
  briefAboutDay: string
}

type JournalDateModalProps = {
  selectedDate: string
  entries: JournalEntry[]
  isSaving: boolean
  saveError: unknown
  onCreateEntry: (payload: CreatePayload, callbacks: { onSuccess: () => void }) => void
  onClose: () => void
}

function JournalDateModal({ selectedDate, entries, isSaving, saveError, onCreateEntry, onClose }: JournalDateModalProps) {
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [mood, setMood] = useState<number>(3)
  const [whatWentGood, setWhatWentGood] = useState('')
  const [whatYouLearned, setWhatYouLearned] = useState('')
  const [briefAboutDay, setBriefAboutDay] = useState('')

  const entriesForDate = useMemo(() => {
    return entries
      .filter((entry) => toIndiaDateKey(entry.created_at) === selectedDate)
      .sort((left, right) => (left.created_at < right.created_at ? -1 : 1))
  }, [entries, selectedDate])

  const hasContent = [whatWentGood, whatYouLearned, briefAboutDay].some((item) => item.trim().length > 0)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    onCreateEntry(
      {
        entryDate: selectedDate,
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
          setIsCreateMode(false)
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="Close journal date modal" />

      <article className="relative z-10 w-full max-w-3xl rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">{formatSelectedDateLabel(selectedDate)}</h3>
            <p className="text-xs text-slate-400">Journal timeline for selected date</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#222222] bg-black px-3 py-1 text-sm text-slate-200 hover:bg-[#222222]"
          >
            Close
          </button>
        </div>

        {!isCreateMode ? (
          <div className="mt-4 space-y-3">
            <div className="max-h-[45vh] space-y-2 overflow-auto pr-1">
              {entriesForDate.length === 0 ? (
                <p className="rounded border border-[#222222] bg-black p-3 text-sm text-slate-400">No entries logged for this day yet.</p>
              ) : (
                entriesForDate.map((entry) => (
                  <article key={entry.id} className="rounded border border-[#222222] bg-black p-3">
                    <p className="text-sm text-slate-300">
                      {moodToEmoji(entry.mood)} {formatIndiaDateTime(entry.created_at)}
                    </p>
                    <div className="mt-2 space-y-2 text-sm text-slate-300 whitespace-pre-wrap">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Topic of the day</p>
                        <p>{entry.what_went_good || 'No note added.'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">What you've learned</p>
                        <p>{entry.what_you_learned || 'No note added.'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Brief about day</p>
                        <p>{entry.brief_about_day || 'No note added.'}</p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <button type="button" onClick={() => setIsCreateMode(true)} className={greenReplicaButtonClass}>
              + Create New Entry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm text-slate-300">Mood Selector</p>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`rounded-md border px-3 py-1 text-lg ${
                      mood === option.value ? 'border-emerald-700 bg-emerald-950/20' : 'border-[#222222] bg-black hover:bg-[#222222]'
                    }`}
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm text-slate-300">
              Topic of the day
              <textarea
                value={whatWentGood}
                onChange={(event) => setWhatWentGood(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-[#222222] bg-black p-2 text-slate-100"
              />
            </label>

            <label className="block text-sm text-slate-300">
              What you've learned
              <textarea
                value={whatYouLearned}
                onChange={(event) => setWhatYouLearned(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-[#222222] bg-black p-2 text-slate-100"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Brief about day
              <textarea
                value={briefAboutDay}
                onChange={(event) => setBriefAboutDay(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded border border-[#222222] bg-black p-2 text-slate-100"
              />
            </label>

            {saveError ? <p className="text-sm text-red-400">Failed to save journal entry: {getReadableErrorMessage(saveError)}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={isSaving || !hasContent} className={`${greenReplicaButtonClass} disabled:opacity-60`}>
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateMode(false)}
                className="rounded border border-[#222222] bg-black px-4 py-2 text-slate-200 hover:bg-[#222222]"
              >
                Back to Entries
              </button>
            </div>
          </form>
        )}
      </article>
    </div>
  )
}

export default JournalDateModal
