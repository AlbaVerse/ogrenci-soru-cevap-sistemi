/** Etiket, ipucu ve hata mesajı düzeni. Input, Select, Textarea ve PasswordInput kullanır. */
export function Field({ id, label, hint, error, required, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
