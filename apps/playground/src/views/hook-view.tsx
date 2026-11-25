import { useEffect, useRef } from 'react'
import { useGencnView } from 'gencn/react'
import type { GencnPhase, Spec } from 'gencn'
import { Button } from '@/components/ui/button'
import { blocks } from './blocks'
import { onAction, onRead } from './home'

/** The app's own words for what gencn reports as codes. */
function wording(phase: GencnPhase) {
  switch (phase.kind) {
    case 'running':
      return 'Working…'
    case 'reading':
      return 'Reading the house…'
    case 'idle':
      return phase.notice?.code === 'failed'
        ? `${phase.notice.tool} didn't work${phase.notice.message ? `: ${phase.notice.message}` : '.'}`
        : phase.notice?.code === 'declined'
          ? `${phase.notice.tool} wasn't run.`
          : ''
    case 'unavailable':
      return {
        'unknown-block': `Uses blocks this app doesn't have.`,
        'invalid-spec': 'This view is broken.',
        'tool-unavailable': `${'tool' in phase ? phase.tool : 'A tool'} is no longer available.`,
        'read-failed': `Couldn't read ${'tool' in phase ? phase.tool : 'the house'}.`,
      }[phase.reason]
    default:
      return ''
  }
}

/**
 * A view drawn by the app itself on gencn's headless hook: its own words,
 * confirm and approval rows, overlay, and when to read (on screen).
 */
export function HookView({ spec }: { spec: Spec }) {
  const { content, phase, refresh } = useGencnView(spec, {
    blocks,
    onAction,
    onRead,
  })
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!refresh || !ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void refresh()
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [refresh])

  const words = wording(phase)
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="relative">
        <div
          className={phase.kind === 'unavailable' ? 'opacity-30' : undefined}
        >
          {content ?? <div className="h-32 border border-dashed" />}
        </div>
        {phase.kind === 'unavailable' && (
          <div className="absolute inset-0 grid place-content-center gap-2 p-4 text-center text-sm">
            <p>{words}</p>
            {phase.reason === 'read-failed' && refresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void refresh()}
              >
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex min-h-8 items-center justify-between gap-2 text-xs text-muted-foreground">
        <span
          className={
            phase.kind === 'idle' && phase.notice
              ? 'text-destructive'
              : undefined
          }
        >
          {phase.kind !== 'unavailable' && words}
        </span>
        {refresh && (
          <Button
            size="sm"
            variant="ghost"
            disabled={phase.kind !== 'idle'}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        )}
      </div>
      {(phase.kind === 'asking' || phase.kind === 'confirming') && (
        <div className="flex flex-col gap-2 border p-3 text-xs">
          <p className="font-medium">
            {phase.kind === 'confirming'
              ? phase.confirm.title
              : `Run ${phase.tool}?`}
          </p>
          {phase.kind === 'confirming' ? (
            <p>{phase.confirm.message}</p>
          ) : (
            <pre className="text-muted-foreground">
              {JSON.stringify(phase.args, null, 2)}
            </pre>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => phase.answer(true)}>
              {phase.kind === 'confirming'
                ? (phase.confirm.confirmLabel ?? 'Yes')
                : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => phase.answer(false)}
            >
              {phase.kind === 'confirming'
                ? (phase.confirm.cancelLabel ?? 'No')
                : 'Decline'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
