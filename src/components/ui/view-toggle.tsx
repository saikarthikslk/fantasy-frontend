import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  /** Current active state — true for left option, false for right option */
  isActive: boolean
  /** Callback when toggle is clicked */
  onToggle: () => void
  /** Icon for left option */
  leftIcon: LucideIcon
  /** Icon for right option */
  rightIcon: LucideIcon
  /** Optional className for the container */
  className?: string
}

/**
 * ViewToggle — segmented pill switch with sliding active indicator.
 * Monochrome: foreground pill on muted track, swapping icon colors.
 */
export function ViewToggle({
  isActive,
  onToggle,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
}: ViewToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative inline-flex items-center h-7 p-0.5 rounded-full border border-border bg-muted/60 backdrop-blur-sm cursor-pointer transition-colors hover:bg-muted',
        className
      )}
      aria-pressed={isActive}
      aria-label={`Toggle view: ${isActive ? 'left option' : 'right option'}`}
    >
      {/* Sliding active indicator — green when pitch view is active, neutral white for list */}
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-6 w-6 rounded-full shadow-sm transition-all duration-300 ease-out',
          isActive ? 'translate-x-0 bg-emerald-700' : 'translate-x-6 bg-foreground'
        )}
      />

      {/* Left segment */}
      <span
        className={cn(
          'relative z-10 h-6 w-6 flex items-center justify-center transition-colors duration-200',
          isActive ? 'text-white' : 'text-muted-foreground'
        )}
      >
        <LeftIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>

      {/* Right segment */}
      <span
        className={cn(
          'relative z-10 h-6 w-6 flex items-center justify-center transition-colors duration-200',
          !isActive ? 'text-background' : 'text-muted-foreground'
        )}
      >
        <RightIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </span>
    </button>
  )
}
