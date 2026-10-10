import { useEffect } from 'react'

/** Açık bir açılır panelin dışına tıklanınca veya Esc'ye basılınca kapanmasını sağlar. */
export function useDismiss(ref, open, onDismiss) {
  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onDismiss(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') onDismiss(true)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onDismiss])
}
