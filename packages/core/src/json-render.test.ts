import { expect, test } from 'vitest'
import type { Spec } from './index.js'
import { prepare } from './json-render.js'

test('prepare gives each callTool a no-op onError, chained ones too', () => {
  const ownError = { set: { '/error': '$error.message' } }
  const spec: Spec = {
    root: 'b',
    elements: {
      b: {
        type: 'Button',
        props: { label: 'Unlock' },
        on: {
          press: {
            action: 'setState',
            params: { statePath: '/x', value: 1 },
            onSuccess: { action: 'callTool', params: { tool: 'Unlock' } },
          },
        },
        children: [],
      },
      c: {
        type: 'Button',
        props: { label: 'Lock' },
        on: {
          press: {
            action: 'callTool',
            params: { tool: 'Lock' },
            onError: ownError,
          },
        },
        children: [],
      },
    },
  }
  const before = structuredClone(spec)
  const ready = prepare(spec)
  expect(ready.elements.b!.on).toEqual({
    press: {
      action: 'setState',
      params: { statePath: '/x', value: 1 },
      onSuccess: {
        action: 'callTool',
        params: { tool: 'Unlock' },
        onError: { set: {} },
      },
    },
  })
  // A spec's own onError is kept as written.
  expect(ready.elements.c!.on).toEqual(spec.elements.c!.on)
  expect(spec).toEqual(before)
})
