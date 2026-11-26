---
title: Refresh
description: Let a view read its state again from a tool, so an old view shows what's true now.
---

Without a refresh, a view shows its state from when it was generated. With one, it reads that state again from a read-only tool.

```json
{
  "state": { "lamp": { "on": true } },
  "refresh": {
    "tool": "GetLiveContext",
    "from": "/result",
    "extract": {
      "/lamp/on": {
        "match": "names: Desk Lamp\\n(?:  .*\\n)*?  state: '(on|off)'",
        "map": { "on": true, "off": false }
      }
    }
  }
}
```

Here the view calls `GetLiveContext`, takes the text at `/result` in its JSON output, and finds the desk lamp's state in it. `on` becomes `true` at `/lamp/on`, which the switch is bound to. See the [API reference](#api-reference) for every field.

A missed match never produces a guess. The view shows `unavailable` with the reason `read-failed`.

## At generation

Call the tool once, then call `checkRefresh(catalog, spec, output)`. It checks that every value extracts, fits the block it's bound to, and equals the spec's `state`. If it fails, return its text to the model.

## When to read

The view reads through the hook's `onRead` option, which calls the tool and returns its output as text. The `readOn` option chooses when:

- `visible` (default): each time the element with the hook's `ref` comes on screen
- `mount`: once
- `manual`: only when you call `refresh()`, such as from a Refresh button

Only use tools your app would let the model call without asking.

## API reference

### `Refresh`

The spec's `refresh` field.

| Field     | Type                         | Description                                                                                |
| --------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| `tool`    | `string`                     | The read-only tool to call.                                                                |
| `args`    | `object?`                    | Its arguments.                                                                             |
| `from`    | `string?`                    | A JSON pointer, such as `/result`, to the text inside the output, when the output is JSON. |
| `extract` | `Record<string, Extraction>` | For each state path, such as `/lamp/on`, how to read its value. At least one.              |

### `Extraction`

How one state value is read from the output.

| Field   | Type                 | Default  | Description                                                                                                                                     |
| ------- | -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `match` | `string`             |          | An [RE2](https://github.com/google/re2/wiki/Syntax) regex. Its first group is the value.                                                        |
| `map`   | `object?`            |          | The value for each captured text, such as `{ "on": true, "off": false }`. Any other text is a miss.                                             |
| `as`    | `'text' \| 'number'` | `'text'` | Read the captured text as is, or as a number.                                                                                                   |
| `scale` | `[read, shown]?`     |          | Converts units: the value becomes value × shown ÷ read, rounded. `[255, 100]` shows a 0–255 brightness as a percentage. Implies `as: 'number'`. |

### `checkRefresh(catalog, spec, output)`

From `gencn`. Checks a spec's refresh against one real `output` of its tool, read when the view is generated. Returns text for the model, showing what each regex matched, or `undefined` when every value extracts, fits its block and equals the spec's `state`.

### `extract(output, refresh)`

From `gencn`. Reads each value from `output` the way `refresh` says, in linear time. Returns one `Extracted` per state path: `{ path, value, snippet }` when it read a value, or `{ path, problem, snippet? }` when it didn't. `snippet` is the text the regex matched.

`extractedState(results)` turns those into `{ [path]: value }`, or `undefined` if any missed. `patternProblem(match)` returns why a regex can't be used, such as having no group, or `undefined`.

### `refreshSchema`

From `gencn`. The zod schema for `Refresh`, for checking one on its own.

See [Rendering](/gencn/docs/rendering/#api-reference) for `onRead`, `readOn` and `refresh()`.
