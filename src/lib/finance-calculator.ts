export const DAILY_BUDGET = 100;

export type DayExpense = {
  day: string;
  spent: number;
  category?: string;
  note?: string;
};

export function getDailyOverspend(spent: number, budget: number = DAILY_BUDGET): number {
  return Math.max(0, spent - budget);
}

export function getDailyUnderspend(spent: number, budget: number = DAILY_BUDGET): number {
  return Math.max(0, budget - spent);
}

export function computeBudgetBalance(days: DayExpense[], budget: number = DAILY_BUDGET) {
  let totalOverspend = 0;
  let totalUnderspend = 0;
  const withCalculations = days.map((d) => {
    const overspend = getDailyOverspend(d.spent, budget);
    const underspend = getDailyUnderspend(d.spent, budget);
    totalOverspend += overspend;
    totalUnderspend += underspend;
    return { ...d, overspend, underspend };
  });
  const netBalance = totalUnderspend - totalOverspend;
  return {
    days: withCalculations,
    totalOverspend,
    totalUnderspend,
    netBalance,
  };
}

export const DEFAULT_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getDefaultWeek(): DayExpense[] {
  return DEFAULT_DAY_LABELS.map((day) => ({ day, spent: 0 }));
}

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Other",
] as const;
