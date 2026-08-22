import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { FINANCE_TRANSACTION_DELETED, FINANCE_TRANSACTION_CREATED } from '../../../lib/eventTaxonomy'
import { supabase } from '../../../lib/supabase'
import { useEventBus } from '../../../store/useEventBus'
import { getIndiaMonthKey } from '../../mind-os/utils/date'

export const financeTransactionsQueryKey = ['finance-os', 'transactions', 'monthly'] as const
const TRANSACTION_TABLE_CANDIDATES = ['transactions'] as const

type TransactionTableName = (typeof TRANSACTION_TABLE_CANDIDATES)[number]
type TransactionRow = Record<string, unknown>
type TransactionInsertAttempt = {
  table: TransactionTableName
  payload: Record<string, unknown>
}

export type FinanceTransactionType = 'INCOME' | 'EXPENSE'

export type FinanceTransaction = {
  id: string
  user_id: string
  amount: number
  category: string
  transaction_type: FinanceTransactionType
  note: string | null
  created_at: string
}

export type FinanceSummary = {
  totalAvailable: number
  totalSpent: number
  walletBalance: number
  progressPercentage: number
}

export type FinanceTransactionsResult = {
  transactions: FinanceTransaction[]
  summary: FinanceSummary
}

type AddTransactionInput = {
  amount: number
  category: string
  transactionType: FinanceTransactionType
  note?: string
}

type DeleteTransactionInput = {
  id: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && code.trim().length > 0) {
      return code
    }
  }

  return 'unknown'
}

function buildError(context: string, error: unknown): Error {
  return new Error(`${context} (${getErrorCode(error)}): ${getErrorMessage(error)}`)
}

function isMissingRelationError(error: unknown, relationName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const relation = relationName.toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes(relation)
  }

  return message.includes(relation) && message.includes('does not exist')
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const column = columnName.toLowerCase()

  if (code === '42703' || code === 'pgrst204') {
    return message.includes(column)
  }

  return message.includes(column) && (message.includes('does not exist') || message.includes('could not find'))
}

function getCurrentMonthKey(): string {
  return getIndiaMonthKey(new Date())
}

function getStringValue(row: TransactionRow, key: string): string | null {
  const value = row[key]
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeTransactionType(row: TransactionRow): FinanceTransactionType {
  const rawType = getStringValue(row, 'transaction_type') ?? getStringValue(row, 'type') ?? 'EXPENSE'
  return rawType.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE'
}

function normalizeTransaction(row: TransactionRow): FinanceTransaction | null {
  const id = getStringValue(row, 'id')
  const userId = getStringValue(row, 'user_id')
  const createdAt = getStringValue(row, 'created_at') ?? getStringValue(row, 'timestamp')

  if (!id || !userId || !createdAt) {
    return null
  }

  const numericAmount = Number(row.amount)
  if (!Number.isFinite(numericAmount)) {
    return null
  }

  return {
    id,
    user_id: userId,
    amount: Math.max(0, numericAmount),
    category: getStringValue(row, 'category') ?? 'Uncategorized',
    transaction_type: normalizeTransactionType(row),
    note: getStringValue(row, 'note'),
    created_at: createdAt,
  }
}

function buildFinanceSummary(transactions: FinanceTransaction[]): FinanceSummary {
  let totalAvailable = 0
  let totalSpent = 0

  for (const transaction of transactions) {
    const amount = Math.max(0, transaction.amount)
    if (transaction.transaction_type === 'INCOME') {
      totalAvailable += amount
    } else {
      totalSpent += amount
    }
  }

  const walletBalance = totalAvailable - totalSpent
  const progressPercentage = totalAvailable > 0 ? (totalSpent / totalAvailable) * 100 : 0

  return {
    totalAvailable,
    totalSpent,
    walletBalance,
    progressPercentage,
  }
}

async function fetchRowsFromTable(table: TransactionTableName): Promise<TransactionRow[]> {
  const { data, error } = await supabase.from(table).select('*')

  if (error) {
    if (isMissingRelationError(error, table)) {
      return []
    }

    throw buildError(`Failed to fetch finance transactions from ${table}`, error)
  }

  return ((data ?? []) as TransactionRow[])
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw buildError('Auth check failed', error)
  }

  if (!user) {
    throw new Error('User is not authenticated.')
  }

  return user.id
}

async function fetchTransactions(): Promise<FinanceTransactionsResult> {
  const currentMonthKey = getCurrentMonthKey()
  const rowsById = new Map<string, FinanceTransaction>()

  for (const table of TRANSACTION_TABLE_CANDIDATES) {
    const rows = await fetchRowsFromTable(table)

    for (const row of rows) {
      const transaction = normalizeTransaction(row)
      if (!transaction || getIndiaMonthKey(transaction.created_at) !== currentMonthKey) {
        continue
      }

      rowsById.set(transaction.id, transaction)
    }
  }

  const transactions = [...rowsById.values()].sort((left, right) => {
    if (left.created_at === right.created_at) {
      return left.id.localeCompare(right.id)
    }

    return left.created_at < right.created_at ? 1 : -1
  })

  return {
    transactions,
    summary: buildFinanceSummary(transactions),
  }
}

async function insertTransactionAttempt(attempt: TransactionInsertAttempt): Promise<string | null> {
  const res = await supabase
    .from('transactions')
    .insert({
      amount: Number(attempt.payload.amount ?? 0),
      category: String(attempt.payload.category ?? ''),
      type: attempt.payload.type === 'income' ? 'income' : 'expense',
      user_id: String(attempt.payload.user_id ?? ''),
      is_need: attempt.payload.is_need as boolean | null,
      timestamp: attempt.payload.timestamp as string | undefined,
    })
    .select('id')
    .single()

  const data = res.data
  const error = res.error

  if (error) {
    const missingColumnNames = ['transaction_type', 'created_at', 'note', 'type', 'timestamp', 'is_need']
    const isRecoverableSchemaError =
      isMissingRelationError(error, attempt.table) || missingColumnNames.some((columnName) => isMissingColumnError(error, columnName))

    if (isRecoverableSchemaError) {
      return null
    }

    throw buildError(`Failed to add finance transaction via ${attempt.table}`, error)
  }

  return data?.id ?? null
}

async function addTransaction({ amount, category, transactionType, note }: AddTransactionInput): Promise<void> {
  const userId = await requireUserId()
  const normalizedAmount = Number.isFinite(amount) ? Math.round(Math.max(0, amount) * 100) / 100 : 0
  const normalizedCategory = category.trim()
  const normalizedTransactionType = transactionType.toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE'
  const createdAt = new Date().toISOString()
  const trimmedNote = note?.trim() || null

  if (normalizedAmount <= 0) {
    throw new Error('Amount must be greater than 0.')
  }

  if (!normalizedCategory) {
    throw new Error('Category is required.')
  }

  const attempts: TransactionInsertAttempt[] = [
    {
      table: 'transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        transaction_type: normalizedTransactionType,
        note: trimmedNote,
        created_at: createdAt,
      },
    },
    {
      table: 'transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        transaction_type: normalizedTransactionType,
        created_at: createdAt,
      },
    },
    {
      table: 'transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        type: normalizedTransactionType.toLowerCase(),
        timestamp: createdAt,
      },
    },
    {
      table: 'finance_transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        transaction_type: normalizedTransactionType,
        note: trimmedNote,
        created_at: createdAt,
      },
    },
    {
      table: 'finance_transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        transaction_type: normalizedTransactionType,
        created_at: createdAt,
      },
    },
  ]

  if (normalizedTransactionType === 'EXPENSE') {
    attempts.push({
      table: 'finance_transactions',
      payload: {
        user_id: userId,
        amount: normalizedAmount,
        category: normalizedCategory,
        is_need: normalizedCategory === 'Need',
        note: trimmedNote,
        created_at: createdAt,
      },
    })
  }

  let insertedId: string | null = null
  for (const attempt of attempts) {
    insertedId = await insertTransactionAttempt(attempt)
    if (insertedId) {
      break
    }
  }

  if (!insertedId) {
    if (normalizedTransactionType === 'INCOME') {
      throw new Error('Income logging requires a transaction_type column in Supabase. Your current finance table schema is still on the legacy expense-only shape.')
    }

    throw new Error('Failed to add finance transaction because no compatible transaction table schema was found.')
  }

  await logEventSafe({
    userId,
    domain: 'finance-os',
    entityType: 'finance_transaction',
    entityId: insertedId,
    eventType: FINANCE_TRANSACTION_CREATED,
    payload: {
      amount: normalizedAmount,
      category: normalizedCategory,
      transactionType: normalizedTransactionType,
    },
  })
}

async function deleteTransaction({ id }: DeleteTransactionInput): Promise<DeleteTransactionInput & { userId: string }> {
  const userId = await requireUserId()

  for (const table of TRANSACTION_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) {
      if (isMissingRelationError(error, table)) {
        continue
      }

      throw buildError(`Failed to delete finance transaction from ${table}`, error)
    }

    if ((data ?? []).length > 0) {
      break
    }
  }

  return {
    id,
    userId,
  }
}

export function useTransactions() {
  return useQuery({
    queryKey: financeTransactionsQueryKey,
    queryFn: fetchTransactions,
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  const emitEvent = useEventBus((state) => state.emitEvent)

  return useMutation({
    mutationFn: addTransaction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeTransactionsQueryKey })
      if (variables.transactionType === 'EXPENSE' && variables.category === 'Want') {
        emitEvent('WANT_EXPENSE_ADDED', {
          amount: variables.amount,
          category: variables.category,
        })
      }
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (deletedTransaction) => {
      void logEventSafe({
        userId: deletedTransaction.userId,
        domain: 'finance-os',
        entityType: 'finance_transaction',
        entityId: deletedTransaction.id,
        eventType: FINANCE_TRANSACTION_DELETED, FINANCE_TRANSACTION_CREATED,
        payload: {
          transaction_id: deletedTransaction.id,
        },
      })
      queryClient.invalidateQueries({ queryKey: financeTransactionsQueryKey })
    },
  })
}
