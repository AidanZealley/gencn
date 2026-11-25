import { useMemo, useState, useSyncExternalStore } from 'react'
import { checkRefresh, checkSpec, type Spec } from 'gencn'
import { GencnView } from 'gencn/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { blocks } from './views/blocks'
import { catalog } from './views/catalog'
import { HookView } from './views/hook-view'
import {
  calls,
  changeElsewhere,
  house,
  liveContext,
  onAction,
  onRead,
} from './views/home'
import { specs } from './views/specs'

const pretty = (spec: Spec) => JSON.stringify(spec, null, 2)

/** The spec as written, or why it can't render: what a host checks first. */
function read(
  text: string,
): { spec: Spec; refresh?: string } | { error: string } {
  let spec: Spec
  try {
    spec = JSON.parse(text)
  } catch (error) {
    return { error: String(error) }
  }
  const error = checkSpec(catalog, spec)
  if (error) return { error }
  // As a host would at generation: one read, checked against the state.
  return { spec, refresh: checkRefresh(catalog, spec, liveContext()) }
}

export function App() {
  const [text, setText] = useState(pretty(specs['Living room']))
  const result = useMemo(() => read(text), [text])
  // Each new spec is a new view.
  const key = useMemo(() => crypto.randomUUID(), [result])
  useSyncExternalStore(house.subscribe, house.version)

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-sm font-semibold">gencn playground</h1>
        <nav className="flex flex-wrap gap-2">
          {Object.entries(specs).map(([name, spec]) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => setText(pretty(spec))}
            >
              {name}
            </Button>
          ))}
        </nav>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem_22rem]">
        <Textarea
          aria-label="Spec"
          spellCheck={false}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-96 font-mono text-xs lg:min-h-[70svh]"
        />
        {'spec' in result ? (
          <>
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                useGencnView
              </h2>
              <HookView key={`hook-${key}`} spec={result.spec} />
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-medium text-muted-foreground">
                &lt;GencnView&gt;
              </h2>
              <GencnView
                key={`view-${key}`}
                spec={result.spec}
                blocks={blocks}
                onAction={onAction}
                onRead={onRead}
                className="flex flex-col gap-2 text-xs [&_[data-gencn-overlay]]:text-destructive"
              />
            </section>
          </>
        ) : (
          <pre className="text-xs whitespace-pre-wrap text-destructive lg:col-span-2">
            {result.error}
          </pre>
        )}
      </div>
      <section className="grid gap-4 text-xs md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">The house</h2>
          <ul>
            {house.devices().map((device) => (
              <li key={device.name}>
                {device.name}: {device.state}
                {device.brightness !== undefined && `, ${device.brightness}%`}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={changeElsewhere}
          >
            Change it elsewhere
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">Calls, each once</h2>
          <ol className="font-mono">
            {calls.map((call, index) => (
              <li key={index}>{call}</li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">checkRefresh at generation</h2>
          <pre className="whitespace-pre-wrap text-muted-foreground">
            {'spec' in result
              ? (result.refresh ?? 'Reads back its state.')
              : '–'}
          </pre>
        </div>
      </section>
    </main>
  )
}

export default App
