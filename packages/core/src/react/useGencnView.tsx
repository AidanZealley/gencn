import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { createViewActor, type Unavailable, type ViewHost } from '../actor.js'
import type { Spec } from '../spec.js'
import type { ViewBlocks } from './blocks.js'

export type GencnViewOptions = ViewHost & {
  blocks: ViewBlocks
  /**
   * When to read the view's state: each time `ref`'s element comes on
   * screen (default), once when the view mounts, or only on `refresh()`.
   */
  readOn?: 'visible' | 'mount' | 'manual'
  /** Opt in to suggested intervals for visible views, with this minimum. */
  minRefreshIntervalMs?: number
  /** Suspend automatic reads for views with an enabled interval. */
  refreshPaused?: boolean
}

/**
 * Draws a view (see `createViewActor`). Destructure what you need; drawing
 * only `view` is always safe. Every field but `ref` and `refresh` comes
 * from `phase`, and the app words them. The spec is fixed when the view is
 * created; a new spec needs a new `key`.
 */
export function useGencnView(
  spec: Spec,
  {
    blocks,
    onAction,
    onRead,
    readOn = 'visible',
    minRefreshIntervalMs,
    refreshPaused,
  }: GencnViewOptions,
) {
  const [actor] = useState(() =>
    createViewActor(spec, { onAction, onRead, catalog: blocks.catalog }),
  )
  useEffect(
    () => actor.setHost({ onAction, onRead }),
    [actor, onAction, onRead],
  )
  useEffect(() => actor.start(), [actor])
  const phase = useSyncExternalStore(actor.subscribe, actor.phase, actor.phase)
  const refresh = actor.spec.refresh && onRead ? actor.refresh : undefined

  // The element `ref` is on; only `visible` watches it, so attaching it
  // never reads again on `mount`.
  const [element, ref] = useState<Element | null>(null)
  const suggested = actor.spec.refresh?.suggestedIntervalMs
  const interval =
    suggested !== undefined &&
    minRefreshIntervalMs !== undefined &&
    Number.isFinite(minRefreshIntervalMs) &&
    minRefreshIntervalMs > 0
      ? Math.min(Math.max(suggested, minRefreshIntervalMs), 2_147_483_647)
      : undefined
  const watched = readOn === 'visible' ? element : null
  useEffect(() => {
    if (!refresh || readOn === 'manual') return
    if (readOn === 'mount') {
      void refresh()
      return
    }
    if (!watched || (interval !== undefined && refreshPaused)) return
    // Reads as it comes on screen, not on every callback while it stays.
    let visible = false
    let timer: ReturnType<typeof setInterval> | undefined
    const updateTimer = () => {
      const shouldPoll =
        interval !== undefined &&
        visible &&
        !document.hidden &&
        actor.phase().kind !== 'unavailable'
      if (shouldPoll && timer === undefined) {
        timer = setInterval(() => {
          if (!document.hidden && actor.phase().kind === 'idle')
            void refresh('automatic')
        }, interval)
      } else if (!shouldPoll && timer !== undefined) {
        clearInterval(timer)
        timer = undefined
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      const now = !!entry?.isIntersecting
      if (now && !visible && (interval === undefined || !document.hidden)) {
        const current = actor.phase().kind
        if (interval === undefined) void refresh()
        else if (current === 'idle') void refresh('automatic')
      }
      visible = now
      updateTimer()
    })
    observer.observe(watched)
    if (interval === undefined) return () => observer.disconnect()

    document.addEventListener('visibilitychange', updateTimer)
    const unsubscribe = actor.subscribe(updateTimer)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateTimer)
      unsubscribe()
      clearInterval(timer)
    }
  }, [actor, interval, refresh, refreshPaused, readOn, watched])

  const { registry } = blocks
  const view: ReactNode = actor.refused ? null : (
    <div inert={phase.kind !== 'idle'}>
      <JSONUIProvider
        registry={registry}
        store={actor.store}
        handlers={actor.handlers}
      >
        <Renderer spec={actor.spec} registry={registry} />
      </JSONUIProvider>
    </div>
  )

  return {
    /** Put on the element that holds the view, for `readOn: 'visible'`. */
    ref: ref as (element: Element | null) => void,
    /** The view's controls, inert unless idle; null when it's refused. */
    view,
    /** What the view is waiting on, if anything. */
    busy:
      phase.kind === 'running' || phase.kind === 'reading'
        ? phase.kind
        : undefined,
    /** Why the last call didn't happen or work. */
    notice: phase.kind === 'idle' ? phase.notice : undefined,
    /** Why the view can't be used. */
    problem: (phase.kind === 'unavailable' ? phase : undefined) as
      Unavailable | undefined,
    /** Reads the view's state again; undefined when it has no refresh. */
    refresh,
    /** The configured interval for visible reads, when enabled. */
    refreshIntervalMs: readOn === 'visible' && refresh ? interval : undefined,
    phase,
  }
}
