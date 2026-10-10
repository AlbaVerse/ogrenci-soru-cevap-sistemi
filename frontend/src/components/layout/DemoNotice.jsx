import { FlaskConical } from 'lucide-react'
import { cx } from '@/utils/cx'

/** Yalnızca mock modunda gösterilen geliştirme ipucu kutusu. Gerçek ürün davranışı değildir. */
export function DemoNotice({ title = 'Demo ipucu', children, className }) {
  return (
    <div className={cx('rounded-xl border border-dashed border-warning/60 bg-warning-soft p-3.5 text-sm', className)}>
      <p className="flex items-center gap-2 font-semibold text-warning">
        <FlaskConical className="size-4" aria-hidden="true" />
        {title} <span className="font-normal">(yalnızca geliştirme/test)</span>
      </p>
      <div className="mt-2 space-y-1.5 text-fg">{children}</div>
    </div>
  )
}
