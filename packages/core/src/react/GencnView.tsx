import { useEffect, useRef } from 'react'
import type { Spec } from '../spec.js'
import { useGencnView, type GencnViewOptions } from './useGencnView.js'

export type GencnViewProps = GencnViewOptions & {
  spec: Spec
  /**
   * When to read the view's state: each time it comes on screen (default),
   * once when it mounts, or only when the person presses Refresh.
   */
  readOn?: 'visible' | 'mount' | 'manual'
  className?: string
}

/**
 * A view with gencn's plain defaults on `useGencnView`. Unstyled: style it
 * through its `data-` attributes, or build your own on the hook. Its few
 * words are placeholders; phases carry codes, for hosts to word.
 */
export function GencnView({
  spec,
  readOn = 'visible',
  className,
  ...options
}: GencnViewProps) {
  const { content, phase, refresh } = useGencnView(spec, options)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!refresh || readOn === 'manual') return
    if (readOn === 'mount' || !element) {
      void refresh()
      return
    }
    let visible = false
    const observer = new IntersectionObserver(([entry]) => {
      const now = !!entry?.isIntersecting
      if (now && !visible) void refresh()
      visible = now
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [refresh, readOn])

  return (
    <div
      ref={ref}
      className={className}
      data-gencn-view=""
      data-phase={phase.kind}
    >
      {content}
      {phase.kind === 'idle' && phase.notice && (
        <p data-gencn-notice={phase.notice.code} role="alert">
          {phase.notice.code}: {phase.notice.tool}
          {phase.notice.message && ` (${phase.notice.message})`}
        </p>
      )}
      {phase.kind === 'confirming' && (
        <div
          data-gencn-confirm=""
          data-variant={phase.confirm.variant}
          role="group"
        >
          <p>{phase.confirm.title}</p>
          <p>{phase.confirm.message}</p>
          <button type="button" onClick={() => phase.answer(true)}>
            {phase.confirm.confirmLabel ?? 'OK'}
          </button>
          <button type="button" onClick={() => phase.answer(false)}>
            {phase.confirm.cancelLabel ?? 'Cancel'}
          </button>
        </div>
      )}
      {phase.kind === 'asking' && (
        <div data-gencn-approval="" role="group">
          <p>{phase.tool}</p>
          <pre>{JSON.stringify(phase.args, null, 2)}</pre>
          <button type="button" onClick={() => phase.answer(true)}>
            Approve
          </button>
          <button type="button" onClick={() => phase.answer(false)}>
            Decline
          </button>
        </div>
      )}
      {phase.kind === 'unavailable' && (
        <div data-gencn-unavailable={phase.reason} role="status">
          {phase.reason}
          {phase.reason === 'read-failed' && refresh && (
            <button type="button" onClick={() => void refresh()}>
              Retry
            </button>
          )}
        </div>
      )}
      {refresh && phase.kind !== 'unavailable' && (
        <button
          type="button"
          data-gencn-refresh=""
          disabled={phase.kind !== 'idle'}
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      )}
    </div>
  )
}
