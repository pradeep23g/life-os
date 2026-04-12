import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'

export const financeTransactionsQueryKey = ['finance-os', 'transactions'] as const

export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category: string
  timestamp: string
}

type AddTransactionInput = {
  amount: number
  category: string
  type?: TransactionType
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

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, amount, type, category, timestamp')
    .order('timestamp', { ascending: false })
    .limit(50)

  if (error) {
    if (isMissingRelationError(error, 'transactions')) {
      return []
    }

    throw buildError('Failed to fetch transactions', error)
  }

  return (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount),
  }))
}

async function addTransaction({ amount, category, type = 'expense' }: AddTransactionInput): Promise<void> {
  const userId = await requireUserId()
  const normalizedAmount = Number.isFinite(amount) ? Math.round(Math.max(0, amount) * 100) / 100 : 0
  const normalizedCategory = category.trim()

  if (normalizedAmount <= 0) {
    throw new Error('Amount must be greater than 0.')
  }

  if (!normalizedCategory) {
    throw new Error('Category is required.')
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: normalizedAmount,
      type,
      category: normalizedCategory,
      timestamp: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to add transaction', error)
  }

  await logEventSafe({
    userId,
    domain: 'finance-os',
    entityType: 'transaction',
    entityId: data.id,
    eventType: 'FINANCE_TRANSACTION_LOGGED',
    payload: {
      amount: normalizedAmount,
      type,
      category: normalizedCategory,
    },
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: financeTransactionsQueryKey,
    queryFn: fetchTransactions,
  })
}

export function useAddTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeTransactionsQueryKey })
    },
  })
}
