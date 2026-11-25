'use client'

import { Heading as HeadingDef } from 'gencn'
import { defineBlock } from 'gencn/react'

const levels = {
  1: { Tag: 'h2', className: 'text-lg font-semibold' },
  2: { Tag: 'h3', className: 'text-base font-semibold' },
  3: { Tag: 'h4', className: 'text-sm font-medium' },
} as const

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const headingBlock = defineBlock(
  HeadingDef,
  function HeadingBlock({ props }) {
    const { Tag, className } = levels[props.level ?? 2]
    return <Tag className={`font-heading ${className}`}>{props.text}</Tag>
  },
)
