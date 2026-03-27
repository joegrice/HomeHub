import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz"
import { differenceInMinutes, parseISO } from "date-fns"

/**
 * Merges Tailwind class names, resolving conflicts via `tailwind-merge`.
 * Drop-in replacement for `clsx` that handles Tailwind utility conflicts.
 *
 * @param inputs Any number of class values (strings, arrays, conditionals).
 * @returns A single deduplicated class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display timezone used throughout the app. */
const TZ = "Europe/London"

/**
 * Formats an ISO 8601 string as `"HH:mm"` in the Europe/London timezone.
 *
 * @param iso ISO 8601 datetime string.
 * @returns Time string in `"HH:mm"` format, e.g. `"08:45"`.
 */
export function formatTime(iso: string): string {
  return formatInTimeZone(parseISO(iso), TZ, "HH:mm")
}

/**
 * Returns a human-readable relative time string such as `"just now"`, `"5m ago"`, or `"2h ago"`.
 * Intended for footer "last updated" labels.
 *
 * @param date ISO 8601 string or `Date` object representing a past moment.
 * @returns Relative label: `"just now"` (<60 s), `"Xm ago"` (<60 min), `"Xh ago"` (<24 h), or `"Xd ago"`.
 */
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return "just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

/**
 * Returns the number of whole minutes from now until the given ISO datetime.
 * Negative values indicate the moment is in the past.
 *
 * @param iso ISO 8601 datetime string.
 * @returns Integer minutes until `iso`.
 */
export function minutesUntil(iso: string): number {
  return differenceInMinutes(parseISO(iso), new Date())
}

/**
 * Converts a string to a deterministic HSL hue value (0–359).
 * Used to assign consistent colours to calendar events by title or calendar name.
 *
 * @param str Any string to hash.
 * @returns Integer in range [0, 359].
 */
export function hashToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}
