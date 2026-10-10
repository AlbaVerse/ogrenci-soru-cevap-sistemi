import { Page } from '@/components/layout/Page'
import { Badge } from '@/components/ui'
import { DemoNotice, InfoPanel, StatusView } from '@/components/stage4/Shared'
import { StatOverview, StatsCharts } from '@/components/stage4/StatsCharts'
import { useResource } from '@/hooks/useResource'
import { statsService } from '@/services'

export function GeneralStatsPage() {
  const { data, loading, error, retry } = useResource(statsService.getGeneralStats)
  return <Page title="Genel İstatistikler" description="AlbaVerse genelinde anonimleştirilmiş soru dağılımları ve kullanım eğilimleri." actions={<Badge tone="primary">Toplulaştırılmış veriler</Badge>}>
    <div className="space-y-5"><InfoPanel>Bu alanda kullanıcı adları, e-postalar veya özel sohbet içerikleri gösterilmez. Çözüm oranı, cevabın doğruluğu için kesin garanti değildir.</InfoPanel>
    <StatusView loading={loading} error={error} retry={retry}>{data && <>{data.isDemo && <DemoNotice>Bu sayfadaki toplu sayılar yalnızca grafik tasarımını denemek içindir; gerçek üniversite istatistiği değildir.</DemoNotice>}<StatOverview stats={data}/><StatsCharts stats={data}/></>}</StatusView></div>
  </Page>
}
