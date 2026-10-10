import { useEffect, useState } from 'react'
import { ArrowUp, CornerDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ChatComposer({ onSend, busy = false, placeholder = 'Üniversiteyle ilgili sorunu yaz...', initialValue = '', compact = false }) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  useEffect(() => setValue(initialValue), [initialValue])
  function submit(event) {
    event?.preventDefault()
    if (busy) return
    const clean = value.trim()
    if (!clean) return
    if (clean.length > 5000) { setError('Soru en fazla 5000 karakter olabilir.'); return }
    setError('')
    setValue('')
    onSend(clean)
  }
  return (
    <form onSubmit={submit} className="w-full" aria-label="Soru gönder">
      <div className="rounded-2xl border border-line-strong bg-surface p-2 shadow-soft transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
        <label htmlFor={compact ? 'home-prompt' : 'chat-prompt'} className="sr-only">Sorunuz</label>
        <textarea
          id={compact ? 'home-prompt' : 'chat-prompt'}
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          disabled={busy}
          maxLength={5100}
          rows={compact ? 2 : 3}
          placeholder={placeholder}
          className="block max-h-48 min-h-16 w-full resize-y bg-transparent px-2 py-2 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-muted disabled:cursor-wait sm:text-base"
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="hidden items-center gap-1 text-xs text-fg-muted sm:flex"><CornerDownLeft className="size-3.5" /> Enter ile gönder · Shift+Enter alt satır</span>
          <span className="text-xs text-fg-muted sm:hidden">{value.length}/5000</span>
          <Button type="submit" size="sm" disabled={busy || !value.trim() || value.trim().length > 5000} aria-label="Soruyu gönder">
            <ArrowUp className="size-4" aria-hidden="true" /> <span className="hidden sm:inline">Gönder</span>
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </form>
  )
}
