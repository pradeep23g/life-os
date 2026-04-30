import { useMemo, useState } from 'react'

import { useAddTransaction, useTransactions } from '../api/useFinance'
import TransactionForm from '../components/TransactionForm'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

  return 'Failed to load transactions.'
}

function FinanceDashboard() {
  const { data, isLoading, isError, error } = useTransactions()
  const { mutate: addTransaction, isPending, error: addError } = useAddTransaction()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const summary = data?.summary

  const recentTransactions = useMemo(() => (data?.transactions ?? []).slice(0, 12), [data?.transactions])
  const weeklyDailyTotals = summary?.weeklyDailyTotals ?? [0, 0, 0, 0, 0, 0, 0]
  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const weeklyBaseline = 500
  const dailyMax = 150

  return (
    <section className="space-y-4 bg-black pb-24">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Finance OS</h1>
        <p className="mt-1 text-sm text-slate-400">Track this month’s burn and quickly log UPI spends.</p>
        <p className="mt-3 text-sm text-slate-200">
          Money Left: <span className={summary?.isMoneyLeftNegative ? 'text-red-500 font-semibold' : 'text-slate-100'}>{isLoading ? '--' : formatCurrency(summary?.moneyLeft ?? 0)}</span>{' '}
          | Days Left: <span className="text-slate-100">{isLoading ? '--' : summary?.daysLeftInMonth ?? 0}</span> | Daily Safe Limit:{' '}
          <span className={`font-bold ${summary?.isDailySafeLimitNegative ? 'text-red-500' : 'text-slate-100'}`}>
            {isLoading ? '--' : formatCurrency(summary?.dailySafeLimit ?? 0)}
          </span>
        </p>
      </article>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-xs text-slate-400">Total Spent</p>
          <p className="mt-2 text-xl font-semibold text-slate-100">{isLoading ? '--' : formatCurrency(summary?.totalSpent ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-xs text-slate-400">Waste This Week</p>
          <p className="mt-2 text-xl font-semibold text-red-400">{isLoading ? '--' : formatCurrency(summary?.wasteAmount ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">Biggest waste: <span className="text-slate-200">{isLoading ? '--' : summary?.topWasteCategory ?? 'No waste yet'}</span></p>
        </article>
        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-xs text-slate-400">Top Leak</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{isLoading ? '--' : summary?.topCategory ?? 'No spend yet'}</p>
        </article>
      </div>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Weekly Burn</h2>
          <p className={`text-sm font-semibold ${(summary?.weeklySpent ?? 0) > weeklyBaseline ? 'text-red-500' : 'text-slate-300'}`}>
            {isLoading ? '--' : `${formatCurrency(summary?.weeklySpent ?? 0)} / ₹${weeklyBaseline}`}
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          {weeklyDailyTotals.map((amount, index) => {
            const fillPercent = Math.min((amount / dailyMax) * 100, 100)
            const isSpike = amount > dailyMax
            return (
              <div key={`${weekDayLabels[index]}-${index}`} className="flex flex-col items-center gap-1">
                <div className="bg-slate-900 w-4 h-16 rounded-sm relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 w-full ${isSpike ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ height: `${fillPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{weekDayLabels[index]}</p>
              </div>
            )
          })}
        </div>
        <p className={`mt-3 text-xs ${summary?.isProjectedOverBudget ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
          At this pace → {isLoading ? '--' : `${formatCurrency(summary?.projectedMonthlySpend ?? 0)}/month`}
          {summary?.isProjectedOverBudget ? ' (OVER BUDGET)' : ''}
        </p>
      </article>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Ledger</h2>

        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading transactions...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">{getReadableErrorMessage(error)}</p> : null}
        {!isLoading && !isError && recentTransactions.length === 0 ? <p className="mt-3 text-sm text-slate-400">No transactions this month yet.</p> : null}

        {!isLoading && !isError && recentTransactions.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentTransactions.map((item) => (
              <li key={item.id} className="rounded-md border border-[#222222] bg-black p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.is_need ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <p className="text-sm font-medium text-slate-100">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">{formatCurrency(item.amount)}</p>
                    <span className={`px-2 rounded text-xs ${item.is_need ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      [{item.is_need ? 'NEED' : 'WANT'}]
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.created_at)}</p>
                {item.note ? <p className="mt-1 text-xs text-slate-300">{item.note}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full border border-emerald-900 bg-[#0a0a0a] text-2xl text-emerald-500 shadow-lg transition-colors hover:bg-slate-900"
        aria-label="Add transaction"
      >
        +
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className="absolute inset-0" aria-label="Close transaction modal" />
          <article className="relative z-10 w-full max-w-md rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-100">Quick Log</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-[#222222] bg-black px-3 py-1 text-sm text-slate-200 hover:bg-slate-900"
              >
                Close
              </button>
            </div>

            <TransactionForm
              isSaving={isPending}
              error={addError}
              summary={summary}
              onSubmit={(payload, callbacks) => {
                addTransaction(payload, {
                  onSuccess: () => {
                    callbacks.onSuccess()
                    setIsModalOpen(false)
                  },
                })
              }}
            />
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default FinanceDashboard
