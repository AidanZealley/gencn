import { useMemo, useState } from 'react'
import { checkSpec } from '@gencn/core'
import type { Spec } from '@json-render/core'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { catalog } from './cards/catalog'
import { GenerativeCard } from './cards/generative-card'
import { specs } from './cards/specs'

const pretty = (spec: Spec) => JSON.stringify(spec, null, 2)

/** The spec as written, or why it can't render. */
function read(text: string): { spec: Spec } | { error: string } {
  let spec: unknown
  try {
    spec = JSON.parse(text)
  } catch (error) {
    return { error: String(error) }
  }
  const error = checkSpec(catalog, spec)
  return error ? { error } : { spec: spec as Spec }
}

export function App() {
  const [text, setText] = useState(pretty(specs['Living room']))
  const result = useMemo(() => read(text), [text])

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
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
      <div className="grid gap-6 md:grid-cols-[1fr_24rem]">
        <Textarea
          aria-label="Spec"
          spellCheck={false}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-96 font-mono text-xs md:min-h-[70svh]"
        />
        <section className="flex flex-col gap-4">
          {'spec' in result ? (
            <GenerativeCard spec={result.spec} />
          ) : (
            <pre className="text-xs whitespace-pre-wrap text-destructive">
              {result.error}
            </pre>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
