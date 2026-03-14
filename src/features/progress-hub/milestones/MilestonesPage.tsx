import { useState } from 'react'
import type { FormEvent } from 'react'

import { useCreateMilestone, useMilestones, useToggleMilestoneCompletion } from '../api/useProgress'

function MilestonesPage() {
  const { data: milestones = [], isLoading, isError, error } = useMilestones()
  const { mutate: createMilestone, isPending: isCreating, error: createError } = useCreateMilestone()
  const { mutate: toggleMilestone, isPending: isUpdating, error: updateError } = useToggleMilestoneCompletion()

  const [title, setTitle] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle || !targetDate) {
      return
    }

    createMilestone(
      {
        title: trimmedTitle,
        targetDate,
      },
      {
        onSuccess: () => {
          setTitle('')
          setTargetDate('')
        },
      },
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-[#f1f5f9]">Milestones</h2>

        <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_140px]">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Milestone title"
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

          <button
            type="submit"
            disabled={isCreating || !title.trim() || !targetDate}
            className="rounded-md border border-[#222222] bg-black px-4 py-2 text-sm text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
          >
            {isCreating ? 'Adding...' : 'Add Milestone'}
          </button>
        </form>

        {createError ? <p className="mt-3 text-sm text-red-400">{createError.message}</p> : null}
      </article>

      {isError ? <p className="text-sm text-red-400">{error.message}</p> : null}
      {updateError ? <p className="text-sm text-red-400">{updateError.message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-[#a1a1aa]">Loading milestones...</p> : null}

        {!isLoading && milestones.length === 0 ? <p className="text-sm text-[#a1a1aa]">No milestones created yet.</p> : null}

        {milestones.map((milestone) => (
          <article key={milestone.id} className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <p className="text-base font-semibold text-[#f1f5f9]">{milestone.title}</p>
            <p className="mt-1 text-sm text-[#a1a1aa]">Target Date: {new Date(milestone.target_date).toLocaleDateString()}</p>
            <p className="text-sm text-[#a1a1aa]">
              Achieved Date:{' '}
              {milestone.achieved_date ? new Date(milestone.achieved_date).toLocaleDateString() : 'Not achieved yet'}
            </p>

            <button
              type="button"
              onClick={() => toggleMilestone({ id: milestone.id, isCompleted: milestone.is_completed })}
              disabled={isUpdating}
              className="mt-3 rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
            >
              {milestone.is_completed ? 'Reopen' : 'Mark as Achieved'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MilestonesPage
