import { useState } from 'react'
import { Check, Clipboard, Pencil, RefreshCw, ThumbsDown, ThumbsUp, Flag, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { SourceCards } from './SourceCards'

const statusLabels = {
  answered: ['Yanıt oluşturuldu', 'success'],
  unanswered: ['Bilgi bulunamadı', 'warning'],
  insufficient: ['Doğrulama gerekli', 'warning'],
}

// Haricî markdown kütüphanesi olmadan güvenli metin gösterimi; HTML çalıştırılmaz.
function AnswerText({ text }) {
  return String(text).split(/\n\s*\n/).map((paragraph, i) => (
    <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap break-words leading-relaxed">
      {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
        ? <strong key={index}>{part.slice(2, -2)}</strong>
        : <span key={index}>{part}</span>)}
    </p>
  ))
}

function Action({ icon: Icon, label, disabled, active, onClick }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active === undefined ? undefined : active} disabled={disabled}
    onClick={onClick} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'text-brand' : 'text-fg-muted hover:text-fg'}`}>
    <Icon className="size-4" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">{label}</span>
  </button>
}

export function ChatMessage({ message, isLastAnswer = false, busy = false, onEdit, onRegenerate, onFeedback, onReport, onCopied }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const status = statusLabels[message.answerStatus]
  const canReport = ['unanswered', 'insufficient'].includes(message.answerStatus)

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 1800)
    } catch { onCopied?.(false) }
  }
  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} aria-label={isUser ? 'Senin mesajın' : 'AlbaVerse yanıtı'}>
      <div className={isUser ? 'max-w-[90%] rounded-2xl rounded-tr-md border border-line bg-surface-2 px-4 py-3 sm:max-w-[82%]' : 'w-full max-w-3xl rounded-2xl border border-line bg-surface px-4 py-4 shadow-soft sm:px-5'}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {!isUser && <span className="flex size-6 items-center justify-center rounded-lg bg-brand-soft text-on-brand-soft"><Sparkles className="size-3.5" aria-hidden="true" /></span>}
          <span className="text-xs font-semibold">{isUser ? 'Sen' : 'AlbaVerse'}</span>
          {!isUser && status && <Badge tone={status[1]}>{status[0]}</Badge>}
          {message.editedAt && <span className="text-xs text-fg-muted">Düzenlendi</span>}
        </div>
        <div className="text-sm text-fg sm:text-[0.94rem]"><AnswerText text={message.content} /></div>
        {!isUser && (message.sources?.length ? <SourceCards sources={message.sources} /> : <p className="mt-3 text-xs text-fg-muted">Bu yanıt için doğrulanmış PDF kaynağı paylaşılmadı.</p>)}
        <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-2">
          {isUser ? <Action icon={Pencil} label="Soruyu düzenle" disabled={busy} onClick={() => onEdit?.(message)} /> : <>
            <Action icon={copied ? Check : Clipboard} label={copied ? 'Kopyalandı' : 'Cevabı kopyala'} onClick={copyAnswer} />
            <Action icon={ThumbsUp} label="Faydalı" active={message.feedback === 'positive'} disabled={busy} onClick={() => onFeedback?.(message, message.feedback === 'positive' ? null : 'positive')} />
            <Action icon={ThumbsDown} label="Faydasız" active={message.feedback === 'negative'} disabled={busy} onClick={() => onFeedback?.(message, message.feedback === 'negative' ? null : 'negative')} />
            <Action icon={RefreshCw} label="Cevabı yeniden oluştur" disabled={busy || !isLastAnswer} onClick={() => onRegenerate?.(message)} />
            {canReport && (message.reportStatus ? <span className="ml-2 text-xs text-success">İncelemeye iletildi</span> : <Action icon={Flag} label="İncelemeye gönder" disabled={busy} onClick={() => onReport?.(message)} />)}
          </>}
        </div>
      </div>
    </article>
  )
}
