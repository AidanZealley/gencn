'use client'

import { Image as ImageDef } from '@gencn/core'
import { defineBlock } from '@gencn/core/react'
import { cn } from '@/lib/utils'

const aspects = { auto: '', square: 'aspect-square', video: 'aspect-video' }

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const imageBlock = defineBlock(ImageDef, function ImageBlock({ props }) {
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
})
