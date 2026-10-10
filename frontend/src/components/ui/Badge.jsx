import { cx } from '@/utils/cx'

const TONES = {
  neutral: 'bg-surface-2 text-fg-muted',
  primary: 'bg-brand-soft text-on-brand-soft',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
}

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span
      className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}
      {...props}
    />
  )
}
