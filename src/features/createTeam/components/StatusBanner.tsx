import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatusBannerProps {
  apiError: string | null
  hint: string | null
  validationError: string | null
  captainViceError: string | null
}

export function StatusBanner({ apiError, hint, validationError, captainViceError }: StatusBannerProps) {
  const [visible, setVisible] = useState(false)
  const [content, setContent] = useState<{ type: string; message: string } | null>(null)

  // Determine current message
  const currentMessage = apiError
    ? { type: 'error', message: apiError }
    : hint
    ? { type: 'hint', message: hint }
    : validationError
    ? { type: 'validation', message: validationError }
    : captainViceError
    ? { type: 'captainVice', message: captainViceError }
    : null

  useEffect(() => {
    if (currentMessage) {
      // New message - show it
      setContent(currentMessage)
      setVisible(true)
    } else if (visible) {
      // Message removed - fade out
      setVisible(false)
      // Clear content after animation
      const timer = setTimeout(() => setContent(null), 300)
      return () => clearTimeout(timer)
    }
  }, [currentMessage, visible])

  if (!content) return null

  const baseClasses = "shrink-0 flex items-center gap-2 px-4 py-2 border-b text-xs transition-all duration-300"
  const animationClasses = visible
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-2"

  const typeClasses = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    hint: "bg-gold/8 border-gold/15 text-gold",
    validation: "bg-destructive/10 border-destructive/20 text-destructive",
    captainVice: "bg-violet-500/8 border-violet-500/15 text-violet-400",
  }[content.type]

  return (
    <div className={`${baseClasses} ${typeClasses} ${animationClasses}`}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{content.message}</span>
    </div>
  )
}
