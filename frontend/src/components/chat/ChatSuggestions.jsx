import { ArrowUpRight, BookOpen, BriefcaseBusiness, GraduationCap, Landmark, ScrollText, Users } from 'lucide-react'

export const QUESTION_CATEGORIES = [
  { title: 'Dersler ve Sınavlar', icon: GraduationCap, prompt: 'Mazeret sınavı hakkında bilgi alabilir miyim?', description: 'Sınavlar ve akademik kurallar' },
  { title: 'Staj İşlemleri', icon: BriefcaseBusiness, prompt: 'Staj başvurusu nasıl yapılır?', description: 'Staj belgeleri ve başvurular' },
  { title: 'Burslar', icon: Landmark, prompt: 'Burs başvuru koşullarını nereden öğrenebilirim?', description: 'Burs ve destek bilgileri' },
  { title: 'Öğrenci İşleri', icon: Users, prompt: 'Öğrenci belgesi nasıl alınır?', description: 'Öğrencilik süreçleri' },
  { title: 'Yönetmelikler', icon: ScrollText, prompt: 'Üniversite yönetmeliklerine nasıl ulaşabilirim?', description: 'Yönergeler ve kurallar' },
  { title: 'Kampüs Yaşamı', icon: BookOpen, prompt: 'Kampüs ile ilgili hangi mevzuat belgeleri mevcut?', description: 'Kampüs ve öğrenci yaşamı' },
]

export function ChatSuggestions({ onChoose, title = 'Hangi konuda bilgi almak istersin?', limit }) {
  const items = limit ? QUESTION_CATEGORIES.slice(0, limit) : QUESTION_CATEGORIES
  return (
    <section aria-label={title}>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ title: label, icon: Icon, prompt, description }) => (
          <button key={label} type="button" onClick={() => onChoose(prompt, label)} className="group rounded-2xl border border-line bg-surface p-4 text-left shadow-soft transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-on-brand-soft"><Icon className="size-4.5" aria-hidden="true" /></span>
              <ArrowUpRight className="size-4 text-fg-muted opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold">{label}</h3>
            <p className="mt-1 text-xs text-fg-muted">{description}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
