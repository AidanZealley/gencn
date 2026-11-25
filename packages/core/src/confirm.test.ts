import { expect, test } from 'vitest'
import { moveConfirms, type Spec } from './index.js'

test("moveConfirms moves callTool's confirm into its params, chained ones too", () => {
  const confirm = { title: 'Unlock?', message: 'The ${/door} door' }
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
    },
  }
  const before = structuredClone(spec)
  expect(moveConfirms(spec).elements.b!.on).toEqual({
    press: {
      action: 'setState',
      params: { statePath: '/x', value: 1 },
      onSuccess: { action: 'callTool', params: { tool: 'Unlock', confirm } },
    },
  })
  expect(spec).toEqual(before)
})
