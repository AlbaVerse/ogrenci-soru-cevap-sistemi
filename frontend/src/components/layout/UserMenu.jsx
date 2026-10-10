import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { roleLabel } from '@/config/roles'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'
import { useDismiss } from '@/hooks/useDismiss'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const panelId = useId()

  const dismiss = useCallback((viaKeyboard) => {
    setOpen(false)
    if (viaKeyboard) buttonRef.current?.focus()
  }, [])
  useDismiss(wrapperRef, open, dismiss)

  if (!user) return null

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Hesap menüsü: ${user.fullName}`}
        className="flex h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-surface-2 sm:h-10 sm:pr-2"
      >
        <Avatar initials={user.initials} size="sm" />
        <span className="hidden max-w-36 truncate text-sm font-medium sm:block">{user.fullName}</span>
        <ChevronDown className="hidden size-4 text-fg-muted sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
            <p className="mt-1 text-xs text-fg-muted">{roleLabel(user)}</p>
          </div>
          <hr className="my-1 border-line" />
          <Link
            to={ROUTES.profile}
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm hover:bg-surface-2 sm:min-h-10"
          >
            <Settings className="size-4 text-fg-muted" aria-hidden="true" />
            Profil ve Ayarlar
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface-2 sm:min-h-10"
          >
            <LogOut className="size-4 text-fg-muted" aria-hidden="true" />
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  )
}
