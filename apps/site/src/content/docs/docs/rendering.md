---
title: Rendering
description: Draw a view with the useGencnView hook, in your app's own words, and ask for approval inside onAction.
---

## `useGencnView`

```tsx
const { ref, view, busy, notice, problem, refresh } = useGencnView(spec, {
  blocks,
  onAction,
  onRead,
})
```

Take only what you need. Drawing `view` alone is always safe.

- `ref`: put it on the element that holds the view, so it can read when it comes on screen.
- `view`: the view's controls, inert while it's busy. `null` when the spec was refused.
- `busy`: `running` or `reading`, while a call or a read is in flight.
- `notice`: why the last call didn't happen or work, with a `code` (`failed` or `declined`), the `tool`, and the tool's `message`, if any.
- `problem`: why the view can't be used, with a `reason`: `unknown-block`, `invalid-spec`, `tool-unavailable` or `read-failed`.
- `refresh`: reads the view's state again. Undefined when the view has no [refresh](/gencn/docs/refresh/) or there's no `onRead`.
- `phase`: the one value the others come from, if you'd rather switch on it.

These carry codes, not English. Your app words them:

```tsx
function HomeView({ spec }: { spec: Spec }) {
  const { ref, view, busy, notice, problem, refresh } = useGencnView(spec, {
    blocks,
    onAction,
    onRead,
  })
  return (
    <div ref={ref}>
      {view}
      {busy && <p>Working…</p>}
      {notice && <p role="alert">{notice.tool} didn't work.</p>}
      {problem && <p>This view can't be used right now.</p>}
      {refresh && (
        <button disabled={!!busy} onClick={() => void refresh()}>
          Refresh
        </button>
      )}
    </div>
  )
}
```

The spec is fixed when the view is created. Give a new spec a new `key`.

## `onAction`

Runs one tool call. It's called with the tool's name, its arguments, and an options object holding `signal`. It resolves to one of:

| Outcome                                | What the view does                                |
| -------------------------------------- | ------------------------------------------------- |
| `{ outcome: 'done' }`                  | Keeps what the person chose.                      |
| `{ outcome: 'failed', message? }`      | Reverts the control and sets a `failed` notice.   |
| `{ outcome: 'declined' }`              | Reverts the control and sets a `declined` notice. |
| `{ outcome: 'unavailable', message? }` | Shows the view as unavailable.                    |

An action runs at most once. `signal` is an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that aborts when the view unmounts, which means the view has stopped waiting. It doesn't cancel the call: let the tool finish, but stop anything that only matters to the view, such as asking the person.

## Approval

A view never asks the person anything. Your app decides which calls need approval, from the tool and its arguments, and asks in its own UI inside `onAction`. Here `needsApproval` and `askPerson` are your app's own functions:

```ts
const onAction: OnAction = async (tool, args, { signal }) => {
  if (needsApproval(tool) && !(await askPerson(tool, args, signal))) {
    return { outcome: 'declined' }
  }
  return runTool(tool, args)
}
```

The view stays busy while you ask. If `signal` aborts first, the view has gone, so close the prompt and treat it as a no.

## API reference

### `useGencnView(spec, options)`

From `gencn/react`. Draws one view.

| Option     | Type                               | Default     | Description                                                                                        |
| ---------- | ---------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `blocks`   | `ViewBlocks`                       |             | From [`createBlocks`](/gencn/docs/catalog/#createblockscatalog-blocks).                            |
| `onAction` | `OnAction`                         |             | Runs a tool call when someone uses a control.                                                      |
| `onRead`   | `OnRead`                           |             | Calls a [refresh](/gencn/docs/refresh/)'s read tool. Without it, views never refresh.              |
| `readOn`   | `'visible' \| 'mount' \| 'manual'` | `'visible'` | When to refresh: each time `ref`'s element comes on screen, once on mount, or only on `refresh()`. |

| Returns   | Type                                  | Description                                                      |
| --------- | ------------------------------------- | ---------------------------------------------------------------- |
| `ref`     | `(element: Element \| null) => void`  | Put it on the element holding the view, for `readOn: 'visible'`. |
| `view`    | `ReactNode`                           | The view, inert while busy. `null` when the spec was refused.    |
| `busy`    | `'running' \| 'reading' \| undefined` | What the view is waiting on.                                     |
| `notice`  | `Notice \| undefined`                 | Why the last call didn't happen or work.                         |
| `problem` | `Unavailable \| undefined`            | Why the view can't be used.                                      |
| `refresh` | `(() => Promise<void>) \| undefined`  | Reads the state again. Undefined without a refresh or `onRead`.  |
| `phase`   | `GencnPhase`                          | The value `busy`, `notice` and `problem` come from.              |

`GencnViewOptions` is the options' type.

### `OnAction`

`(tool: string, args: Args, options: CallOptions) => Promise<ActionOutcome>`

- `tool`: the tool's name, as the spec's `callTool` wrote it.
- `args`: its arguments (`Args` is `Record<string, unknown>`), with any state they read filled in.
- `options.signal`: aborts when the view stops waiting. `CallOptions` is `{ signal: AbortSignal }`.

`ActionOutcome` is one of the four outcomes in the [table above](#onaction). If `onAction` throws, the call counts as `failed`, with the error's message.

### `OnRead`

`(tool: string, args: Args, options: CallOptions) => Promise<string>`

Calls a refresh's read tool and resolves to its output as text. If it throws, the view becomes unavailable with `read-failed` and your error's `message`.

### `Notice`

| Field     | Type                     | Description                 |
| --------- | ------------------------ | --------------------------- |
| `code`    | `'failed' \| 'declined'` | Which outcome it came from. |
| `tool`    | `string`                 | The tool that was called.   |
| `message` | `string?`                | The tool's own text.        |

### `Unavailable`

Each `reason` carries its own fields:

| `reason`           | Fields                        | When                                                                                                                            |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `unknown-block`    | `blocks: string[]`            | The spec uses blocks your catalog doesn't have.                                                                                 |
| `invalid-spec`     | `problems: string`            | The spec fails [`checkSpec`](/gencn/docs/catalog/#what-checkspec-checks); `problems` is its text.                               |
| `tool-unavailable` | `tool`, `message?`            | `onAction` returned `unavailable`.                                                                                              |
| `read-failed`      | `tool`, `misses?`, `message?` | A refresh didn't extract (`misses`, see [`extract`](/gencn/docs/refresh/#extractoutput-refresh)) or `onRead` threw (`message`). |

### `GencnPhase`

What a view is doing. `kind` is one of:

- `idle`, with the last `notice`, if any.
- `running` or `reading`, with the `tool`.
- `unavailable`, with the fields of an `Unavailable`.

### `createViewActor(spec, options)`

The view without React, which `useGencnView` is drawn on. Use it to draw views with another renderer. `options` is `{ catalog, onAction, onRead? }` (`ViewHost` is `{ onAction, onRead? }`). It returns a `ViewActor`:

| Member                | Description                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `spec`                | The spec as drawn.                                                                                   |
| `refused`             | An `Unavailable` when the spec can't be drawn, fixed at creation.                                    |
| `store`               | json-render's state store for the view.                                                              |
| `handlers`            | json-render's action handlers, `{ callTool }`.                                                       |
| `phase()`             | The current `GencnPhase`.                                                                            |
| `subscribe(listener)` | Calls `listener` when the phase changes. Returns an unsubscribe function.                            |
| `refresh()`           | Reads the state again. Does nothing without a refresh or `onRead`.                                   |
| `setHost(host)`       | Replaces `onAction` and `onRead`, for the next call or read.                                         |
| `start()`             | Starts waiting for results. Returns `stop`, which aborts `signal` without cancelling a started call. |

When a call doesn't succeed, the `callTool` handler rejects with a `ViewCallError`, so a spec's `onError` runs. Its `code` is `busy` (the view was already doing something, so the control reverted), `failed`, `declined`, `unavailable` or `stopped`, with the `tool` and a `message`.
