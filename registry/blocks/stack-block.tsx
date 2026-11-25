import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import { cn } from '@/lib/utils'

const gap = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' }
const align = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}
const justify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function StackBlock({
  props,
  children,
}: BaseComponentProps<BlockProps<'Stack'>>) {
  const row = props.direction === 'horizontal'
  return (
    <div
      className={cn(
        'flex',
        row ? 'flex-row flex-wrap' : 'flex-col',
        gap[props.gap ?? 'md'],
        align[props.align ?? (row ? 'center' : 'stretch')],
        justify[props.justify ?? 'start'],
      )}
    >
      {children}
    </div>
  )
}
