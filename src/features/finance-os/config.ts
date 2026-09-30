const DEFAULT_MONTHLY_BUDGET = 2000

const configuredMonthlyBudget = Number(import.meta.env.VITE_FINANCE_OS_MONTHLY_BUDGET)

// TODO(F-004): Migrate to the user_settings table once finance preferences are persisted, using the existing user_settings.finance_preferences column.
export const FINANCE_OS_MONTHLY_BUDGET =
  Number.isFinite(configuredMonthlyBudget) && configuredMonthlyBudget > 0
    ? configuredMonthlyBudget
    : DEFAULT_MONTHLY_BUDGET
