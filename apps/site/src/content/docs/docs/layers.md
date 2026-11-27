---
title: How the layers fit together
description: How gencn, json-render, and your app work together to render and refresh a view.
---

gencn builds on [json-render](https://json-render.dev/). A gencn view is a json-render spec with an optional [refresh recipe](/gencn/docs/refresh/).

## Your app supplies the components and tools

The shadcn registry installs React blocks into your project. A switch block imports your app's own `Switch`, so it picks up your theme and any changes you've made to the component. The [catalog](/gencn/docs/catalog/) describes which blocks the agent can use. The React registry tells json-render how to render them.

A generated control dispatches `callTool` with a tool name and arguments. Your app supplies one `onAction` handler, which can route these requests through its existing MCP client and approval flow. gencn specs leave out json-render's `confirm` so your app can apply its current approval settings.

## gencn saves how to read state

When the agent creates a light switch, it can find a read tool such as Home Assistant's `GetLiveContext`, inspect its response, and save a recipe for extracting that light's state. Your app can check the recipe against the response before accepting the view.

Later, a refresh asks your app's `onRead` handler to run the saved call. One response can fill several state paths, such as the on/off values for every switch in a card. The same recipe runs each time, without another model turn. A view needs a suitable read tool to offer refresh.

## json-render holds the values

json-render owns the store, resolves bindings, renders the blocks, and dispatches events. When someone flips a two-way-bound switch, the store updates immediately. gencn keeps the controls inert while your app handles the request, including any approval prompt. If the request fails or is declined, gencn restores values from its last confirmed store snapshot. For a switch to snap back, bind its value to the store and provide an initial value at that path.

[`useGencnView`](/gencn/docs/rendering/) wires these pieces together. Render its `view` to get the controls and action behavior. Use `ref` or `refresh()` to read the state again, and use `busy`, `notice`, or `problem` when you want to show your own feedback.
