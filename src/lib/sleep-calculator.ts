/**
 * Sleep Coach — Sleep calculation utility (non-AI).
 * All numbers here are computed from raw hours; the AI only interprets them.
 */

export const TARGET_SLEEP_HOURS = 8;

/** One day in the log: label, hours slept, optional wake/bed times (e.g. "7:00 AM"). */
export type SleepDay = {
  day: string;
  hours: number;
  wakeTime?: string;
  bedtime?: string;
};

/**
 * Per-day debt: hours below target (0 if over target).
 * Formula: dailyDebt = Math.max(0, target - sleepHours)
 */
export function getDailyDebt(sleepHours: number, targetHours: number = TARGET_SLEEP_HOURS): number {
  return Math.max(0, targetHours - sleepHours);
}

/**
 * Per-day credit: hours above target (0 if under target).
 * Formula: dailyCredit = Math.max(0, sleepHours - target)
 */
export function getDailyCredit(sleepHours: number, targetHours: number = TARGET_SLEEP_HOURS): number {
  return Math.max(0, sleepHours - targetHours);
}

/**
 * Aggregate over 7 days: total debt, total credit, net balance.
 * Net balance = totalCredit - totalDebt (positive = surplus, negative = deficit).
 */
export function computeSleepBalance(days: SleepDay[], targetHours: number = TARGET_SLEEP_HOURS) {
  let totalDebt = 0;
  let totalCredit = 0;
  const withCalculations = days.map((d) => {
    const debt = getDailyDebt(d.hours, targetHours);
    const credit = getDailyCredit(d.hours, targetHours);
    totalDebt += debt;
    totalCredit += credit;
    return { ...d, debt, credit };
  });
  const netBalance = totalCredit - totalDebt;
  return {
    days: withCalculations,
    totalDebt,
    totalCredit,
    netBalance,
  };
}

export const DEFAULT_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Default log: 7 days, each with TARGET_SLEEP_HOURS. */
export function getDefaultSleepLog(): SleepDay[] {
  return DEFAULT_DAY_LABELS.map((day) => ({ day, hours: TARGET_SLEEP_HOURS }));
}

/** First non-empty wakeTime in the log, or undefined. */
export function getTypicalWakeTime(days: SleepDay[]): string | undefined {
  const first = days.find((d) => d.wakeTime?.trim());
  return first?.wakeTime?.trim() || undefined;
}

/** First non-empty bedtime in the log, or undefined. */
export function getTypicalBedtime(days: SleepDay[]): string | undefined {
  const first = days.find((d) => d.bedtime?.trim());
  return first?.bedtime?.trim() || undefined;
}
