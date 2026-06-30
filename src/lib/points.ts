import { DAILY_BUDGET, type DayExpense } from "./finance-calculator";
import { POINTS_STORAGE_KEY } from "./storage-keys";

export { POINTS_STORAGE_KEY };

export function pointsForSpending(spent: number, budget: number = DAILY_BUDGET): number {
  if (spent <= 0) return 0;
  const ratio = spent / budget;
  if (ratio <= 0.25) return 10;
  if (ratio <= 0.5) return 8;
  if (ratio <= 0.75) return 6;
  if (ratio <= 1.0) return 4;
  if (ratio <= 1.25) return 2;
  return 0;
}

function averageDailySpend(days: DayExpense[]): number {
  if (days.length === 0) return 0;
  const total = days.reduce((sum, d) => sum + d.spent, 0);
  return total / days.length;
}

export type PointsState = {
  totalPoints: number;
  lastAddedDaysKey?: string;
  history?: { at: string; points: number }[];
};

export function loadPoints(): PointsState {
  try {
    const raw = localStorage.getItem(POINTS_STORAGE_KEY);
    if (!raw) return { totalPoints: 0 };
    const data = JSON.parse(raw) as PointsState;
    const total = typeof data.totalPoints === "number" ? data.totalPoints : 0;
    return {
      totalPoints: total,
      lastAddedDaysKey: data.lastAddedDaysKey,
      history: data.history,
    };
  } catch {
    return { totalPoints: 0 };
  }
}

export function savePoints(state: PointsState): void {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

function daysKey(days: DayExpense[]): string {
  return days.map((d) => `${d.day}:${d.spent}`).join("|");
}

export function addPointsForWeekIfNew(
  days: DayExpense[],
  pointsFromAI?: number,
  _budget?: number
): void {
  const budget = _budget ?? DAILY_BUDGET;
  const state = loadPoints();
  const key = daysKey(days);
  if (state.lastAddedDaysKey === key) return;
  const hasAI = pointsFromAI !== undefined && pointsFromAI >= 0;
  const basePoints = hasAI ? pointsFromAI : pointsForSpending(averageDailySpend(days), budget);
  const weekPoints = Math.max(0, Math.min(10, Math.round(basePoints)));
  savePoints({
    totalPoints: (state.totalPoints ?? 0) + weekPoints,
    lastAddedDaysKey: key,
    history: state.history,
  });
}

export function getAllTimePoints(): number {
  return loadPoints().totalPoints ?? 0;
}
