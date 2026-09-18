import { useState, type KeyboardEvent } from 'react'
import { useAddTransaction, useDeleteTransaction, useTransactions } from '../api/useFinance'
import { FinanceIcon } from '../../../components/icons'
import { LoadingView } from '../../../components/LoadingView'
import { formatIndiaDateTime } from '../../mind-os/utils/date'
import { Terminal, Trash2 } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function FinanceDashboard() {
  const { data, isLoading, isError } = useTransactions()
  const { mutate: addTransaction, isPending } = useAddTransaction()
  const { mutate: deleteTransaction } = useDeleteTransaction()
  
  const [command, setCommand] = useState('')
  const [parseError, setParseError] = useState('')

  const summary = data?.summary
  const transactions = data?.transactions ?? []
  const balance = summary?.walletBalance ?? 0
  const isPositive = balance >= 0

  const handleCommandSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    if (!command.trim()) return

    // Matches "+1500 Salary", "-15 Coffee", "- 15 Coffee", etc.
    const match = command.trim().match(/^([+-])?\s?\$?(\d+(?:\.\d{1,2})?)\s+(.+)$/)
    if (!match || !match[1]) {
      setParseError("Invalid format. Use: '+1500 Salary' or '-15 Coffee'")
      return
    }

    const type = match[1] === '+' ? 'INCOME' : 'EXPENSE'
    const amount = parseFloat(match[2])
    const category = match[3].trim()

    if (isNaN(amount) || amount <= 0) {
      setParseError("Amount must be greater than 0.")
      return
    }

    setParseError('')
    addTransaction({ transactionType: type as 'INCOME' | 'EXPENSE', amount, category }, {
      onSuccess: () => setCommand('')
    })
  }

  return (
    <section className="min-h-[80vh] flex flex-col space-y-12 bg-background pb-24 font-mono selection:bg-primary/30">
      {/* Header & Hero Balance */}
      <header className="flex flex-col items-center justify-center pt-8 md:pt-16">
        <div className="flex items-center gap-2 mb-8 text-text-tertiary">
          <FinanceIcon className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-[0.3em]">Sovereign Ledger</span>
        </div>
        
        <div className="relative flex flex-col items-center justify-center">
           {/* Ambient Glow */}
           <div className={`absolute inset-0 blur-[100px] opacity-15 -z-10 transition-colors duration-1000 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
           <h1 className={`text-6xl sm:text-8xl md:text-[9rem] tabular-nums font-light tracking-tighter leading-none transition-colors duration-1000 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
             {isLoading ? '---' : formatCurrency(balance).replace(/[^0-9.,-]/g, '')}
           </h1>
           <span className="text-text-tertiary text-[10px] md:text-xs tracking-[0.2em] uppercase mt-6 opacity-70">
             Available Capital (INR)
           </span>
        </div>
      </header>

      {/* Terminal Command Input */}
      <div className="max-w-3xl w-full mx-auto px-4 z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Terminal className={`h-5 w-5 transition-colors ${parseError ? 'text-threat-warning' : 'text-text-tertiary group-focus-within:text-primary'}`} />
          </div>
          <input
            type="text"
            value={command}
            onChange={(e) => { setCommand(e.target.value); setParseError(''); }}
            onKeyDown={handleCommandSubmit}
            disabled={isPending}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            placeholder="> -1500 Rent  |  +45000 Salary  (Press Enter)"
            className={`w-full bg-surface/50 border backdrop-blur-sm rounded-none py-4 pl-12 pr-4 text-text-primary placeholder:text-text-tertiary/50 focus:outline-none focus:ring-1 transition-all text-sm sm:text-base font-mono disabled:opacity-50 shadow-2xl
              ${parseError ? 'border-threat-warning/50 focus:ring-threat-warning focus:border-threat-warning' : 'border-border-subtle focus:ring-primary focus:border-primary'}
            `}
          />
          {isPending && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="h-6 mt-1 overflow-hidden">
          {parseError ? (
            <p className="text-[10px] text-threat-warning font-mono animate-fade-in">{parseError}</p>
          ) : (
            <p className="text-[10px] text-text-tertiary font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">
              Prefix with + for income, - for expense. Space separated category.
            </p>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4">
        {isLoading ? (
          <div className="py-12">
            <LoadingView variant="inline" label="Decrypting Ledger" sublabel="Fetching transactional history..." />
          </div>
        ) : isError ? (
          <p className="text-sm text-threat-warning text-center">Failed to load ledger.</p>
        ) : transactions.length === 0 ? (
          <p className="text-xs tracking-widest uppercase text-text-tertiary text-center mt-12 border border-border-subtle border-dashed py-16 bg-surface/10">No transactions recorded in the current epoch.</p>
        ) : (
          <div className="w-full overflow-x-auto border border-border-subtle bg-surface/20 backdrop-blur-sm shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface/80 text-[10px] uppercase tracking-widest text-text-tertiary">
                  <th className="py-4 px-6 font-normal w-[200px]">Timestamp</th>
                  <th className="py-4 px-6 font-normal w-[100px]">Vector</th>
                  <th className="py-4 px-6 font-normal">Entity / Category</th>
                  <th className="py-4 px-6 font-normal text-right w-[150px]">Volume</th>
                  <th className="py-4 px-6 font-normal text-center w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm divide-y divide-border-subtle/50">
                {transactions.map(tx => {
                  const isInc = tx.transaction_type === 'INCOME'
                  return (
                    <tr key={tx.id} className="hover:bg-surface/80 transition-colors group">
                      <td className="py-3 px-6 text-text-secondary whitespace-nowrap text-[11px]">
                        {formatIndiaDateTime(tx.created_at)}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[9px] uppercase tracking-widest font-medium border ${isInc ? 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400' : 'border-rose-900/30 bg-rose-950/20 text-rose-400'}`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-text-primary font-sans font-medium">
                        {tx.category}
                      </td>
                      <td className={`py-3 px-6 text-right tabular-nums tracking-tight ${isInc ? 'text-emerald-400' : 'text-text-primary'}`}>
                        {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Void transaction: ${tx.category}?`)) deleteTransaction({ id: tx.id })
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-text-tertiary hover:text-threat-warning transition-all rounded hover:bg-threat-warning/10"
                          title="Void Transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
