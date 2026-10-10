import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Alert, Spinner } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { authService } from '@/services'

const linkClass =
  'inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover'

/** E-postadaki doğrulama bağlantısının açıldığı sayfa: /e-posta-dogrulama?token=... */
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [result, setResult] = useState(null) // null = doğrulanıyor | { ok: true } | { ok: false, message }
  const startedFor = useRef(null)

  useEffect(() => {
    if (!token || startedFor.current === token) return // StrictMode'da çift istek atılmaz
    startedFor.current = token
    authService
      .verifyEmail({ token })
      .then(() => setResult({ ok: true }))
      .catch((err) => setResult({ ok: false, message: err?.message || 'Doğrulama tamamlanamadı.' }))
  }, [token])

  if (!token) {
    return (
      <AuthLayout title="E-posta doğrulama">
        <Alert tone="warning" title="Doğrulama bağlantısı eksik">
          Bağlantı eksik veya hatalı görünüyor. E-postandaki bağlantıyı tam olarak açtığından emin ol ya da kodla doğrula.
        </Alert>
        <Link to={ROUTES.verifyPending} className={`${linkClass} mt-5`}>
          Kodla doğrula veya yeniden gönder
        </Link>
      </AuthLayout>
    )
  }

  if (!result) {
    return (
      <AuthLayout title="E-posta doğrulanıyor">
        <div className="flex items-center gap-3 text-sm text-fg-muted">
          <Spinner label="E-posta doğrulanıyor" /> Bir saniye, e-posta adresin doğrulanıyor…
        </div>
      </AuthLayout>
    )
  }

  if (result.ok) {
    return (
      <AuthLayout title="E-posta doğrulandı">
        <Alert tone="success" title="Hesabın hazır">
          E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.
        </Alert>
        <Link to={ROUTES.login} className={`${linkClass} mt-5`}>
          Giriş yap
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Doğrulama başarısız">
      <Alert tone="danger" title="E-posta doğrulanamadı">
        {result.message}
      </Alert>
      <Link to={ROUTES.verifyPending} className={`${linkClass} mt-5`}>
        Yeni doğrulama isteği gönder
      </Link>
    </AuthLayout>
  )
}
