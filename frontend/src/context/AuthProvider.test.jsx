import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { authMock } from '@/mocks/authMock'
import { DEMO_PASSWORD } from '@/mocks/data/users'
import { UNAUTHORIZED_EVENT } from '@/services/api/httpClient'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './auth-context'

function Probe() {
  const { status, user, sessionExpired, login, logout } = useAuth()
  return (
    <>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user?.fullName ?? '-'}</p>
      <p data-testid="expired">{String(sessionExpired)}</p>
      <button onClick={() => login({ email: 'irem.kaya@ostimteknik.edu.tr', password: DEMO_PASSWORD })}>giriş</button>
      <button onClick={() => login({ email: 'irem.kaya@ostimteknik.edu.tr', password: 'yanlis' }).catch(() => {})}>hatalı giriş</button>
      <button onClick={logout}>çıkış</button>
    </>
  )
}

const renderProbe = () => render(<AuthProvider><Probe /></AuthProvider>)

beforeEach(() => authMock.resetDemo())

describe('AuthProvider (mock servisle)', () => {
  it('oturum yoksa unauthenticated olur', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
  })

  it('giriş ve çıkışta durum güncellenir', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await userEvent.click(screen.getByText('giriş'))
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('İrem Kaya'))
    await userEvent.click(screen.getByText('çıkış'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(screen.getByTestId('expired')).toHaveTextContent('false')
  })

  it('hatalı girişte oturum açılmaz', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await userEvent.click(screen.getByText('hatalı giriş'))
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
  })

  it('oturum açıkken 401 olayı gelirse oturum düşer ve süre doldu işaretlenir', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    await userEvent.click(screen.getByText('giriş'))
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    })
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(screen.getByTestId('expired')).toHaveTextContent('true')
  })

  it('oturum yokken gelen 401 olayı "süre doldu" mesajı üretmez', async () => {
    renderProbe()
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    act(() => {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    })
    expect(screen.getByTestId('expired')).toHaveTextContent('false')
  })
})
