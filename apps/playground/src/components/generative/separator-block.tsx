'use client'

import { Separator as SeparatorDef } from '@gencn/core'
import { defineBlock } from '@gencn/core/react'
import { Separator } from '@/components/ui/separator'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const separatorBlock = defineBlock(
  SeparatorDef,
  function SeparatorBlock() {
    return <Separator />
  },
)
