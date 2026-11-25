import { useGencnView } from '@gencn/core/react'
import type { Spec } from '@gencn/core'
import { Button } from '@/components/ui/button'
import { blocks } from './blocks'
import { onAction, onRead } from './home'

/**
 * A view drawn by the app itself on gencn's headless hook: its own
 * approval row, busy line, overlay and refresh button, in its own style.
 */
export function HookView({ spec }: { spec: Spec }) {
  const { ref, content, phase, answer, refresh } = useGencnView(spec, {
    blocks,
    onAction,
    onRead,
  })
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div className="relative">
        <div
          inert={phase.kind !== 'idle'}
          className={phase.kind === 'unavailable' ? 'opacity-30' : undefined}
        >
          {content ?? <div className="h-32 border border-dashed" />}
        </div>
        {phase.kind === 'unavailable' && (
          <div className="absolute inset-0 grid place-content-center gap-2 p-4 text-center text-sm">
            <p className="whitespace-pre-wrap">{phase.message}</p>
            {phase.retry && (
              <Button size="sm" variant="outline" onClick={phase.retry}>
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="flex min-h-8 items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {phase.kind === 'running' && 'Working…'}
          {phase.kind === 'reading' && 'Reading the house…'}
          {phase.kind === 'idle' && phase.notice && (
            <span className="text-destructive">{phase.notice}</span>
          )}
        </span>
        {refresh && (
          <Button
            size="sm"
            variant="ghost"
            disabled={phase.kind !== 'idle'}
            onClick={refresh}
          >
            Refresh
          </Button>
        )}
      </div>
      {phase.kind === 'asking' && (
        <div className="flex flex-col gap-2 border p-3 text-xs">
          <p className="font-medium">Run {phase.tool}?</p>
          <pre className="text-muted-foreground">
            {JSON.stringify(phase.args, null, 2)}
          </pre>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => answer(true)}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => answer(false)}>
              Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
