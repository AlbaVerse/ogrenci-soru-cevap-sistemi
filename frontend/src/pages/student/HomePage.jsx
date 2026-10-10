import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChartNoAxesColumn, CheckCircle2, Clock3, History, Megaphone, MessageSquareText } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatSuggestions } from '@/components/chat/ChatSuggestions'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/context/auth-context'
import { chatService, homeService } from '@/services'

function StatCard({ label, value, icon: Icon }) {
  return <Card padding="sm" className="flex min-h-24 items-start justify-between gap-2">
    <div><p className="text-xs text-fg-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value ?? '—'}</p></div>
    <span className="rounded-xl bg-brand-soft p-2 text-on-brand-soft"><Icon className="size-4" aria-hidden="true" /></span>
  </Card>
}

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recent, setRecent] = useState([])
  const [overview, setOverview] = useState(null)
  const [busy, setBusy] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.allSettled([chatService.listConversations(), homeService.getOverview()]).then(([chats, summary]) => {
      if (!alive) return
      if (chats.status === 'fulfilled') setRecent(chats.value.slice(0, 3))
      if (summary.status === 'fulfilled') setOverview(summary.value)
      setFailed(chats.status === 'rejected' && summary.status === 'rejected')
      setBusy(false)
    })
    return () => { alive = false }
  }, [user?.id])

  function ask(prompt, category) {
    navigate(ROUTES.chatNew, { state: { prompt, category } })
  }

  const firstName = user?.firstName || 'Merhaba'
  const summary = overview?.summary
  return <Page title="Ana Sayfa" description="AlbaVerse'e hoş geldin. İhtiyacın olan bilgiye daha kolay ulaş.">
    <div className="space-y-8 pb-6">
      <Card variant="glass" padding="lg" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-brand-soft opacity-60 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl space-y-4">
          <Badge tone="primary">OSTİM Teknik Üniversitesi · Dijital bilgi asistanı</Badge>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">Merhaba, {firstName}! <span aria-hidden="true">👋</span></h2>
          <p className="max-w-2xl text-sm leading-7 text-fg-muted sm:text-base">Dersler, sınavlar, stajlar ve üniversite mevzuatı hakkında merak ettiklerini sor. Yanıtların kaynaklarını da birlikte inceleyelim.</p>
          <ChatComposer compact onSend={(prompt) => ask(prompt)} placeholder="Örneğin: Staj başvurusu nasıl yapılır?" />
          <p className="text-xs text-fg-muted">Yapay zekâ yanıtları resmî üniversite bildirimi yerine geçmez. Kaynakları kontrol et.</p>
        </div>
      </Card>

      <ChatSuggestions onChoose={ask} title="Bir konuyla başlayabilirsin" limit={6} />

      <div className="grid items-start gap-5 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="home-recent">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="home-recent" className="text-lg font-semibold">Son sohbetlerin</h2>
            <button type="button" onClick={() => navigate(ROUTES.history)} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">Tümünü gör <ArrowRight className="size-4" /></button>
          </div>
          <Card padding="sm" className="min-h-48">
            {busy ? <div className="space-y-3 p-3"><Skeleton className="h-12"/><Skeleton className="h-12"/></div> : recent.length ?
              <div className="divide-y divide-line">{recent.map((conversation) => <button key={conversation.id} type="button" onClick={() => navigate(ROUTES.chat(conversation.id))} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-surface-2">
                <MessageSquareText className="size-4 shrink-0 text-brand" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{conversation.title}</span><ArrowRight className="size-4 shrink-0 text-fg-muted" aria-hidden="true" />
              </button>)}</div> : <EmptyState icon={History} title="Henüz bir sohbetin yok" description="İlk sorunu sorarak başlayabilirsin."/>}
          </Card>
        </section>
        <section className="lg:col-span-2" aria-labelledby="home-stats">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="home-stats" className="text-lg font-semibold">Kullanım özetin</h2>
            <button type="button" onClick={() => navigate(ROUTES.statsPersonal)} className="text-sm font-medium text-brand hover:underline">Detaylar</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sorularım" value={busy ? '…' : summary?.totalQuestions} icon={ChartNoAxesColumn} />
            <StatCard label="Yanıtlanan" value={busy ? '…' : summary?.answeredCount} icon={CheckCircle2} />
            <StatCard label="Yanıtsız" value={busy ? '…' : summary?.unansweredCount} icon={MessageSquareText} />
            <StatCard label="Yetersiz" value={busy ? '…' : summary?.insufficientCount} icon={Clock3} />
          </div>
          <p className="mt-2 text-xs text-fg-muted">{overview?.isDemo ? 'Demo verileri; gerçek sistem istatistiği değildir.' : 'Veriler hesabının kullanım özetidir.'}</p>
        </section>
      </div>
      <section aria-labelledby="home-announcements">
        <div className="mb-3 flex items-center justify-between"><h2 id="home-announcements" className="text-lg font-semibold">Duyurular</h2><button onClick={() => navigate(ROUTES.announcements)} type="button" className="text-sm font-medium text-brand hover:underline">Duyurulara git</button></div>
        {overview?.isDemo && <p className="mb-2 text-xs text-fg-muted">Aşağıdaki kartlar yalnızca tasarım önizlemesidir; resmî duyuru değildir.</p>}
        <div className="grid gap-3 sm:grid-cols-2">{overview?.announcements?.length ? overview.announcements.map((item) => <Card key={item.id} as="article" padding="sm">
          <div className="flex gap-3"><Megaphone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true"/><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-fg-muted">{item.description}</p></div></div>
        </Card>) : <Card className="sm:col-span-2"><p className="text-sm text-fg-muted">{failed ? 'Özet bilgiler şu anda alınamıyor. Daha sonra yeniden dene.' : 'Henüz gösterilecek duyuru bulunmuyor.'}</p></Card>}</div>
      </section>
    </div>
  </Page>
}
