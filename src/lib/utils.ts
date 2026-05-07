import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display name that falls back to surname (last word) when too long, instead of ellipsis. */
export function shortPlayerName(name: string | undefined, maxLen = 12): string {
  if (!name) return ''
  if (name.length <= maxLen) return name
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return parts[parts.length - 1]
}
