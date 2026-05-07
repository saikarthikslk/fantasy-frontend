import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display name that falls back to the longest word when too long, instead of ellipsis. Tie → later word. */
export function shortPlayerName(name: string | undefined, maxLen = 12): string {
  if (!name) return ''
  if (name.length <= maxLen) return name
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return name
  let pick = parts[0]
  for (const w of parts) {
    if (w.length >= pick.length) pick = w
  }
  return pick
}
