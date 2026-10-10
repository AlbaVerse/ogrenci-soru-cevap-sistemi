import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'
import { Forbidden } from '@/pages/shared/Forbidden'

function SessionError() {
  const { error, retry } = useAuth()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <ErrorState title="Oturum bilgisi alınamadı" error={error} onRetry={retry} />
    </div>
  )
}

/** Giriş yapmamış kullanıcıyı giriş sayfasına yönlendirir. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner label="Oturum kontrol ediliyor" />
  if (status === 'error') return <SessionError />
  if (status === 'unauthenticated') return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Yalnızca misafirler için (giriş, kayıt...). Giriş yapmış kullanıcıyı ana sayfaya alır. */
export function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') return <FullPageSpinner label="Oturum kontrol ediliyor" />
  if (status === 'error') return <SessionError />
  if (status === 'authenticated') return <Navigate to={ROUTES.home} replace />
  return <Outlet />
}

/**
 * Role göre sayfa erişimi (yalnızca kullanıcı deneyimi içindir; asıl yetki kontrolü backend'dedir).
 * Yetkisizse yerleşim korunarak 403 sayfası gösterilir.
 */
export function RoleRoute({ allow }) {
  const { user } = useAuth()
  return allow.includes(user?.role) ? <Outlet /> : <Forbidden />
}
