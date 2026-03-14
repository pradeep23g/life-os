import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useChallenges, useCreateChallenge, useUpdateChallengeStatus } from '../api/useProgress'

function ChallengesPage() {
  const { data: challenges = [], isLoading, isError, error } = useChallenges()
  const { mutate: createChallenge, isPending: isCreating, error: createError } = useCreateChallenge()
  const { mutate: updateStatus, isPending: isUpdating, error: updateError } = useUpdateChallengeStatus()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { completedCount, completionPercent } = useMemo(() => {
    const completed = challenges.filter((challenge) => challenge.status === 'Completed').length
    const percent = challenges.length ? Math.round((completed / challenges.length) * 100) : 0

    return {
      completedCount: completed,
      completionPercent: percent,
    }
  }, [challenges])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return
    }

    createChallenge(
      {
        title: trimmedTitle,
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
        },
      },
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-[#f1f5f9]">Challenges</h2>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          Completion: {completedCount}/{challenges.length} ({completionPercent}%)
        </p>

        <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Challenge title"
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Challenge description"
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

          <button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="w-full rounded-md border border-[#222222] bg-black px-4 py-2 text-sm text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60 md:w-auto"
          >
            {isCreating ? 'Adding...' : 'Add Challenge'}
          </button>
        </form>

        {createError ? <p className="mt-3 text-sm text-red-400">{createError.message}</p> : null}
      </article>

      {isError ? <p className="text-sm text-red-400">{error.message}</p> : null}
      {updateError ? <p className="text-sm text-red-400">{updateError.message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-[#a1a1aa]">Loading challenges...</p> : null}

        {!isLoading && challenges.length === 0 ? <p className="text-sm text-[#a1a1aa]">No challenges yet.</p> : null}

        {challenges.map((challenge) => (
          <article key={challenge.id} className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <p className="text-base font-semibold text-[#f1f5f9]">{challenge.title}</p>
            <p className="mt-1 text-sm text-[#a1a1aa]">{challenge.description || 'No description provided.'}</p>
            <p className="mt-2 text-xs text-[#a1a1aa]">Status: {challenge.status}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {challenge.status === 'Active' ? (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus({ id: challenge.id, status: 'Completed' })}
                    disabled={isUpdating}
                    className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
                  >
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus({ id: challenge.id, status: 'Failed' })}
                    disabled={isUpdating}
                    className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
                  >
                    Mark Failed
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => updateStatus({ id: challenge.id, status: 'Active' })}
                  disabled={isUpdating}
                  className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
                >
                  Reopen
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ChallengesPage
