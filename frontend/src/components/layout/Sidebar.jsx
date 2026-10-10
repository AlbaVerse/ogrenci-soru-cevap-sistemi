import { cx } from '@/utils/cx'
import { SidebarContent } from './SidebarContent'

/** Masaüstü (lg ve üzeri) daraltılabilir kenar çubuğu. */
export function Sidebar({ collapsed, onToggleCollapse }) {
  return (
    <aside
      aria-label="Kenar çubuğu"
      className={cx(
        'sticky top-0 hidden h-dvh shrink-0 border-r border-line bg-surface transition-[width] duration-200 lg:block',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </aside>
  )
}
