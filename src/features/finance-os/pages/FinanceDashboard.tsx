import { useMemo, useState } from 'react'

import { type FinanceTransaction, useAddTransaction, useDeleteTransaction, useTransactions } from '../api/useFinance'
import TransactionForm from '../components/TransactionForm'
import { DeleteButton } from '../../../components/DeleteButton'
import { buildMonthGrid, formatIndiaDate, formatIndiaDateTime, getMonthLabel, toIndiaDateKey } from '../../mind-os/utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
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

function getCalendarCellTone(hasIncome: boolean, hasExpense: boolean) {
  if (hasIncome && hasExpense) {
    return 'border-[#333333] bg-surface text-slate-100'
  }

  if (hasIncome) {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
  }

  if (hasExpense) {
    return 'border-rose-500/40 bg-rose-500/10 text-rose-100'
  }

  return 'border-border bg-[#111111] text-slate-400'
}

function FinanceDashboard() {
  const { data, isLoading, isError, error } = useTransactions()
  const { mutate: addTransaction, isPending, error: addError } = useAddTransaction()
  const { mutate: deleteTransaction } = useDeleteTransaction()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const summary = data?.summary
  const monthLabel = useMemo(() => getMonthLabel(new Date()), [])
  const monthCells = useMemo(() => buildMonthGrid(new Date()), [])

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, FinanceTransaction[]>()

    for (const transaction of data?.transactions ?? []) {
      const dateKey = toIndiaDateKey(transaction.created_at)
      const existing = map.get(dateKey) ?? []
      existing.push(transaction)
      map.set(dateKey, existing)
    }

    return map
  }, [data?.transactions])

  const visibleTransactions = useMemo(() => {
    if (!selectedDateKey) {
      return data?.transactions ?? []
    }

    return transactionsByDate.get(selectedDateKey) ?? []
  }, [data?.transactions, selectedDateKey, transactionsByDate])

  const selectedDateLabel = selectedDateKey ? formatIndiaDate(new Date(`${selectedDateKey}T00:00:00Z`)) : null
  const clampedProgressWidth = Math.max(0, Math.min(summary?.progressPercentage ?? 0, 100))

  return (
    <section className="space-y-4 bg-black pb-28 sm:pb-24">
      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Finance OS</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-100">{monthLabel}</h1>
            <p className="mt-2 text-sm text-slate-400">Bidirectional wallet ledger for the current month. Income builds the wallet. Expenses consume it.</p>
          </div>
          <div className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-right">
            <p className="text-xs text-slate-400">Spend Ratio</p>
            <p className="mt-1 text-base font-semibold text-slate-100">{isLoading ? '--' : `${(summary?.progressPercentage ?? 0).toFixed(1)}%`}</p>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full border border-border bg-black">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-rose-500 transition-all duration-500 ease-out"
            style={{
              width: `${clampedProgressWidth}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {isLoading
            ? 'Calculating monthly ledger state...'
            : (summary?.totalAvailable ?? 0) > 0
              ? `${formatCurrency(summary?.totalSpent ?? 0)} spent from ${formatCurrency(summary?.totalAvailable ?? 0)} available`
              : 'No income logged yet. Spend ratio is held at 0% until available funds exist.'}
        </p>
      </article>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-slate-400">Total Available</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-300">{isLoading ? '--' : formatCurrency(summary?.totalAvailable ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-slate-400">Total Spent</p>
          <p className="mt-3 text-2xl font-semibold text-rose-300">{isLoading ? '--' : formatCurrency(summary?.totalSpent ?? 0)}</p>
        </article>
        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-slate-400">Wallet Balance</p>
          <p className={`mt-3 text-2xl font-semibold ${((summary?.walletBalance ?? 0) < 0) ? 'text-rose-300' : 'text-slate-100'}`}>
            {isLoading ? '--' : formatCurrency(summary?.walletBalance ?? 0)}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-slate-400">Transactions</p>
          <p className="mt-3 text-2xl font-semibold text-slate-100">{isLoading ? '--' : data?.transactions.length ?? 0}</p>
        </article>
      </div>

      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Monthly Calendar</h2>
            <p className="mt-1 text-xs text-slate-400">Green marks income days. Red marks expense days. Click a day to filter the ledger below.</p>
          </div>
          {selectedDateKey ? (
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              className="rounded-md border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-200 hover:bg-[#222222]"
            >
              Clear Filter
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] text-slate-500">
          {weekdayHeaders.map((weekday) => (
            <p key={weekday}>{weekday}</p>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCells.map((day) => {
            const dayTransactions = transactionsByDate.get(day.dateKey) ?? []
            const incomeTotal = dayTransactions
              .filter((transaction) => transaction.transaction_type === 'INCOME')
              .reduce((total, transaction) => total + transaction.amount, 0)
            const expenseTotal = dayTransactions
              .filter((transaction) => transaction.transaction_type === 'EXPENSE')
              .reduce((total, transaction) => total + transaction.amount, 0)
            const hasIncome = incomeTotal > 0
            const hasExpense = expenseTotal > 0
            const isSelected = selectedDateKey === day.dateKey

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey((previous) => (previous === day.dateKey ? null : day.dateKey))}
                className={`relative min-h-[108px] rounded-md border p-2 text-left transition-colors ${getCalendarCellTone(hasIncome, hasExpense)} ${
                  day.inCurrentMonth ? '' : 'opacity-35'
                } ${isSelected ? 'ring-1 ring-slate-300/70' : ''}`}
              >
                <p className="text-sm font-semibold">{day.day}</p>
                <div className="mt-5 space-y-1 text-[10px] leading-4">
                  {hasIncome ? <p className="text-emerald-300">+ {formatCurrency(incomeTotal)}</p> : <p className="text-transparent">.</p>}
                  {hasExpense ? <p className="text-rose-300">- {formatCurrency(expenseTotal)}</p> : <p className="text-transparent">.</p>}
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {hasIncome ? <span className="h-2 w-2 border border-emerald-500 bg-emerald-500" /> : null}
                  {hasExpense ? <span className="h-2 w-2 border border-rose-500 bg-rose-500" /> : null}
                </div>
              </button>
            )
          })}
        </div>
      </article>

      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recent Transactions</h2>
            <p className="mt-1 text-xs text-slate-400">
              {selectedDateLabel ? `Filtered to ${selectedDateLabel}. Click the same day again or clear the filter to return to the full month.` : 'Showing all transactions logged this month.'}
            </p>
          </div>
          {selectedDateLabel ? <p className="text-xs text-slate-300">{selectedDateLabel}</p> : null}
        </div>

        {isLoading ? <p className="mt-4 text-sm text-slate-400">Loading transactions...</p> : null}
        {isError ? <p className="mt-4 text-sm text-red-400">{getReadableErrorMessage(error)}</p> : null}
        {!isLoading && !isError && visibleTransactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">{selectedDateKey ? 'No transactions logged for this date.' : 'No transactions logged this month yet.'}</p>
        ) : null}

        {!isLoading && !isError && visibleTransactions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {visibleTransactions.map((item) => {
              const isIncome = item.transaction_type === 'INCOME'

              return (
                <li key={item.id} className="group rounded-md border border-border bg-[#111111] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 w-2 border ${isIncome ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500'}`} />
                        <p className="text-sm font-medium text-slate-100">{item.category}</p>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] ${
                            isIncome ? 'border border-emerald-900 bg-emerald-950/20 text-emerald-300' : 'border border-rose-900 bg-rose-950/20 text-rose-300'
                          }`}
                        >
                          {item.transaction_type}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">{formatIndiaDateTime(item.created_at)}</p>
                      {item.note ? <p className="mt-2 text-xs text-slate-300">{item.note}</p> : null}
                    </div>

                    <div className="flex items-start gap-2">
                      <p className={`text-sm font-semibold ${isIncome ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                      </p>
                      <DeleteButton
                        onClick={() => {
                          const confirmed = window.confirm('Delete this transaction?')
                          if (!confirmed) {
                            return
                          }

                          deleteTransaction({ id: item.id })
                        }}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </article>

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl border border-border bg-surface text-2xl text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition hover:bg-[#111111]"
        aria-label="Add transaction"
      >
        +
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className="absolute inset-0" aria-label="Close transaction modal" />
          <article className="relative z-10 max-h-[88vh] w-[92%] max-w-md overflow-y-auto rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-100">Quick Log</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-border bg-[#111111] px-3 py-1 text-sm text-slate-200 hover:bg-[#222222]"
              >
                Close
              </button>
            </div>

            <TransactionForm
              isSaving={isPending}
              error={addError}
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
