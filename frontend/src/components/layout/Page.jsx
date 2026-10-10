import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Sayfa kapsayıcısı + başlık alanı. Başlık belge başlığını da günceller. */
export function Page({ title, description, actions, children }) {
  useDocumentTitle(title)
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-fg-muted sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
