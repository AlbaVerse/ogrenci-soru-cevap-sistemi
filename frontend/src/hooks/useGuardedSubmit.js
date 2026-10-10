import { useCallback, useRef, useState } from 'react'

/** Aynı formun art arda (çift tıklama, Enter) gönderilmesini engeller. */
export function useGuardedSubmit(handler) {
  const running = useRef(false)
  const [pending, setPending] = useState(false)

  const run = useCallback(
    async (...args) => {
      if (running.current) return undefined
      running.current = true
      setPending(true)
      try {
        return await handler(...args)
      } finally {
        running.current = false
        setPending(false)
      }
    },
    [handler],
  )

  return [run, pending]
}
