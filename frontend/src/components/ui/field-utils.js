import { cx } from '@/utils/cx'

export function fieldProps(id, { hint, error }) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  }
}

export const controlClass = (error) =>
  cx(
    'block w-full rounded-lg border bg-surface px-3 text-base text-fg placeholder:text-fg-muted sm:text-sm',
    'transition-colors disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70',
    error ? 'border-danger' : 'border-line-strong hover:border-fg-muted',
  )
