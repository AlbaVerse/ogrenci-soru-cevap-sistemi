import { cx } from '@/utils/cx'

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-md bg-surface-2', className)} />
}
