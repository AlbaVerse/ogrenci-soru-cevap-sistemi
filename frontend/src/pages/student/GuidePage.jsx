import { ArrowRight, BookOpen, FileText, History, MessageSquareText, ShieldCheck, UserRound, ChartPie, Flag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Page } from '@/components/layout/Page'
import { Card } from '@/components/ui'
import { InfoPanel } from '@/components/stage4/Shared'
import { ROUTES } from '@/config/routes'

const steps = [
  { title:'Sorunu yaz', description:'Ana Sayfa veya Yeni Sohbet ekranında doğal dilde soru sor. Enter göndermek, Shift+Enter satır atlamak içindir.',icon:MessageSquareText,to:ROUTES.chatNew,label:'Sohbete git' },
  { title:'Yanıtı ve kaynakları incele',description:'Yanıtın altında PDF adı, mevcutsa sayfa ve madde bilgisi görünür. Kaynak bağlantısı yoksa bilgi uydurulmaz.',icon:FileText,to:ROUTES.documents,label:'Belgeleri incele' },
  { title:'Sohbetlerini yönet',description:'Önceki konuşmalarına dön, ara, yeniden adlandır veya sil. Demo oturumunda veriler gerçek sunucuya kaydedilmez.',icon:History,to:ROUTES.history,label:'Geçmişe git' },
  { title:'İstatistiklere bak',description:'Genel İstatistikler anonim toplamları, Kişisel İstatistikler yalnızca sana ait soruları gösterir.',icon:ChartPie,to:ROUTES.statsPersonal,label:'İstatistiklerim' },
  { title:'Cevap yetersizse bildir',description:'Sohbette bir yanıtın faydasını değerlendirebilir veya cevapsız sorunu “İncelemeye gönder” ile bildirebilirsin.',icon:Flag,to:ROUTES.chatNew,label:'Yeni sohbet' },
  { title:'Hesabını yönet',description:'Profil ve Ayarlar ekranından hesap ve tema bilgilerini kontrol edebilirsin. Personel rolü için admin onayı gerekir.',icon:UserRound,to:ROUTES.profile,label:'Profil ve ayarlar' },
]
export function GuidePage() {
  return <Page title="Kullanım Rehberi" description="AlbaVerse'ü güvenli ve kolay şekilde kullanmak için kısa bir yol haritası.">
    <div className="space-y-5"><Card variant="glass" padding="lg"><div className="flex items-start gap-4"><span className="rounded-2xl bg-brand-soft p-3 text-on-brand-soft"><BookOpen className="size-7"/></span><div><h2 className="text-xl font-semibold">AlbaVerse ile bilgiye erişim</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-fg-muted">Üniversite mevzuatını araştırmayı kolaylaştırmak için tasarlanan dijital bilgi asistanı. Demo ortamında gerçek AI veya üniversite belge araması henüz bağlı değildir.</p></div></div></Card>
      <div className="grid gap-4 md:grid-cols-2">{steps.map((s,i)=>{const Icon=s.icon; return <Card key={s.title} as="article" className="flex h-full flex-col gap-3"><div className="flex items-center justify-between"><span className="rounded-xl bg-brand-soft p-2.5 text-on-brand-soft"><Icon className="size-5" aria-hidden="true"/></span><span className="text-sm font-semibold text-fg-muted">{String(i+1).padStart(2,'0')}</span></div><h3 className="text-base font-semibold">{s.title}</h3><p className="flex-1 text-sm leading-6 text-fg-muted">{s.description}</p><Link to={s.to} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">{s.label}<ArrowRight className="size-4"/></Link></Card>})}</div>
      <InfoPanel><div><p className="font-medium text-fg">Bilgilerin güvenilirliğini kontrol et</p><p className="mt-1">Yapay zekâ yanıtları resmî üniversite bildirimi yerine geçmez. Önemli başvurular ve tarihler için güncel ve yetkili kaynakları incele.</p><p className="mt-2 flex items-center gap-1"><ShieldCheck className="size-4"/> Hesap bilgilerin ve kişisel kullanım verilerin erişim yetkisine göre korunmalıdır.</p></div></InfoPanel>
    </div>
  </Page>
}
