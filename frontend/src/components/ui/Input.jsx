import { forwardRef, useId } from 'react'
import { cx } from '@/utils/cx'
import { Field } from './Field'
import { controlClass, fieldProps } from './field-utils'

export const Input = forwardRef(function Input(
  { label, hint, error, required, id, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <input
        ref={ref}
        required={required}
        className={cx(controlClass(error), 'h-11 sm:h-10', className)}
        {...fieldProps(inputId, { hint, error })}
        {...props}
      />
    </Field>
  )
})
