import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '@/context/auth-context'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { DEMO_ACCOUNTS } from '@/mocks/data/users'
import { mapUser } from '@/services/adapters/userMapper'

export const demoUser = (key) => mapUser(DEMO_ACCOUNTS[key].raw)

/** Gerçek AuthProvider yerine sabit bir oturum sağlar (servis katmanına dokunmaz). */
export function renderWithProviders(ui, { route = '/', user = null, status, authOverrides = {} } = {}) {
  const auth = {
    status: status ?? (user ? 'authenticated' : 'unauthenticated'),
    user,
    error: null,
    retry: vi.fn(),
    sessionExpired: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    dismissSessionExpired: vi.fn(),
    simulateSessionExpiry: null,
    previewAccounts: null,
    previewSignIn: null,
    resetDemo: null,
    ...authOverrides,
  }
  return {
    auth,
    ...render(
      <ThemeProvider>
        <ToastProvider>
          <AuthContext.Provider value={auth}>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </ThemeProvider>,
    ),
  }
}
