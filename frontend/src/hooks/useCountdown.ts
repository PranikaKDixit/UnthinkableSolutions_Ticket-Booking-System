import { useEffect, useRef, useState } from 'react'
import { timeLeft } from '../lib/format'

/**
 * Live seconds-remaining until `expiresAt`.
 * Calls `onExpire` exactly once when it reaches zero.
 */
export function useCountdown(expiresAt?: string | null, onExpire?: () => void) {
  const [secs, setSecs] = useState(() => timeLeft(expiresAt))
  const fired = useRef(false)

  useEffect(() => {
    fired.current = false
    setSecs(timeLeft(expiresAt))
    if (!expiresAt) return

    const id = setInterval(() => {
      const left = timeLeft(expiresAt)
      setSecs(left)
      if (left <= 0 && !fired.current) {
        fired.current = true
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt])

  return secs
}
