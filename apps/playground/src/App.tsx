import { useMemo, useState, useSyncExternalStore } from 'react'
import { checkRefresh, checkSpec, type Spec } from 'gencn'
import { BookOpen } from 'lucide-react'
import { GencnLogo } from '@/components/gencn-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { catalog } from './views/catalog'
import { HookView } from './views/hook-view'
import {
  calls,
  changeElsewhere,
  house,
  liveContext,
  type Approval,
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

type Example = keyof typeof specs
const examples = Object.keys(specs) as Example[]

/**
 * A workbench: the spec beside its render on one screen at desktop
 * widths, and the pretend house below them. Narrower, it stacks and scrolls.
 */
export function App() {
  const [text, setText] = useState(pretty(specs['Living room']))
  const result = useMemo(() => read(text), [text])
  // Each new spec is a new view. getRandomValues, unlike randomUUID, works
  // over plain HTTP, as on a LAN address.
  const key = useMemo(
    () => crypto.getRandomValues(new Uint32Array(1))[0],
    [result],
  )
  useSyncExternalStore(house.subscribe, house.version)
  const approval = house.approval()
  // The example showing, if the spec is still one, unedited.
  const example = examples.find((name) => pretty(specs[name]) === text)

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2">
        <GencnLogo />
        <Badge variant="secondary">Playground</Badge>
        {/* Below sm, the examples take a row of their own, under the rest. */}
        <nav className="order-last flex w-full items-center gap-1 rounded-lg bg-muted p-0.5 sm:order-none sm:ml-auto sm:w-auto">
          {examples.map((name) => (
            <button
              key={name}
              aria-pressed={example === name}
              onClick={() => setText(pretty(specs[name]))}
              className={cn(
                'flex-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex-none',
                example === name && 'bg-background text-foreground shadow-sm',
              )}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<a href="/gencn/docs/getting-started/" target="_top" />}
          >
            <BookOpen />
            {/* The narrowest phones keep the top row to one line. */}
            <span className="max-[359px]:sr-only">Docs</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section className="flex h-96 flex-col border-b lg:h-auto lg:min-h-0 lg:border-r lg:border-b-0">
          <div className="flex h-10 shrink-0 items-center justify-between border-b px-4">
            <span className="font-mono text-xs text-muted-foreground">
              spec.json
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs',
                'spec' in result ? 'text-muted-foreground' : 'text-destructive',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  'spec' in result ? 'bg-emerald-500' : 'bg-destructive',
                )}
              />
              {'spec' in result ? 'Valid spec' : 'Invalid spec'}
            </span>
          </div>
          <Textarea
            aria-label="Spec"
            spellCheck={false}
            value={text}
            onChange={(event) => setText(event.target.value)}
            // A fixed box that scrolls, not one that grows with the spec.
            className="[field-sizing:fixed] min-h-0 flex-1 resize-none rounded-none border-0 p-4 font-mono text-xs leading-relaxed focus-visible:ring-0 md:text-xs dark:bg-transparent"
          />
        </section>

        <section className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] p-4 md:p-6">
            {'spec' in result ? (
              <div className="mx-auto flex max-w-xl flex-col gap-4">
                <HookView key={key} spec={result.spec} />
                {approval && <ApprovalCard approval={approval} />}
              </div>
            ) : (
              <pre className="mx-auto max-w-3xl rounded-lg border border-destructive/30 bg-background p-4 text-xs whitespace-pre-wrap text-destructive">
                {result.error}
              </pre>
            )}
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-px border-t bg-border text-xs md:grid-cols-3 lg:h-44">
            <Panel title="The house">
              <ul className="flex flex-col gap-1.5">
                {house.devices().map((device) => (
                  <li key={device.name} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-1.5 rounded-full',
                        device.state === 'off'
                          ? 'bg-muted-foreground/40'
                          : 'bg-amber-500',
                      )}
                    />
                    {device.name}
                    <span className="ml-auto text-muted-foreground">
                      {device.state}
                      {device.brightness !== undefined &&
                        ` · ${device.brightness}%`}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                size="xs"
                variant="outline"
                className="mt-1 self-start"
                onClick={changeElsewhere}
              >
                Change it elsewhere
              </Button>
            </Panel>
            <Panel title={`Calls, each once (${calls.length})`}>
              {calls.length ? (
                <ol className="flex flex-col gap-1 font-mono">
                  {calls.map((call, index) => (
                    <li key={index} className="break-all">
                      {call}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted-foreground">
                  Use a control to call a tool.
                </p>
              )}
            </Panel>
            <Panel title="checkRefresh at generation">
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {'spec' in result
                  ? (result.refresh ?? 'Reads back its state.')
                  : '–'}
              </pre>
            </Panel>
          </div>
        </section>
      </main>
    </div>
  )
}

/** The app's own approval, which its `onAction` waits on. */
function ApprovalCard({ approval }: { approval: Approval }) {
  return (
    <Card size="sm" role="group" aria-label={`Allow ${approval.tool}?`}>
      <CardHeader>
        <CardTitle>Allow {approval.tool}?</CardTitle>
        <CardDescription>The view wants to make this call.</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-muted-foreground">
          {JSON.stringify(approval.args, null, 2)}
        </pre>
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm" onClick={() => approval.answer(true)}>
          Allow
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => approval.answer(false)}
        >
          Don't allow
        </Button>
      </CardFooter>
    </Card>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex min-h-0 flex-col gap-2 overflow-auto bg-background p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  )
}

export default App
