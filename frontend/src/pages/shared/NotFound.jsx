import { Link } from 'react-router-dom'
import { AlbaVerseLogo } from '@/assets/AlbaVerseLogo'
import { ROUTES } from '@/config/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Sayfa bulunamadı')
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <AlbaVerseLogo />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sayfa bulunamadı</h1>
      <p className="max-w-sm text-sm text-fg-muted">Aradığın sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link
        to={ROUTES.home}
        className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
      >
        Ana sayfaya dön
      </Link>
    </main>
  )
}
