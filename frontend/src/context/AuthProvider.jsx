import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '@/services'
import { UNAUTHORIZED_EVENT } from '@/services/api/httpClient'
import { AuthContext } from './auth-context'

const INITIAL = { status: 'loading', user: null, error: null, sessionExpired: false }
const SIGNED_OUT = { status: 'unauthenticated', user: null, error: null, sessionExpired: false }

async function fetchSession() {
  try {
    const user = await authService.getSession()
    return user ? { ...SIGNED_OUT, status: 'authenticated', user } : SIGNED_OUT
  } catch (err) {
    if (err?.status === 401) return SIGNED_OUT
    return { ...SIGNED_OUT, status: 'error', error: err }
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    let active = true
    fetchSession().then((next) => active && setState(next))
    return () => {
      active = false
    }
  }, [])

  // Oturum açıkken korumalı bir istek 401 dönerse oturum düşürülür ve kullanıcı bilgilendirilir.
  useEffect(() => {
    const onUnauthorized = () =>
      setState((current) =>
        current.status === 'authenticated' ? { ...SIGNED_OUT, sessionExpired: true } : current,
      )
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const retry = useCallback(async () => {
    setState(INITIAL)
    setState(await fetchSession())
  }, [])

  /** Başarılıysa kullanıcıyı döndürür; hata AppError olarak çağırana fırlatılır (form hatası göstermek için). */
  const login = useCallback(async (credentials) => {
    const user = await authService.login(credentials)
    setState({ ...SIGNED_OUT, status: 'authenticated', user })
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      // Sunucu isteği başarısız olsa bile yerel oturum bilgisi temizlenir.
      setState(SIGNED_OUT)
    }
  }, [])

  const updateUser = useCallback((user) => setState((current) => ({ ...current, user })), [])
  const dismissSessionExpired = useCallback(() => setState((c) => ({ ...c, sessionExpired: false })), [])

  // ---- Yalnızca mock modu ----
  const previewSignIn = useCallback(async (accountKey) => {
    const user = await authService.signInAs(accountKey)
    setState({ ...SIGNED_OUT, status: 'authenticated', user })
  }, [])
  const resetDemo = useCallback(() => {
    authService.resetDemo?.()
    setState(SIGNED_OUT)
  }, [])
  const simulateSessionExpiry = useCallback(() => {
    authService.expireSession?.()
    setState((current) => (current.status === 'authenticated' ? { ...SIGNED_OUT, sessionExpired: true } : current))
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      retry,
      login,
      logout,
      updateUser,
      dismissSessionExpired,
      previewAccounts: authService.previewAccounts ?? null,
      previewSignIn: authService.signInAs ? previewSignIn : null,
      resetDemo: authService.resetDemo ? resetDemo : null,
      simulateSessionExpiry: authService.expireSession ? simulateSessionExpiry : null,
    }),
    [state, retry, login, logout, updateUser, dismissSessionExpired, previewSignIn, resetDemo, simulateSessionExpiry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
