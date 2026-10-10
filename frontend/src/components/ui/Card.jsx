import { cx } from '@/utils/cx'

const VARIANTS = {
  default: 'border border-line bg-surface shadow-soft',
  glass: 'glass',
  flat: 'bg-surface-2',
}

const PADDING = { none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-5 sm:p-7' }

export function Card({ as: Tag = 'div', variant = 'default', padding = 'md', interactive = false, className, ...props }) {
  return (
    <Tag
      className={cx(
        'rounded-2xl',
        VARIANTS[variant],
        PADDING[padding],
        interactive &&
          'transition motion-safe:hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop',
        className,
      )}
      {...props}
    />
  )
}
