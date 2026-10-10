import { Link, NavLink } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { AlbaVerseLogo } from '@/assets/AlbaVerseLogo'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { getNavigation } from '@/config/navigation'
import { roleLabel } from '@/config/roles'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'
import { cx } from '@/utils/cx'

const itemClass = (isActive, collapsed) =>
  cx(
    'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors lg:min-h-10',
    isActive
      ? 'bg-brand-soft text-on-brand-soft before:absolute before:-left-3 before:inset-y-2 before:w-1 before:rounded-r before:bg-primary'
      : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
    collapsed && 'justify-center px-0',
  )

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon
  return (
    <li>
      <Tooltip label={item.label} disabled={!collapsed} className="flex w-full">
        <NavLink
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) => cx(itemClass(isActive, collapsed), 'w-full')}
        >
          <Icon className="size-5 shrink-0" aria-hidden="true" />
          <span className={cx(collapsed && 'sr-only')}>{item.label}</span>
        </NavLink>
      </Tooltip>
    </li>
  )
}

export function SidebarNav({ collapsed = false, onNavigate }) {
  const { user } = useAuth()
  const items = getNavigation(user)

  return (
    <nav aria-label="Ana menü" className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
      <ul className="space-y-1">
        {items.map((item) =>
          item.children ? (
            <li key={item.id}>
              {collapsed ? (
                <hr className="my-2 border-line" />
              ) : (
                <p className="px-3 pb-1 pt-3 text-xs font-semibold text-fg-muted">{item.label}</p>
              )}
              <ul className="space-y-1">
                {item.children.map((child) => (
                  <NavItem key={child.id} item={child} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
              </ul>
              {collapsed && <hr className="my-2 border-line" />}
            </li>
          ) : (
            <NavItem key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ),
        )}
      </ul>
    </nav>
  )
}

export function SidebarUser({ collapsed = false, onNavigate }) {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="border-t border-line p-3">
      <div className={cx('flex items-center gap-3', collapsed && 'justify-center')}>
        <Tooltip label={`${user.fullName} · ${roleLabel(user)}`} disabled={!collapsed}>
          <Link
            to={ROUTES.profile}
            onClick={onNavigate}
            aria-label={collapsed ? `Profil: ${user.fullName}` : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 hover:bg-surface-2"
          >
            <Avatar initials={user.initials} />
            {!collapsed && (
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-medium">{user.fullName}</span>
                <span className="block truncate text-xs text-fg-muted">{roleLabel(user)}</span>
              </span>
            )}
          </Link>
        </Tooltip>
        {!collapsed && (
          <button
            type="button"
            onClick={logout}
            aria-label="Çıkış yap"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      {collapsed && (
        <Tooltip label="Çıkış yap" className="mt-2 flex w-full">
          <button
            type="button"
            onClick={logout}
            aria-label="Çıkış yap"
            className="flex h-10 w-full items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

/** Masaüstü kenar çubuğu ve mobil çekmece aynı içeriği kullanır. */
export function SidebarContent({ collapsed = false, onToggleCollapse, onClose, onNavigate }) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cx('flex h-16 shrink-0 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Link to={ROUTES.home} onClick={onNavigate} aria-label="AlbaVerse ana sayfa" className="rounded-lg">
          <AlbaVerseLogo showWordmark={!collapsed} />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="flex size-10 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

      {onToggleCollapse && (
        <div className="px-3 pb-2">
          <Tooltip label="Menüyü genişlet" disabled={!collapsed} className="flex w-full">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
              className={cx(
                'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg',
                collapsed && 'justify-center px-0',
              )}
            >
              <ToggleIcon className="size-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>Menüyü daralt</span>}
            </button>
          </Tooltip>
        </div>
      )}

      <SidebarUser collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  )
}
