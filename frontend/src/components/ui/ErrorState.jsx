import { RefreshCw, TriangleAlert } from 'lucide-react'
import { cx } from '@/utils/cx'
import { Button } from './Button'

/** error: AppError veya benzeri. message verilmezse error.message kullanılır. */
export function ErrorState({ title = 'Bir sorun oluştu', message, error, onRetry, className }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center px-4 py-10 text-center', className)}>
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">
        {message || error?.message || 'İşlem tamamlanamadı. Yeniden dene.'}
      </p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Yeniden dene
        </Button>
      )}
    </div>
  )
}
