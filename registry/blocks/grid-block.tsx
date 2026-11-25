import type { BlockProps } from '@gencn/core'
import type { BaseComponentProps } from '@json-render/react'
import { cn } from '@/lib/utils'

const columns = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
}
const gap = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' }

// Adapted from @json-render/shadcn (Apache-2.0), github.com/vercel-labs/json-render.
export function GridBlock({
  props,
  children,
}: BaseComponentProps<BlockProps<'Grid'>>) {
  return (
    <div
      className={cn(
        'grid',
        columns[props.columns ?? 2],
        gap[props.gap ?? 'md'],
      )}
    >
      {children}
    </div>
  )
}
