import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'hidden md:inline-flex items-center justify-center px-1.5 py-0.5 rounded border',
        'text-[10px] font-mono font-medium leading-none',
        'bg-muted text-muted-foreground border-border/80',
        'select-none pointer-events-none',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
