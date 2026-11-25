'use client'

import { Badge as BadgeDef } from 'gencn'
import { defineBlock } from 'gencn/react'
import { Badge } from '@/components/ui/badge'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const badgeBlock = defineBlock(BadgeDef, function BadgeBlock({ props }) {
  return <Badge variant={props.variant ?? 'default'}>{props.text}</Badge>
})
