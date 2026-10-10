import { forwardRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cx } from '@/utils/cx'

const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger text-on-danger hover:opacity-90',
}

const SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm sm:h-10',
  lg: 'h-12 gap-2 px-5 text-base',
}

const ICON_SIZES = {
  sm: 'size-9',
  md: 'size-11 sm:size-10',
  lg: 'size-12',
}

/** Not: yalnızca ikon içeren butonlarda `iconOnly` ile birlikte aria-label verilmelidir. */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, iconOnly = false, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        iconOnly ? ICON_SIZES[size] : SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
