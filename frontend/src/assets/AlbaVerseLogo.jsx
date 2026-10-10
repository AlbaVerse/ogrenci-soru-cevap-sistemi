import { cx } from '@/utils/cx'

/** AlbaVerse işareti: "A" harfi, kitap sayfasını andıran kavisli çıta ve küçük bir yörünge noktası. */
export function AlbaVerseMark({ className, inverted = false }) {
  return (
    <svg viewBox="0 0 40 40" className={cx('size-8 shrink-0', className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" className={inverted ? 'fill-white' : 'fill-primary'} />
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverted ? 'stroke-deep' : 'stroke-on-primary'}
      >
        <path d="M11 29 20 10l9 19" strokeWidth="3.2" />
        <path d="M14.8 23.6Q20 19.8 25.2 23.6" strokeWidth="2.6" />
      </g>
      <circle cx="30" cy="11" r="2.5" className="fill-rose" />
    </svg>
  )
}

export function AlbaVerseLogo({ showWordmark = true, inverted = false, className }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <AlbaVerseMark inverted={inverted} />
      {showWordmark && (
        <span className={cx('text-lg font-semibold tracking-tight', inverted ? 'text-white' : 'text-fg')}>
          Alba<span className={cx('font-normal', inverted ? 'text-rose' : 'text-brand')}>Verse</span>
        </span>
      )}
      {!showWordmark && <span className="sr-only">AlbaVerse</span>}
    </span>
  )
}
