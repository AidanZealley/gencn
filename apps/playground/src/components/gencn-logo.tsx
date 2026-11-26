import { cn } from '@/lib/utils'

/** The gencn mark, a switch that's on, as in the site's gencn-mark.svg. */
export function GencnMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle cx="15" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

/** The mark and name, linking to the site's home page. */
export function GencnLogo({ className }: { className?: string }) {
  return (
    <a
      href="/gencn/"
      // Out of the docs' iframe, not into it.
      target="_top"
      className={cn(
        'flex items-center gap-1.5 text-lg font-semibold tracking-tight',
        className,
      )}
    >
      <GencnMark className="size-6" />
      gencn
    </a>
  )
}
