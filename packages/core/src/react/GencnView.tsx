import type { Spec } from '../spec.js'
import { useGencnView, type GencnViewOptions } from './useGencnView.js'

export type GencnViewProps = GencnViewOptions & {
  spec: Spec
  className?: string
}

/**
 * A view with gencn's plain defaults on `useGencnView`: its content, inert
 * while busy; an approval row; a notice; an overlay with Try again; a
 * refresh button. No styling of its own: style it through the `data-`
 * attributes, or build your own on the hook.
 */
export function GencnView({ spec, className, ...options }: GencnViewProps) {
  const { ref, content, phase, answer, refresh } = useGencnView(spec, options)
  return (
    <div
      ref={ref}
      className={className}
      data-gencn-view=""
      data-phase={phase.kind}
    >
      <div data-gencn-content="" inert={phase.kind !== 'idle'}>
        {content}
      </div>
      {(phase.kind === 'running' || phase.kind === 'reading') && (
        <p data-gencn-busy="" aria-live="polite">
          {phase.kind === 'reading' ? 'Reading…' : 'Working…'}
        </p>
      )}
      {phase.kind === 'idle' && phase.notice && (
        <p data-gencn-notice="" role="alert">
          {phase.notice}
        </p>
      )}
      {phase.kind === 'asking' && (
        <div
          data-gencn-approval=""
          role="group"
          aria-label={`Run ${phase.tool}?`}
        >
          <p>Run {phase.tool}?</p>
          <pre>{JSON.stringify(phase.args, null, 2)}</pre>
          <button type="button" onClick={() => answer(true)}>
            Approve
          </button>
          <button type="button" onClick={() => answer(false)}>
            Decline
          </button>
        </div>
      )}
      {phase.kind === 'unavailable' && (
        <div data-gencn-overlay="" data-reason={phase.reason} role="status">
          <p>{phase.message}</p>
          {phase.retry && (
            <button type="button" onClick={phase.retry}>
              Try again
            </button>
          )}
        </div>
      )}
      {refresh && phase.kind !== 'unavailable' && (
        <button
          type="button"
          data-gencn-refresh=""
          disabled={phase.kind !== 'idle'}
          onClick={refresh}
        >
          Refresh
        </button>
      )}
    </div>
  )
}
