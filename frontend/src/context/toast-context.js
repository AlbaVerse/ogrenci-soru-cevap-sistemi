import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

/** Kullanım: const toast = useToast(); toast.success('Kaydedildi') */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast, ToastProvider içinde kullanılmalıdır.')
  return ctx
}
