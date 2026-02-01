/**
 * Reward points for good sleep. Stored in localStorage; persists across reloads.
 */

import { TARGET_SLEEP_HOURS, type SleepDay } from "./sleep-calculator";
import { POINTS_STORAGE_KEY } from "./storage-keys";

export { POINTS_STORAGE_KEY };

/** Points per night with oversleep awareness relative to target. */
export function pointsForHours(hours: number, target: number = TARGET_SLEEP_HOURS): number {
  if (hours <= 0) return 0;
  const diff = hours - target;
  if (diff >= 7) return 0;
  if (diff >= 5) return 2;
  if (diff >= 3) return 6;
  if (diff >= 1) return 8;
  if (diff >= 0) return 10;
  const deficit = Math.abs(diff);
  if (deficit <= 1) return 5;
  return 0;
}

function averageHours(days: SleepDay[]): number {
  if (days.length === 0) return 0;
  const total = days.reduce((sum, d) => sum + d.hours, 0);
  return total / days.length;
}

function clampWeeklyPoints(
  days: SleepDay[],
  points: number,
  totalDebt: number,
  target: number = TARGET_SLEEP_HOURS
): number {
  const rounded = Math.max(0, Math.min(10, Math.round(points)));
  const hasExtreme = days.some((d) => d.hours >= target + 7);
  const heavyCount = days.filter((d) => d.hours >= target + 4 && d.hours < target + 7).length;
  const severeShortThreshold = Math.max(2, target - 4);
  const shortThreshold = Math.max(3.5, target - 2.5);
  const severeShortCount = days.filter((d) => d.hours > 0 && d.hours < severeShortThreshold).length;
  const shortCount = days.filter((d) => d.hours > 0 && d.hours < shortThreshold).length;
  const avg = averageHours(days);

  let maxAllowed = 10;
  if (hasExtreme) {
    maxAllowed = 3;
  } else if (heavyCount > 0 || avg > target + 2.5) {
    maxAllowed = 6;
  }

  if (severeShortCount >= 2) {
    maxAllowed = Math.min(maxAllowed, 2);
  } else if (shortCount >= 3 || avg < target - 2.25) {
    maxAllowed = Math.min(maxAllowed, 4);
  }

  if (totalDebt > 6) {
    maxAllowed = Math.min(maxAllowed, 5);
  } else if (totalDebt > 3) {
    maxAllowed = Math.min(maxAllowed, 7);
  }

  return Math.max(0, Math.min(maxAllowed, rounded));
}

export type PointsState = {
  totalPoints: number;
  /** Hash of last 7-day log we added points for (avoid double-add). */
  lastAddedDaysKey?: string;
  history?: { at: string; points: number }[];
};

/** Load points from localStorage. */
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

/** Save points to localStorage. */
export function savePoints(state: PointsState): void {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/** Unique key for current 7-day log (to avoid adding same week twice). */
function daysKey(days: SleepDay[]): string {
  return days.map((d) => `${d.day}:${d.hours}`).join("|");
}

/**
 * Add this week's points to all-time total (once per unique 7-day log).
 * Call when user gets analysis. Uses AI coach points when provided, else formula.
 */
export function addPointsForWeekIfNew(
  days: SleepDay[],
  pointsFromAI?: number,
  totalDebt: number = 0,
  targetHours: number = TARGET_SLEEP_HOURS
): void {
  const state = loadPoints();
  const key = daysKey(days);
  if (state.lastAddedDaysKey === key) return;
  const hasAI = pointsFromAI !== undefined && pointsFromAI >= 0;
  const basePoints = hasAI ? pointsFromAI : pointsForHours(averageHours(days), targetHours);
  const weekPoints = clampWeeklyPoints(days, basePoints, totalDebt, targetHours);
  savePoints({
    totalPoints: (state.totalPoints ?? 0) + weekPoints,
    lastAddedDaysKey: key,
    history: state.history,
  });
}

/** Get all-time points (for display). */
export function getAllTimePoints(): number {
  return loadPoints().totalPoints ?? 0;
}
