import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { cx } from '@/utils/cx'

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

/**
 * Yerel <dialog> üzerine kurulu. Odak tuzağı, Esc ile kapanma ve odağın geri verilmesi tarayıcı tarafından yönetilir.
 * İlk odak için içerikte `data-autofocus` bulunan öğe varsa ona odaklanır.
 * placement="left": mobil menü çekmecesi (drawer) olarak kullanılır.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  placement = 'center',
  ariaLabel,
  hideHeader = false,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()
  const isDrawer = placement === 'left'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={cx('av-dialog', isDrawer && 'av-drawer')}
      aria-labelledby={title && !hideHeader ? titleId : undefined}
      aria-label={!title || hideHeader ? ariaLabel || title : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => !onClose && event.preventDefault()}
      onClose={() => open && onClose?.()}
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      {open && (
        <div
          className={cx(
            'av-dialog-panel flex flex-col border border-line bg-surface text-fg shadow-pop',
            isDrawer
              ? 'h-dvh w-[min(20rem,88vw)] rounded-r-2xl'
              : cx('max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] rounded-2xl', SIZES[size]),
          )}
        >
          {!hideHeader && (
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="-m-1.5 rounded-lg p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {children != null && (
            <div className={cx('min-h-0 flex-1 overflow-y-auto', !isDrawer && 'px-5 py-4')}>{children}</div>
          )}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
