import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { FinanceTransactionType } from '../api/useFinance'
import { emitSystemFeedback } from '../../system/feedback'

const expenseCategories = ['Need', 'Want'] as const
const incomeSources = ['Pocket Money', 'Gift', 'Rollover'] as const

type TransactionFormValues = {
  amount: string
  transactionType: FinanceTransactionType
  category: string
  note: string
}

type TransactionFormPayload = {
  amount: number
  category: string
  transactionType: FinanceTransactionType
  note: string
}

type TransactionFormProps = {
  isSaving: boolean
  error: unknown
  onSubmit: (payload: TransactionFormPayload, callbacks: { onSuccess: () => void }) => void
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

  return 'Failed to add transaction.'
}

function TransactionForm({ isSaving, error, onSubmit }: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>({
    amount: '',
    transactionType: 'EXPENSE',
    category: 'Need',
    note: '',
  })

  const parsedAmount = useMemo(() => Number.parseFloat(values.amount), [values.amount])
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const isCategoryValid = values.category.trim().length > 0

  const visibleCategories = values.transactionType === 'EXPENSE' ? expenseCategories : incomeSources

  const handleTransactionTypeChange = (transactionType: FinanceTransactionType) => {
    setValues((previous) => ({
      ...previous,
      transactionType,
      category: transactionType === 'EXPENSE' ? 'Need' : 'Pocket Money',
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAmountValid || !isCategoryValid) {
      return
    }

    const transactionType = values.transactionType
    const category = values.category
    const amount = parsedAmount

    onSubmit(
      {
        amount,
        category,
        transactionType,
        note: values.note,
      },
      {
        onSuccess: () => {
          emitSystemFeedback({
            title: transactionType === 'INCOME' ? 'Income logged.' : 'Expense logged.',
            description: `${category} recorded for INR ${amount.toFixed(2)}.`,
          })

          setValues({
            amount: '',
            transactionType: 'EXPENSE',
            category: 'Need',
            note: '',
          })
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono">
      <div className="border border-[#222222] bg-black p-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Mode</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={values.transactionType === 'EXPENSE'}
            onClick={() => handleTransactionTypeChange('EXPENSE')}
            className={`border px-3 py-3 text-xs uppercase tracking-[0.2em] transition-colors ${
              values.transactionType === 'EXPENSE'
                ? 'border-red-900 bg-[#140606] text-red-300'
                : 'border-[#222222] bg-[#0a0a0a] text-zinc-300 hover:bg-[#111111]'
            }`}
          >
            Log Expense
          </button>
          <button
            type="button"
            aria-pressed={values.transactionType === 'INCOME'}
            onClick={() => handleTransactionTypeChange('INCOME')}
            className={`border px-3 py-3 text-xs uppercase tracking-[0.2em] transition-colors ${
              values.transactionType === 'INCOME'
                ? 'border-emerald-900 bg-[#06110a] text-emerald-300'
                : 'border-[#222222] bg-[#0a0a0a] text-zinc-300 hover:bg-[#111111]'
            }`}
          >
            Log Income
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Amount</span>
        <input
          type="text"
          inputMode="decimal"
          pattern="^\\d*([.]\\d{0,2})?$"
          value={values.amount}
          onChange={(event) => setValues((previous) => ({ ...previous, amount: event.target.value }))}
          placeholder="0.00"
          className="mt-1 w-full border border-[#222222] bg-black px-3 py-3 text-2xl text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-100"
        />
      </label>

      <div className="border border-[#222222] bg-black p-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          {values.transactionType === 'EXPENSE' ? 'Spend Type' : 'Source'}
        </p>
        <div className={`mt-2 grid gap-2 ${values.transactionType === 'EXPENSE' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
          {visibleCategories.map((option) => {
            const isSelected = values.category === option
            const selectedClass =
              values.transactionType === 'EXPENSE'
                ? 'border-red-900 bg-[#140606] text-red-300'
                : 'border-emerald-900 bg-[#06110a] text-emerald-300'

            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setValues((previous) => ({ ...previous, category: option }))}
                className={`border px-3 py-3 text-xs uppercase tracking-[0.2em] transition-colors ${
                  isSelected ? selectedClass : 'border-[#222222] bg-[#0a0a0a] text-zinc-300 hover:bg-[#111111]'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Note</span>
        <input
          value={values.note}
          onChange={(event) => setValues((previous) => ({ ...previous, note: event.target.value }))}
          placeholder={values.transactionType === 'INCOME' ? 'Source detail / context' : 'Vendor / context'}
          className="mt-1 w-full border border-[#222222] bg-black px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-100"
        />
      </label>

      {error ? <p className="text-xs text-red-400">{getReadableErrorMessage(error)}</p> : null}

      <button
        type="submit"
        disabled={!isAmountValid || !isCategoryValid || isSaving}
        className="w-full border border-[#222222] bg-black px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-100 transition-colors hover:bg-[#111111] disabled:opacity-60"
      >
        {isSaving ? 'Saving...' : `Save ${values.transactionType === 'INCOME' ? 'Income' : 'Expense'}`}
      </button>
    </form>
  )
}

export default TransactionForm
