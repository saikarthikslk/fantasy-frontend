import { useContext, useEffect, useRef } from 'react'
import { KeyboardContext, type KeyboardContextValue } from './KeyboardProvider'

export function useKeyboard(): KeyboardContextValue {
  const ctx = useContext(KeyboardContext)
  if (!ctx) throw new Error('useKeyboard must be used inside <KeyboardProvider>')
  return ctx
}

/**
 * Register a contextual keyboard handler for the current page/component.
 * The handler should return `true` if it consumed the event.
 *
 * Uses a ref to always call the latest handler — no stale closure issues.
 * Callers do NOT need to wrap their handler in useCallback.
 */
export function usePageShortcuts(
  id: string,
  handler: (e: KeyboardEvent) => boolean,
) {
  const { registerPage, unregisterPage } = useKeyboard()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    registerPage(id, (e) => handlerRef.current(e))
    return () => unregisterPage(id)
  }, [id, registerPage, unregisterPage])
}
