import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'

const tones = { default: 'text-foreground', muted: 'text-muted-foreground' }

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function TextBlock({ props }: BaseComponentProps<BlockProps<'Text'>>) {
  return (
    <p className={`text-sm ${tones[props.tone ?? 'default']}`}>{props.text}</p>
  )
}
