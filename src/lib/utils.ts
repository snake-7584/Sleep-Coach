import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names; resolves conflicts via tailwind-merge. Used by UI components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
