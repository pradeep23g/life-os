import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'

export const financeTransactionsQueryKey = ['finance-os', 'transactions', 'monthly'] as const

export type FinanceTransaction = {
  id: string
  user_id: string
  amount: number
  category: string
  is_need: boolean
  note: string | null
  created_at: string
}

export type FinanceSummary = {
  monthlyBudget: number
  totalSpent: number
  needsTotal: number
  wantsTotal: number
  topCategory: string
  weeklySpent: number
  weeklyDailyTotals: number[]
  daysLeftInMonth: number
  moneyLeft: number
  dailySafeLimit: number
  projectedMonthlySpend: number
  wasteAmount: number
  topWasteCategory: string
  isProjectedOverBudget: boolean
  isMoneyLeftNegative: boolean
  isDailySafeLimitNegative: boolean
  projectionMultiplier: number
}

export type FinanceTransactionsResult = {
  transactions: FinanceTransaction[]
  summary: FinanceSummary
}

type AddTransactionInput = {
  amount: number
  category: string
  isNeed: boolean
  note?: string
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

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0))
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function getIndiaMonthMeta() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970')
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1')
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1')
  const totalDaysInMonth = new Date(year, month, 0).getDate()
  const daysPassed = Math.min(totalDaysInMonth, Math.max(1, day))
  const daysLeftInMonth = Math.max(0, totalDaysInMonth - day)

  return {
    totalDaysInMonth,
    daysPassed,
    daysLeftInMonth,
  }
}

function getIndiaWeekdayIndex(dateValue: string): number {
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(dateValue))

  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }

  return weekdayMap[weekdayName] ?? 0
}

function getIndiaDateKey(dateValue: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateValue))

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

function getIndiaWeekRange() {
  const now = new Date()
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(now)

  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }
  const offsetFromMonday = weekdayMap[weekdayName] ?? 0

  const indiaDateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = Number(indiaDateParts.find((part) => part.type === 'year')?.value ?? '1970')
  const month = Number(indiaDateParts.find((part) => part.type === 'month')?.value ?? '01')
  const day = Number(indiaDateParts.find((part) => part.type === 'day')?.value ?? '01')

  const todayIndiaUtcNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const weekStart = new Date(todayIndiaUtcNoon)
  weekStart.setUTCDate(weekStart.getUTCDate() - offsetFromMonday)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  return {
    startKey: getIndiaDateKey(weekStart.toISOString()),
    endKey: getIndiaDateKey(weekEnd.toISOString()),
  }
}

function buildFinanceSummary(transactions: FinanceTransaction[]): FinanceSummary {
  const monthlyBudget = 2000
  let totalSpent = 0
  let needsTotal = 0
  let wantsTotal = 0
  const categorySpend = new Map<string, number>()
  const wasteCategorySpend = new Map<string, number>()
  const weeklyDailyTotals = [0, 0, 0, 0, 0, 0, 0]
  const weekRange = getIndiaWeekRange()
  const monthMeta = getIndiaMonthMeta()

  for (const transaction of transactions) {
    const amount = Math.max(0, transaction.amount)
    totalSpent += amount

    if (transaction.is_need) {
      needsTotal += amount
    } else {
      wantsTotal += amount
      const normalizedWasteCategory = transaction.category.trim() || 'Misc'
      wasteCategorySpend.set(normalizedWasteCategory, (wasteCategorySpend.get(normalizedWasteCategory) ?? 0) + amount)
    }

    const normalizedCategory = transaction.category.trim() || 'Misc'
    categorySpend.set(normalizedCategory, (categorySpend.get(normalizedCategory) ?? 0) + amount)

    const transactionDateKey = getIndiaDateKey(transaction.created_at)
    if (transactionDateKey >= weekRange.startKey && transactionDateKey <= weekRange.endKey) {
      const dayIndex = getIndiaWeekdayIndex(transaction.created_at)
      weeklyDailyTotals[dayIndex] += amount
    }
  }

  let topCategory = 'No spend yet'
  let topCategoryAmount = 0
  for (const [category, amount] of categorySpend.entries()) {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount
      topCategory = category
    }
  }

  let topWasteCategory = 'No waste yet'
  let topWasteAmount = 0
  for (const [category, amount] of wasteCategorySpend.entries()) {
    if (amount > topWasteAmount) {
      topWasteAmount = amount
      topWasteCategory = category
    }
  }

  const moneyLeft = monthlyBudget - totalSpent
  const safeDivisor = Math.max(1, monthMeta.daysLeftInMonth)
  const dailySafeLimit = moneyLeft / safeDivisor
  const projectionMultiplier = monthMeta.totalDaysInMonth / Math.max(1, monthMeta.daysPassed)
  const projectedMonthlySpend = totalSpent * projectionMultiplier

  return {
    monthlyBudget,
    totalSpent,
    needsTotal,
    wantsTotal,
    topCategory,
    weeklySpent: weeklyDailyTotals.reduce((total, value) => total + value, 0),
    weeklyDailyTotals,
    daysLeftInMonth: monthMeta.daysLeftInMonth,
    moneyLeft,
    dailySafeLimit,
    projectedMonthlySpend,
    wasteAmount: wantsTotal,
    topWasteCategory,
    isProjectedOverBudget: projectedMonthlySpend > monthlyBudget,
    isMoneyLeftNegative: moneyLeft < 0,
    isDailySafeLimitNegative: dailySafeLimit < 0,
    projectionMultiplier,
  }
}

export function getProjectedMonthlySpendAfter(summary: FinanceSummary, transactionAmount: number): number {
  const normalizedAmount = Number.isFinite(transactionAmount) ? Math.max(0, transactionAmount) : 0
  return summary.projectedMonthlySpend + normalizedAmount * summary.projectionMultiplier
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
  const { startIso, endIso } = getCurrentMonthRange()
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('id, user_id, amount, category, is_need, note, created_at')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'finance_transactions')) {
      return {
        transactions: [],
        summary: buildFinanceSummary([]),
      }
    }

    throw buildError('Failed to fetch finance transactions', error)
  }

  const transactions: FinanceTransaction[] = (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))

  return {
    transactions,
    summary: buildFinanceSummary(transactions),
  }
}

async function addTransaction({ amount, category, isNeed, note }: AddTransactionInput): Promise<void> {
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
    .from('finance_transactions')
    .insert({
      user_id: userId,
      amount: normalizedAmount,
      category: normalizedCategory,
      is_need: isNeed,
      note: note?.trim() || null,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to add finance transaction', error)
  }

  await logEventSafe({
    userId,
    domain: 'finance-os',
    entityType: 'finance_transaction',
    entityId: data.id,
    eventType: 'FINANCE_TRANSACTION_LOGGED',
    payload: {
      amount: normalizedAmount,
      category: normalizedCategory,
      isNeed,
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
