/** Central localStorage keys so dashboard, analysis, and settings stay in sync. */

export const STORAGE_KEY = "sleep-coach-log";
export const ANALYSIS_STORAGE_KEY = "sleep-coach-analysis";
export const POINTS_STORAGE_KEY = "sleep-coach-points";
/** Set when user clears cache; dashboard shows "this week" = 0 once, then removes. */
export const CACHE_CLEARED_KEY = "sleep-coach-cache-cleared";
/** Array of past week snapshots (createdAt, days, debt, credit, plan, points). */
export const WEEKS_HISTORY_KEY = "sleep-coach-weeks";
