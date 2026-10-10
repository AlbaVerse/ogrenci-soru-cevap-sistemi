import { Construction } from 'lucide-react'
import { Page } from '@/components/layout/Page'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

/** Henüz geliştirilmemiş ekranlar için yer tutucu. İlgili aşamada gerçek sayfayla değiştirilir. */
export function PlannedPage({ title, stage, description }) {
  return (
    <Page title={title}>
      <Card className="max-w-xl">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
            <Construction className="size-5" aria-hidden="true" />
          </span>
          <div>
            <Badge tone="info">Aşama {stage}</Badge>
            <p className="mt-2 text-sm">Bu ekran Aşama {stage}&apos;te geliştirilecek.</p>
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
        </div>
      </Card>
    </Page>
  )
}
