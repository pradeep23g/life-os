import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useAddTransaction, useTransactions } from '../api/useTransactions'

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

function FinanceDashboard() {
  const { data: transactions = [], isLoading, isError, error } = useTransactions()
  const { mutate: addTransaction, isPending, error: addError } = useAddTransaction()

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions])
  const expenseTotal = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amount, 0),
    [transactions],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    addTransaction(
      {
        amount: parsedAmount,
        category,
        type: 'expense',
      },
      {
        onSuccess: () => {
          setAmount('')
          setCategory('')
        },
      },
    )
  }

  return (
    <section className="space-y-4 bg-[#000000]">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Finance OS</h1>
        <p className="mt-1 text-sm text-slate-400">Log transactions quickly and track the latest money movements.</p>
      </article>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
          <h2 className="text-lg font-semibold text-slate-100">Log Expense</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <label className="block text-sm text-slate-300">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-slate-100"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Category
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Food, Travel, Subscriptions..."
                className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-slate-100"
              />
            </label>

            <button
              type="submit"
              disabled={isPending || !amount.trim() || !category.trim()}
              className="rounded-md border border-[#222222] bg-black px-4 py-2 text-sm text-slate-100 hover:bg-slate-900 disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Add Expense'}
            </button>
          </form>

          {addError ? (
            <p className="mt-3 text-sm text-red-400">{addError instanceof Error ? addError.message : 'Failed to add transaction.'}</p>
          ) : null}
        </article>

        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Recent Transactions</h2>
            <p className="text-sm text-slate-300">Total expenses: {formatCurrency(expenseTotal)}</p>
          </div>

          {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading transactions...</p> : null}
          {isError ? (
            <p className="mt-3 text-sm text-red-400">{error instanceof Error ? error.message : 'Failed to load transactions.'}</p>
          ) : null}

          {!isLoading && !isError && recentTransactions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No transactions yet.</p>
          ) : null}

          {!isLoading && !isError && recentTransactions.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recentTransactions.map((item) => (
                <li key={item.id} className="rounded-md border border-[#222222] bg-black p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-100">{item.category}</p>
                    <p className={`text-sm font-semibold ${item.type === 'expense' ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {item.type === 'expense' ? '-' : '+'}
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(item.timestamp)}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default FinanceDashboard
