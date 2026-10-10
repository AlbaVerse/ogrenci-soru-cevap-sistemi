import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Badge, Card, EmptyState } from '@/components/ui'
import { DemoNotice, StatusView, dateTr } from '@/components/stage4/Shared'
import { StatOverview, StatsCharts } from '@/components/stage4/StatsCharts'
import { ROUTES } from '@/config/routes'
import { useResource } from '@/hooks/useResource'
import { statsService } from '@/services'

const periods = [{value:'7',label:'Son 7 gün'},{value:'30',label:'Son 30 gün'},{value:'all',label:'Tüm zamanlar'}]

export function PersonalStatsPage() {
  const [period,setPeriod] = useState('all')
  const { data, loading, error, retry } = useResource(statsService.getMyStats, period)
  return <Page title="Kişisel İstatistikler" description="Yalnızca senin soruların ve kullanım geçmişin." actions={<Badge tone="primary">Kişisel veriler</Badge>}>
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="İstatistik zaman aralığı">{periods.map(x=><button type="button" key={x.value} aria-pressed={period===x.value} onClick={()=>setPeriod(x.value)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${period===x.value?'border-primary bg-brand-soft text-on-brand-soft':'border-line bg-surface text-fg-muted hover:border-line-strong'}`}>{x.label}</button>)}</div>
      <StatusView loading={loading} error={error} retry={retry}>{data && <>{data.isDemo && <DemoNotice>Bu veriler yalnızca oturum açan demo kullanıcısının sohbetlerinden hesaplanır; gerçek sunucuya kaydedilmez.</DemoNotice>}<StatOverview stats={data}/><StatsCharts stats={data}/>
        <Card as="section"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Son sorularım</h2><Link to={ROUTES.history} className="text-sm font-medium text-brand hover:underline">Geçmişe git</Link></div>
          {(data.recentQuestions || []).length ? <ul className="divide-y divide-line">{data.recentQuestions.map(q=><li key={q.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={q.title}>{q.title}</p><p className="mt-1 text-xs text-fg-muted">{dateTr(q.date)} · {q.category || 'Diğer'} · {q.status === 'answered' ? 'Cevaplandı' : q.status === 'insufficient' ? 'Yetersiz' : 'Cevaplanamadı'}</p></div>{q.conversationId && <Link to={ROUTES.chat(q.conversationId)} aria-label="Sohbeti görüntüle" className="rounded-lg p-2 text-brand hover:bg-surface-2"><ArrowRight className="size-4"/></Link>}</li>)}</ul> : <EmptyState title="Bu aralıkta soru bulunmuyor" description="Başka bir zaman aralığı deneyebilir veya yeni soru sorabilirsin."/>}
        </Card></>}</StatusView>
    </div>
  </Page>
}
