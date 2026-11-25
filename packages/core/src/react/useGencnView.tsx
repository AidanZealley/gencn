import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { createViewActor, type ViewHost } from '../actor.js'
import type { Spec } from '../spec.js'
import type { ViewBlocks } from './blocks.js'

export type GencnViewOptions = ViewHost & { blocks: ViewBlocks }

/**
 * Draws a view (see `createViewActor`): its content, inert unless idle,
 * and its phase, which the host draws and words. It never reads on its
 * own: call `refresh` when the host wants, such as when the view comes on
 * screen. The spec is fixed when the view is created; a new spec needs a
 * new `key`.
 */
export function useGencnView(spec: Spec, options: GencnViewOptions) {
  const [actor] = useState(() =>
    createViewActor(spec, { ...options, catalog: options.blocks.catalog }),
  )
  const { onAction, onRead } = options
  useEffect(
    () => actor.setHost({ onAction, onRead }),
    [actor, onAction, onRead],
  )
  useEffect(() => actor.start(), [actor])
  const phase = useSyncExternalStore(actor.subscribe, actor.phase, actor.phase)

  const { registry } = options.blocks
  const content: ReactNode = actor.refused ? null : (
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
    content,
    phase,
    /** Reads the view's state again; undefined when it has no refresh. */
    refresh: actor.spec.refresh && onRead ? actor.refresh : undefined,
  }
}
