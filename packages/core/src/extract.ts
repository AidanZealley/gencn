import { RE2JS } from 're2js'
import type { Refresh } from './spec.js'

/** One state path's read: its value, or why there isn't one. */
export type Extracted =
  | { path: string; value: unknown; snippet: string }
  | { path: string; problem: string; snippet?: string }

/** The value at JSON pointer `pointer` in `value`, or undefined. */
function at(value: unknown, pointer: string) {
  if (pointer === '') return value
  return pointer
    .slice(1)
    .split('/')
    .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce<unknown>(
      (node, key) =>
        node !== null && typeof node === 'object'
          ? (node as Record<string, unknown>)[key]
          : undefined,
      value,
    )
}

/** The text the regexes read: `from` inside it if it's JSON, else all of it. */
function source(output: string, from: string | undefined) {
  if (from === undefined) return output
  let parsed: unknown
  try {
    parsed = JSON.parse(output)
  } catch {
    return output
  }
  const found = at(parsed, from)
  if (found === undefined) return undefined
  return typeof found === 'string' ? found : JSON.stringify(found)
}

/** A regex that doesn't compile for RE2, or has no group: why; else undefined. */
export function patternProblem(pattern: string) {
  try {
    return RE2JS.compile(pattern).groupCount() < 1
      ? 'needs a group, such as (on|off), for the value'
      : undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * Reads each state value from a refresh's `output`, as `refresh.extract`
 * says, in linear time (RE2). Pure. A regex that doesn't match, or a value
 * `map` doesn't list, or a number that isn't one, is a problem, never a
 * guess.
 */
export function extract(output: string, refresh: Refresh): Extracted[] {
  const text = source(output, refresh.from)
  return Object.entries(refresh.extract).map(([path, { match, map, as }]) => {
    if (text === undefined) {
      return { path, problem: `nothing at ${refresh.from} in the output` }
    }
    const problem = patternProblem(match)
    if (problem) return { path, problem: `match ${problem}` }
    const matcher = RE2JS.compile(match).matcher(text)
    if (!matcher.find()) {
      return { path, problem: `match ${JSON.stringify(match)} found nothing` }
    }
    const snippet = text.slice(matcher.start(), matcher.end())
    const captured = matcher.group(1) ?? ''
    if (map) {
      return Object.hasOwn(map, captured)
        ? { path, value: map[captured], snippet }
        : {
            path,
            snippet,
            problem: `read "${captured}", which map doesn't list`,
          }
    }
    if (as === 'number') {
      // Decimal digits only: no hex, exponents, spaces or Infinity.
      return /^-?\d+(\.\d+)?$/.test(captured)
        ? { path, value: Number(captured), snippet }
        : { path, snippet, problem: `read "${captured}", not a number` }
    }
    return { path, value: captured, snippet }
  })
}

/** Every value `extract` read, by state path, or undefined if any is missing. */
export function extractedState(results: readonly Extracted[]) {
  if (results.some((result) => 'problem' in result)) return undefined
  return Object.fromEntries(
    results.map((result) => [
      result.path,
      (result as { value: unknown }).value,
    ]),
  )
}
