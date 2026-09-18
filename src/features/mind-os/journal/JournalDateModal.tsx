import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { DeleteButton } from '../../../components/DeleteButton'
import type { JournalEntry } from '../api/useJournal'
import {
  formatIndiaDateTime,
  toIndiaDateKey,
  CLINICAL_MOOD_SCALE,
  getMoodLabel,
} from '../utils/date'

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
  onDeleteEntry: (id: string) => void
  onClose: () => void
}

function JournalDateModal({
  selectedDate,
  entries,
  isSaving,
  saveError,
  onCreateEntry,
  onDeleteEntry,
  onClose,
}: JournalDateModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close journal date modal"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl text-text-primary">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-xl font-serif font-normal text-text-primary">
              {formatSelectedDateLabel(selectedDate)}
            </h3>
            <p className="text-xs font-mono text-text-tertiary">
              Chronicle timeline &bull; <span className="tabular-nums">{selectedDate}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            Close
          </button>
        </div>

        {!isCreateMode ? (
          <div className="mt-4 space-y-4">
            <div className="max-h-[50vh] space-y-3 overflow-auto pr-1 divide-y divide-border-subtle/50">
              {entriesForDate.length === 0 ? (
                <p className="py-6 text-center text-sm font-serif italic text-text-tertiary">
                  No reflections recorded for this day yet.
                </p>
              ) : (
                entriesForDate.map((entry) => (
                  <article key={entry.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-secondary border border-border-subtle px-1.5 py-0.5 rounded-sm bg-elevated/40">
                          {getMoodLabel(entry.mood)} [0{entry.mood}]
                        </span>
                        <span className="font-mono tabular-nums text-xs text-text-tertiary">
                          {formatIndiaDateTime(entry.updated_at || entry.created_at)}
                        </span>
                      </div>
                      <DeleteButton
                        onClick={() => {
                          const confirmed = window.confirm('Delete this journal entry?')
                          if (!confirmed) return
                          onDeleteEntry(entry.id)
                        }}
                      />
                    </div>

                    <div className="space-y-1.5 text-sm font-serif text-text-primary">
                      {entry.brief_about_day && (
                        <p className="leading-relaxed italic">&ldquo;{entry.brief_about_day}&rdquo;</p>
                      )}
                      {entry.what_went_good && (
                        <p className="text-xs font-sans text-text-secondary">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mr-1.5">
                            Clarity:
                          </span>
                          {entry.what_went_good}
                        </p>
                      )}
                      {entry.what_you_learned && (
                        <p className="text-xs font-sans text-text-secondary">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary mr-1.5">
                            Distilled:
                          </span>
                          {entry.what_you_learned}
                        </p>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsCreateMode(true)}
                className="px-3.5 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium"
              >
                + Record Entry for This Date
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                Brief about day / Reflection
              </label>
              <textarea
                value={briefAboutDay}
                onChange={(event) => setBriefAboutDay(event.target.value)}
                rows={3}
                placeholder="Self-honest observation..."
                className="w-full rounded-sm border border-border-subtle bg-background p-2.5 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-text-secondary mb-1">
                  Topic of the day / What went well
                </label>
                <input
                  type="text"
                  value={whatWentGood}
                  onChange={(event) => setWhatWentGood(event.target.value)}
                  placeholder="Small victory or clarity..."
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

            {saveError ? (
              <p className="text-xs font-sans text-threat-critical">
                Failed to save journal entry: {getReadableErrorMessage(saveError)}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsCreateMode(false)}
                className="rounded-sm border border-border-subtle px-3 py-1.5 text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
              >
                Back to Entries
              </button>
              <button
                type="submit"
                disabled={isSaving || !hasContent}
                className="px-4 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default JournalDateModal

