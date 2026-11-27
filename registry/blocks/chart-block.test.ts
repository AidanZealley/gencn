import { expect, test, vi } from 'vitest'
import {
  Chart,
  checkSpec,
  createCatalog,
  toolPrompt,
} from '../../packages/core/src/index.js'
import { updateTrace } from './chart-block'

vi.mock('gencn', () => import('../../packages/core/src/index.js'))
vi.mock('gencn/react', () => import('../../packages/core/src/react/index.js'))
vi.mock('@/components/ui/chart', () => ({}))

test('a trace accepts read-only state references in series order', () => {
  const catalog = createCatalog([Chart])
  expect(toolPrompt(catalog)).toContain('use variant "trace" and set latest')
  const props = {
    title: 'Printer position',
    variant: 'trace',
    series: ['X', 'Y', 'Z'],
    latest: [{ $state: '/x' }, { $state: '/y' }, { $state: '/z' }],
  }
  expect(
    checkSpec(catalog, {
      root: 'chart',
      state: { x: 10, y: 20, z: 5 },
      elements: { chart: { type: 'Chart', props, children: [] } },
    }),
  ).toBeUndefined()
})

test('a trace records only distinct consecutive tuples at observation times', () => {
  const first = updateTrace({ points: [] }, { time: 100, values: [1, 2, 3] })
  const duplicate = updateTrace(first, { time: 250, values: [1, 2, 3] })
  expect(duplicate).toBe(first)

  const moved = updateTrace(duplicate, { time: 300, values: [1, 2, 4] })
  const returned = updateTrace(moved, { time: 800, values: [1, 2, 3] })
  expect(returned.points).toEqual([
    { time: 100, values: [1, 2, 3] },
    { time: 300, values: [1, 2, 4] },
    { time: 800, values: [1, 2, 3] },
  ])
})

test('a trace caps the points and expires them even without a value change', () => {
  let trace: Parameters<typeof updateTrace>[0] = { points: [] }
  for (let time = 0; time <= 310; time++) {
    trace = updateTrace(trace, { time, values: [time] })
  }
  expect(trace.points).toHaveLength(300)
  expect(trace.points[0]?.time).toBe(11)

  const expired = updateTrace(trace, { time: 300_311 })
  expect(expired.points).toEqual([])
  expect(updateTrace(expired, { time: 300_320, values: [310] })).toBe(expired)
  expect(updateTrace(expired, { time: 300_330, values: [311] }).points).toEqual(
    [{ time: 300_330, values: [311] }],
  )
})
