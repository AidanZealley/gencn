import { useEffect, useReducer, useRef, useSyncExternalStore } from 'react'
import { ArrowUp, Palette } from 'lucide-react'
import type { Spec } from 'gencn'
import { useGencnView } from 'gencn/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { blocks } from '../views/blocks'
import { exchanges, themes, type ThemeName } from './script'

// The landing demo: a chat whose replies are gencn views, played from
// script.ts on a loop. Real blocks and real shadcn themes; switching the
// theme restyles every view already on screen. It's part of the page, not
// a widget: inert, transparent, never scrolled by the visitor, and in the
// visitor's own colour scheme.
//
// State: one reducer owns the transcript's progress and the theme; the
// script player (one per mount, stopped on unmount) is its only writer.

type State = {
  /** Exchanges asked so far, and how many of those have their reply. */
  asked: number
  replied: number
  /** What the composer shows being typed. */
  draft: string
  /** True while the transcript fades out before the loop restarts. */
  clearing: boolean
  theme: ThemeName
}

type Event =
  | { type: 'type'; draft: string }
  | { type: 'ask' }
  | { type: 'reply' }
  | { type: 'theme'; theme: ThemeName }
  | { type: 'clear' }
  | { type: 'restart' }

const start: State = {
  asked: 0,
  replied: 0,
  draft: '',
  clearing: false,
  theme: 'neutral',
}

function reduce(state: State, event: Event): State {
  switch (event.type) {
    case 'type':
      return { ...state, draft: event.draft }
    case 'ask':
      return { ...state, asked: state.asked + 1, draft: '' }
    case 'reply':
      return { ...state, replied: state.asked }
    case 'theme':
      return { ...state, theme: event.theme }
    case 'clear':
      return { ...state, clearing: true }
    case 'restart':
      return start
  }
}

/** Waits `ms` of time the tab was visible; rejects when the signal aborts. */
function clock(signal: AbortSignal) {
  const tick = () =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(signal.reason)
      const timer = setTimeout(resolve, 50)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(signal.reason)
      })
    })
  return async (ms: number) => {
    for (let left = ms; left > 0;) {
      await tick()
      if (!document.hidden) left -= 50
    }
  }
}

async function play(
  dispatch: (event: Event) => void,
  wait: (ms: number) => Promise<void>,
) {
  for (;;) {
    for (const exchange of exchanges) {
      if (exchange.theme) {
        await wait(500)
        dispatch({ type: 'theme', theme: exchange.theme })
        await wait(1500)
      }
      for (let length = 1; length <= exchange.ask.length; length++) {
        dispatch({ type: 'type', draft: exchange.ask.slice(0, length) })
        await wait(30)
      }
      await wait(400)
      dispatch({ type: 'ask' })
      await wait(1200)
      dispatch({ type: 'reply' })
      await wait(3600)
    }
    await wait(2000)
    dispatch({ type: 'clear' })
    await wait(600)
    dispatch({ type: 'restart' })
    await wait(600)
  }
}

/**
 * The page's colour scheme: `?scheme=light|dark` from the page embedding
 * the demo, which may have its own choice, or else the visitor's.
 */
const chosen = new URLSearchParams(location.search).get('scheme')
const darkQuery = matchMedia('(prefers-color-scheme: dark)')
const subscribeScheme = (listener: () => void) => {
  darkQuery.addEventListener('change', listener)
  return () => darkQuery.removeEventListener('change', listener)
}
const useDark = () =>
  useSyncExternalStore(subscribeScheme, () =>
    chosen ? chosen === 'dark' : darkQuery.matches,
  )

// The views are only watched, never used, so no call ever runs.
const onAction = async () => ({ outcome: 'done' as const })

function View({ spec }: { spec: Spec }) {
  const { view } = useGencnView(spec, { blocks, onAction })
  return <div className="w-full max-w-sm">{view}</div>
}

export function Demo() {
  const [state, dispatch] = useReducer(reduce, start)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'ask' })
      dispatch({ type: 'reply' })
      return
    }
    const lifetime = new AbortController()
    play(dispatch, clock(lifetime.signal)).catch(() => {})
    return () => lifetime.abort()
  }, [])

  // The theme lives on <html>, so everything on the page follows it.
  const dark = useDark()
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-changing')
    root.dataset.theme = state.theme
    root.classList.toggle('dark', dark)
    const timer = setTimeout(() => root.classList.remove('theme-changing'), 600)
    return () => clearTimeout(timer)
  }, [state.theme, dark])

  // Keep the latest message in view as the transcript grows. The list
  // hides its overflow, so only this moves it.
  const list = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      list.current?.scrollTo({
        top: list.current.scrollHeight,
        behavior: 'smooth',
      }),
    )
    observer.observe(content.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <div inert className="flex h-svh flex-col text-foreground select-none">
      <div
        ref={list}
        className="min-h-0 flex-1 overflow-hidden mask-t-from-75% mask-t-to-100%"
      >
        <div
          ref={content}
          className={cn(
            'flex min-h-full flex-col justify-end gap-5 p-4 transition-opacity duration-500',
            state.clearing && 'opacity-0',
          )}
        >
          {/* Each exchange asked so far, and the next one's theme change
              as soon as it happens, before its question is typed. */}
          {exchanges.slice(0, state.asked + 1).map((exchange, index) => {
            const asked = index < state.asked
            const changed =
              exchange.theme && (asked || state.theme === exchange.theme)
            return (
              <div key={index} className="flex flex-col gap-3">
                {changed && <ThemeChange theme={exchange.theme!} />}
                {asked && (
                  <p className="max-w-[80%] animate-in self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground duration-300 fade-in slide-in-from-bottom-2">
                    {exchange.ask}
                  </p>
                )}
                {asked &&
                  (index < state.replied ? (
                    <div className="flex animate-in flex-col gap-3 duration-500 fade-in slide-in-from-bottom-2">
                      <p className="text-sm">{exchange.reply}</p>
                      <View spec={exchange.view} />
                    </div>
                  ) : (
                    <p className="animate-pulse text-sm text-muted-foreground">
                      Making a view…
                    </p>
                  ))}
              </div>
            )
          })}
        </div>
      </div>

      <div className="shrink-0 p-4 pt-2">
        <div className="flex items-center gap-2 rounded-lg border bg-background py-1.5 pr-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm">
            {state.draft || (
              <span className="text-muted-foreground">Ask anything</span>
            )}
          </span>
          <Button size="icon-sm" disabled={!state.draft}>
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  )
}

const label = (theme: ThemeName) =>
  themes.find(({ name }) => name === theme)!.label

/**
 * The theme change as an event in the transcript, so it reads as something
 * that happened in the app. The swatch wears the new theme.
 */
function ThemeChange({ theme }: { theme: ThemeName }) {
  return (
    <div className="flex animate-in items-center gap-3 text-xs text-muted-foreground duration-500 fade-in">
      <span className="h-px flex-1 bg-border" />
      <span className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-foreground">
        <Palette className="size-3.5 text-muted-foreground" />
        Theme changed to
        <span data-theme={theme} className="size-3 rounded-full bg-primary" />
        <span className="font-medium">{label(theme)}</span>
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
