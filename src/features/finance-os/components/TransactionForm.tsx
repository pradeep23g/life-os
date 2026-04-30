import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { FinanceSummary } from '../api/useFinance'
import { getProjectedMonthlySpendAfter } from '../api/useFinance'
import { emitSystemFeedback } from '../../system/feedback'

const categories = ['Food', 'Travel', 'Academics', 'Social', 'Misc'] as const

type TransactionFormValues = {
  amount: string
  category: string
  customCategory: string
  isNeed: boolean
  note: string
}

type TransactionFormPayload = {
  amount: number
  category: string
  isNeed: boolean
  note: string
}

type TransactionFormProps = {
  isSaving: boolean
  error: unknown
  summary?: FinanceSummary
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

function TransactionForm({ isSaving, error, summary, onSubmit }: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>({
    amount: '',
    category: 'Food',
    customCategory: '',
    isNeed: true,
    note: '',
  })

  const parsedAmount = useMemo(() => Number.parseFloat(values.amount), [values.amount])
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const resolvedCategory = values.category === 'Other' ? values.customCategory.trim() : values.category
  const isCategoryValid = resolvedCategory.length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAmountValid || !isCategoryValid) {
      return
    }

    const submittedAmount = parsedAmount
    const submittedIsNeed = values.isNeed
    onSubmit(
      {
        amount: submittedAmount,
        category: resolvedCategory,
        isNeed: submittedIsNeed,
        note: values.note,
      },
      {
        onSuccess: () => {
          const safeLimit = summary?.dailySafeLimit ?? Number.POSITIVE_INFINITY
          const projectedAfter = summary ? getProjectedMonthlySpendAfter(summary, submittedAmount) : 0
          const monthlyBudget = summary?.monthlyBudget ?? 2000

          const brokeSafeLimit = !submittedIsNeed && submittedAmount > safeLimit
          const projectedOverBudget = summary ? projectedAfter > monthlyBudget : false

          if (brokeSafeLimit) {
            emitSystemFeedback({
              title: `⚠️ ₹${submittedAmount.toFixed(2)} Want logged.`,
              description: `You just broke your safe limit of ₹${safeLimit.toFixed(2)}/day. Pull back.`,
            })
          }

          if (projectedOverBudget) {
            emitSystemFeedback({
              title: '🚨 System Alert',
              description: 'Current pacing will exceed monthly budget.',
            })
          }

          if (!brokeSafeLimit && !projectedOverBudget) {
            emitSystemFeedback({
              title: 'Transaction logged.',
              description: 'Spending recorded within current control range.',
            })
          }

          setValues({
            amount: '',
            category: 'Food',
            customCategory: '',
            isNeed: true,
            note: '',
          })
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs text-slate-400">Amount</span>
        <input
          type="text"
          inputMode="decimal"
          pattern="^\d*([.]\d{0,2})?$"
          value={values.amount}
          onChange={(event) => setValues((previous) => ({ ...previous, amount: event.target.value }))}
          placeholder="0.00"
          className="mt-1 w-full rounded-lg border border-[#222222] bg-black px-3 py-3 text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-900"
        />
      </label>

      <label className="block">
        <span className="text-xs text-slate-400">Category</span>
        <select
          value={values.category}
          onChange={(event) => setValues((previous) => ({ ...previous, category: event.target.value }))}
          className="mt-1 w-full rounded-lg border border-[#222222] bg-black px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-900"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </label>

      {values.category === 'Other' ? (
        <label className="block">
          <span className="text-xs text-slate-400">Custom Category</span>
          <input
            value={values.customCategory}
            onChange={(event) => setValues((previous) => ({ ...previous, customCategory: event.target.value }))}
            placeholder="Type your category"
            className="mt-1 w-full rounded-lg border border-[#222222] bg-black px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-900"
          />
        </label>
      ) : null}

      <div className="rounded-lg border border-[#222222] bg-black p-2">
        <p className="text-xs text-slate-400">Spend Type</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValues((previous) => ({ ...previous, isNeed: true }))}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              values.isNeed ? 'border-emerald-900 text-emerald-500 bg-emerald-950/20' : 'border-[#222222] text-slate-300 hover:bg-[#111111]'
            }`}
          >
            Need
          </button>
          <button
            type="button"
            onClick={() => setValues((previous) => ({ ...previous, isNeed: false }))}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              !values.isNeed ? 'border-rose-900 text-rose-400 bg-rose-950/20' : 'border-[#222222] text-slate-300 hover:bg-[#111111]'
            }`}
          >
            Want
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-slate-400">Note</span>
        <input
          value={values.note}
          onChange={(event) => setValues((previous) => ({ ...previous, note: event.target.value }))}
          placeholder="UPI ref / context"
          className="mt-1 w-full rounded-lg border border-[#222222] bg-black px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-900"
        />
      </label>

      {error ? <p className="text-xs text-red-400">{getReadableErrorMessage(error)}</p> : null}

      <button
        type="submit"
        disabled={!isAmountValid || !isCategoryValid || isSaving}
        className="w-full border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2 disabled:opacity-60"
      >
        {isSaving ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
  )
}

export default TransactionForm
