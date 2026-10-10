import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LoaderCircle, MessageSquarePlus, Sparkles } from 'lucide-react'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatSuggestions } from '@/components/chat/ChatSuggestions'
import { Page } from '@/components/layout/Page'
import { Alert, Button, Card, Modal, Spinner } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useToast } from '@/context/toast-context'
import { chatService } from '@/services'

export function ChatPage() {
  const { id: conversationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [working, setWorking] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editedText, setEditedText] = useState('')
  const listRef = useRef(null)
  const autoScrollRef = useRef(true)
  const pendingRef = useRef(false)
  const initialSentRef = useRef(null)

  useEffect(() => {
    let active = true
    if (!conversationId) {
      setConversation(null)
      setLoading(false)
      setError('')
      return () => { active = false }
    }
    setLoading(true)
    setError('')
    chatService.getConversation(conversationId).then((data) => {
      if (active) { setConversation(data); setLoading(false); autoScrollRef.current = true }
    }).catch((err) => { if (active) { setError(err?.message || 'Sohbet yüklenemedi.'); setLoading(false) } })
    return () => { active = false }
  }, [conversationId])

  const send = useCallback(async (question, category = null) => {
    if (pendingRef.current || !question.trim()) return
    pendingRef.current = true
    setWorking(true)
    setError('')
    setPendingQuestion(question)
    autoScrollRef.current = true
    try {
      let currentId = conversationId
      if (!currentId) {
        const created = await chatService.createConversation({ category })
        currentId = created.id
      }
      const result = await chatService.sendMessage(currentId, question)
      setConversation(result.conversation)
      if (!conversationId) navigate(ROUTES.chat(currentId), { replace: true, state: null })
    } catch (err) {
      setDraft(question)
      setError(err?.message || 'Mesaj gönderilemedi. Tekrar dene.')
    } finally {
      setPendingQuestion('')
      setWorking(false)
      pendingRef.current = false
    }
  }, [conversationId, navigate])

  // Ana sayfadan gönderilen ilk soru bir kez otomatik işlenir.
  useEffect(() => {
    const prompt = location.state?.prompt
    if (!conversationId && prompt && initialSentRef.current !== location.key) {
      initialSentRef.current = location.key
      void send(prompt, location.state?.category ?? null)
    }
  }, [conversationId, location.key, location.state, send])

  useEffect(() => {
    const el = listRef.current
    if (!el || !autoScrollRef.current) return
    el.scrollTop = el.scrollHeight
  }, [conversation?.messages?.length, pendingQuestion, working, loading])

  async function update(action, successMessage) {
    if (pendingRef.current) return
    pendingRef.current = true
    setWorking(true)
    setError('')
    try {
      const next = await action()
      if (next?.messages) setConversation(next)
      if (successMessage) toast.success(successMessage)
      return true
    } catch (err) {
      setError(err?.message || 'İşlem tamamlanamadı.')
      return false
    } finally { setWorking(false); pendingRef.current = false }
  }

  async function feedback(message, rating) {
    await update(async () => {
      const result = await chatService.setFeedback(conversationId, message.id, rating)
      setConversation((c) => ({ ...c, messages: c.messages.map((m) => m.id === message.id ? { ...m, feedback: result.feedback } : m) }))
    }, 'Geri bildirimin kaydedildi.')
  }

  async function report(message) {
    await update(async () => {
      const result = await chatService.reportQuestion(conversationId, message.id)
      setConversation((c) => ({ ...c, messages: c.messages.map((m) => m.id === message.id ? { ...m, reportStatus: result.reportStatus } : m) }))
    }, 'Soru incelenmek üzere iletildi.')
  }

  async function saveEdit(event) {
    event.preventDefault()
    if (!editing || !editedText.trim()) return
    const done = await update(() => chatService.editMessage(conversationId, editing.id, editedText), 'Soru düzenlendi; sonraki yanıtlar yenilendi.')
    if (done) { setEditing(null); setEditedText('') }
  }

  const messages = conversation?.messages || []
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id
  const hasMessages = messages.length > 0 || !!pendingQuestion

  return <Page title={conversation?.title || 'Yeni Sohbet'} description="Sorunu yaz, AlbaVerse sana uygun mevzuat kaynaklarını bulmaya çalışsın." actions={<Button variant="secondary" onClick={() => navigate(ROUTES.history)}><ArrowLeft className="size-4" aria-hidden="true" /> Geçmiş</Button>}>
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {error && <Alert tone="danger" title="İşlem yapılamadı">{error}</Alert>}
      {loading ? <Card><div role="status" className="flex items-center justify-center gap-2 py-20"><Spinner /> Sohbet yükleniyor...</div></Card> :
        <>
          <div ref={listRef} onScroll={(event) => { const el = event.currentTarget; autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120 }}
            className="min-h-60 max-h-[min(65dvh,730px)] space-y-5 overflow-y-auto rounded-2xl border border-line bg-surface-2/50 p-3 sm:min-h-88 sm:p-5" aria-live="polite" aria-relevant="additions">
            {!hasMessages && <div className="space-y-7 py-5 sm:py-8">
              <div className="text-center"><div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-on-brand-soft"><Sparkles className="size-6" /></div>
                <h2 className="text-xl font-semibold">Bugün ne öğrenmek istersin?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-fg-muted">Üniversite belgeleri ve akademik süreçler hakkında sorular sorabilirsin.</p>
              </div>
              <ChatSuggestions title="Örnek sorular ve kategoriler" onChoose={(prompt, category) => { setDraft(prompt); setSelectedCategory(category) }} />
            </div>}
            {messages.map((message) => <ChatMessage key={message.id} message={message} busy={working}
              isLastAnswer={message.id === lastAssistantId && messages.at(-1)?.id === message.id}
              onEdit={(m) => { setEditing(m); setEditedText(m.content) }}
              onRegenerate={(m) => update(() => chatService.regenerateMessage(conversationId, m.id), 'Yanıt yeniden oluşturuldu.')}
              onFeedback={feedback} onReport={report}
              onCopied={(ok = true) => ok ? toast.success('Yanıt kopyalandı.') : toast.error('Kopyalama başarısız oldu.')}
            />)}
            {pendingQuestion && <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl bg-surface px-4 py-3 text-sm">{pendingQuestion}</div></div>}
            {working && <div role="status" className="flex items-center gap-2 text-sm text-fg-muted"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Cevap hazırlanıyor...</div>}
          </div>
          <ChatComposer onSend={(question) => send(question, selectedCategory)} busy={working} initialValue={draft} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
            <span>Yanıtlar eksik veya hatalı olabilir. PDF kaynaklarını kontrol et.</span>
            <button className="inline-flex items-center gap-1 text-brand hover:underline" onClick={() => navigate(ROUTES.chatNew, { state: null })} type="button"><MessageSquarePlus className="size-3.5" /> Yeni sohbet <ArrowRight className="size-3" /></button>
          </div>
        </>}
    </div>
    <Modal open={!!editing} onClose={() => !working && setEditing(null)} title="Soruyu düzenle" description="Bu sorudan sonraki yanıtlar yeni soruya göre yeniden oluşturulur. Sonraki mesajlar kaldırılır."
      footer={<><Button variant="secondary" disabled={working} onClick={() => setEditing(null)}>Vazgeç</Button><Button form="edit-question" type="submit" loading={working} disabled={!editedText.trim()}>Düzenle ve yeniden yanıtla</Button></>}>
      <form id="edit-question" onSubmit={saveEdit}><label htmlFor="edit-question-text" className="mb-2 block text-sm font-medium">Sorun</label><textarea id="edit-question-text" data-autofocus rows={5} maxLength={5000} value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full resize-y rounded-lg border border-line-strong bg-surface p-3 text-sm focus:border-primary focus:outline-none" /></form>
    </Modal>
  </Page>
}
