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

Runs one tool call. It resolves to one of:

| Outcome                                | What the view does                                |
| -------------------------------------- | ------------------------------------------------- |
| `{ outcome: 'done' }`                  | Keeps what the person chose.                      |
| `{ outcome: 'failed', message? }`      | Reverts the control and sets a `failed` notice.   |
| `{ outcome: 'declined' }`              | Reverts the control and sets a `declined` notice. |
| `{ outcome: 'unavailable', message? }` | Shows the view as unavailable.                    |

An action runs at most once. When a view unmounts, its signal aborts, which means the view has stopped waiting. It doesn't cancel the call.

## Approval

A view never asks the person anything. Your app decides which calls need approval, from the tool and its arguments, and asks in its own UI inside `onAction`:

```ts
const onAction: OnAction = async (tool, args, { signal }) => {
  if (needsApproval(tool) && !(await askPerson(tool, args, signal))) {
    return { outcome: 'declined' }
  }
  return runTool(tool, args)
}
```

The view stays busy while you ask. If its signal aborts first, treat that as a no.
