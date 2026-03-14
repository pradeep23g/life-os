import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useCreateWeeklyPlan, usePlanning, useUpdateWeeklyPlan } from '../api/usePlanning'

function getWeekStartDateISO(date = new Date()) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day

  value.setDate(value.getDate() + diff)
  value.setHours(0, 0, 0, 0)

  return value.toISOString().slice(0, 10)
}

function formatWeekDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString()
}

function PlanningPage() {
  const { data: plans = [], isLoading, isError, error } = usePlanning()
  const { mutate: createPlan, isPending: isCreating, error: createError } = useCreateWeeklyPlan()
  const { mutate: updatePlan, isPending: isUpdating, error: updateError } = useUpdateWeeklyPlan()

  const currentWeekStart = getWeekStartDateISO()

  const existingPlan = useMemo(() => {
    return plans.find((plan) => plan.week_start_date === currentWeekStart) ?? null
  }, [plans, currentWeekStart])

  const [draftByWeek, setDraftByWeek] = useState<Record<string, string>>({})

  const focusText = draftByWeek[currentWeekStart] ?? existingPlan?.focus_text ?? ''

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = focusText.trim()

    if (!trimmed) {
      return
    }

    if (existingPlan) {
      updatePlan({
        id: existingPlan.id,
        focusText: trimmed,
        weekStartDate: currentWeekStart,
      })
      return
    }

    createPlan({
      focusText: trimmed,
      weekStartDate: currentWeekStart,
    })
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <h2 className="text-lg font-semibold text-slate-100">Weekly Focus</h2>
        <p className="mt-1 text-sm text-slate-300">Week starting {formatWeekDate(currentWeekStart)}</p>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <textarea
            value={focusText}
            onChange={(event) =>
              setDraftByWeek((previous) => ({
                ...previous,
                [currentWeekStart]: event.target.value,
              }))
            }
            rows={8}
            placeholder="Define this week's primary execution focus..."
            className="w-full rounded-md border border-slate-700 bg-slate-800 p-3 text-slate-100"
          />

          <button
            type="submit"
            disabled={isCreating || isUpdating || !focusText.trim()}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            {isCreating || isUpdating ? 'Saving...' : existingPlan ? 'Update Weekly Focus' : 'Save Weekly Focus'}
          </button>

          {createError ? <p className="text-sm text-red-400">{createError.message}</p> : null}
          {updateError ? <p className="text-sm text-red-400">{updateError.message}</p> : null}
        </form>
      </article>

      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Plans</h2>

        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading plans...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">{error.message}</p> : null}

        {!isLoading && !isError && plans.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No plans yet.</p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {plans.slice(0, 6).map((plan) => (
            <li key={plan.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs text-slate-400">{formatWeekDate(plan.week_start_date)}</p>
              <p className="mt-1 text-sm text-slate-200">{plan.focus_text}</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

export default PlanningPage
