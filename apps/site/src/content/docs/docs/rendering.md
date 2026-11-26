---
title: Rendering
description: Draw a view with GencnView, or with the useGencnView hook when you want to draw its states yourself.
---

## `<GencnView>`

```tsx
<GencnView
  spec={spec}
  blocks={blocks}
  onAction={runTool}
  onRead={readTool}
  readOn="visible"
/>
```

Its defaults are unstyled. Style it through `data-` attributes such as `data-phase`, `data-gencn-approval` and `data-gencn-unavailable`. Its few words are placeholders.

## `onAction`

Runs one tool call. It resolves to one of:

| Outcome                                | What the view does                                       |
| -------------------------------------- | -------------------------------------------------------- |
| `{ outcome: 'done' }`                  | Keeps what the person chose.                             |
| `{ outcome: 'failed', message? }`      | Reverts the control.                                     |
| `{ outcome: 'unavailable', message? }` | Shows the view as unavailable.                           |
| `{ outcome: 'ask' }`                   | Asks the person, then calls again with `approved: true`. |

An action runs at most once. When a view unmounts, its signal aborts, which means the view has stopped waiting. It doesn't cancel the call.

## `useGencnView`

Use the hook to draw everything yourself, with your own words, approval rows and overlay:

```tsx
const { content, phase, refresh } = useGencnView(spec, {
  blocks,
  onAction,
  onRead,
})
```

`content` is the view, made inert while it's busy. `phase` is the one value to draw from:

- `idle`, with an optional `notice` (`failed` or `declined`)
- `running` or `reading`
- `confirming` or `asking`, each with an `answer(yes)` function
- `unavailable`, with a `reason`: `unknown-block`, `invalid-spec`, `tool-unavailable` or `read-failed`

Phases carry codes, not English. Your app words them.

The spec is fixed when the view is created. Give a new spec a new `key`.
