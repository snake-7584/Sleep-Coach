/**
 * Parse and compute sleep duration from bedtime and wake time (12hr AM/PM).
 */

/** Parse "11:00 PM", "11pm", "11:30 AM" etc. to minutes since midnight (0–1439). Returns null if invalid. */
export function parseTimeToMinutes(str: string): number | null {
  const s = str.trim().toUpperCase();
  if (!s) return null;
  // Match: optional leading digits, optional :MM, optional space, optional AM/PM
  const match = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (hours < 0 || hours > 12 || minutes < 0 || minutes > 59) return null;

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  if (!ampm) {
    // No AM/PM: assume 24hr if > 12
    if (hours <= 12) return null; // ambiguous, require AM/PM
    if (hours > 23) return null;
  }

  return hours * 60 + minutes;
}

/**
 * Hours slept between bedtime and wake time (wake is next morning).
 * e.g. bed "11:00 PM" (23:00), wake "7:00 AM" (7:00) → 8 hours.
 * Returns null if either time is invalid.
 */
export function hoursBetweenBedAndWake(bedStr: string, wakeStr: string): number | null {
  const bed = parseTimeToMinutes(bedStr);
  const wake = parseTimeToMinutes(wakeStr);
  if (bed === null || wake === null) return null;
  let diff = wake - bed;
  if (diff <= 0) diff += 24 * 60; // wake is next day
  return Math.round((diff / 60) * 2) / 2; // round to 0.5
}

/** Format hours to "X.X" for display; cap at 24. */
export function formatHours(h: number): string {
  const capped = Math.min(24, Math.max(0, h));
  return capped % 1 === 0 ? String(capped) : capped.toFixed(1);
}

/** Split "11:00 PM" into time and AM/PM for separate inputs. */
export function splitTime(str: string): { time: string; amPm: "AM" | "PM" } {
  const s = str.trim();
  if (!s) return { time: "", amPm: "AM" };
  const match = s.match(/^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?$/i);
  if (!match) return { time: s, amPm: "AM" };
  return { time: match[1], amPm: (match[2]?.toUpperCase() === "PM" ? "PM" : "AM") as "AM" | "PM" };
}

/** Combine time and AM/PM into "11:00 PM". */
export function combineTimeAmPm(time: string, amPm: "AM" | "PM"): string {
  const t = time.trim();
  if (!t) return "";
  return `${t} ${amPm}`;
}
