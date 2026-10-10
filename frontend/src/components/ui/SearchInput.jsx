import { Search, X } from 'lucide-react'
import { cx } from '@/utils/cx'
import { controlClass } from './field-utils'

/** `aria-label` zorunludur (görünür etiket yok). Değer değişimi string olarak bildirilir. */
export function SearchInput({ value, onValueChange, placeholder = 'Ara', className, ...props }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className={cx(controlClass(false), 'h-11 pl-9 pr-10 sm:h-10 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Aramayı temizle"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-fg-muted hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
