/**
 * Week history: past analysis snapshots for "view previous weeks" and AI context.
 * Only call something "typical" when we have more than one week (don't assume from one occurrence).
 */

import { WEEKS_HISTORY_KEY } from "./storage-keys";
import type { SleepDay } from "./sleep-calculator";

export type WeekEntry = {
  createdAt: string;
  days: SleepDay[];
  totalDebt: number;
  totalCredit: number;
  netBalance: number;
  plan: string;
  points: number;
  typicalWake?: string;
  typicalBedtime?: string;
  targetHours?: number;
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
        typeof e.totalDebt === "number" &&
        typeof e.totalCredit === "number" &&
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
    // ignore
  }
}

/** Summary for API: last N weeks (debt, credit, points) so AI can build on previous. */
export function getPreviousWeeksSummary(count: number = 2): { debt: number; credit: number; points: number }[] {
  return loadRaw()
    .slice(0, count)
    .map((e) => ({ debt: e.totalDebt, credit: e.totalCredit, points: e.points }));
}

export function clearWeekHistory(): void {
  try {
    localStorage.removeItem(WEEKS_HISTORY_KEY);
  } catch {
    // ignore
  }
}
