import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import { Button } from '@/components/ui/button'

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function ButtonBlock({
  props,
  emit,
}: BaseComponentProps<BlockProps<'Button'>>) {
  return (
    <Button
      variant={props.variant ?? 'default'}
      disabled={props.disabled}
      onClick={() => emit('press')}
    >
      {props.label}
    </Button>
  )
}
