import { useMemo, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import {
  mindOsHabitsQueryKey,
  useHabitWorkspace,
  useHabits,
  useMarkHabitDone,
} from '../../mind-os/api/useHabits'
import { useCreateJournalEntry, useJournalEntries } from '../../mind-os/api/useJournal'
import { systemStatusQueryKey } from '../../system/api/useSystemStatus'

function toIndiaDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  base.setUTCDate(base.getUTCDate() + days)
  const y = base.getUTCFullYear()
  const m = String(base.getUTCMonth() + 1).padStart(2, '0')
  const d = String(base.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getIndiaTodayDateKey() {
  return toIndiaDateKey(new Date())
}

function getIndiaWeekDateKeysMondayStart() {
  const today = new Date()
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(today)
  const weekdayIndexMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const dayInIndia = weekdayIndexMap[weekday] ?? 0
  const mondayOffset = dayInIndia === 0 ? -6 : 1 - dayInIndia
  const monday = addDays(getIndiaTodayDateKey(), mondayOffset)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

const moodOptions = [
  { value: 1, emoji: '\u{1F61E}' },
  { value: 2, emoji: '\u{1F610}' },
  { value: 3, emoji: '\u{1F642}' },
  { value: 4, emoji: '\u{1F604}' },
  { value: 5, emoji: '\u{1F525}' },
] as const

export default function EndOfDayCard() {
  const queryClient = useQueryClient()
  const { data: habits = [] } = useHabits()
  const { data: workspace } = useHabitWorkspace()
  const { data: journals = [] } = useJournalEntries()
  const { mutateAsync: createJournalEntry, isPending: isSavingCheckIn } = useCreateJournalEntry()
  const { mutateAsync: markHabitDone, isPending: isMarkingHabitDone } = useMarkHabitDone()

  const [selectedMood, setSelectedMood] = useState<number>(3)
  const [note, setNote] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const habitStatsById = useMemo(() => {
    const map = new Map<string, { completedToday: boolean; currentStreak: number }>()
    for (const habit of workspace?.habits ?? []) {
      map.set(habit.id, {
        completedToday: habit.completedToday,
        currentStreak: habit.currentStreak,
      })
    }
    return map
  }, [workspace?.habits])

  const weekDateKeys = useMemo(() => getIndiaWeekDateKeysMondayStart(), [])
  const journalDateSet = useMemo(() => {
    return new Set(journals.map((entry) => toIndiaDateKey(entry.created_at)))
  }, [journals])

  async function handleMarkDone(habitId: string, habitType: 'binary' | 'target', targetValue: number) {
    await markHabitDone({
      habitId,
      habitType,
      targetValue,
    })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mindOsHabitsQueryKey }),
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey }),
    ])
  }

  async function handleSaveCheckIn() {
    setSaveError('')
    setSaveMessage('')

    try {
      await createJournalEntry({
        entryDate: getIndiaTodayDateKey(),
        mood: selectedMood,
        whatWentGood: '',
        whatYouLearned: '',
        briefAboutDay: note.trim(),
      })

      setNote('')
      setSaveMessage('Logged')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save check-in.')
    }
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-[#0a0a0a] p-4">
      <h2 className="text-lg font-semibold text-slate-100">End of Day</h2>

      <section className="mt-4">
        <h3 className="text-sm font-semibold text-slate-200">Today's habits</h3>
        <ul className="mt-2 space-y-2">
          {habits.length === 0 ? (
            <li className="text-sm text-slate-400">No habits yet.</li>
          ) : (
            habits.map((habit) => {
              const stat = habitStatsById.get(habit.id)
              const completedToday = stat?.completedToday ?? false
              const currentStreak = stat?.currentStreak ?? 0

              return (
                <li key={habit.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-black p-2">
                  <div>
                    <p className="text-sm font-medium text-slate-100">{habit.title}</p>
                    <p className="text-xs text-slate-400">Streak: {currentStreak}</p>
                  </div>

                  {completedToday ? (
                    <span className="text-emerald-400" aria-label="Completed today">
                      ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isMarkingHabitDone}
                      onClick={() => handleMarkDone(habit.id, habit.habit_type, habit.target_value)}
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                    >
                      Mark Done
                    </button>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-200">Mood + quick note</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedMood(option.value)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedMood === option.value
                  ? 'border-slate-500 bg-slate-800 text-slate-100'
                  : 'border-slate-700 bg-black text-slate-300 hover:bg-slate-900'
              }`}
            >
              {option.emoji}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="One line about today... (optional)"
          rows={2}
          className="mt-2 w-full rounded-md border border-slate-800 bg-black p-2 text-sm text-slate-100"
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveCheckIn}
            disabled={isSavingCheckIn}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            {isSavingCheckIn ? 'Saving...' : 'Save check-in'}
          </button>
          {saveMessage ? <p className="text-sm text-emerald-400">{saveMessage}</p> : null}
          {saveError ? <p className="text-sm text-red-400">{saveError}</p> : null}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-200">This week</h3>
        <div className="mt-2 flex items-center gap-2">
          {weekDateKeys.map((dateKey, index) => {
            const filled = journalDateSet.has(dateKey)
            const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]
            return (
              <span
                key={dateKey}
                title={dayLabel}
                className={`h-2.5 w-2.5 rounded-full border ${
                  filled ? 'border-slate-300 bg-slate-300' : 'border-slate-700 bg-transparent'
                }`}
              />
            )
          })}
        </div>
      </section>
    </article>
  )
}
