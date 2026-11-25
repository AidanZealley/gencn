import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import { cn } from '@/lib/utils'

const aspects = { auto: '', square: 'aspect-square', video: 'aspect-video' }

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function ImageBlock({ props }: BaseComponentProps<BlockProps<'Image'>>) {
  return (
    <img
      src={props.src}
      alt={props.alt}
      loading="lazy"
      className={cn(
        'w-full bg-muted object-cover',
        aspects[props.aspect ?? 'auto'],
      )}
    />
  )
}
