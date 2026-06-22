import { useMemo, useState } from 'react'

import { type FinanceTransaction, useAddTransaction, useDeleteTransaction, useTransactions } from '../api/useFinance'
import TransactionForm from '../components/TransactionForm'
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
    return 'border-[#3a3a3a] bg-[#050505] text-zinc-100'
  }

  if (hasIncome) {
    return 'border-emerald-950 bg-[#06110a] text-emerald-100'
  }

  if (hasExpense) {
    return 'border-red-950 bg-[#140606] text-red-100'
  }

  return 'border-[#222222] bg-[#0a0a0a] text-zinc-400'
}

function FinanceDashboard() {
  const { data, isLoading, isError, error } = useTransactions()
  const { mutate: addTransaction, isPending, error: addError } = useAddTransaction()
  const { mutate: deleteTransaction, isPending: isDeletingTransaction } = useDeleteTransaction()
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
    <section className="space-y-4 bg-black pb-24 font-mono text-zinc-100">
      <article className="border border-[#222222] bg-[#0a0a0a] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Finance OS</p>
            <h1 className="mt-2 text-2xl uppercase tracking-[0.16em] text-zinc-100">{monthLabel}</h1>
            <p className="mt-2 text-sm text-zinc-400">Bidirectional wallet ledger for the current month. Income builds the wallet. Expenses consume it.</p>
          </div>
          <div className="border border-[#222222] bg-black px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Spend Ratio</p>
            <p className="mt-1 text-lg text-zinc-100">{isLoading ? '--' : `${(summary?.progressPercentage ?? 0).toFixed(1)}%`}</p>
          </div>
        </div>

        <div className="mt-4 h-3 border border-[#222222] bg-black">
          <div
            className="h-full bg-red-900"
            style={{
              width: `${clampedProgressWidth}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {isLoading
            ? 'Calculating monthly ledger state...'
            : (summary?.totalAvailable ?? 0) > 0
              ? `${formatCurrency(summary?.totalSpent ?? 0)} spent from ${formatCurrency(summary?.totalAvailable ?? 0)} available`
              : 'No income logged yet. Spend ratio is held at 0% until available funds exist.'}
        </p>
      </article>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Total Available</p>
          <p className="mt-3 text-2xl text-emerald-300">{isLoading ? '--' : formatCurrency(summary?.totalAvailable ?? 0)}</p>
        </article>
        <article className="border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Total Spent</p>
          <p className="mt-3 text-2xl text-red-300">{isLoading ? '--' : formatCurrency(summary?.totalSpent ?? 0)}</p>
        </article>
        <article className="border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Wallet Balance</p>
          <p className={`mt-3 text-2xl ${((summary?.walletBalance ?? 0) < 0) ? 'text-red-300' : 'text-zinc-100'}`}>
            {isLoading ? '--' : formatCurrency(summary?.walletBalance ?? 0)}
          </p>
        </article>
        <article className="border border-[#222222] bg-[#0a0a0a] p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Transactions</p>
          <p className="mt-3 text-2xl text-zinc-100">{isLoading ? '--' : data?.transactions.length ?? 0}</p>
        </article>
      </div>

      <article className="border border-[#222222] bg-[#0a0a0a] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg uppercase tracking-[0.16em] text-zinc-100">Monthly Calendar</h2>
            <p className="mt-1 text-xs text-zinc-500">Green marks income days. Red marks expense days. Click a day to filter the ledger below.</p>
          </div>
          {selectedDateKey ? (
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              className="border border-[#222222] bg-black px-3 py-2 text-xs uppercase tracking-[0.2em] text-zinc-200 hover:bg-[#111111]"
            >
              Clear Filter
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.16em] text-zinc-500">
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
                className={`relative min-h-[108px] border p-2 text-left transition-colors ${getCalendarCellTone(hasIncome, hasExpense)} ${
                  day.inCurrentMonth ? '' : 'opacity-35'
                } ${isSelected ? 'outline outline-1 outline-zinc-100' : ''}`}
              >
                <p className="text-sm">{day.day}</p>
                <div className="mt-5 space-y-1 text-[10px] leading-4">
                  {hasIncome ? <p className="text-emerald-300">+ {formatCurrency(incomeTotal)}</p> : <p className="text-transparent">.</p>}
                  {hasExpense ? <p className="text-red-300">- {formatCurrency(expenseTotal)}</p> : <p className="text-transparent">.</p>}
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {hasIncome ? <span className="h-2 w-2 border border-emerald-500 bg-emerald-500" /> : null}
                  {hasExpense ? <span className="h-2 w-2 border border-red-500 bg-red-500" /> : null}
                </div>
              </button>
            )
          })}
        </div>
      </article>

      <article className="border border-[#222222] bg-[#0a0a0a] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg uppercase tracking-[0.16em] text-zinc-100">Recent Transactions</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {selectedDateLabel ? `Filtered to ${selectedDateLabel}. Click the same day again or clear the filter to return to the full month.` : 'Showing all transactions logged this month.'}
            </p>
          </div>
          {selectedDateLabel ? <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">{selectedDateLabel}</p> : null}
        </div>

        {isLoading ? <p className="mt-4 text-sm text-zinc-500">Loading transactions...</p> : null}
        {isError ? <p className="mt-4 text-sm text-red-400">{getReadableErrorMessage(error)}</p> : null}
        {!isLoading && !isError && visibleTransactions.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">{selectedDateKey ? 'No transactions logged for this date.' : 'No transactions logged this month yet.'}</p>
        ) : null}

        {!isLoading && !isError && visibleTransactions.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {visibleTransactions.map((item) => {
              const isIncome = item.transaction_type === 'INCOME'

              return (
                <li key={item.id} className="group border border-[#222222] bg-black p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 w-2 border ${isIncome ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500'}`} />
                        <p className="text-sm uppercase tracking-[0.16em] text-zinc-100">{item.category}</p>
                        <span
                          className={`border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                            isIncome ? 'border-emerald-900 bg-[#06110a] text-emerald-300' : 'border-red-900 bg-[#140606] text-red-300'
                          }`}
                        >
                          {item.transaction_type}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">{formatIndiaDateTime(item.created_at)}</p>
                      {item.note ? <p className="mt-2 text-xs text-zinc-300">{item.note}</p> : null}
                    </div>

                    <div className="flex items-start gap-2">
                      <p className={`text-sm ${isIncome ? 'text-emerald-300' : 'text-red-300'}`}>
                        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                      </p>
                      <button
                        type="button"
                        disabled={isDeletingTransaction}
                        onClick={() => {
                          const confirmed = window.confirm('Delete this transaction?')
                          if (!confirmed) {
                            return
                          }

                          deleteTransaction({ id: item.id })
                        }}
                        className="border border-transparent px-2 py-1 text-sm text-zinc-600 transition-colors hover:border-[#222222] hover:text-red-400"
                        aria-label="Delete transaction"
                      >
                        X
                      </button>
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
        className="fixed bottom-6 right-6 z-50 h-14 w-14 border border-[#222222] bg-[#0a0a0a] text-3xl text-zinc-100 transition-colors hover:bg-[#111111]"
        aria-label="Add transaction"
      >
        +
      </button>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className="absolute inset-0" aria-label="Close transaction modal" />
          <article className="relative z-10 max-h-[88vh] w-[92%] max-w-md overflow-y-auto border border-[#222222] bg-[#0a0a0a] p-4 font-mono">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg uppercase tracking-[0.16em] text-zinc-100">Quick Log</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="border border-[#222222] bg-black px-3 py-2 text-xs uppercase tracking-[0.2em] text-zinc-200 hover:bg-[#111111]"
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
