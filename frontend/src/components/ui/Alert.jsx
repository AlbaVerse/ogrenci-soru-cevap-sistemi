import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cx } from '@/utils/cx'

const TONES = {
  info: { icon: Info, box: 'bg-info-soft text-info' },
  success: { icon: CircleCheck, box: 'bg-success-soft text-success' },
  warning: { icon: TriangleAlert, box: 'bg-warning-soft text-warning' },
  danger: { icon: CircleAlert, box: 'bg-danger-soft text-danger' },
}

export function Alert({ tone = 'info', title, children, action, className }) {
  const { icon: Icon, box } = TONES[tone]
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-xl p-3.5 text-sm', box, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'text-fg')}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}
