import { cx } from '@/utils/cx'

export function Avatar({ initials, size = 'md', className }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-on-brand-soft',
        size === 'sm' ? 'size-8 text-xs' : 'size-9 text-sm',
        className,
      )}
    >
      {initials}
    </span>
  )
}
