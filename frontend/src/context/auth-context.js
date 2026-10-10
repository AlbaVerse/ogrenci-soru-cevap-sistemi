import { createContext, useContext } from 'react'

/**
 * value: { status: 'loading' | 'authenticated' | 'unauthenticated' | 'error',
 *          user, error, retry, logout, previewAccounts, previewSignIn, resetDemo }
 */
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return ctx
}
