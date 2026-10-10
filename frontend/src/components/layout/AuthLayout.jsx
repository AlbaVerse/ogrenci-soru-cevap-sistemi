import { Link } from 'react-router-dom'
import { AlbaVerseLogo } from '@/assets/AlbaVerseLogo'
import { ROUTES } from '@/config/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { DemoBanner } from './DemoBanner'
import { ThemeToggle } from './ThemeToggle'

/** Giriş, kayıt ve şifre akışı sayfalarının ortak yerleşimi. */
export function AuthLayout({ title, description, children }) {
  useDocumentTitle(title)
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <DemoBanner />
      <div className="flex flex-1">
        <aside className="hidden w-[26rem] shrink-0 flex-col justify-between bg-deep p-10 text-white lg:flex xl:w-[30rem]">
          <AlbaVerseLogo inverted />
          <div>
            <p className="text-2xl font-semibold leading-snug tracking-tight">
              Yönetmelikleri aramak yerine sor, kaynağıyla birlikte oku.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              AlbaVerse, OSTİM Teknik Üniversitesi mevzuat ve yönerge belgelerine dayanarak yanıt verir ve dayandığı
              belgeyi gösterir.
            </p>
          </div>
          <p className="text-xs text-white/60">OSTİM Teknik Üniversitesi öğrenci ve personeli için</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <Link to={ROUTES.home} aria-label="AlbaVerse" className="rounded-lg lg:invisible">
              <AlbaVerseLogo />
            </Link>
            <ThemeToggle />
          </div>
          <main id="main" className="flex flex-1 items-start justify-center px-4 pb-10 sm:items-center sm:px-6">
            <div className="w-full max-w-md">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              {description && <p className="mt-1.5 text-sm text-fg-muted">{description}</p>}
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
