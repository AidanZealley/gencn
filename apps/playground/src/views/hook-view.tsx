import { useGencnView } from 'gencn/react'
import type { Notice, Spec, Unavailable } from 'gencn'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { blocks } from './blocks'
import { onAction, onRead } from './home'

/** The app's own words for what gencn reports as codes. */
const said = (notice: Notice) =>
  notice.code === 'failed'
    ? `${notice.tool} didn't work${notice.message ? `: ${notice.message}` : '.'}`
    : `${notice.tool} wasn't allowed, so nothing changed.`

const explained = (problem: Unavailable) =>
  ({
    'unknown-block': `Uses blocks this app doesn't have.`,
    'invalid-spec': 'This view is broken.',
    'tool-unavailable': `${'tool' in problem ? problem.tool : 'A tool'} is no longer available.`,
    'read-failed': `Couldn't read ${'tool' in problem ? problem.tool : 'the house'}.`,
  })[problem.reason]

/**
 * A view drawn by the app on gencn's hook, in its own words: what it's
 * waiting on, why a call didn't work, and why it can't be used. It reads
 * the house each time it comes on screen.
 */
export function HookView({ spec }: { spec: Spec }) {
  const { ref, view, busy, notice, problem, refresh } = useGencnView(spec, {
    blocks,
    onAction,
    onRead,
  })

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="relative">
        <div className={cn(problem && 'opacity-30')}>
          {view ?? <div className="h-32 border border-dashed" />}
        </div>
        {problem && (
          <div className="absolute inset-0 grid place-content-center gap-2 p-4 text-center text-sm">
            <p>{explained(problem)}</p>
            {problem.reason === 'read-failed' && refresh && (
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
        <span className={cn(notice && 'text-destructive')}>
          {busy === 'running' && 'Working…'}
          {busy === 'reading' && 'Reading the house…'}
          {notice && said(notice)}
        </span>
        {refresh && !problem && (
          <Button
            size="sm"
            variant="ghost"
            disabled={!!busy}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        )}
      </div>
    </div>
  )
}
