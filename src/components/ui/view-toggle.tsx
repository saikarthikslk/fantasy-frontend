import type { LucideIcon } from 'lucide-react'

interface ViewToggleProps {
  /** Current active state - true for right option, false for left option */
  isActive: boolean
  /** Callback when toggle is clicked */
  onToggle: () => void
  /** Icon for left option */
  leftIcon: LucideIcon
  /** Icon for right option */
  rightIcon: LucideIcon
  /** Color for active state (default: 'bg-green-700') */
  activeColor?: string
  /** Color for inactive state (default: 'bg-foreground') */
  inactiveColor?: string
  /** Optional className for the container */
  className?: string
}

/**
 * ViewToggle - A sliding toggle switch with icons
 * 
 * Features:
 * - Smooth sliding animation between two states
 * - Customizable icons for each state
 * - Customizable colors
 * - Accessible button with proper ARIA attributes
 * 
 * @example
 * ```tsx
 * <ViewToggle
 *   isActive={showPitchView}
 *   onToggle={() => setShowPitchView(!showPitchView)}
 *   leftIcon={LayoutGrid}
 *   rightIcon={List}
 * />
 * ```
 */
export function ViewToggle({
  isActive,
  onToggle,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  activeColor = 'bg-green-700',
  inactiveColor = 'bg-foreground',
  className = '',
}: ViewToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 cursor-pointer bg-[#383838] ${className}`}
      aria-pressed={isActive}
      aria-label={`Toggle view: ${isActive ? 'Right option' : 'Left option'}`}
    >
      {/* Static icons - left side (inactive when active) */}
      <span
        className={`absolute left-0 w-8 h-8 flex items-center justify-center transition-opacity duration-300 z-10 ${
          isActive ? 'opacity-0' : 'opacity-50'
        }`}
      >
        <LeftIcon className="h-3.5 w-3.5 text-white" />
      </span>

      {/* Static icons - right side (inactive when not active) */}
      <span
        className={`absolute right-0 w-8 h-8 flex items-center justify-center transition-opacity duration-300 z-10 ${
          !isActive ? 'opacity-0' : 'opacity-50'
        }`}
      >
        <RightIcon className="h-3.5 w-3.5 text-white" />
      </span>

      {/* Sliding pill with active icon */}
      <span
        className={`absolute h-8 w-8 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center z-20 ${
          isActive ? `translate-x-0 ${activeColor}` : `translate-x-8 ${inactiveColor}`
        }`}
      >
        {isActive ? (
          <LeftIcon className="h-4 w-4 text-white" />
        ) : (
          <RightIcon className="h-4 w-4 text-white" />
        )}
      </span>
    </button>
  )
}
