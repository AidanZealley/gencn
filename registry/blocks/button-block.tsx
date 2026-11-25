'use client'

import { Button as ButtonDef } from 'gencn'
import { defineBlock } from 'gencn/react'
import { Button } from '@/components/ui/button'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export const buttonBlock = defineBlock(
  ButtonDef,
  function ButtonBlock({ props, emit }) {
    return (
      <Button
        variant={props.variant ?? 'default'}
        disabled={props.disabled}
        onClick={() => emit('press')}
      >
        {props.label}
      </Button>
    )
  },
)
