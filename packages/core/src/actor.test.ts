import { expect, test } from 'vitest'
import {
  Card,
  Switch,
  createCatalog,
  createViewActor,
  type ActionOutcome,
  type Spec,
} from './index.js'

const catalog = createCatalog([Card, Switch])

const lamp = (): Spec => ({
  root: 'lamp',
  state: { on: false },
  elements: {
    lamp: {
      type: 'Switch',
      props: { label: 'Lamp', checked: { $bindState: '/on' } },
      on: {
        change: {
          action: 'callTool',
          params: { tool: 'Set', args: { on: { $state: '/on' } } },
        },
      },
      children: [],
    },
  },
  refresh: {
    tool: 'Read',
    extract: {
      '/on': { match: 'lamp: (on|off)', map: { on: true, off: false } },
    },
  },
})

/** A host whose calls settle when the test says, counting each. */
function host() {
  const calls: string[] = []
  const pending: ((outcome: ActionOutcome) => void)[] = []
  return {
    calls,
    settle: (outcome: ActionOutcome) => pending.shift()!(outcome),
    onAction: (tool: string, args: Record<string, unknown>) => {
      calls.push(`${tool} ${JSON.stringify(args)}`)
      return new Promise<ActionOutcome>((resolve) => pending.push(resolve))
    },
    onRead: async () => 'lamp: on',
  }
}

/** What a switch press does: write the bound state, then call. */
const press = (actor: ReturnType<typeof createViewActor>, on: boolean) => {
  actor.store.set('/on', on)
  return actor.handlers.callTool({ tool: 'Set', args: { on } })
}

test('a view reverts every call that did not work, and only reads set what is confirmed', async () => {
  const h = host()
  const actor = createViewActor(lamp(), { ...h, catalog })
  const stop = actor.start()

  // A read sets the state the view goes back to.
  await actor.refresh()
  expect(actor.store.get('/on')).toBe(true)

  // A press while another call runs reverts at once, without a call.
  const first = press(actor, false)
  expect(actor.phase().kind).toBe('running')
  await expect(press(actor, true)).rejects.toMatchObject({ code: 'busy' })
  expect(actor.store.get('/on')).toBe(false) // the first press's input stays
  h.settle({ outcome: 'done' })
  await first
  expect(actor.phase()).toEqual({ kind: 'idle' })

  // A failed call goes back to the last confirmed state.
  const failing = press(actor, true)
  h.settle({ outcome: 'failed', message: 'no answer' })
  await expect(failing).rejects.toMatchObject({ code: 'failed' })
  expect(actor.store.get('/on')).toBe(false)
  expect(actor.phase()).toMatchObject({
    kind: 'idle',
    notice: { code: 'failed', message: 'no answer' },
  })

  // So does one the host's approval declined, which it notes.
  const asked = press(actor, true)
  h.settle({ outcome: 'declined' })
  await expect(asked).rejects.toMatchObject({ code: 'declined' })
  expect(actor.store.get('/on')).toBe(false)
  expect(actor.phase()).toEqual({
    kind: 'idle',
    notice: { code: 'declined', tool: 'Set' },
  })

  // Stopping mid-call stops waiting; the call itself carries on.
  const late = press(actor, true)
  stop()
  await expect(late).rejects.toMatchObject({ code: 'stopped' })
  h.settle({ outcome: 'done' }) // the host still finishes it
  expect(h.calls).toEqual([
    'Set {"on":false}',
    'Set {"on":true}',
    'Set {"on":true}',
    'Set {"on":true}',
  ])
})
