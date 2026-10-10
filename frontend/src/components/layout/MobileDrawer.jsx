import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { SidebarContent } from './SidebarContent'

/** Tablet ve telefonda hamburger ile açılan menü çekmecesi. */
export function MobileDrawer({ open, onClose }) {
  const { pathname } = useLocation()

  // Sayfa değişince çekmece kapanır.
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react/exhaustive-deps
  }, [pathname])

  return (
    <Modal open={open} onClose={onClose} placement="left" hideHeader ariaLabel="Ana menü">
      <SidebarContent onClose={onClose} onNavigate={onClose} />
    </Modal>
  )
}
