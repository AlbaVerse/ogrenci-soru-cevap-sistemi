import { useState } from "react"
import { ExternalLink, FileText, X } from "lucide-react"

function safeUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null
  try {
    const parsed = new URL(url, window.location.origin)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null
  } catch { return null }
}

export function SourceCards({ sources = [] }) {
  const [selectedSource, setSelectedSource] = useState(null)

  if (!sources.length) return null

  return (
    <>
      <section className="mt-4" aria-label="Yanıt kaynakları">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">İlgili kaynaklar</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sources.map((source, index) => {
            const url = safeUrl(source.url)
            const hasSnippet = Boolean(source.snippet || source.content)

            return (
              <div
                key={`${source.documentId || source.title}-${index}`}
                className="rounded-xl border border-line bg-surface p-3 transition hover:border-brand/40"
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{source.title}</p>
                    {(source.page != null || source.article) && (
                      <p className="mt-1 text-xs text-fg-muted">
                        {[source.page != null ? `Sayfa ${source.page}` : null, source.article].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {hasSnippet && (
                        <button
                          type="button"
                          onClick={() => setSelectedSource(source)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-2 hover:underline cursor-pointer"
                        >
                          Maddeyi İncele
                        </button>
                      )}

                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted underline-offset-2 hover:underline"
                        >
                          Orijinal Belge <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}

                      {!hasSnippet && !url && (
                        <p className="text-xs text-fg-muted">Görüntüleme bağlantısı sağlanmadı.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Kaynak Detay Modalı */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">Mevzuat Dayanağı</span>
                <h3 className="mt-1 text-base font-semibold text-fg">{selectedSource.title}</h3>
                {selectedSource.article && (
                  <p className="text-xs text-fg-muted mt-0.5">{selectedSource.article}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="rounded-lg p-1.5 text-fg-muted hover:bg-surface-elevated hover:text-fg"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Mevzuat Metni</p>
              <div className="mt-2 whitespace-pre-line rounded-xl bg-surface-elevated p-4 text-sm leading-relaxed text-fg">
                {selectedSource.snippet || selectedSource.content || "Metin bulunamadı."}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-medium text-brand-fg transition hover:opacity-90"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
