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

- `tool` and `args`: the call to make.
- `from`: an optional JSON pointer into the output, when the output is JSON.
- `extract`: for each state path, an RE2 regex whose first group is the value. Add `map` to translate the text, or `as: "number"` to read a number.

A missed match never produces a guess. The view shows `unavailable` with the reason `read-failed`.

## At generation

Call the tool once, then call `checkRefresh(catalog, spec, output)`. It checks that every value extracts, fits the block it's bound to, and equals the spec's `state`. If it fails, return its text to the model.

## When to read

`onRead(tool, args)` returns the tool's output as text. The hook never reads by itself; call `refresh()`. `<GencnView readOn>` chooses for you:

- `visible` (default): each time the view comes on screen
- `mount`: once
- `manual`: only when the person presses Refresh

Only use tools your app would let the model call without asking.
