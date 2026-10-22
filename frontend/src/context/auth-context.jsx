import { createContext, useContext, useCallback, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// Backend URL adresi
const API_BASE_URL = 'http://127.0.0.1:8000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('unauthenticated') 
  const [error, setError] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const previewAccounts = [
    { key: 'student', label: 'Öğrenci', email: 'ogrenci@ostimteknik.edu.tr' },
    { key: 'staff', label: 'Personel', email: 'personel@ostimteknik.edu.tr' },
    { key: 'admin', label: 'Yönetici', email: 'admin@ostimteknik.edu.tr' },
  ]

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('albaverse_auth_token')

    if (!token) {
      setUser(null)
      setStatus('unauthenticated')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (res.ok) {
        const text = await res.text()
        const data = text ? JSON.parse(text) : {}
        setUser(data)
        setStatus('authenticated')
        setError(null)
        setSessionExpired(false)
      } else {
        localStorage.removeItem('albaverse_auth_token')
        setUser(null)
        setStatus('unauthenticated')
        setSessionExpired(true)
      }
    } catch (err) {
      localStorage.removeItem('albaverse_auth_token')
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (credentials) => {
    const username = credentials.email || credentials.username
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: credentials.password }),
    })

    let data = {}
    const text = await res.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('JSON Parse Hatası:', text)
      }
    }

    if (!res.ok) {
      const err = new Error(data.detail || 'Giriş başarısız.')
      err.code = data.code
      throw err
    }

    if (data.token) {
      localStorage.setItem('albaverse_auth_token', data.token)
      setUser(data.user || data)
      setStatus('authenticated')
      setSessionExpired(false)
      setError(null)
    }
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('albaverse_auth_token')
    setUser(null)
    setStatus('unauthenticated')
    setError(null)
    setSessionExpired(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        sessionExpired,
        previewAccounts,
        login,
        logout,
        retry: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}