import { AlertCircle } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'

interface StatusBannerProps {
  apiError: string | null
  hint: string | null
  validationError: string | null
  captainViceError: string | null
}

type Message = { type: string; message: string } | null

export function StatusBanner({ apiError, hint, validationError, captainViceError }: StatusBannerProps) {
  const currentMessage = useMemo<Message>(() => {
    if (apiError) return { type: 'error', message: apiError }
    if (hint) return { type: 'hint', message: hint }
    if (validationError) return { type: 'validation', message: validationError }
    if (captainViceError) return { type: 'captainVice', message: captainViceError }
    return null
  }, [apiError, hint, validationError, captainViceError])

  const [displayMessage, setDisplayMessage] = useState<Message>(null)
  const [isVisible, setIsVisible] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined)
  const prevMessageRef = useRef<Message>(null)

  useEffect(() => {
    clearTimeout(timeoutRef.current)
    cancelAnimationFrame(rafRef.current!)

    if (currentMessage) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplayMessage(currentMessage)
        rafRef.current = requestAnimationFrame(() => {
          setIsVisible(false)
          rafRef.current = requestAnimationFrame(() => {
            setIsVisible(true)
          })
        })
      })
    } else if (prevMessageRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setIsVisible(false)
        timeoutRef.current = setTimeout(() => setDisplayMessage(null), 300)
      })
    }

    prevMessageRef.current = currentMessage

    return () => {
      clearTimeout(timeoutRef.current)
      cancelAnimationFrame(rafRef.current!)
    }
  }, [currentMessage])

  if (!displayMessage) return null

  const typeClasses: Record<string, string> = {
    error:       'bg-destructive/10 border-destructive/20 text-destructive',
    hint:        'bg-gold/8 border-gold/15 text-gold',
    validation:  'bg-destructive/10 border-destructive/20 text-destructive',
    captainVice: 'bg-violet-500/8 border-violet-500/15 text-violet-400',
  }

  return (
    <div
      className={[
        'shrink-0 flex items-center gap-2 px-4 border-b text-xs transition-all duration-300 overflow-hidden',
        typeClasses[displayMessage.type],
        isVisible
          ? 'opacity-100 translate-y-0 py-2 max-h-20'
          : 'opacity-0 -translate-y-2 py-0 max-h-0',
      ].join(' ')}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span>{displayMessage.message}</span>
    </div>
  )
}