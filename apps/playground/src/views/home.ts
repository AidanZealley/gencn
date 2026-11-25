import type { ActionOutcome, OnAction, OnRead } from 'gencn'

// A pretend Home Assistant, shaped like its real Assist tools: actions
// name a device, answer with success and failed lists and no new state;
// GetLiveContext returns a JSON envelope around a prose line and a YAML
// list of every device. The porch light never answers; changing the
// heating asks first. Calls take a moment, like a real house.

type Device = {
  name: string
  domain: 'light' | 'climate'
  area: string
  state: string
  brightness?: number
}

const devices: Device[] = [
  {
    name: 'Desk Lamp',
    domain: 'light',
    area: 'Living Room',
    state: 'on',
    brightness: 60,
  },
  { name: 'Porch Light', domain: 'light', area: 'Porch', state: 'off' },
  { name: 'Thermostat', domain: 'climate', area: 'Hall', state: 'heat' },
]

const listeners = new Set<() => void>()
let version = 0
const changed = () => {
  version++
  listeners.forEach((listener) => listener())
}

/** For `useSyncExternalStore`: the house as a list, which changes as it does. */
export const house = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  version: () => version,
  devices: () => devices,
}

/** Changes a device from "elsewhere", as the HA app or an automation would. */
export function changeElsewhere() {
  const lamp = devices[0]!
  lamp.state = lamp.state === 'on' ? 'off' : 'on'
  lamp.brightness = lamp.state === 'on' ? 30 : 0
  const thermostat = devices[2]!
  thermostat.state = thermostat.state === 'heat' ? 'auto' : 'heat'
  changed()
}

const later = (signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 400)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

/** GetLiveContext's output, as HA writes it. */
export const liveContext = () =>
  JSON.stringify({
    success: true,
    result: [
      'Live Context: An overview of the areas and the devices in this smart home:',
      ...devices.flatMap((device) => [
        `- names: ${device.name}`,
        `  domain: ${device.domain}`,
        `  state: '${device.state}'`,
        `  areas: ${device.area}`,
        ...(device.brightness === undefined
          ? []
          : ['  attributes:', `    brightness: '${device.brightness}'`]),
      ]),
    ].join('\n'),
  })

export const onRead: OnRead = async (tool, _args, { signal }) => {
  await later(signal)
  if (tool !== 'GetLiveContext') throw new Error(`No read tool ${tool}.`)
  return liveContext()
}

/** Runs a call the way HA would, once; the log lists each. */
export const calls: string[] = []

export const onAction: OnAction = async (tool, args, { approved }) => {
  if (tool === 'HassClimateSetMode' && !approved) {
    return { outcome: 'ask' }
  }
  // Started: never cancelled, even if the view goes away.
  await new Promise((resolve) => setTimeout(resolve, 400))
  calls.push(`${tool} ${JSON.stringify(args)}`)
  const device = devices.find((device) => device.name === args.name)
  if (!device) {
    return {
      outcome: 'unavailable',
      message: `No device ${String(args.name)}.`,
    }
  }
  const failed = device.name === 'Porch Light'
  const result = {
    speech: {},
    response_type: 'action_done',
    data: {
      success: failed ? [] : [{ name: device.name, type: 'entity' }],
      failed: failed ? [{ name: device.name, type: 'entity' }] : [],
    },
  }
  if (!failed) {
    if (tool === 'HassTurnOn') device.state = 'on'
    if (tool === 'HassTurnOff') device.state = 'off'
    if (tool === 'HassLightSet') device.brightness = Number(args.brightness)
    if (tool === 'HassClimateSetMode') device.state = String(args.mode)
  }
  changed()
  return failed
    ? ({ outcome: 'failed', message: JSON.stringify(result) } as ActionOutcome)
    : { outcome: 'done' }
}
