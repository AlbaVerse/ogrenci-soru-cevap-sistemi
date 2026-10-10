import { forwardRef, useId } from 'react'
import { cx } from '@/utils/cx'
import { Field } from './Field'
import { controlClass, fieldProps } from './field-utils'

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, id, rows = 4, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <Field id={areaId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={cx(controlClass(error), 'py-2.5', className)}
        {...fieldProps(areaId, { hint, error })}
        {...props}
      />
    </Field>
  )
})
