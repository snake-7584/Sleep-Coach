import { WEEKS_HISTORY_KEY } from "./storage-keys";
import type { DayExpense } from "./finance-calculator";

export type WeekEntry = {
  createdAt: string;
  days: DayExpense[];
  totalOverspend: number;
  totalUnderspend: number;
  netBalance: number;
  plan: string;
  points: number;
  targetBudget?: number;
};

const MAX_WEEKS = 20;

function loadRaw(): WeekEntry[] {
  try {
    const raw = localStorage.getItem(WEEKS_HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is WeekEntry =>
        e &&
        typeof e === "object" &&
        typeof e.createdAt === "string" &&
        Array.isArray(e.days) &&
        typeof e.totalOverspend === "number" &&
        typeof e.totalUnderspend === "number" &&
        typeof e.plan === "string"
    );
  } catch {
    return [];
  }
}

export function loadWeekHistory(): WeekEntry[] {
  return loadRaw();
}

export function appendWeek(entry: Omit<WeekEntry, "createdAt">): void {
  try {
    const list = loadRaw();
    const withDate: WeekEntry = { ...entry, createdAt: new Date().toISOString() };
    const next = [withDate, ...list].slice(0, MAX_WEEKS);
    localStorage.setItem(WEEKS_HISTORY_KEY, JSON.stringify(next));
  } catch {
  }
}

export function getPreviousWeeksSummary(count: number = 2): { overspend: number; underspend: number; points: number }[] {
  return loadRaw()
    .slice(0, count)
    .map((e) => ({ overspend: e.totalOverspend, underspend: e.totalUnderspend, points: e.points }));
}

export function clearWeekHistory(): void {
  try {
    localStorage.removeItem(WEEKS_HISTORY_KEY);
  } catch {
  }
}
