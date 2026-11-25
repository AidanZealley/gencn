import { useMemo, useSyncExternalStore } from 'react'
import { createStateStore, type Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'
import { registry } from './card-blocks'

/** Renders a checked spec. Its state lives in one store, seeded by the spec. */
export function GenerativeCard({ spec }: { spec: Spec }) {
  const store = useMemo(() => createStateStore(spec.state), [spec])
  const { subscribe, getSnapshot } = store
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <div className="flex flex-col gap-4">
      <JSONUIProvider registry={registry} store={store}>
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
      <pre className="overflow-auto bg-muted p-3 text-xs">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  )
}
