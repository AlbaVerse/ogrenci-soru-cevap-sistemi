import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DemoBanner } from './DemoBanner'
import { MobileDrawer } from './MobileDrawer'
import { Sidebar } from './Sidebar'
import { StaffApprovalNotice } from './StaffApprovalNotice'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'albaverse.sidebarCollapsed' // hassas olmayan arayüz tercihi

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const firstRender = useRef(true)

  // Sayfa değişince odak ana içeriğe alınır ve sayfa başına dönülür (ekran okuyucu ve klavye için).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1')
      } catch {
        /* tercih yalnızca bu oturumda geçerli olur */
      }
      return !value
    })

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Ana içeriğe geç
      </a>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <StaffApprovalNotice />
        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
