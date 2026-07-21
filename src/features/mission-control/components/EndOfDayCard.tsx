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
import { useEveningSync } from '../../system/api/useEveningSync'
import { useEventBus } from '../../../store/useEventBus'

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
  
  const { mutate: executeEveningSync, isPending: isSyncing } = useEveningSync()
  const pendingEventsCount = useEventBus((s) => s.recentEvents.length)

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
    <div className="mx-auto max-w-3xl space-y-16 pb-8">
      {/* 1. FINALIZE HABITS */}
      <section>
        <h3 className="mb-6 text-center font-mono text-xs tracking-widest text-slate-500 uppercase">1. Finalize Habits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.length === 0 ? (
            <div className="col-span-2 text-center text-xs text-slate-500">No habits yet.</div>
          ) : (
            habits.map((habit) => {
              const stat = habitStatsById.get(habit.id)
              const completedToday = stat?.completedToday ?? false
              const currentStreak = stat?.currentStreak ?? 0

              return (
                <div key={habit.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{habit.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Streak: {currentStreak}</p>
                  </div>

                  {completedToday ? (
                    <span className="px-4 text-sm font-medium text-green-500/80">Done</span>
                  ) : (
                    <button
                      type="button"
                      disabled={isMarkingHabitDone}
                      onClick={() => handleMarkDone(habit.id, habit.habit_type, habit.target_value)}
                      className="rounded-lg border border-border bg-[#111111] px-4 py-1.5 text-xs text-slate-300 transition-colors hover:bg-[#222222] disabled:opacity-60"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* 2. REFLECTION */}
      <section className="mx-auto max-w-md space-y-6 text-center">
        <h3 className="mb-2 font-mono text-xs tracking-widest text-slate-500 uppercase">2. Reflection</h3>
        
        <div className="flex justify-center gap-4">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedMood(option.value)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl transition-all ${
                selectedMood === option.value
                  ? 'border-indigo-500/50 bg-indigo-500/10 grayscale-0'
                  : 'border-border bg-surface opacity-60 grayscale hover:bg-[#111111] hover:opacity-100'
              }`}
            >
              {option.emoji}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Write a brief reflection... (optional)"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-[#111111] p-4 text-sm text-slate-200 transition-colors placeholder:text-slate-600 focus:border-slate-500 focus:outline-none"
        />

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCheckIn}
            disabled={isSavingCheckIn}
            className="rounded-lg border border-border px-8 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-[#111111] disabled:opacity-60"
          >
            {isSavingCheckIn ? 'Saving...' : 'Save Check-In'}
          </button>
          {saveMessage ? <p className="text-xs text-green-500/80">{saveMessage}</p> : null}
          {saveError ? <p className="text-xs text-red-500/80">{saveError}</p> : null}
        </div>
      </section>

      {/* 3. CONSISTENCY */}
      <section className="mx-auto max-w-sm text-center">
        <h3 className="mb-6 font-mono text-xs tracking-widest text-slate-500 uppercase">Consistency</h3>
        <div className="flex justify-center gap-6">
          {weekDateKeys.map((dateKey, index) => {
            const filled = journalDateSet.has(dateKey)
            const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]
            return (
              <div key={dateKey} className="flex flex-col items-center gap-2">
                <div 
                  className={`h-2 w-2 rounded-full transition-all ${
                    filled ? 'bg-indigo-500' : 'bg-[#222222]'
                  }`} 
                />
                <span className="font-mono text-xs tracking-widest text-slate-500 uppercase">{dayLabel}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. EXECUTE EVENING SYNC */}
      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="font-mono text-xs tracking-widest text-slate-500">{pendingEventsCount} Pending System Events</p>
        <button
          type="button"
          disabled={isSyncing}
          onClick={() => executeEveningSync()}
          className="rounded-lg border border-border bg-surface px-10 py-3 font-mono text-xs tracking-widest text-slate-300 uppercase transition-all hover:bg-[#111111] hover:text-slate-100 disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Execute Evening Sync'}
        </button>
      </div>
    </div>
  )
}
