import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/utils/cx'

/** items: [{ id, title, content }] */
export function Accordion({ items, allowMultiple = false, defaultOpenIds = [], className }) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpenIds))

  const toggle = (id) =>
    setOpenIds((current) => {
      const next = new Set(allowMultiple ? current : [])
      if (current.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className={cx('divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      {items.map((item) => {
        const open = openIds.has(item.id)
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-surface-2"
              >
                {item.title}
                <ChevronDown
                  className={cx('size-4 shrink-0 text-fg-muted transition-transform', open && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cx(
                'grid transition-[grid-template-rows] duration-200',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden" inert={!open}>
                <div className="px-4 pb-4 text-sm text-fg-muted">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
