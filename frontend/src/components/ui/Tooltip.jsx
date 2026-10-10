import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '@/utils/cx'

/**
 * Taşan (overflow) kapsayıcılarda kesilmemesi için portal ve `fixed` konumlandırma kullanır.
 * Kısaltılmış/ikon-only öğelerde etiket ayrıca aria-label ile de verilmelidir.
 */
export function Tooltip({ label, children, side = 'right', disabled = false, className }) {
  const ref = useRef(null)
  const [position, setPosition] = useState(null)

  const show = () => {
    if (disabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPosition(
      side === 'right'
        ? { top: rect.top + rect.height / 2, left: rect.right + 8, transform: 'translateY(-50%)' }
        : { top: rect.bottom + 8, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' },
    )
  }
  const hide = () => setPosition(null)

  return (
    <>
      <span
        ref={ref}
        className={cx('inline-flex', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(event) => event.key === 'Escape' && hide()}
      >
        {children}
      </span>
      {position &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', ...position }}
            className="pointer-events-none z-[80] rounded-md bg-fg px-2 py-1 text-xs font-medium text-canvas shadow-pop"
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  )
}
