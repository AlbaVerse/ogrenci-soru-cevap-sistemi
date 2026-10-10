import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/utils/cx'
import { Field } from './Field'
import { controlClass, fieldProps } from './field-utils'

/** options: [{ value, label }] */
export const Select = forwardRef(function Select(
  { label, hint, error, required, id, options = [], placeholder, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          required={required}
          className={cx(controlClass(error), 'h-11 appearance-none pr-10 sm:h-10', className)}
          {...fieldProps(selectId, { hint, error })}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
})
