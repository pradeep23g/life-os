import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAddTransaction } from '../features/finance-os/api/useFinance'
import { useCreateTask } from '../features/productivity-hub/api/useTasks'
import { emitSystemFeedback } from '../features/system/feedback'

type ParsedCommand =
  | {
      kind: 'finance'
      amount: number
      category: 'Need' | 'Want'
      note: string
      label: string
    }
  | {
      kind: 'task'
      title: string
      label: string
    }
  | {
      kind: 'invalid'
      reason: string
    }
  | {
      kind: 'empty'
    }

function parseCommand(rawInput: string): ParsedCommand {
  const input = rawInput.trim()
  if (!input) {
    return { kind: 'empty' }
  }

  const financeMatch = input.match(/^\/f\s+(\d+(?:\.\d{1,2})?)\s+(want|need)\s*(.*)$/i)
  if (financeMatch) {
    const amount = Number(financeMatch[1])
    const spendType = financeMatch[2].toLowerCase()
    const note = financeMatch[3]?.trim() ?? ''

    if (!Number.isFinite(amount) || amount <= 0) {
      return { kind: 'invalid', reason: 'Amount must be greater than 0.' }
    }

    const category = spendType === 'need' ? 'Need' : 'Want'
    return {
      kind: 'finance',
      amount,
      category,
      note,
      label: `Log INR ${Math.round(amount)} as EXPENSE / ${category.toUpperCase()}${note ? ` for ${note}` : ''}`,
    }
  }

  const taskMatch = input.match(/^\/t\s+(.+)$/i)
  if (taskMatch) {
    const title = taskMatch[1].trim()
    if (!title) {
      return { kind: 'invalid', reason: 'Task title is required.' }
    }

    return {
      kind: 'task',
      title,
      label: `Create task: ${title}`,
    }
  }

  return {
    kind: 'invalid',
    reason: 'Use /f [amount] [want|need] [note] or /t [title].',
  }
}

function CommandPalette() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const createTask = useCreateTask()
  const addTransaction = useAddTransaction()

  const parsed = useMemo(() => parseCommand(inputValue), [inputValue])
  const isSubmitting = createTask.isPending || addTransaction.isPending

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCommandPaletteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
      if (!isCommandPaletteShortcut) {
        return
      }

      event.preventDefault()
      setIsOpen((previous) => !previous)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  const closePalette = () => {
    setIsOpen(false)
    setInputValue('')
  }

  const runCommand = () => {
    if (parsed.kind === 'finance') {
      addTransaction.mutate(
        {
          amount: parsed.amount,
          category: parsed.category,
          transactionType: 'EXPENSE',
          note: parsed.note,
        },
        {
          onSuccess: () => {
            emitSystemFeedback({
              title: 'Command complete',
              description: parsed.label,
            })
            navigate('/finance-os')
            closePalette()
          },
        },
      )
      return
    }

    if (parsed.kind === 'task') {
      createTask.mutate(
        {
          title: parsed.title,
          deadlineType: 'no_deadline',
          deadlineDate: null,
        },
        {
          onSuccess: () => {
            emitSystemFeedback({
              title: 'Command complete',
              description: parsed.label,
            })
            navigate('/productivity-hub/tasks')
            closePalette()
          },
        },
      )
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 p-4 pt-[12vh]">
      <button type="button" aria-label="Close command palette" onClick={closePalette} className="absolute inset-0" />

      <article className="relative z-10 w-full max-w-2xl rounded-xl border border-border bg-surface p-4">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              closePalette()
              return
            }

            if (event.key === 'Enter' && !isSubmitting && (parsed.kind === 'finance' || parsed.kind === 'task')) {
              event.preventDefault()
              runCommand()
            }
          }}
          placeholder="Type /f 600 want movie or /t Ship auth fix"
          className="w-full rounded-lg border border-border bg-black px-4 py-4 text-lg text-slate-100 outline-none placeholder:text-slate-500 focus:border-green-900"
        />

        <div className="mt-3 rounded-lg border border-border bg-black p-3">
          {parsed.kind === 'empty' ? <p className="text-sm text-slate-400">Type a slash command to run one action instantly.</p> : null}
          {parsed.kind === 'invalid' ? <p className="text-sm text-red-400">{parsed.reason}</p> : null}
          {parsed.kind === 'finance' || parsed.kind === 'task' ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-200">
                <span className="mr-2 rounded-lg border border-green-900 bg-green-950/20 px-2 py-1 text-xs text-green-400">Enter</span>
                {parsed.label}
              </p>
              <button
                type="button"
                onClick={runCommand}
                disabled={isSubmitting}
                className="rounded-lg border border-green-900 px-3 py-1 text-sm text-green-400 transition-colors hover:bg-green-950/30 disabled:opacity-60"
              >
                Run
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}

export default CommandPalette
