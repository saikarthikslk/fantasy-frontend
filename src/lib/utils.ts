import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generic name parts that don't identify a specific cricketer; skipped when shortening. */
const GENERIC_NAME_PARTS = new Set([
  'agarwal',
  'ali',
  'hussain',
  'khan',
  'kumar',
  'md',
  'mishra',
  'mohammed',
  'mohd',
  'pandey',
  'patel',
  'reddy',
  'sharma',
  'singh',
  'varma',
  'yadav',
])

/** Display name that falls back to the longest distinctive word when too long. Tie → later word. */
export function shortPlayerName(name: string | undefined, maxLen = 12): string {
  if (!name) return ''
  if (name.length <= maxLen) return name
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return name
  const distinctive = parts.filter((w) => !GENERIC_NAME_PARTS.has(w.toLowerCase()))
  const pool = distinctive.length > 0 ? distinctive : parts
  let pick = pool[0]
  for (const w of pool) {
    if (w.length >= pick.length) pick = w
  }
  return pick
}
