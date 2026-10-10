import { useMemo, useState } from 'react'
import { Activity, CheckCircle2, CircleHelp, Clock3, MessageCircleOff, MessagesSquare } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, EmptyState } from '@/components/ui'
import { compactCount, timeTr } from './Shared'

const statusLabels = [ ['answeredCount', 'Cevaplanan', 'var(--success)'], ['unansweredCount', 'Cevaplanamayan', 'var(--danger)'], ['insufficientCount', 'Yetersiz', 'var(--warning)'] ]
const colors = ['var(--primary)', 'var(--rose)', 'var(--info)', 'var(--success)', 'var(--warning)', 'var(--fg-muted)']
const periodLabel = { day: 'Günlük', week: 'Haftalık', month: 'Aylık' }
const dateLabel = (date) => { const parsed = Date.parse(date); return Number.isFinite(parsed) ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(parsed) : date }

export function StatOverview({ stats }) {
  const total = stats.totalQuestions ?? 0
  const rate = total ? Math.round(((stats.answeredCount || 0) / total) * 100) : null
  const cards = [
    { label: 'Toplam soru', value: compactCount(total), icon: MessagesSquare },
    { label: 'Cevaplanan', value: compactCount(stats.answeredCount), icon: CheckCircle2 },
    { label: 'Cevaplanamayan', value: compactCount(stats.unansweredCount), icon: MessageCircleOff },
    { label: 'Yetersiz cevap', value: compactCount(stats.insufficientCount), icon: CircleHelp },
    { label: 'Cevaplanma oranı', value: rate == null ? '—' : `%${rate}`, icon: Activity },
    { label: 'Ortalama yanıt süresi', value: timeTr(stats.averageResponseTimeMs), icon: Clock3 },
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <Card key={label} padding="md" className="flex items-start justify-between gap-2"><div><p className="text-sm text-fg-muted">{label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p></div><div className="rounded-xl bg-brand-soft p-2.5 text-on-brand-soft"><Icon className="size-5" aria-hidden="true"/></div></Card>)}</div>
}

function aggregateTrend(trend, grouping) {
  if (grouping === 'day') return trend.map(({ date, count }) => ({ name: dateLabel(date), count, date }))
  const map = new Map()
  for (const item of trend) {
    const parsed = new Date(`${item.date}T12:00:00Z`)
    if (!Number.isFinite(parsed.getTime())) continue
    if (grouping === 'week') { const weekday = (parsed.getUTCDay() + 6) % 7; parsed.setUTCDate(parsed.getUTCDate() - weekday) }
    else parsed.setUTCDate(1)
    const date = parsed.toISOString().slice(0,10)
    map.set(date, (map.get(date) || 0) + item.count)
  }
  return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({ name: grouping==='month' ? new Intl.DateTimeFormat('tr-TR',{month:'short',year:'numeric'}).format(new Date(`${date}T12:00:00Z`)) : dateLabel(date), count, date }))
}

export function StatsCharts({ stats, allowGrouping = true }) {
  const [grouping, setGrouping] = useState('day')
  const statuses = statusLabels.map(([key, name, fill]) => ({ name, value: stats[key] || 0, fill })).filter((x) => x.value > 0)
  const categories = stats.categories || []
  const trend = useMemo(()=>aggregateTrend(stats.dailyTrend || [], grouping),[stats.dailyTrend,grouping])
  const hasData = statuses.length > 0
  return <div className="grid gap-5 lg:grid-cols-2">
    <Card as="section" className="min-w-0" aria-label="Soru cevap durumları"><h2 className="mb-1 text-lg font-semibold">Cevap durumları</h2><p className="text-sm text-fg-muted">Soruların sonuçlara göre dağılımı</p>
      {hasData ? <><div className="mt-4 h-56" role="img" aria-label={statuses.map(x=>`${x.name}: ${x.value}`).join(', ')}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statuses} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={3} stroke="none">{statuses.map(x=><Cell key={x.name} fill={x.fill}/>)}</Pie><Tooltip formatter={(v)=>[v,'Soru']} contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--fg)',borderRadius:10}}/></PieChart></ResponsiveContainer></div><div className="mt-1 flex flex-wrap gap-3">{statuses.map(x=><span key={x.name} className="flex items-center gap-1.5 text-xs text-fg-muted"><span className="size-2.5 rounded-full" style={{background:x.fill}}/>{x.name}: {x.value}</span>)}</div></> : <EmptyState title="Henüz cevap istatistiği yok" description="Soru sorulduğunda grafik burada gösterilecek."/>}
    </Card>
    <Card as="section" className="min-w-0" aria-label="En çok soru sorulan kategoriler"><h2 className="mb-1 text-lg font-semibold">Soru kategorileri</h2><p className="text-sm text-fg-muted">En sık sorulan konular</p>
      {categories.length ? <><div className="mt-4 h-64" role="img" aria-label={categories.map(x=>`${x.name}: ${x.count}`).join(', ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={categories} layout="vertical" margin={{top:0,right:12,bottom:0,left:5}}><CartesianGrid horizontal={false} stroke="var(--line)"/><XAxis type="number" tick={{fill:'var(--fg-muted)',fontSize:11}} allowDecimals={false}/><YAxis type="category" dataKey="name" width={112} tick={{fill:'var(--fg-muted)',fontSize:11}}/><Tooltip cursor={{fill:'var(--surface-2)'}} contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--fg)',borderRadius:10}}/><Bar dataKey="count" name="Soru sayısı" radius={[0,5,5,0]} maxBarSize={24}>{categories.map((x,i)=><Cell key={x.name} fill={colors[i%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></> : <EmptyState title="Kategori verisi yok" description="Kategori bilgileri geldiğinde burada gösterilecek."/>}
    </Card>
    <Card as="section" className="min-w-0 lg:col-span-2" aria-label="Zamana göre soru yoğunluğu"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Zamana göre soru yoğunluğu</h2><p className="text-sm text-fg-muted">Belirlenen zaman aralığında sorulan sorular</p></div>{allowGrouping && <div className="flex rounded-xl border border-line p-1" role="group" aria-label="Grafik zaman ölçeği">{Object.entries(periodLabel).map(([value,label])=><button key={value} type="button" aria-pressed={grouping===value} onClick={()=>setGrouping(value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${grouping===value?'bg-brand-soft text-on-brand-soft':'text-fg-muted hover:bg-surface-2'}`}>{label}</button>)}</div>}</div>
      {trend.length ? <div className="mt-5 h-60" role="img" aria-label={trend.map(x=>`${x.name}: ${x.count}`).join(', ')}><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{top:8,right:12,bottom:4,left:-18}}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fill:'var(--fg-muted)',fontSize:11}}/><YAxis allowDecimals={false} tick={{fill:'var(--fg-muted)',fontSize:11}}/><Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--line)',color:'var(--fg)',borderRadius:10}}/><Line type="monotone" dataKey="count" name="Soru sayısı" stroke="var(--primary)" strokeWidth={2.5} dot={{r:3}}/></LineChart></ResponsiveContainer></div>:<EmptyState title="Zaman serisi henüz yok" description="Soru geçmişi oluştukça burada gösterilecek."/>}
    </Card>
  </div>
}
