const DEFAULT_MONTHLY_BUDGET = 2000

const configuredMonthlyBudget = Number(import.meta.env.VITE_FINANCE_OS_MONTHLY_BUDGET)

// TODO: Move this to a user_settings table once finance preferences are persisted.
export const FINANCE_OS_MONTHLY_BUDGET =
  Number.isFinite(configuredMonthlyBudget) && configuredMonthlyBudget > 0
    ? configuredMonthlyBudget
    : DEFAULT_MONTHLY_BUDGET
