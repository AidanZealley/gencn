import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createStateStore, type StateModel } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { CALL_TOOL } from '../catalog.js'
import { extract, extractedState } from '../extract.js'
import type { Spec } from '../spec.js'
import { checkSpec } from '../validate.js'
import type { Blocks } from './blocks.js'

export type Args = Record<string, unknown>

/** What became of a call. `ask`: call again with `approved` once the person agrees. */
export type ActionOutcome =
  | { outcome: 'done' }
  | { outcome: 'failed'; message?: string }
  | { outcome: 'unavailable'; message?: string }
  | { outcome: 'ask' }

/**
 * Aborting `signal` means the view stopped waiting (it went away). It must
 * never cancel an action that started: an action runs at most once.
 */
export type CallOptions = { signal: AbortSignal }

/** Runs one tool call for the person. */
export type OnAction = (
  tool: string,
  args: Args,
  options: CallOptions & { approved?: boolean },
) => Promise<ActionOutcome>

/** Calls the refresh's read tool; resolves to its output as text. */
export type OnRead = (
  tool: string,
  args: Args,
  options: CallOptions,
) => Promise<string>

/** What a view is doing: the one value its controls, rows and overlay follow. */
export type GencnPhase =
  /** Ready; `notice` says why the last call didn't work. */
  | { kind: 'idle'; notice?: string }
  | { kind: 'running' }
  | { kind: 'reading' }
  /** The host wants this exact call approved first. */
  | { kind: 'asking'; tool: string; args: Args }
  | {
      kind: 'unavailable'
      reason:
        'invalid-spec' | 'read-failed' | 'tool-unavailable' | 'unknown-block'
      message: string
      /** Reads again, for a failed read. */
      retry?: () => void
    }

export type GencnViewOptions = {
  blocks: Blocks
  onAction: OnAction
  /** Needed for a spec with `refresh`. */
  onRead?: OnRead
}

/** Why `spec` can't be drawn with `blocks`, or nothing. */
function refusal(blocks: Blocks, spec: Spec): GencnPhase | undefined {
  const unknown = [
    ...new Set(
      Object.values(spec.elements ?? {})
        .map((element) => element.type)
        .filter((type) => !blocks.catalog.names.includes(type)),
    ),
  ]
  if (unknown.length) {
    return {
      kind: 'unavailable',
      reason: 'unknown-block',
      message: `This view uses blocks this app doesn't have: ${unknown.join(', ')}.`,
    }
  }
  const problems = checkSpec(blocks.catalog, spec)
  return problems === undefined
    ? undefined
    : { kind: 'unavailable', reason: 'invalid-spec', message: problems }
}

/** `state` as store writes, one per top-level key. */
const writes = (state: StateModel) =>
  Object.fromEntries(
    Object.entries(state).map(([key, value]) => [
      `/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`,
      value,
    ]),
  )

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/**
 * A view as one actor. Every call and read runs through its queue, one at
 * a time, and only the queue writes the phase. The store holds what the
 * person set; `confirmed` holds the state as of the last call that worked
 * or the last read, which a failed or declined call puts back, so a control
 * never shows input that didn't take. A read runs when the view comes on
 * screen and on `refresh()`, never after an action (a slow device would
 * flip back), and sets the store and `confirmed` together. Nothing retries.
 *
 * The spec is checked before drawing; one that fails, or uses a block
 * `blocks` lacks, isn't drawn. A view's spec never changes: give a new
 * spec a new `key`.
 */
export function useGencnView(spec: Spec, options: GencnViewOptions) {
  const { blocks } = options
  // The newest callbacks, so the view's handlers stay the same functions.
  const latest = useRef(options)
  latest.current = options

  const [store] = useState(() => createStateStore(spec.state ?? {}))
  const confirmed = useRef(store.getSnapshot())
  const refused = useMemo(() => refusal(blocks, spec), [blocks, spec])

  // The actor's phase: written only here, mirrored to React to draw.
  const current = useRef<GencnPhase>(refused ?? { kind: 'idle' })
  const [phase, setPhaseState] = useState(current.current)
  const setPhase = (next: GencnPhase) => {
    current.current = next
    setPhaseState(next)
  }

  const queue = useRef(Promise.resolve())
  const lifetime = useRef<AbortController>(undefined)
  useEffect(() => {
    const controller = new AbortController()
    lifetime.current = controller
    return () => controller.abort()
  }, [])
  /** Runs `job` after the ones before it, unless the view went away. */
  const enqueue = (job: (signal: AbortSignal) => Promise<void>) => {
    queue.current = queue.current.then(async () => {
      const signal = lifetime.current?.signal
      if (!signal || signal.aborted) return
      try {
        await job(signal)
      } catch {
        // Each job settles its own phase; nothing escapes the queue.
      }
    })
  }

  const decide = useRef<(approved: boolean) => void>(undefined)
  const revert = () => store.update(writes(confirmed.current))

  const read = useCallback(() => {
    const { refresh } = spec
    enqueue(async (signal) => {
      const onRead = latest.current.onRead
      const now = current.current
      const blocked = now.kind === 'unavailable' && now.reason !== 'read-failed'
      if (!refresh || !onRead || blocked) return
      setPhase({ kind: 'reading' })
      const failed = (message: string) =>
        setPhase({
          kind: 'unavailable',
          reason: 'read-failed',
          message,
          retry: read,
        })
      try {
        const output = await onRead(refresh.tool, refresh.args ?? {}, {
          signal,
        })
        if (signal.aborted) return
        const results = extract(output, refresh)
        const values = extractedState(results)
        if (!values) {
          failed(
            results
              .flatMap((result) =>
                'problem' in result
                  ? [`${result.path}: ${result.problem}`]
                  : [],
              )
              .join('\n'),
          )
          return
        }
        store.update(values)
        confirmed.current = store.getSnapshot()
        setPhase({ kind: 'idle' })
      } catch (error) {
        if (!signal.aborted) failed(messageOf(error))
      }
    })
    // The spec never changes; the queue and store are the view's own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const call = (tool: string, args: Args) =>
    enqueue(async (signal) => {
      if (current.current.kind !== 'idle') return
      const { onAction } = latest.current
      setPhase({ kind: 'running' })
      try {
        let result = await onAction(tool, args, { signal })
        if (signal.aborted) return
        if (result.outcome === 'ask') {
          setPhase({ kind: 'asking', tool, args })
          const approved = await new Promise<boolean>((resolve) => {
            decide.current = resolve
            signal.addEventListener('abort', () => resolve(false), {
              once: true,
            })
          })
          decide.current = undefined
          if (signal.aborted) return
          if (!approved) {
            revert()
            setPhase({ kind: 'idle' })
            return
          }
          setPhase({ kind: 'running' })
          result = await onAction(tool, args, { signal, approved })
          if (signal.aborted) return
        }
        if (result.outcome === 'done') {
          confirmed.current = store.getSnapshot()
          setPhase({ kind: 'idle' })
          return
        }
        revert()
        setPhase(
          result.outcome === 'unavailable'
            ? {
                kind: 'unavailable',
                reason: 'tool-unavailable',
                message: result.message ?? `${tool} is no longer available.`,
              }
            : {
                kind: 'idle',
                notice:
                  result.outcome === 'failed'
                    ? (result.message ?? `${tool} didn't work.`)
                    : `${tool} wasn't approved.`,
              },
        )
      } catch (error) {
        if (signal.aborted) return
        revert()
        setPhase({ kind: 'idle', notice: messageOf(error) })
      }
    })

  // The same functions for the view's life: json-render keeps the first.
  const [handlers] = useState(() => ({
    [CALL_TOOL]: (params: Record<string, unknown>) =>
      call(String(params.tool), (params.args ?? {}) as Args),
  }))

  // Reads each time the view comes on screen.
  const [element, ref] = useState<Element | null>(null)
  useEffect(() => {
    if (!element || !spec.refresh) return
    let visible = false
    const observer = new IntersectionObserver(([entry]) => {
      const now = !!entry?.isIntersecting
      if (now && !visible) read()
      visible = now
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, read, spec.refresh])

  const content: ReactNode = refused ? null : (
    <JSONUIProvider
      registry={blocks.registry}
      store={store}
      handlers={handlers}
    >
      <Renderer spec={spec} registry={blocks.registry} />
    </JSONUIProvider>
  )

  return {
    /** Attach to the view's outer element: reads wait until it's on screen. */
    ref: ref as (element: Element | null) => void,
    content,
    phase,
    /** The person's answer while `asking`. */
    answer: (approved: boolean) => decide.current?.(approved),
    /** Reads the view's state again; undefined when the spec has no refresh. */
    refresh: spec.refresh && options.onRead ? read : undefined,
  }
}
