import { ExternalLink, FileText } from 'lucide-react'

function safeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null
  try {
    const parsed = new URL(url, window.location.origin)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null
  } catch { return null }
}

export function SourceCards({ sources = [] }) {
  if (!sources.length) return null
  return (
    <section className="mt-4" aria-label="Yanıt kaynakları">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">İlgili kaynaklar</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((source, index) => {
          const url = safeUrl(source.url)
          return (
            <div key={`${source.documentId || source.title}-${index}`} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{source.title}</p>
                  {(source.page != null || source.article) && (
                    <p className="mt-1 text-xs text-fg-muted">{[source.page != null ? `Sayfa ${source.page}` : null, source.article].filter(Boolean).join(' · ')}</p>
                  )}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-2 hover:underline">
                      Belgeyi görüntüle <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  ) : <p className="mt-2 text-xs text-fg-muted">Görüntüleme bağlantısı sağlanmadı.</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
