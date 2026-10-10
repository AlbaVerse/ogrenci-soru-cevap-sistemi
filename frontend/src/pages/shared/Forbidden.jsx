import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { EmptyState } from '@/components/ui/EmptyState'
import { ROUTES } from '@/config/routes'

export function Forbidden() {
  return (
    <Page title="Erişim yetkin yok">
      <EmptyState
        icon={ShieldAlert}
        title="Bu sayfaya erişim yetkin yok"
        description="Bu bölüm yalnızca ilgili role sahip kullanıcılara açıktır. Yetkin olduğunu düşünüyorsan sistem yöneticisiyle iletişime geç."
        action={
          <Link
            to={ROUTES.home}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            Ana sayfaya dön
          </Link>
        }
      />
    </Page>
  )
}
