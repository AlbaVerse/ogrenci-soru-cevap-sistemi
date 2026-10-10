import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { AlbaVerseLogo } from '@/assets/AlbaVerseLogo'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Topbar({ onOpenMenu }) {
  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-3 sm:px-5 lg:h-16">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" iconOnly onClick={onOpenMenu} aria-label="Menüyü aç" className="lg:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        <Link to={ROUTES.home} aria-label="AlbaVerse ana sayfa" className="rounded-lg lg:hidden">
          <AlbaVerseLogo />
        </Link>
        <span className="hidden text-sm text-fg-muted lg:block">OSTİM Teknik Üniversitesi</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
