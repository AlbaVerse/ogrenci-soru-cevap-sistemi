import { Inbox } from 'lucide-react'
import { cx } from '@/utils/cx'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center px-4 py-10 text-center', className)}>
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
