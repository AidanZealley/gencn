'use client'

import { Text as TextDef } from 'gencn'
import { defineBlock } from 'gencn/react'

const tones = { default: 'text-foreground', muted: 'text-muted-foreground' }

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const textBlock = defineBlock(TextDef, function TextBlock({ props }) {
  return (
    <p className={`text-sm ${tones[props.tone ?? 'default']}`}>{props.text}</p>
  )
})
