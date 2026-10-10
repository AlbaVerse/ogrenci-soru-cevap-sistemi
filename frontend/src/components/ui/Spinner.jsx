import { LoaderCircle } from 'lucide-react'
import { cx } from '@/utils/cx'

export function Spinner({ label = 'Yükleniyor', className }) {
  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle className={cx('size-5 animate-spin text-brand', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function FullPageSpinner({ label = 'Yükleniyor' }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <Spinner label={label} className="size-7" />
    </div>
  )
}
