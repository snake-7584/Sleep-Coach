import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names; resolves conflicts via tailwind-merge. Used by UI components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUsername(): string {
  const adjectives = ['Swift', 'Bright', 'Smart', 'Quick', 'Brave', 'Clever', 'Wise', 'Bold'];
  const nouns = ['Fox', 'Owl', 'Hawk', 'Bear', 'Wolf', 'Deer', 'Hare', 'Lynx'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

const XP_THRESHOLDS = [
  { level: 1, title: 'Newbie', minXp: 0 },
  { level: 2, title: 'Saver', minXp: 100 },
  { level: 3, title: 'Budgeter', minXp: 350 },
  { level: 4, title: 'Investor', minXp: 850 },
  { level: 5, title: 'Financier', minXp: 1850 },
  { level: 6, title: 'Wealth Builder', minXp: 3850 },
  { level: 7, title: 'Money Master', minXp: 7350 },
  { level: 8, title: 'Financial Guru', minXp: 12350 },
  { level: 9, title: 'Wealth Wizard', minXp: 19850 },
  { level: 10, title: 'Millionaire', minXp: 29850 },
];

export function getLevelInfo(level: number) {
  const info = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)];
  const next = XP_THRESHOLDS[level];
  return {
    ...info,
    xpRequired: next ? next.minXp - info.minXp : 0,
  };
}

export function getProgressToNextLevel(xp: number, level: number): number {
  const current = getLevelInfo(level);
  const next = XP_THRESHOLDS[level];
  if (!next) return 100;
  return Math.min(((xp - current.minXp) / (next.minXp - current.minXp)) * 100, 100);
}
