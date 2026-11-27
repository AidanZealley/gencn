import { createStateStore, type StateModel } from '@json-render/core'
import type { Catalog } from './catalog.js'
import { extract, extractedState, type Extracted } from './extract.js'
import { prepare } from './json-render.js'
import type { Spec } from './spec.js'
import { checkSpec } from './validate.js'

/** Runs one read or tool call at a time against a json-render store. */
export function createViewActor(
  source: Spec,
  options: ViewHost & { catalog: Catalog },
) {
  const refused = refusal(options.catalog, source)
  // json-render never rethrows a failed call (see json-render.ts).
  const spec = refused ? source : prepare(source)
  let host: ViewHost = options
  const store = createStateStore(spec.state ?? {})
  let confirmed = store.getSnapshot()
  let phase: ActorPhase = refused
    ? { kind: 'unavailable', ...refused }
    : { kind: 'idle' }
  const listeners = new Set<() => void>()
  let lifetime = new AbortController()

  const setPhase = (next: ActorPhase) => {
    phase = next
    listeners.forEach((listener) => listener())
  }
  const revertTo = (state: StateModel) => store.update(writes(state))

  /** The `callTool` handler: resolves when the call worked, else rejects. */
  const call = async (params: Record<string, unknown>) => {
    const tool = String(params.tool)
    const args = (params.args ?? {}) as Args
    const { signal } = lifetime
    if (signal.aborted) {
      revertTo(confirmed)
      throw new ViewCallError('stopped', tool)
    }
    if (phase.kind !== 'idle') {
      revertTo(phase.kind === 'running' ? phase.pressed : confirmed)
      throw new ViewCallError('busy', tool)
    }

    setPhase({
      kind: 'running',
      status: { kind: 'running', tool },
      pressed: store.getSnapshot(),
    })

    let result: ActionOutcome
    try {
      result = await until(host.onAction(tool, args, { signal }), signal, tool)
    } catch (error) {
      result = { outcome: 'failed', message: messageOf(error) }
    }

    if (signal.aborted) throw new ViewCallError('stopped', tool)
    if (result.outcome === 'done') {
      confirmed = store.getSnapshot()
      setPhase({ kind: 'idle' })
      return
    }

    revertTo(confirmed)
    if (result.outcome === 'unavailable') {
      setPhase({
        kind: 'unavailable',
        reason: 'tool-unavailable',
        tool,
        ...(result.message !== undefined && { message: result.message }),
      })
      throw new ViewCallError('unavailable', tool, result.message)
    }

    const message = result.outcome === 'failed' ? result.message : undefined
    setPhase({
      kind: 'idle',
      notice: {
        code: result.outcome,
        tool,
        ...(message !== undefined && { message }),
      },
    })
    throw new ViewCallError(result.outcome, tool, message)
  }

  /** Reads the view's state again from its refresh tool. */
  const refresh = async () => {
    const { refresh: source } = spec
    const { onRead } = host
    const { signal } = lifetime
    const retry = phase.kind === 'unavailable' && phase.reason === 'read-failed'
    if (
      !source ||
      !onRead ||
      signal.aborted ||
      (phase.kind !== 'idle' && !retry)
    )
      return
    const { tool } = source
    setPhase({ kind: 'reading', tool })
    let results: Extracted[]
    try {
      const output = await until(
        onRead(tool, source.args ?? {}, { signal }),
        signal,
        tool,
      )
      if (signal.aborted) return
      results = extract(output, source)
    } catch (error) {
      if (signal.aborted) return
      setPhase({
        kind: 'unavailable',
        reason: 'read-failed',
        tool,
        message: messageOf(error),
      })
      return
    }

    const values = extractedState(results)
    if (!values) {
      setPhase({
        kind: 'unavailable',
        reason: 'read-failed',
        tool,
        misses: results.filter((result) => 'problem' in result),
      })
      return
    }
    store.update(values)
    confirmed = store.getSnapshot()
    setPhase({ kind: 'idle' })
  }

  /** Starts waiting; the returned stop leaves any dispatched tool call alone. */
  const start = () => {
    if (lifetime.signal.aborted) lifetime = new AbortController()
    const own = lifetime
    return () => {
      if (own.signal.aborted) return
      own.abort()
      if (phase.kind === 'running') revertTo(confirmed)
      if (phase.kind === 'running' || phase.kind === 'reading') {
        setPhase({ kind: 'idle' })
      }
    }
  }

  return {
    /** The spec as drawn (see `prepare`). */
    spec,
    /** Why it can't be drawn, fixed at creation; undefined if it can. */
    refused,
    store,
    /** json-render's handlers: one per action, its promise the call's own. */
    handlers: { callTool: call },
    phase: (): GencnPhase => (phase.kind === 'running' ? phase.status : phase),
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    /** Reads again; resolves once settled. A no-op without refresh or `onRead`. */
    refresh,
    /** Replaces the host's callbacks, for the next call or read. */
    setHost: (next: ViewHost) => {
      host = next
    },
    start,
  }
}

export type ViewActor = ReturnType<typeof createViewActor>

export type Args = Record<string, unknown>

/** What became of a call. `declined`: the host asked, and the person said no. */
export type ActionOutcome =
  | { outcome: 'done' }
  /** `message` is the tool's own text, if any. */
  | { outcome: 'failed'; message?: string }
  | { outcome: 'unavailable'; message?: string }
  | { outcome: 'declined' }

/**
 * Aborting `signal` means the view stopped waiting (it went away). It must
 * never cancel an action that started: an action runs at most once. A host
 * still asking the person to approve a call treats it as a no.
 */
export type CallOptions = { signal: AbortSignal }

/**
 * Runs one tool call for the person. A call that needs approval asks here,
 * in the host's own UI, before it runs the tool.
 */
export type OnAction = (
  tool: string,
  args: Args,
  options: CallOptions,
) => Promise<ActionOutcome>

/** Calls the refresh's read tool; resolves to its output as text. */
export type OnRead = (
  tool: string,
  args: Args,
  options: CallOptions,
) => Promise<string>

/** How a view reaches its host's tools. */
export type ViewHost = { onAction: OnAction; onRead?: OnRead }

/** Why the last call didn't happen or work; hosts word it. */
export type Notice = {
  code: 'failed' | 'declined'
  tool: string
  /** The tool's own text, if it gave any. */
  message?: string
}

/** Why a view can't be used; hosts word it. */
export type Unavailable =
  | { reason: 'unknown-block'; blocks: string[] }
  /** `problems` is `checkSpec`'s text, written for a model. */
  | { reason: 'invalid-spec'; problems: string }
  | { reason: 'tool-unavailable'; tool: string; message?: string }
  /** `misses` for a read that didn't extract; `message` for one that threw. */
  | {
      reason: 'read-failed'
      tool: string
      misses?: Extracted[]
      message?: string
    }

/** What a view is doing: the one value its controls, rows and overlay follow. */
export type GencnPhase =
  | { kind: 'idle'; notice?: Notice }
  | { kind: 'running'; tool: string }
  | { kind: 'reading'; tool: string }
  | ({ kind: 'unavailable' } & Unavailable)

/**
 * What a call's promise rejects with, so json-render's `onError` runs.
 * `busy`: the view was already doing something, so this click reverted.
 */
export class ViewCallError extends Error {
  constructor(
    readonly code: 'busy' | 'failed' | 'declined' | 'unavailable' | 'stopped',
    readonly tool: string,
    message?: string,
  ) {
    super(message ?? code)
  }
}

/** Why `spec` can't be drawn from `catalog`, or nothing. */
function refusal(catalog: Catalog, spec: Spec): Unavailable | undefined {
  const blocks = [
    ...new Set(
      Object.values(spec.elements ?? {})
        .map((element) => element.type)
        .filter((type) => !catalog.names.includes(type)),
    ),
  ]
  if (blocks.length) return { reason: 'unknown-block', blocks }
  const problems = checkSpec(catalog, spec)
  return problems === undefined
    ? undefined
    : { reason: 'invalid-spec', problems }
}

/** `state` as store writes, one per top-level key. */
const writes = (state: StateModel) =>
  Object.fromEntries(
    Object.entries(state).map(([key, value]) => [
      `/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`,
      value,
    ]),
  )

/** `promise`, or a `stopped` rejection once `signal` aborts: stops waiting only. */
const until = <T>(promise: Promise<T>, signal: AbortSignal, tool: string) =>
  new Promise<T>((resolve, reject) => {
    const stopped = () => reject(new ViewCallError('stopped', tool))
    if (signal.aborted) return stopped()
    signal.addEventListener('abort', stopped, { once: true })
    promise.then(resolve, reject)
  })

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/** The running call owns the snapshot used to undo a second press. */
type ActorPhase =
  | Exclude<GencnPhase, { kind: 'running' }>
  | {
      kind: 'running'
      status: Extract<GencnPhase, { kind: 'running' }>
      pressed: StateModel
    }
