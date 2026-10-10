import { useCallback, useState } from 'react'

/** Basit form durumu: değerler, alan hataları ve genel (form düzeyi) hata. */
export function useFormState(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [formElement, attachForm] = useState(null) // <form ref={attachForm}>
  const [initial] = useState(initialValues)

  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    // Kullanıcı düzeltmeye başlayınca o alanın hatası temizlenir.
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }, [])

  /** Hataları gösterir ve ilk hatalı alana odaklanır (klavye ve ekran okuyucu kullanıcıları için). */
  const showErrors = useCallback((next) => {
    setErrors(next)
    setTimeout(() => formElement?.querySelector('[aria-invalid="true"]')?.focus(), 0)
  }, [formElement])

  const reset = useCallback(() => {
    setValues(initial)
    setErrors({})
    setFormError(null)
  }, [initial])

  const bind = (name) => ({
    value: values[name],
    onChange: (event) => setField(name, event.target.value),
    error: errors[name],
  })

  return { values, errors, formError, attachForm, setFormError, setField, showErrors, reset, bind }
}
