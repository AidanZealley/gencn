import { expect, test } from 'vitest'
import { prepareCalls, type Spec } from './index.js'

test('prepareCalls moves confirm into params and adds a no-op onError, chained calls too', () => {
  const confirm = { title: 'Unlock?', message: 'The ${/door} door' }
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
            // json-render's type leaves confirm off chained bindings, but
            // its runtime honours it, so it's moved there too.
            onSuccess: {
              action: 'callTool',
              params: { tool: 'Unlock' },
              confirm,
            } as never,
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
  const ready = prepareCalls(spec)
  expect(ready.elements.b!.on).toEqual({
    press: {
      action: 'setState',
      params: { statePath: '/x', value: 1 },
      onSuccess: {
        action: 'callTool',
        params: { tool: 'Unlock', confirm },
        onError: { set: {} },
      },
    },
  })
  // A spec's own onError is kept as written.
  expect(ready.elements.c!.on).toEqual(spec.elements.c!.on)
  expect(spec).toEqual(before)
})
