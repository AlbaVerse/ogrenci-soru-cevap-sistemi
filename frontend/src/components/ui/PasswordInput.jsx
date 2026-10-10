import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cx } from '@/utils/cx'
import { Field } from './Field'
import { controlClass, fieldProps } from './field-utils'

export const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, required, id, className, containerClassName, autoComplete = 'current-password', ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeOff : Eye

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          required={required}
          autoComplete={autoComplete}
          className={cx(controlClass(error), 'h-11 pr-11 sm:h-10', className)}
          {...fieldProps(inputId, { hint, error })}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-fg-muted hover:text-fg"
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </button>
      </div>
    </Field>
  )
})
