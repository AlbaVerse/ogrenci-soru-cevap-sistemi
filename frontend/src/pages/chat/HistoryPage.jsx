import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, History, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, Spinner } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useToast } from '@/context/toast-context'
import { chatService } from '@/services'

function friendlyDate(date) {
  if (!date) return ''
  const ms = Date.parse(date)
  return Number.isFinite(ms) ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(ms) : ''
}

export function HistoryPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const requestCounter = useRef(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [renamed, setRenamed] = useState('')
  const [deleting, setDeleting] = useState(null)

  const reload = useCallback(async () => {
    const index = ++requestCounter.current
    try {
      const results = await chatService.listConversations({ search })
      if (index === requestCounter.current) { setItems(results); setError('') }
    } catch (err) {
      if (index === requestCounter.current) setError(err?.message || 'Sohbet geçmişi yüklenemedi.')
    } finally { if (index === requestCounter.current) setLoading(false) }
  }, [search])
  useEffect(() => { const timer = setTimeout(() => { setLoading(true); void reload() }, 220); return () => clearTimeout(timer) }, [reload])
  const filtered = items

  async function rename(event) {
    event.preventDefault()
    if (!renamed.trim() || busy) return
    setBusy(true)
    try { await chatService.renameConversation(editing.id, renamed); setEditing(null); await reload(); toast.success('Sohbet yeniden adlandırıldı.') }
    catch (err) { toast.error(err?.message || 'Sohbet adı değiştirilemedi.') }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!deleting || busy) return
    setBusy(true)
    try { await chatService.deleteConversation(deleting.id); setDeleting(null); await reload(); toast.success('Sohbet silindi.') }
    catch (err) { toast.error(err?.message || 'Sohbet silinemedi.') }
    finally { setBusy(false) }
  }

  return <Page title="Sohbet Geçmişi" description="Önceki konuşmalarını ara, aç, yeniden adlandır veya sil." actions={<Button onClick={() => navigate(ROUTES.chatNew)}><Plus className="size-4"/> Yeni sohbet</Button>}>
    <Card padding="md">
      <div className="mb-5 relative">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-fg-muted" aria-hidden="true" />
        <label htmlFor="history-search" className="sr-only">Sohbetlerde ara</label>
        <input id="history-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sohbet başlığında veya kategoride ara" className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-3 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary" />
      </div>
      {loading ? <div role="status" className="flex justify-center py-12"><Spinner /></div> : error ? <div role="alert" className="py-10 text-center text-sm text-danger">{error} <Button variant="secondary" size="sm" onClick={reload}>Tekrar dene</Button></div> : !filtered.length ?
        <EmptyState icon={History} title={search ? 'Aramana uygun sohbet bulunamadı' : 'Henüz bir sohbetin yok'} description={search ? 'Başka kelimeler deneyebilirsin.' : 'Yeni bir sohbet başlatarak ilk sorunu sor.'} action={!search && <Button onClick={() => navigate(ROUTES.chatNew)}>Sohbet başlat</Button>} /> :
        <ul className="divide-y divide-line">{filtered.map((c) => <li key={c.id} className="flex items-center gap-2 py-3">
          <button type="button" onClick={() => navigate(ROUTES.chat(c.id))} className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
            <span className="block truncate text-sm font-semibold">{c.title}</span>
            <span className="mt-1 block text-xs text-fg-muted">{friendlyDate(c.updatedAt)} · {c.messageCount ?? 0} mesaj {c.category ? `· ${c.category}` : ''}</span>
          </button>
          <button type="button" aria-label={`${c.title} sohbetini yeniden adlandır`} title="Yeniden adlandır" onClick={() => { setEditing(c); setRenamed(c.title) }} className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg"><Pencil className="size-4" /></button>
          <button type="button" aria-label={`${c.title} sohbetini sil`} title="Sil" onClick={() => setDeleting(c)} className="rounded-lg p-2 text-fg-muted hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>
          <button type="button" aria-label={`${c.title} sohbetini aç`} onClick={() => navigate(ROUTES.chat(c.id))} className="hidden rounded-lg p-2 text-brand hover:bg-surface-2 sm:block"><ArrowRight className="size-4" /></button>
        </li>)}</ul>}
    </Card>
    <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title="Sohbeti yeniden adlandır" footer={<><Button variant="secondary" disabled={busy} onClick={() => setEditing(null)}>Vazgeç</Button><Button loading={busy} disabled={!renamed.trim() || renamed.length > 100} type="submit" form="rename-chat">Kaydet</Button></>}>
      <form id="rename-chat" onSubmit={rename}><Input label="Sohbet adı" value={renamed} onChange={(e) => setRenamed(e.target.value)} maxLength={100} required data-autofocus /></form>
    </Modal>
    <ConfirmDialog open={!!deleting} onCancel={() => setDeleting(null)} onConfirm={remove} title="Sohbet silinsin mi?" description="Bu işlem geri alınamaz. Sohbetteki bütün mesajlar silinir." confirmLabel="Sohbeti sil" tone="danger" />
  </Page>
}
