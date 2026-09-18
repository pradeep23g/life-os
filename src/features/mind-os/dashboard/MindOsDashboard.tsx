import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntryMood,
} from '../api/useJournal'
import {
  useHabitWorkspace,
  useMarkHabitDone,
  useUndoHabitDone,
  useAdjustHabitCount,
  useCreateHabit,
  type HabitType,
} from '../api/useHabits'
import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import {
  formatIndiaDate,
  formatIndiaDateTime,
  getTodayIndiaDateKey,
  toIndiaDateKey,
  CLINICAL_MOOD_SCALE,
  getMoodLabel,
  getPast7DayKeys,
  calculateHabit30DayConsistency,
} from '../utils/date'

export default function MindOsDashboard() {
  const { data: journals = [], isLoading: journalsLoading } = useJournalEntries()
  const { data: habitWorkspace, isLoading: habitsLoading } = useHabitWorkspace()
  const { data: eventsAnalytics, isLoading: eventsLoading } = useEventsAnalytics()

  const { mutate: createJournalEntry, isPending: isCreatingJournal } = useCreateJournalEntry()
  const { mutate: updateJournalMood, isPending: isUpdatingMood } = useUpdateJournalEntryMood()
  const { mutate: markHabitDone, isPending: isMarkingDone } = useMarkHabitDone()
  const { mutate: undoHabitDone, isPending: isUndoingHabit } = useUndoHabitDone()
  const { mutate: adjustHabitCount, isPending: isAdjustingCount } = useAdjustHabitCount()
  const { mutate: createHabit, isPending: isCreatingHabit } = useCreateHabit()

  // Inline Quick-Entry State (Zone 1)
  const [isQuickWriteOpen, setIsQuickWriteOpen] = useState(false)
  const [quickMood, setQuickMood] = useState<number>(3)
  const [quickReflection, setQuickReflection] = useState('')
  const [quickWentGood, setQuickWentGood] = useState('')
  const [quickLearned, setQuickLearned] = useState('')
  const [showDeepPrompts, setShowDeepPrompts] = useState(false)
  const [quickWriteError, setQuickWriteError] = useState<string | null>(null)

  // Quick Add Habit State (Zone 2)
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [newHabitType, setNewHabitType] = useState<HabitType>('binary')
  const [newHabitTarget, setNewHabitTarget] = useState('1')
  const [newHabitUnit, setNewHabitUnit] = useState('')
  const [addHabitError, setAddHabitError] = useState<string | null>(null)

  const todayKey = getTodayIndiaDateKey()
  const past7Days = getPast7DayKeys(todayKey)

  // Identify latest journal reflection and today's entry
  const latestJournal = journals[0]
  const todayJournal = journals.find((j) => toIndiaDateKey(j.created_at) === todayKey)
  const currentMoodValue = todayJournal ? todayJournal.mood : latestJournal ? latestJournal.mood : 3

  const habits = habitWorkspace?.habits ?? []
  const logValueByHabitDate = habitWorkspace?.logValueByHabitDate ?? {}
  const consistencyPercent = eventsAnalytics?.consistencyPercent ?? 0

  // Quick reflection submission handler
  const handleQuickWriteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuickWriteError(null)

    if (quickReflection.trim().length === 0 && quickWentGood.trim().length === 0 && quickLearned.trim().length === 0) {
      setQuickWriteError('Please enter a brief thought or reflection.')
      return
    }

    createJournalEntry(
      {
        entryDate: todayKey,
        mood: quickMood,
        briefAboutDay: quickReflection.trim(),
        whatWentGood: quickWentGood.trim(),
        whatYouLearned: quickLearned.trim(),
      },
      {
        onSuccess: () => {
          setQuickReflection('')
          setQuickWentGood('')
          setQuickLearned('')
          setShowDeepPrompts(false)
          setIsQuickWriteOpen(false)
        },
        onError: (err) => {
          setQuickWriteError(err instanceof Error ? err.message : 'Failed to record reflection.')
        },
      },
    )
  }

  // Quick mood scale toggle handler
  const handleMoodSelect = (moodVal: number) => {
    if (todayJournal) {
      updateJournalMood({ id: todayJournal.id, mood: moodVal })
    } else {
      createJournalEntry({
        entryDate: todayKey,
        mood: moodVal,
        briefAboutDay: '',
        whatWentGood: '',
        whatYouLearned: '',
      })
    }
  }

  // Quick Habit creation handler
  const handleCreateHabitSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddHabitError(null)
    const trimmedTitle = newHabitTitle.trim()
    if (!trimmedTitle) {
      setAddHabitError('Habit title is required.')
      return
    }

    const targetVal = newHabitType === 'target' ? Math.max(1, Number(newHabitTarget) || 1) : 1

    createHabit(
      {
        title: trimmedTitle,
        habitType: newHabitType,
        targetValue: targetVal,
        unit: newHabitUnit.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewHabitTitle('')
          setNewHabitType('binary')
          setNewHabitTarget('1')
          setNewHabitUnit('')
          setIsAddHabitOpen(false)
        },
        onError: (err) => {
          setAddHabitError(err instanceof Error ? err.message : 'Failed to create habit.')
        },
      },
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-12 text-text-primary">
      {/* Swiss Header: The Study & Sanctuary */}
      <header className="border-b border-border-subtle pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Room 03 • The Sanctuary
            </span>
            <span className="text-text-tertiary font-mono text-xs">•</span>
            <span className="font-mono tabular-nums text-xs text-text-tertiary">
              IST {todayKey}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-text-primary">
            The Study
          </h1>
          <p className="text-sm font-sans text-text-secondary max-w-xl">
            A quiet space for psychological self-honesty, cognitive restoration, and daily habit rhythms.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-text-tertiary uppercase tracking-wider">30-Day Pulse</div>
            <div className="text-base font-mono tabular-nums text-text-primary font-medium">
              {eventsLoading ? '--' : `${consistencyPercent}%`}
            </div>
          </div>
          <div className="h-7 w-px bg-border-subtle" aria-hidden="true" />
          <div className="text-right">
            <div className="text-text-tertiary uppercase tracking-wider">Active Rhythms</div>
            <div className="text-base font-mono tabular-nums text-text-primary font-medium">
              {habitsLoading ? '--' : habits.length}
            </div>
          </div>
        </div>
      </header>

      {/* Primary Asymmetric Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Chronicle (Zone 1) & Clinical Mood Scale (Zone 3) */}
        <div className="space-y-10">
          
          {/* ZONE 1 — CHRONICLE */}
          <section className="space-y-4" aria-labelledby="chronicle-heading">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h2 id="chronicle-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Zone 01 • Chronicle
              </h2>
              <Link
                to="journal"
                className="text-xs font-sans text-text-secondary hover:text-text-primary transition-colors underline-offset-4 hover:underline"
              >
                Open Full Archive
              </Link>
            </div>

            {/* Latest Reflection: Literary Newsreader serif presentation */}
            <article className="py-2 space-y-4">
              {journalsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-elevated/40 rounded-sm w-3/4" />
                  <div className="h-4 bg-elevated/40 rounded-sm w-1/2" />
                </div>
              ) : latestJournal ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono tabular-nums text-xs text-text-tertiary">
                      {formatIndiaDateTime(latestJournal.created_at)}
                    </span>
                    <span className="font-mono text-xs text-text-secondary border border-border-subtle px-2 py-0.5 rounded-sm bg-surface/30">
                      Tone: {getMoodLabel(latestJournal.mood)} [{latestJournal.mood}/5]
                    </span>
                  </div>

                  <blockquote className="text-xl sm:text-2xl font-serif font-light text-text-primary leading-relaxed text-balance">
                    &ldquo;{latestJournal.brief_about_day || latestJournal.what_went_good || latestJournal.what_you_learned || 'An unwritten moment.'}&rdquo;
                  </blockquote>

                  {/* Deeper reflection notes if present */}
                  {(latestJournal.what_went_good || latestJournal.what_you_learned) && (
                    <div className="pt-2 space-y-2 text-sm font-serif text-text-secondary border-t border-border-subtle/50">
                      {latestJournal.what_went_good && (
                        <p className="leading-snug">
                          <span className="font-sans text-xs font-medium uppercase tracking-wider text-text-tertiary mr-2">
                            Clarity:
                          </span>
                          {latestJournal.what_went_good}
                        </p>
                      )}
                      {latestJournal.what_you_learned && (
                        <p className="leading-snug">
                          <span className="font-sans text-xs font-medium uppercase tracking-wider text-text-tertiary mr-2">
                            Distilled:
                          </span>
                          {latestJournal.what_you_learned}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-text-tertiary font-serif italic text-base">
                  No reflections recorded yet. Record your internal weather below.
                </div>
              )}
            </article>

            {/* Quick-Entry Action: Unobtrusive inline prompt */}
            <div className="pt-2">
              {!isQuickWriteOpen ? (
                <button
                  type="button"
                  onClick={() => setIsQuickWriteOpen(true)}
                  className="w-full text-left py-2.5 px-3 border border-border-subtle rounded-sm hover:border-border text-text-secondary hover:text-text-primary transition-colors text-sm font-sans flex items-center justify-between group"
                >
                  <span className="font-mono text-xs text-text-tertiary group-hover:text-text-secondary">
                    &gt; Record thought...
                  </span>
                  <span className="text-xs text-text-tertiary font-sans">
                    [ Write ]
                  </span>
                </button>
              ) : (
                <form
                  onSubmit={handleQuickWriteSubmit}
                  className="border border-border-subtle rounded-sm p-4 space-y-4 bg-elevated/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif italic text-sm text-text-secondary">
                      What is your internal weather?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsQuickWriteOpen(false)}
                      className="text-xs font-mono text-text-tertiary hover:text-text-primary"
                    >
                      [ Dismiss ]
                    </button>
                  </div>

                  {/* Mood Selector inside quick entry */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">
                      Select Tone:
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {CLINICAL_MOOD_SCALE.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setQuickMood(item.value)}
                          className={`py-1.5 px-1 text-center text-xs font-sans rounded-sm border transition-colors ${
                            quickMood === item.value
                              ? 'border-accent-primary bg-accent-primary/15 text-text-primary font-medium'
                              : 'border-border-subtle text-text-secondary hover:border-border'
                          }`}
                        >
                          <div className="font-mono tabular-nums text-[10px] text-text-tertiary">0{item.value}</div>
                          <div className="truncate text-xs">{item.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reflection Textarea */}
                  <div>
                    <label htmlFor="quick-reflection-input" className="sr-only">
                      Reflection Note
                    </label>
                    <textarea
                      id="quick-reflection-input"
                      rows={3}
                      value={quickReflection}
                      onChange={(e) => setQuickReflection(e.target.value)}
                      placeholder="Write your honest thought or observation..."
                      className="w-full bg-background border border-border-subtle rounded-sm p-3 text-sm font-serif text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                      autoFocus
                    />
                  </div>

                  {/* Progressive Disclosure for deeper fields */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowDeepPrompts((prev) => !prev)}
                      className="text-xs font-mono text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      {showDeepPrompts ? '[-] Less prompts' : '[+] Add clarity & distilled lesson'}
                    </button>

                    {showDeepPrompts && (
                      <div className="mt-3 space-y-3 border-t border-border-subtle/50 pt-3">
                        <div>
                          <label className="block text-xs font-sans text-text-secondary mb-1">
                            What went well today?
                          </label>
                          <input
                            type="text"
                            value={quickWentGood}
                            onChange={(e) => setQuickWentGood(e.target.value)}
                            placeholder="Clarity or small victory..."
                            className="w-full bg-background border border-border-subtle rounded-sm px-3 py-1.5 text-xs font-sans text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-sans text-text-secondary mb-1">
                            What did you learn?
                          </label>
                          <input
                            type="text"
                            value={quickLearned}
                            onChange={(e) => setQuickLearned(e.target.value)}
                            placeholder="Distilled insight..."
                            className="w-full bg-background border border-border-subtle rounded-sm px-3 py-1.5 text-xs font-sans text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {quickWriteError && (
                    <p className="text-xs font-sans text-threat-critical">{quickWriteError}</p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickWriteOpen(false)}
                      className="px-3 py-1.5 text-xs font-sans text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingJournal}
                      className="px-4 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium disabled:opacity-50"
                    >
                      {isCreatingJournal ? 'Recording...' : 'Record Reflection'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* ZONE 3 — CLINICAL MOOD SCALE */}
          <section className="space-y-4 border-t border-border-subtle pt-6" aria-labelledby="mood-scale-heading">
            <div className="flex items-center justify-between">
              <h2 id="mood-scale-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Zone 03 • Internal Tone Scale
              </h2>
              <span className="font-mono tabular-nums text-xs text-text-tertiary">
                {todayJournal ? 'Recorded for Today' : 'Select Today\'s Tone'}
              </span>
            </div>

            <p className="text-xs font-sans text-text-secondary">
              Clinical 5-step weather evaluation. Direct click sets or updates today&apos;s internal baseline.
            </p>

            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Clinical Tone Scale">
              {CLINICAL_MOOD_SCALE.map((tone) => {
                const isCurrent = currentMoodValue === tone.value
                return (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => handleMoodSelect(tone.value)}
                    disabled={isUpdatingMood || isCreatingJournal}
                    title={tone.description}
                    className={`py-3 px-2 text-center rounded-sm border transition-all flex flex-col items-center justify-between gap-1 group ${
                      isCurrent
                        ? 'border-accent-primary bg-accent-primary/10 text-text-primary shadow-sm'
                        : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                    }`}
                  >
                    <span className="font-mono tabular-nums text-[11px] text-text-tertiary group-hover:text-text-secondary">
                      0{tone.value}
                    </span>
                    <span className="text-xs font-sans font-medium truncate w-full">
                      {tone.label}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        isCurrent ? 'bg-accent-primary' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </div>

            <div className="text-[11px] font-mono text-text-tertiary">
              Current state: <span className="text-text-secondary">{getMoodLabel(currentMoodValue)}</span> &bull;{' '}
              {CLINICAL_MOOD_SCALE.find((t) => t.value === currentMoodValue)?.description}
            </div>
          </section>

        </div>

        {/* Right Column: Rhythm Ledger (Zone 2) */}
        <section className="space-y-6" aria-labelledby="rhythm-ledger-heading">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div>
              <h2 id="rhythm-ledger-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Zone 02 • Rhythm Ledger
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddHabitOpen((prev) => !prev)}
                className="text-xs font-sans text-text-secondary hover:text-text-primary transition-colors underline-offset-4 hover:underline"
              >
                {isAddHabitOpen ? 'Close Form' : '+ New Habit'}
              </button>
              <span className="text-text-tertiary font-mono text-xs">•</span>
              <Link
                to="habits"
                className="text-xs font-sans text-text-secondary hover:text-text-primary transition-colors underline-offset-4 hover:underline"
              >
                Full Ledger
              </Link>
            </div>
          </div>

          {/* Inline Habit Creation Form */}
          {isAddHabitOpen && (
            <form
              onSubmit={handleCreateHabitSubmit}
              className="border border-border-subtle rounded-sm p-4 space-y-3 bg-elevated/20 text-xs font-sans"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif italic text-sm text-text-secondary">
                  Establish a Behavioral Rhythm
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddHabitOpen(false)}
                  className="font-mono text-text-tertiary hover:text-text-primary"
                >
                  [ Dismiss ]
                </button>
              </div>

              <div>
                <label className="block text-text-secondary mb-1">Habit Title</label>
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  placeholder="e.g. 20-minute silent walk, read 15 pages..."
                  className="w-full bg-background border border-border-subtle rounded-sm px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary mb-1">Type</label>
                  <select
                    value={newHabitType}
                    onChange={(e) => setNewHabitType(e.target.value as HabitType)}
                    className="w-full bg-background border border-border-subtle rounded-sm px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border"
                  >
                    <option value="binary">Binary (Done / Open)</option>
                    <option value="target">Target (Count / Volume)</option>
                  </select>
                </div>

                {newHabitType === 'target' && (
                  <div>
                    <label className="block text-text-secondary mb-1">Target Count</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={newHabitTarget}
                        onChange={(e) => setNewHabitTarget(e.target.value)}
                        className="w-20 bg-background border border-border-subtle rounded-sm px-2 py-1.5 text-xs text-text-primary font-mono tabular-nums focus:outline-none focus:border-border"
                      />
                      <input
                        type="text"
                        value={newHabitUnit}
                        onChange={(e) => setNewHabitUnit(e.target.value)}
                        placeholder="unit (pages, min)"
                        className="w-full bg-background border border-border-subtle rounded-sm px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {addHabitError && (
                <p className="text-threat-critical">{addHabitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isCreatingHabit}
                  className="px-3 py-1.5 rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium disabled:opacity-50"
                >
                  {isCreatingHabit ? 'Creating...' : 'Create Rhythm'}
                </button>
              </div>
            </form>
          )}

          {/* Hairline-Separated Rhythm Rows */}
          {habitsLoading ? (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-10 bg-elevated/30 rounded-sm" />
              <div className="h-10 bg-elevated/30 rounded-sm" />
              <div className="h-10 bg-elevated/30 rounded-sm" />
            </div>
          ) : habits.length === 0 ? (
            <div className="py-8 text-center border-b border-border-subtle text-text-tertiary text-sm font-sans">
              No active rhythms established yet.{' '}
              <button
                type="button"
                onClick={() => setIsAddHabitOpen(true)}
                className="text-accent-primary underline underline-offset-4"
              >
                Create your first rhythm
              </button>
              .
            </div>
          ) : (
            <div className="divide-y divide-border-subtle/50" role="list" aria-label="Habit rhythms">
              {habits.map((habit) => {
                const consistency30Day = calculateHabit30DayConsistency(
                  habit.id,
                  habit.habit_type,
                  habit.target_value,
                  logValueByHabitDate,
                )

                return (
                  <div
                    key={habit.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    role="listitem"
                  >
                    {/* Habit Info */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-serif text-base sm:text-lg text-text-primary truncate">
                          {habit.title}
                        </h3>
                        {habit.habit_type === 'target' && (
                          <span className="font-mono tabular-nums text-[11px] text-text-tertiary">
                            {habit.target_value} {habit.unit ?? ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-text-tertiary">
                        <span className="tabular-nums">
                          {habit.currentStreak}d current &bull; {habit.longestStreak}d best
                        </span>
                        <span>&bull;</span>
                        <span className="tabular-nums text-text-secondary">
                          {consistency30Day}% 30d
                        </span>
                      </div>
                    </div>

                    {/* 7-Day Rhythm Dot Strip */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5" aria-label="Last 7 days rhythm">
                        {past7Days.map((dayKey) => {
                          const logVal = logValueByHabitDate[`${habit.id}:${dayKey}`] ?? 0
                          const isDone = habit.habit_type === 'target' ? logVal >= habit.target_value : logVal >= 1
                          const isToday = dayKey === todayKey

                          return (
                            <div
                              key={dayKey}
                              title={`${dayKey}: ${isDone ? 'Completed' : 'Open'}`}
                              className="flex flex-col items-center gap-0.5"
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                  isDone
                                    ? 'bg-accent-primary'
                                    : isToday
                                    ? 'border border-text-tertiary'
                                    : 'border border-border-subtle bg-surface/30'
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>

                      {/* State & Action Button */}
                      <div className="flex items-center gap-2">
                        {habit.habit_type === 'binary' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (habit.completedToday) {
                                undoHabitDone({ habitId: habit.id })
                              } else {
                                markHabitDone({
                                  habitId: habit.id,
                                  habitType: 'binary',
                                  targetValue: 1,
                                })
                              }
                            }}
                            disabled={isMarkingDone || isUndoingHabit}
                            className={`min-w-[76px] px-2.5 py-1 text-xs font-mono tabular-nums rounded-sm border transition-colors ${
                              habit.completedToday
                                ? 'border-accent-primary/60 bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/20'
                                : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                            }`}
                          >
                            {habit.completedToday ? 'Done \u2713' : 'Mark'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustHabitCount({ habitId: habit.id, delta: -1 })}
                              disabled={isAdjustingCount || habit.todayValue <= 0}
                              className="h-7 w-7 rounded-sm border border-border-subtle text-text-secondary hover:border-border hover:text-text-primary font-mono text-xs flex items-center justify-center disabled:opacity-40"
                              aria-label="Decrease count"
                            >
                              -
                            </button>
                            <span className="min-w-[44px] text-center font-mono tabular-nums text-xs text-text-primary">
                              {habit.todayValue}/{habit.target_value}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustHabitCount({ habitId: habit.id, delta: 1 })}
                              disabled={isAdjustingCount}
                              className="h-7 w-7 rounded-sm border border-border-subtle text-text-secondary hover:border-border hover:text-text-primary font-mono text-xs flex items-center justify-center"
                              aria-label="Increase count"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recovery Note if recent mistake exists */}
          {habitWorkspace?.recentMistake && (
            <div className="border border-border-subtle/70 rounded-sm p-3.5 space-y-1.5 bg-surface/20">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-threat-warning uppercase tracking-wider">
                  Reconciliation Note
                </span>
                <span className="text-text-tertiary tabular-nums">
                  {formatIndiaDate(habitWorkspace.recentMistake.break_date)}
                </span>
              </div>
              <p className="text-xs font-sans text-text-secondary leading-relaxed">
                Break detected on <strong className="text-text-primary font-normal">{habitWorkspace.recentMistake.habitTitle}</strong>.{' '}
                {habitWorkspace.recentMistake.reason
                  ? `Reason recorded: "${habitWorkspace.recentMistake.reason}".`
                  : 'No break reason recorded yet.'}
              </p>
              <Link
                to="habits"
                className="inline-block text-xs font-sans text-text-secondary underline underline-offset-4 hover:text-text-primary pt-0.5"
              >
                Open habit ledger to record recovery commitment &rarr;
              </Link>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

